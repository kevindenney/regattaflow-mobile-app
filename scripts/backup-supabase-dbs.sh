#!/usr/bin/env bash
#
# Supabase database backup
# ------------------------
# Dumps each Supabase project listed in ~/.config/supabase-backup/projects.conf,
# encrypts with AES-256-CBC + PBKDF2, and writes to iCloud.
#
# Usage:
#   ./backup-supabase-dbs.sh              # create encrypted backups
#   ./backup-supabase-dbs.sh --dry        # show what would be dumped
#   ./backup-supabase-dbs.sh --decrypt FILE  # decrypt an existing dump
#
# Designed to run non-interactively (for launchd):
#   - DB URLs live in   ~/.config/supabase-backup/projects.conf  (chmod 600)
#   - Encryption pass:  macOS Keychain (service: supabase-backup, account: passphrase)
#                       — auto-synced via iCloud Keychain, viewable in Apple Passwords app
#
# Restore later:
#   ./backup-supabase-dbs.sh --decrypt /path/to/db-NAME-DATE.sql.gz.enc
#   psql "$NEW_DB_URL" < restored.sql
#
# To recover the passphrase manually (if needed outside this script):
#   security find-generic-password -s supabase-backup -a passphrase -w
#

set -euo pipefail

CONFIG_DIR="$HOME/.config/supabase-backup"
CONFIG_FILE="$CONFIG_DIR/projects.conf"
KEYCHAIN_SERVICE="supabase-backup"
KEYCHAIN_ACCOUNT="passphrase"
BACKUP_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs/SecretBackups/db-dumps"
DATE=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$CONFIG_DIR/backup.log"

# Get passphrase from macOS Keychain (auto-synced via iCloud Keychain)
get_passphrase() {
  security find-generic-password -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_ACCOUNT" -w 2>/dev/null
}

color() { printf "\033[%sm%s\033[0m" "$1" "$2"; }
green() { color "32" "$1"; }
yellow() { color "33" "$1"; }
red() { color "31" "$1"; }
cyan() { color "36" "$1"; }

log() {
  local msg="$1"
  echo "$msg"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$LOG_FILE" 2>/dev/null || true
}

MODE="${1:-create}"

# ---- Decrypt mode ----
if [[ "$MODE" == "--decrypt" ]]; then
  if [[ -z "${2:-}" ]]; then
    echo "$(red "Error:") provide path to encrypted dump"
    echo "Usage: $0 --decrypt path/to/db-NAME-DATE.sql.gz.enc"
    exit 1
  fi
  ENCRYPTED="$2"
  if [[ ! -f "$ENCRYPTED" ]]; then
    echo "$(red "Error:") $ENCRYPTED not found"
    exit 1
  fi
  PASSPHRASE=$(get_passphrase)
  if [[ -z "$PASSPHRASE" ]]; then
    echo "$(red "Error:") passphrase not found in Keychain"
    echo "Recover or set with: security add-generic-password -s $KEYCHAIN_SERVICE -a $KEYCHAIN_ACCOUNT -w"
    exit 1
  fi

  base=$(basename "$ENCRYPTED" .enc)
  out_dir="$HOME/Desktop/db-restore-$DATE"
  mkdir -p "$out_dir"
  out_file="$out_dir/${base%.gz}"

  echo "$(cyan "Decrypting") $ENCRYPTED"
  echo "$(cyan "Output:")     $out_file"

  if openssl enc -d -aes-256-cbc -pbkdf2 -in "$ENCRYPTED" -pass "pass:$PASSPHRASE" | gunzip > "$out_file"; then
    size=$(du -h "$out_file" | awk '{print $1}')
    echo "$(green "✓ Decrypted:") $out_file  $(cyan "($size)")"
    echo ""
    echo "First lines:"
    head -5 "$out_file"
  else
    echo "$(red "✗ Decryption failed")"
    rm -rf "$out_dir"
    exit 1
  fi
  exit 0
fi

# ---- Validate config ----
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "$(red "Error:") config file missing: $CONFIG_FILE"
  echo ""
  echo "Set it up with:"
  echo "  cp $CONFIG_FILE.example $CONFIG_FILE"
  echo "  chmod 600 $CONFIG_FILE"
  echo "  # then edit and add real DB URLs from Supabase Dashboard"
  exit 1
fi

# Check perms — refuse if world-readable
perms=$(stat -f "%Lp" "$CONFIG_FILE" 2>/dev/null || echo "000")
if [[ "$perms" != "600" ]]; then
  echo "$(yellow "Warning:") $CONFIG_FILE has perms $perms — should be 600"
  echo "Fix with: chmod 600 \"$CONFIG_FILE\""
  exit 1
fi

# Read project list
projects=()
while IFS= read -r line; do
  # Skip blank lines and comments
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  projects+=( "$line" )
done < "$CONFIG_FILE"

if [[ ${#projects[@]} -eq 0 ]]; then
  echo "$(red "Error:") no projects in $CONFIG_FILE"
  exit 1
fi

echo "$(cyan "Projects to back up") (${#projects[@]}):"
for entry in "${projects[@]}"; do
  name="${entry%%|*}"
  url="${entry#*|}"
  # Mask password in URL for display
  masked=$(echo "$url" | sed -E 's|:([^:@/]+)@|:***@|')
  echo "  $name  →  $masked"
done
echo ""

if [[ "$MODE" == "--dry" || "$MODE" == "--dry-run" || "$MODE" == "-n" ]]; then
  echo "$(yellow "Dry run — no dumps created.")"
  exit 0
fi

# ---- Validate passphrase (from Keychain) ----
PASSPHRASE=$(get_passphrase)
if [[ -z "$PASSPHRASE" ]]; then
  echo "$(red "Error:") passphrase not found in Keychain"
  echo ""
  echo "Set it (one-time) with a strong random password:"
  echo "  security add-generic-password -s $KEYCHAIN_SERVICE -a $KEYCHAIN_ACCOUNT \\"
  echo "    -w \"\$(openssl rand -base64 32)\" -U"
  echo ""
  echo "Then verify with:"
  echo "  security find-generic-password -s $KEYCHAIN_SERVICE -a $KEYCHAIN_ACCOUNT -w"
  exit 1
fi

# ---- Verify pg_dump available ----
if ! command -v pg_dump >/dev/null 2>&1; then
  echo "$(red "Error:") pg_dump not found. Install with: brew install postgresql"
  exit 1
fi

# ---- Create backup directory ----
mkdir -p "$BACKUP_DIR"

# ---- Run dumps ----
log "$(cyan "Starting Supabase backups") → $BACKUP_DIR"
ok=0
fail=0

for entry in "${projects[@]}"; do
  name="${entry%%|*}"
  url="${entry#*|}"
  out_file="$BACKUP_DIR/db-${name}-${DATE}.sql.gz.enc"

  log "$(cyan "Dumping:") $name"

  # pg_dump → gzip → openssl encrypt, all in pipe (no plaintext on disk)
  # --no-owner --no-privileges: portable across DB instances
  # --no-comments: smaller dumps (Supabase auto-generated comments add noise)
  if pg_dump "$url" \
        --no-owner \
        --no-privileges \
        --no-comments \
        --quote-all-identifiers \
        2>>"$LOG_FILE" | \
     gzip -9 | \
     openssl enc -aes-256-cbc -pbkdf2 -salt -out "$out_file" -pass "pass:$PASSPHRASE"; then

    size=$(du -h "$out_file" | awk '{print $1}')
    log "$(green "  ✓ $name") → $(basename "$out_file")  $(cyan "($size)")"
    ok=$((ok + 1))
  else
    log "$(red "  ✗ $name failed")"
    rm -f "$out_file" 2>/dev/null
    fail=$((fail + 1))
  fi
done

# ---- Prune old backups (keep last 8 weeks per project) ----
log "$(cyan "Pruning") backups older than 56 days..."
find "$BACKUP_DIR" -type f -name "db-*.sql.gz.enc" -mtime +56 -print -delete 2>/dev/null | \
  while read -r f; do log "  removed: $(basename "$f")"; done || true

# ---- Summary ----
log ""
log "$(cyan "Summary:") $(green "$ok ok") | $(red "$fail failed")"
log "$(cyan "Backups:") $BACKUP_DIR"

if [[ $fail -gt 0 ]]; then
  exit 1
fi

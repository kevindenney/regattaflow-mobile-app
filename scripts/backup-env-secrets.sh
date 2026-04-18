#!/usr/bin/env bash
#
# Encrypted secrets backup
# ------------------------
# Bundles all .env files + dev credentials (SSH, AWS, GCP, npm, gh, etc.)
# into an encrypted tarball. Output is safe to store anywhere (iCloud,
# Dropbox, GitHub gist) since it's encrypted with AES-256-CBC + PBKDF2.
#
# Usage:
#   ./backup-env-secrets.sh              # create backup (prompts for password)
#   ./backup-env-secrets.sh --dry        # show what would be bundled
#   ./backup-env-secrets.sh --decrypt FILE  # decrypt an existing bundle
#
# To restore later:
#   ./backup-env-secrets.sh --decrypt ~/path/to/secrets-backup-YYYYMMDD.tar.gz.enc
#
# Includes:
#   - All .env files under ~/Developer (excluding .example/.template)
#   - credentials.json, *-key.json, service-account*.json
#   - ~/.ssh/         (SSH keys, config, known_hosts)
#   - ~/.aws/         (AWS credentials)
#   - ~/.config/gcloud/  (Google Cloud credentials)
#   - ~/.config/gh/   (GitHub CLI tokens)
#   - ~/.npmrc        (npm tokens)
#   - ~/.docker/config.json  (Docker registry creds)
#   - ~/.expo/        (Expo CLI session)
#   - ~/.netrc        (legacy auth tokens)
#

set -euo pipefail

DEV_ROOT="$HOME/Developer"
BACKUP_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs/SecretBackups"
DATE=$(date +%Y%m%d-%H%M%S)
OUTPUT_FILE="secrets-backup-$DATE.tar.gz.enc"

# System credential paths (relative to $HOME, only included if they exist)
# Use specific files for paths that contain large caches
SYSTEM_CRED_PATHS=(
  ".ssh"
  ".aws"
  ".config/gh"
  ".npmrc"
  ".docker/config.json"
  ".netrc"
  ".gnupg"
  # gcloud — only credential files, not 85MB of cache
  ".config/gcloud/application_default_credentials.json"
  ".config/gcloud/access_tokens.db"
  ".config/gcloud/credentials.db"
  ".config/gcloud/configurations"
  ".config/gcloud/legacy_credentials"
  # expo — only auth state, not 1GB of cache
  ".expo/state.json"
)

color() { printf "\033[%sm%s\033[0m" "$1" "$2"; }
green() { color "32" "$1"; }
yellow() { color "33" "$1"; }
red() { color "31" "$1"; }
cyan() { color "36" "$1"; }

MODE="${1:-create}"

# ---- Decrypt mode ----
if [[ "$MODE" == "--decrypt" ]]; then
  if [[ -z "${2:-}" ]]; then
    echo "$(red "Error:") provide path to encrypted file"
    echo "Usage: $0 --decrypt path/to/file.tar.gz.enc"
    exit 1
  fi
  ENCRYPTED="$2"
  if [[ ! -f "$ENCRYPTED" ]]; then
    echo "$(red "Error:") $ENCRYPTED not found"
    exit 1
  fi

  RESTORE_DIR="$HOME/Desktop/env-restore-$DATE"
  mkdir -p "$RESTORE_DIR"

  echo "$(cyan "Decrypting") $ENCRYPTED"
  echo "$(cyan "Restoring to:") $RESTORE_DIR"
  echo ""

  if openssl enc -d -aes-256-cbc -pbkdf2 -in "$ENCRYPTED" | tar -xzf - -C "$RESTORE_DIR"; then
    echo ""
    echo "$(green "✓ Decrypted successfully")"
    echo "$(cyan "Files restored to:") $RESTORE_DIR"
    echo ""
    echo "Files inside:"
    find "$RESTORE_DIR" -type f | head -20
  else
    echo "$(red "✗ Decryption failed") — wrong password?"
    rm -rf "$RESTORE_DIR"
    exit 1
  fi
  exit 0
fi

# ---- Find env files ----
echo "$(cyan "Scanning") $DEV_ROOT for .env files..."
echo ""

# Files to include (skip .example, .template)
env_files=()
while IFS= read -r line; do
  env_files+=( "$line" )
done < <(find "$DEV_ROOT" -type f \
  \( -name ".env" \
     -o -name ".env.local" \
     -o -name ".env.development" \
     -o -name ".env.production" \
     -o -name ".env.staging" \
     -o -name ".env.emulator" \
     -o -name ".env.test" \
     -o -name ".xcode.env" \
     -o -name "*.env" \) \
  -not -name "*.example" \
  -not -name "*.template" \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/.expo/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -not -path "*/.vercel/*" \
  -not -path "*/_archives/*" \
  -not -path "*/.claude/worktrees/*" \
  2>/dev/null | sort)

# Also include credential JSONs and key files in dev folder
while IFS= read -r line; do
  env_files+=( "$line" )
done < <(find "$DEV_ROOT" -maxdepth 3 -type f \
  \( -name "credentials.json" \
     -o -name "*-key.json" \
     -o -name "service-account*.json" \
     -o -name "token.pickle" \) \
  -not -path "*/node_modules/*" \
  2>/dev/null | sort)

# System credential paths
system_paths=()
for rel in "${SYSTEM_CRED_PATHS[@]}"; do
  abs="$HOME/$rel"
  if [[ -e "$abs" ]]; then
    system_paths+=( "$abs" )
  fi
done

count=$((${#env_files[@]} + ${#system_paths[@]}))

if [[ $count -eq 0 ]]; then
  echo "$(yellow "No secrets found.")"
  exit 0
fi

echo "$(cyan "Project secrets") (${#env_files[@]} files):"
for f in "${env_files[@]}"; do
  size=$(wc -c < "$f" 2>/dev/null | tr -d ' ')
  echo "  $f  $(cyan "($size bytes)")"
done

echo ""
echo "$(cyan "System credentials") (${#system_paths[@]} paths):"
for p in "${system_paths[@]}"; do
  if [[ -d "$p" ]]; then
    files=$(find "$p" -type f 2>/dev/null | wc -l | tr -d ' ')
    size=$(du -sh "$p" 2>/dev/null | awk '{print $1}')
    echo "  $p  $(cyan "($files files, $size)")"
  else
    size=$(wc -c < "$p" 2>/dev/null | tr -d ' ')
    echo "  $p  $(cyan "($size bytes)")"
  fi
done
echo ""

if [[ "$MODE" == "--dry" || "$MODE" == "--dry-run" || "$MODE" == "-n" ]]; then
  echo "$(yellow "Dry run — no backup created.")"
  echo "Run without --dry to create encrypted backup."
  exit 0
fi

# ---- Create backup directory ----
if [[ ! -d "$BACKUP_DIR" ]]; then
  echo "$(cyan "Creating backup directory:") $BACKUP_DIR"
  mkdir -p "$BACKUP_DIR"
fi

OUTPUT_PATH="$BACKUP_DIR/$OUTPUT_FILE"

# ---- Get encryption password ----
echo "$(cyan "Encryption password")"
echo "Use a strong password. Save it to your password manager BEFORE confirming."
echo "Without this password, the backup is unrecoverable."
echo ""

read -srp "Password: " PASSWORD
echo ""
read -srp "Confirm:  " PASSWORD2
echo ""

if [[ "$PASSWORD" != "$PASSWORD2" ]]; then
  echo "$(red "✗ Passwords don't match")"
  exit 1
fi

if [[ ${#PASSWORD} -lt 12 ]]; then
  echo "$(red "✗ Password too short — use at least 12 characters")"
  exit 1
fi

# ---- Create encrypted tarball ----
echo ""
echo "$(cyan "Creating encrypted bundle...")"

# tar -> gzip -> openssl encrypt, all in pipe (no plaintext on disk)
# Combine env files and system credential paths
all_paths=( "${env_files[@]}" "${system_paths[@]}" )

if tar -czf - "${all_paths[@]}" 2>/dev/null | \
   openssl enc -aes-256-cbc -pbkdf2 -salt -out "$OUTPUT_PATH" -pass "pass:$PASSWORD"; then
  size=$(du -h "$OUTPUT_PATH" | awk '{print $1}')
  echo ""
  echo "$(green "✓ Backup created:")"
  echo "  $OUTPUT_PATH  $(cyan "($size)")"
  echo ""
  echo "$(cyan "Files included:") $count"
  echo "$(cyan "Encryption:") AES-256-CBC + PBKDF2"
  echo ""
  echo "$(yellow "⚠ IMPORTANT:")"
  echo "  1. Save the password to Apple Passwords / 1Password NOW"
  echo "  2. The backup is in iCloud — it'll sync to other Apple devices"
  echo "  3. Without the password, this backup is unrecoverable"
  echo ""
  echo "$(cyan "To restore later:")"
  echo "  $0 --decrypt \"$OUTPUT_PATH\""
else
  echo "$(red "✗ Backup failed")"
  rm -f "$OUTPUT_PATH" 2>/dev/null
  exit 1
fi

# Clear password from memory
PASSWORD=""
PASSWORD2=""

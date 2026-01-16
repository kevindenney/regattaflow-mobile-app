#!/bin/bash

# ============================================================================
# NurseFlow Setup Script
# ============================================================================
# Forks RegattaFlow to create NurseFlow for nursing education
#
# Usage: ./scripts/setup-nurseflow.sh [target-directory]
#
# Default target: /Users/kdenney/Developer/NurseFlow/nurseflow-app
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")"
TARGET_DIR="${1:-/Users/kdenney/Developer/NurseFlow/nurseflow-app}"
APP_NAME="NurseFlow"

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                    NurseFlow Setup Script                        ║"
echo "║                                                                  ║"
echo "║  Forking RegattaFlow → NurseFlow                                ║"
echo "║  Target: better.at/nursing                                       ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Source: $SOURCE_DIR"
echo "  Target: $TARGET_DIR"
echo ""

# Confirm before proceeding
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted.${NC}"
    exit 1
fi

# ============================================================================
# Step 1: Create target directory
# ============================================================================
echo ""
echo -e "${GREEN}[1/8] Creating project directory...${NC}"

if [ -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}Warning: Target directory already exists.${NC}"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Aborted.${NC}"
        exit 1
    fi
    rm -rf "$TARGET_DIR"
fi

mkdir -p "$(dirname "$TARGET_DIR")"

# ============================================================================
# Step 2: Copy codebase
# ============================================================================
echo -e "${GREEN}[2/8] Copying codebase (this may take a minute)...${NC}"

rsync -av --progress "$SOURCE_DIR/" "$TARGET_DIR/" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.expo' \
  --exclude 'dist' \
  --exclude '.next' \
  --exclude 'ios' \
  --exclude 'android' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.env.development' \
  --exclude '.env.production' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude 'coverage' \
  --exclude '.turbo' \
  | tail -n 5

echo "  Done!"

cd "$TARGET_DIR"

# ============================================================================
# Step 3: Initialize fresh git repo
# ============================================================================
echo -e "${GREEN}[3/8] Initializing git repository...${NC}"

git init --quiet
echo "  Git initialized"

# ============================================================================
# Step 4: Update package.json
# ============================================================================
echo -e "${GREEN}[4/8] Updating package.json...${NC}"

# Use node for more reliable JSON manipulation
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.name = 'nurseflow-app';
pkg.description = 'NurseFlow - Clinical education platform for nursing students';
pkg.version = '0.1.0';
delete pkg.repository;
delete pkg.bugs;
delete pkg.homepage;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('  Updated package.json');
"

# ============================================================================
# Step 5: Update app.json
# ============================================================================
echo -e "${GREEN}[5/8] Updating app.json...${NC}"

node -e "
const fs = require('fs');
const app = JSON.parse(fs.readFileSync('app.json', 'utf8'));
app.expo.name = 'NurseFlow';
app.expo.slug = 'nurseflow';
app.expo.scheme = 'nurseflow';
if (app.expo.ios) {
  app.expo.ios.bundleIdentifier = 'com.nurseflow.app';
}
if (app.expo.android) {
  app.expo.android.package = 'com.nurseflow.app';
}
fs.writeFileSync('app.json', JSON.stringify(app, null, 2));
console.log('  Updated app.json');
"

# ============================================================================
# Step 6: Create .env template
# ============================================================================
echo -e "${GREEN}[6/8] Creating .env template...${NC}"

cat > .env.example << 'EOF'
# ============================================================================
# NurseFlow Environment Variables
# ============================================================================

# Supabase (create new project at supabase.com)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Services (Anthropic Claude)
EXPO_PUBLIC_ANTHROPIC_API_KEY=your-anthropic-key

# Optional: Google Maps (for clinical site mapping)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Optional: Google AI
EXPO_PUBLIC_GOOGLE_AI_KEY=your-google-ai-key
EOF

echo "  Created .env.example"

# ============================================================================
# Step 7: Update CLAUDE.md for new project
# ============================================================================
echo -e "${GREEN}[7/8] Creating NurseFlow CLAUDE.md...${NC}"

cat > CLAUDE.md << 'EOF'
# CLAUDE.md - NurseFlow App

This file provides context for Claude Code when working on this project.

## Project Overview

NurseFlow is a clinical education platform for nursing students, adapted from RegattaFlow. It helps nursing students prepare for, execute, and reflect on clinical experiences while tracking progress toward NCLEX readiness.

**Target URL:** better.at/nursing

## Key Personas

- **Students**: Clinical shift preparation, competency tracking, NCLEX prep
- **Faculty**: Student supervision, evaluations, checkoffs
- **Preceptors**: Simplified shift verification and feedback
- **Program Admin**: Cohort management, placements, accreditation

## Core Concepts (Mapped from RegattaFlow)

| RegattaFlow | NurseFlow |
|-------------|-----------|
| Race | Clinical Shift |
| Practice Session | Skills Lab |
| Sailor | Student |
| Coach | Faculty |
| Club | Program |
| Venue | Clinical Site |
| Regatta | Rotation |
| Fleet | Cohort |

## Tech Stack

- **Framework**: Expo SDK 54 with React Native
- **Router**: Expo Router (file-based routing)
- **Styling**: NativeWind (TailwindCSS)
- **UI Components**: Gluestack UI
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **State Management**: TanStack React Query
- **AI**: Anthropic Claude SDK

## Common Commands

```bash
npm start                    # Start Expo dev server
npm run typecheck            # TypeScript checking
npm run lint                 # ESLint
npx supabase db push         # Push migrations
```

## Phase System

Clinical shifts have 4 phases:
- **Prep**: Patient research, care plan preparation
- **Launch**: Handoff, initial assessments, prioritization
- **Care**: Active patient care, medications, documentation
- **Reflect**: Structured reflection, NCLEX questions, AI analysis

## NCLEX Integration

Every clinical experience maps to NCLEX categories:
- Management of Care
- Safety and Infection Control
- Health Promotion and Maintenance
- Psychosocial Integrity
- Basic Care and Comfort
- Pharmacological Therapies
- Reduction of Risk Potential
- Physiological Adaptation

## Reference Documents

- `docs/NURSEFLOW_COMPLETE_CONCEPT.md` - Full concept
- `docs/NURSEFLOW_IMPLEMENTATION_GUIDE.md` - Implementation guide
EOF

echo "  Created CLAUDE.md"

# ============================================================================
# Step 8: Initial commit
# ============================================================================
echo -e "${GREEN}[8/8] Creating initial commit...${NC}"

git add .
git commit -m "Initial fork from RegattaFlow for NurseFlow

NurseFlow - Clinical education platform for nursing students
Target: better.at/nursing

Adapted from RegattaFlow sailing race management app.
See docs/NURSEFLOW_*.md for concept and implementation guides."

echo "  Committed"

# ============================================================================
# Complete!
# ============================================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Setup Complete!                               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "  1. Navigate to project:"
echo -e "     ${YELLOW}cd $TARGET_DIR${NC}"
echo ""
echo "  2. Install dependencies:"
echo -e "     ${YELLOW}npm install${NC}"
echo ""
echo "  3. Run entity renaming (optional, can do incrementally):"
echo -e "     ${YELLOW}node scripts/rename-entities.mjs --dry-run${NC}  # Preview"
echo -e "     ${YELLOW}node scripts/rename-entities.mjs${NC}            # Apply"
echo ""
echo "  4. Set up Supabase:"
echo -e "     ${YELLOW}cp .env.example .env${NC}"
echo -e "     # Edit .env with your Supabase credentials"
echo ""
echo "  5. Start development:"
echo -e "     ${YELLOW}npm start${NC}"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  - docs/NURSEFLOW_COMPLETE_CONCEPT.md"
echo "  - docs/NURSEFLOW_IMPLEMENTATION_GUIDE.md"
echo ""

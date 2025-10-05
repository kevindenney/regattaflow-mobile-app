#!/bin/bash

# Stripe Edge Functions Deployment Script
# This script deploys the Stripe Connect Edge Functions to Supabase

set -e  # Exit on error

echo "╔════════════════════════════════════════════╗"
echo "║   Stripe Edge Functions Deployment        ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Check if we're logged in
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase${NC}"
    echo ""
    echo "Please login:"
    echo "  supabase login"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Authenticated${NC}"
echo ""

# Check if project is linked
if [ ! -f ".git/supabase/config.toml" ] && [ ! -f "supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠️  Project not linked${NC}"
    echo ""
    echo "Please link your project:"
    echo "  supabase link --project-ref <your-project-ref>"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Project linked${NC}"
echo ""

# Check if functions directory exists
if [ ! -d "supabase/functions" ]; then
    echo -e "${RED}❌ supabase/functions directory not found${NC}"
    echo ""
    echo "Make sure you're in the project root directory"
    exit 1
fi

echo -e "${BLUE}📦 Functions to deploy:${NC}"
echo "  • stripe-balance"
echo "  • stripe-transactions"
echo ""

# Ask for confirmation
read -p "Continue with deployment? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "🚀 Deploying functions..."
echo ""

# Deploy stripe-balance
echo -e "${BLUE}Deploying stripe-balance...${NC}"
if supabase functions deploy stripe-balance; then
    echo -e "${GREEN}✅ stripe-balance deployed${NC}"
else
    echo -e "${RED}❌ Failed to deploy stripe-balance${NC}"
    exit 1
fi

echo ""

# Deploy stripe-transactions
echo -e "${BLUE}Deploying stripe-transactions...${NC}"
if supabase functions deploy stripe-transactions; then
    echo -e "${GREEN}✅ stripe-transactions deployed${NC}"
else
    echo -e "${RED}❌ Failed to deploy stripe-transactions${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✨ All functions deployed successfully!${NC}"
echo ""

# Check if STRIPE_SECRET_KEY is set
echo "🔐 Checking environment variables..."
if supabase secrets list | grep -q "STRIPE_SECRET_KEY"; then
    echo -e "${GREEN}✅ STRIPE_SECRET_KEY is set${NC}"
else
    echo -e "${YELLOW}⚠️  STRIPE_SECRET_KEY not set${NC}"
    echo ""
    echo "Set your Stripe secret key:"
    echo "  supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx"
    echo ""
    echo "Or for production:"
    echo "  supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx"
    echo ""
fi

echo ""
echo "📖 Next Steps:"
echo "  1. Set STRIPE_SECRET_KEY if not already set"
echo "  2. Run database migration: supabase db push"
echo "  3. Test the earnings screen in your app"
echo "  4. Monitor function logs: supabase functions logs stripe-balance"
echo ""
echo "🎉 Deployment complete!"

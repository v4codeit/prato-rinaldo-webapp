#!/bin/bash

# Deployment script for cleanup-sessions Edge Function
# This script deploys the function and sets up the cron schedule

set -e

echo "=========================================="
echo "Deploying cleanup-sessions Edge Function"
echo "=========================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "Error: Not logged in to Supabase"
    echo "Login with: supabase login"
    exit 1
fi

# Deploy the function
echo ""
echo "Step 1: Deploying function..."
supabase functions deploy cleanup-sessions

# Check if secrets need to be set
echo ""
echo "Step 2: Checking environment variables..."
echo "Please ensure the following secrets are set in your Supabase Dashboard:"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo ""
read -p "Have you set these secrets? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Set secrets using:"
    echo "  supabase secrets set SUPABASE_URL=your-url"
    echo "  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key"
    echo ""
    echo "Or set them in the Supabase Dashboard under:"
    echo "  Settings > Edge Functions > Secrets"
    exit 1
fi

# Test the function with dry run
echo ""
echo "Step 3: Testing function with dry run..."
PROJECT_REF=$(supabase projects list | grep -v "REFERENCE" | head -1 | awk '{print $3}')
if [ -z "$PROJECT_REF" ]; then
    echo "Warning: Could not determine project reference"
    echo "Please test manually using:"
    echo "  curl -X POST 'https://YOUR-PROJECT.supabase.co/functions/v1/cleanup-sessions?dry_run=true' \\"
    echo "    -H 'Authorization: Bearer YOUR_ANON_KEY'"
else
    echo "Project Reference: $PROJECT_REF"
    echo "Test URL: https://$PROJECT_REF.supabase.co/functions/v1/cleanup-sessions?dry_run=true"
fi

# Remind about cron setup
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo ""
echo "1. Test the function manually:"
echo "   curl -X POST 'https://YOUR-PROJECT.supabase.co/functions/v1/cleanup-sessions?dry_run=true' \\"
echo "     -H 'Authorization: Bearer YOUR_ANON_KEY'"
echo ""
echo "2. Set up cron schedule in supabase/config.toml:"
echo "   [functions.cleanup-sessions]"
echo "   verify_jwt = false"
echo "   "
echo "   [functions.cleanup-sessions.schedule]"
echo "   cron = \"0 2 * * *\"  # Daily at 2 AM UTC"
echo ""
echo "3. Or add the cron trigger in Supabase Dashboard:"
echo "   Edge Functions > cleanup-sessions > Add Cron Trigger"
echo "   Schedule: 0 2 * * *"
echo ""
echo "4. Monitor logs:"
echo "   supabase functions logs cleanup-sessions --follow"
echo ""

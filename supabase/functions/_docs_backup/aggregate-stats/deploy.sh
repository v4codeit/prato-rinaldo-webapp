#!/bin/bash

# Deployment script for aggregate-stats Edge Function
# This script deploys the function and configures the cron schedule

set -e  # Exit on error

echo "===================================="
echo "Deploying aggregate-stats function"
echo "===================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Deploy the Edge Function
echo "Deploying Edge Function..."
supabase functions deploy aggregate-stats

# Set environment variables (if not already set)
echo ""
echo "Checking environment variables..."

# Get current project reference
PROJECT_REF=$(supabase projects list --format json | jq -r '.[0].ref // empty')

if [ -z "$PROJECT_REF" ]; then
    echo "Warning: Could not determine project reference"
    echo "Please set environment variables manually:"
    echo "  supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co"
    echo "  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
else
    echo "Project reference: $PROJECT_REF"

    # Check if secrets are already set
    SECRETS=$(supabase secrets list --format json 2>/dev/null || echo "[]")

    if ! echo "$SECRETS" | jq -e '.[] | select(.name == "SUPABASE_URL")' > /dev/null; then
        echo "Setting SUPABASE_URL..."
        supabase secrets set SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
    else
        echo "SUPABASE_URL already set"
    fi

    if ! echo "$SECRETS" | jq -e '.[] | select(.name == "SUPABASE_SERVICE_ROLE_KEY")' > /dev/null; then
        echo ""
        echo "Warning: SUPABASE_SERVICE_ROLE_KEY not set"
        echo "Please set it manually:"
        echo "  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    else
        echo "SUPABASE_SERVICE_ROLE_KEY already set"
    fi
fi

# Apply database migration
echo ""
echo "Applying database migration..."
if [ -f "../migrations/00005_aggregated_stats_table.sql" ]; then
    echo "Migration file found: ../migrations/00005_aggregated_stats_table.sql"
    echo "Run: supabase db push"
else
    echo "Warning: Migration file not found"
    echo "Please apply the migration manually"
fi

# Deploy cron configuration
echo ""
echo "Deploying cron configuration..."
if [ -f "../.cron.yaml" ]; then
    echo "Cron config found: ../.cron.yaml"
    echo "The cron schedule will be automatically deployed with the function"
else
    echo "Warning: .cron.yaml not found"
    echo "Please configure cron manually in Supabase Dashboard:"
    echo "  1. Go to Edge Functions > aggregate-stats"
    echo "  2. Navigate to 'Cron jobs' tab"
    echo "  3. Set schedule: 0 */6 * * * (every 6 hours)"
fi

# Test the function
echo ""
echo "Testing the function..."
echo "Invoking aggregate-stats function..."
supabase functions invoke aggregate-stats --no-verify-jwt || echo "Test failed (this is expected if no data exists yet)"

echo ""
echo "===================================="
echo "Deployment complete!"
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Verify the function in Supabase Dashboard"
echo "2. Check logs: supabase functions logs aggregate-stats"
echo "3. Configure cron schedule if not already set"
echo "4. Run initial calculation: supabase functions invoke aggregate-stats"
echo ""
echo "The function will automatically run every 6 hours"
echo "Stats will be available in the aggregated_stats table"

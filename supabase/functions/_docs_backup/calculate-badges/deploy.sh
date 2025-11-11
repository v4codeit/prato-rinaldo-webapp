#!/bin/bash

# Deployment script for calculate-badges Edge Function
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e  # Exit on error

ENVIRONMENT=${1:-staging}
FUNCTION_NAME="calculate-badges"

echo "========================================="
echo "Deploying $FUNCTION_NAME Edge Function"
echo "Environment: $ENVIRONMENT"
echo "========================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Step 1: Deploy the function
echo ""
echo "Step 1: Deploying function..."
supabase functions deploy $FUNCTION_NAME

# Step 2: Set up environment variables (if needed)
echo ""
echo "Step 2: Environment variables..."
echo "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically provided"

# Step 3: Test the function
echo ""
echo "Step 3: Testing function..."
echo "Running test invocation..."

# Get project reference
PROJECT_REF=$(supabase projects list --output json | jq -r '.[0].id // empty')

if [ -z "$PROJECT_REF" ]; then
    echo "Warning: Could not determine project reference. Skipping test."
else
    echo "Testing function at: https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME"
    # Uncomment to test immediately after deployment:
    # curl -i --location --request POST "https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME" \
    #   --header "Authorization: Bearer $SUPABASE_ANON_KEY" \
    #   --header "Content-Type: application/json"
fi

# Step 4: Set up Cron job
echo ""
echo "Step 4: Setting up Cron job..."
echo "You need to manually create a Cron job to run this function hourly."
echo ""
echo "Run this SQL in your Supabase SQL Editor:"
echo ""
cat << 'EOF'
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the function to run every hour
SELECT cron.schedule(
  'calculate-badges-hourly',
  '0 * * * *',  -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-badges',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

-- Check if the job was created
SELECT * FROM cron.job WHERE jobname = 'calculate-badges-hourly';
EOF
echo ""
echo "Don't forget to replace YOUR_PROJECT_REF and YOUR_ANON_KEY!"

echo ""
echo "========================================="
echo "Deployment completed successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Ensure badges are seeded (run seed-badges.sql)"
echo "2. Set up the Cron job using the SQL above"
echo "3. Monitor logs: supabase functions logs $FUNCTION_NAME"
echo "4. Test manually: curl your function endpoint"
echo ""

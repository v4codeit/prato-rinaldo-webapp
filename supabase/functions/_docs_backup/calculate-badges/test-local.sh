#!/bin/bash

# Local testing script for calculate-badges Edge Function
# This script starts the function locally and tests it

set -e

FUNCTION_NAME="calculate-badges"
LOCAL_PORT=54321

echo "========================================="
echo "Testing $FUNCTION_NAME Edge Function Locally"
echo "========================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if local Supabase is running
if ! curl -s http://localhost:$LOCAL_PORT/rest/v1/ > /dev/null 2>&1; then
    echo "Error: Local Supabase is not running"
    echo "Start it with: supabase start"
    exit 1
fi

echo ""
echo "Starting function locally..."
echo "Press Ctrl+C to stop"
echo ""

# Serve the function in the background
supabase functions serve $FUNCTION_NAME --no-verify-jwt &
SERVE_PID=$!

# Wait for function to start
sleep 3

# Test the function
echo ""
echo "Testing function..."
echo ""

curl -i --location --request POST "http://localhost:$LOCAL_PORT/functions/v1/$FUNCTION_NAME" \
  --header "Authorization: Bearer $(supabase status --output json | jq -r '.anon_key')" \
  --header "Content-Type: application/json"

echo ""
echo ""
echo "Test completed. Check the output above for results."
echo ""

# Clean up
echo "Stopping function server..."
kill $SERVE_PID 2>/dev/null || true

echo "Done!"

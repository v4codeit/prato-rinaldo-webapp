#!/bin/bash

# Email Notifications Edge Function Test Script
# This script helps test the email-notifications function with various scenarios

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FUNCTION_URL="${FUNCTION_URL:-http://localhost:54321/functions/v1/email-notifications}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-test-secret}"
ANON_KEY="${ANON_KEY:-your-anon-key}"

echo -e "${YELLOW}Email Notifications Test Script${NC}"
echo "=================================="
echo "Function URL: $FUNCTION_URL"
echo ""

# Test 1: Marketplace Item Approved
test_marketplace_approved() {
  echo -e "${YELLOW}Test 1: Marketplace Item Approved${NC}"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "x-webhook-signature: $WEBHOOK_SECRET" \
    -d '{
      "type": "UPDATE",
      "table": "marketplace_items",
      "record": {
        "id": "test-item-123",
        "status": "approved",
        "seller_id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Beautiful Handmade Ceramic Vase",
        "price": 45.50,
        "donation_percentage": 15
      },
      "old_record": {
        "status": "pending"
      }
    }')

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Test passed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  else
    echo -e "${RED}✗ Test failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  fi
  echo ""
}

# Test 2: Marketplace Item Rejected
test_marketplace_rejected() {
  echo -e "${YELLOW}Test 2: Marketplace Item Rejected${NC}"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "x-webhook-signature: $WEBHOOK_SECRET" \
    -d '{
      "type": "UPDATE",
      "table": "marketplace_items",
      "record": {
        "id": "test-item-456",
        "status": "rejected",
        "seller_id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Vintage Bicycle",
        "price": 120.00,
        "donation_percentage": 0
      },
      "old_record": {
        "status": "pending"
      }
    }')

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Test passed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  else
    echo -e "${RED}✗ Test failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  fi
  echo ""
}

# Test 3: Professional Profile Approved
test_professional_approved() {
  echo -e "${YELLOW}Test 3: Professional Profile Approved${NC}"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "x-webhook-signature: $WEBHOOK_SECRET" \
    -d '{
      "type": "UPDATE",
      "table": "professional_profiles",
      "record": {
        "id": "test-prof-123",
        "status": "approved",
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Experienced Electrician",
        "category": "electrical",
        "availability": "paid",
        "hourly_rate": 45.00
      },
      "old_record": {
        "status": "pending"
      }
    }')

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Test passed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  else
    echo -e "${RED}✗ Test failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  fi
  echo ""
}

# Test 4: Professional Profile Rejected
test_professional_rejected() {
  echo -e "${YELLOW}Test 4: Professional Profile Rejected${NC}"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "x-webhook-signature: $WEBHOOK_SECRET" \
    -d '{
      "type": "UPDATE",
      "table": "professional_profiles",
      "record": {
        "id": "test-prof-456",
        "status": "rejected",
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Plumbing Services",
        "category": "plumbing",
        "availability": "volunteer",
        "hourly_rate": null
      },
      "old_record": {
        "status": "pending"
      }
    }')

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Test passed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  else
    echo -e "${RED}✗ Test failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  fi
  echo ""
}

# Test 5: User Verification Approved
test_user_verification() {
  echo -e "${YELLOW}Test 5: User Verification Approved${NC}"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "x-webhook-signature: $WEBHOOK_SECRET" \
    -d '{
      "type": "UPDATE",
      "table": "users",
      "record": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "verification_status": "approved",
        "name": "Mario Rossi",
        "email": "mario.rossi@example.com"
      },
      "old_record": {
        "verification_status": "pending"
      }
    }')

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Test passed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  else
    echo -e "${RED}✗ Test failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  fi
  echo ""
}

# Test 6: Invalid Webhook Signature
test_invalid_signature() {
  echo -e "${YELLOW}Test 6: Invalid Webhook Signature (should fail)${NC}"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "x-webhook-signature: wrong-secret" \
    -d '{
      "type": "UPDATE",
      "table": "marketplace_items",
      "record": {
        "id": "test-item-789",
        "status": "approved"
      },
      "old_record": {
        "status": "pending"
      }
    }')

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${GREEN}✓ Test passed - correctly rejected (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  else
    echo -e "${RED}✗ Test failed - should have been rejected (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  fi
  echo ""
}

# Test 7: Wrong HTTP Method
test_wrong_method() {
  echo -e "${YELLOW}Test 7: Wrong HTTP Method (should fail)${NC}"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$FUNCTION_URL" \
    -H "Authorization: Bearer $ANON_KEY")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -eq 405 ]; then
    echo -e "${GREEN}✓ Test passed - correctly rejected (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  else
    echo -e "${RED}✗ Test failed - should have been rejected (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  fi
  echo ""
}

# Test 8: No Status Change (should skip)
test_no_status_change() {
  echo -e "${YELLOW}Test 8: No Status Change (should skip email)${NC}"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "x-webhook-signature: $WEBHOOK_SECRET" \
    -d '{
      "type": "UPDATE",
      "table": "marketplace_items",
      "record": {
        "id": "test-item-999",
        "status": "pending",
        "title": "Updated title only"
      },
      "old_record": {
        "status": "pending",
        "title": "Original title"
      }
    }')

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Test passed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
    echo -e "${YELLOW}Note: Should show 'sent: 0'${NC}"
  else
    echo -e "${RED}✗ Test failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
  fi
  echo ""
}

# Run all tests
run_all_tests() {
  echo -e "${YELLOW}Running all tests...${NC}"
  echo ""

  test_marketplace_approved
  test_marketplace_rejected
  test_professional_approved
  test_professional_rejected
  test_user_verification
  test_invalid_signature
  test_wrong_method
  test_no_status_change

  echo -e "${GREEN}All tests completed!${NC}"
}

# Main menu
show_menu() {
  echo "Select test to run:"
  echo "1) Marketplace Item Approved"
  echo "2) Marketplace Item Rejected"
  echo "3) Professional Profile Approved"
  echo "4) Professional Profile Rejected"
  echo "5) User Verification Approved"
  echo "6) Invalid Webhook Signature"
  echo "7) Wrong HTTP Method"
  echo "8) No Status Change"
  echo "9) Run all tests"
  echo "0) Exit"
  echo ""
  read -p "Enter choice: " choice

  case $choice in
    1) test_marketplace_approved ;;
    2) test_marketplace_rejected ;;
    3) test_professional_approved ;;
    4) test_professional_rejected ;;
    5) test_user_verification ;;
    6) test_invalid_signature ;;
    7) test_wrong_method ;;
    8) test_no_status_change ;;
    9) run_all_tests ;;
    0) exit 0 ;;
    *) echo -e "${RED}Invalid choice${NC}" ;;
  esac
}

# Check if running with argument
if [ "$1" == "all" ]; then
  run_all_tests
else
  show_menu
fi

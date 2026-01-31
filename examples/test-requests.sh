#!/bin/bash

# FON SDK Express CRUD App - Test Requests
# Make sure the Express app is running before executing this script:
#   npx ts-node examples/express-crud-app.ts

BASE_URL="http://localhost:3000"

echo "======================================"
echo "FON SDK Express CRUD App - Test Suite"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Get info
echo -e "${BLUE}1. GET / - View available routes${NC}"
curl -s "$BASE_URL/" | json_pp
echo ""
echo ""

# 2. Create user with FON transformation
echo -e "${BLUE}2. POST /foon/users - Create user with messy fields (FON transformation)${NC}"
echo -e "${YELLOW}   Input: firstname, lastname, email_address, user_age (string), user_role${NC}"
echo -e "${YELLOW}   Expected: Transform to schema-compliant format${NC}"
curl -s -X POST "$BASE_URL/foon/users" \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "John",
    "lastname": "Doe",
    "email_address": "john@example.com",
    "user_age": "30",
    "user_role": "admin"
  }' | json_pp
echo ""
echo ""

# 3. Create user without transformation
echo -e "${BLUE}3. POST /users - Create user with exact schema (no transformation)${NC}"
curl -s -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": {
      "given": "Jane",
      "family": "Smith"
    },
    "email": "jane@example.com",
    "age": 25,
    "role": "user"
  }' | json_pp
echo ""
echo ""

# 4. Create another user with FON
echo -e "${BLUE}4. POST /foon/users - Create another user with different messy format${NC}"
echo -e "${YELLOW}   Input: first_name, last_name, mail${NC}"
curl -s -X POST "$BASE_URL/foon/users" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Alice",
    "last_name": "Johnson",
    "mail": "alice@example.com",
    "years_old": "28"
  }' | json_pp
echo ""
echo ""

# 5. Get all users
echo -e "${BLUE}5. GET /users - List all users${NC}"
curl -s "$BASE_URL/users" | json_pp
echo ""
echo ""

# 6. Get single user
echo -e "${BLUE}6. GET /users/1 - Get specific user${NC}"
curl -s "$BASE_URL/users/1" | json_pp
echo ""
echo ""

# 7. Update user with FON
echo -e "${BLUE}7. PUT /foon/users/1 - Update user with messy fields (FON transformation)${NC}"
echo -e "${YELLOW}   Input: first, new_email${NC}"
curl -s -X PUT "$BASE_URL/foon/users/1" \
  -H "Content-Type: application/json" \
  -d '{
    "first": "Jonathan",
    "new_email": "jonathan@example.com"
  }' | json_pp
echo ""
echo ""

# 8. Update user without transformation
echo -e "${BLUE}8. PUT /users/2 - Update user with exact schema (no transformation)${NC}"
curl -s -X PUT "$BASE_URL/users/2" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 26
  }' | json_pp
echo ""
echo ""

# 9. Get all users again to see updates
echo -e "${BLUE}9. GET /users - List all users (after updates)${NC}"
curl -s "$BASE_URL/users" | json_pp
echo ""
echo ""

# 10. Delete user
echo -e "${BLUE}10. DELETE /users/1 - Delete user${NC}"
curl -s -X DELETE "$BASE_URL/users/1" | json_pp
echo ""
echo ""

# 11. Get all users after delete
echo -e "${BLUE}11. GET /users - List all users (after delete)${NC}"
curl -s "$BASE_URL/users" | json_pp
echo ""
echo ""

# 12. Try to create with low confidence (should fail)
echo -e "${BLUE}12. POST /foon/users - Create with ambiguous fields (should fail)${NC}"
echo -e "${YELLOW}   Input: Random fields that don't map well${NC}"
curl -s -X POST "$BASE_URL/foon/users" \
  -H "Content-Type: application/json" \
  -d '{
    "xyz": "test",
    "abc": "value"
  }' | json_pp
echo ""
echo ""

echo -e "${GREEN}======================================"
echo -e "Test suite completed!"
echo -e "======================================${NC}"

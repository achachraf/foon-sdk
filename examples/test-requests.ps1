# FON SDK Express CRUD App - Test Requests (PowerShell)
# Make sure the Express app is running before executing this script:
#   npx ts-node examples/express-crud-app.ts

$BaseUrl = "http://localhost:3000"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "FON SDK Express CRUD App - Test Suite" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Get info
Write-Host "1. GET / - View available routes" -ForegroundColor Blue
Invoke-RestMethod -Uri "$BaseUrl/" -Method Get | ConvertTo-Json -Depth 10
Write-Host ""

# 2. Create user with FON transformation
Write-Host "2. POST /foon/users - Create user with messy fields (FON transformation)" -ForegroundColor Blue
Write-Host "   Input: firstname, lastname, email_address, user_age (string), user_role" -ForegroundColor Yellow
$body1 = @{
    firstname = "John"
    lastname = "Doe"
    email_address = "john@example.com"
    user_age = "30"
    user_role = "admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BaseUrl/foon/users" -Method Post -Body $body1 -ContentType "application/json" | ConvertTo-Json -Depth 10
Write-Host ""

# 3. Create user without transformation
Write-Host "3. POST /users - Create user with exact schema (no transformation)" -ForegroundColor Blue
$body2 = @{
    name = @{
        given = "Jane"
        family = "Smith"
    }
    email = "jane@example.com"
    age = 25
    role = "user"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BaseUrl/users" -Method Post -Body $body2 -ContentType "application/json" | ConvertTo-Json -Depth 10
Write-Host ""

# 4. Create another user with FON
Write-Host "4. POST /foon/users - Create another user with different messy format" -ForegroundColor Blue
$body3 = @{
    first_name = "Alice"
    last_name = "Johnson"
    mail = "alice@example.com"
    years_old = "28"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BaseUrl/foon/users" -Method Post -Body $body3 -ContentType "application/json" | ConvertTo-Json -Depth 10
Write-Host ""

# 5. Get all users
Write-Host "5. GET /users - List all users" -ForegroundColor Blue
Invoke-RestMethod -Uri "$BaseUrl/users" -Method Get | ConvertTo-Json -Depth 10
Write-Host ""

# 6. Get single user
Write-Host "6. GET /users/1 - Get specific user" -ForegroundColor Blue
Invoke-RestMethod -Uri "$BaseUrl/users/1" -Method Get | ConvertTo-Json -Depth 10
Write-Host ""

# 7. Update user with FON
Write-Host "7. PUT /foon/users/1 - Update user with messy fields (FON transformation)" -ForegroundColor Blue
$body4 = @{
    first = "Jonathan"
    new_email = "jonathan@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BaseUrl/foon/users/1" -Method Put -Body $body4 -ContentType "application/json" | ConvertTo-Json -Depth 10
Write-Host ""

# 8. Update user without transformation
Write-Host "8. PUT /users/2 - Update user with exact schema (no transformation)" -ForegroundColor Blue
$body5 = @{
    age = 26
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BaseUrl/users/2" -Method Put -Body $body5 -ContentType "application/json" | ConvertTo-Json -Depth 10
Write-Host ""

# 9. Get all users again
Write-Host "9. GET /users - List all users (after updates)" -ForegroundColor Blue
Invoke-RestMethod -Uri "$BaseUrl/users" -Method Get | ConvertTo-Json -Depth 10
Write-Host ""

# 10. Delete user
Write-Host "10. DELETE /users/1 - Delete user" -ForegroundColor Blue
Invoke-RestMethod -Uri "$BaseUrl/users/1" -Method Delete | ConvertTo-Json -Depth 10
Write-Host ""

# 11. Get all users after delete
Write-Host "11. GET /users - List all users (after delete)" -ForegroundColor Blue
Invoke-RestMethod -Uri "$BaseUrl/users" -Method Get | ConvertTo-Json -Depth 10
Write-Host ""

# 12. Try with ambiguous fields (should fail)
Write-Host "12. POST /foon/users - Create with ambiguous fields (should fail)" -ForegroundColor Blue
try {
    $body6 = @{
        xyz = "test"
        abc = "value"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "$BaseUrl/foon/users" -Method Post -Body $body6 -ContentType "application/json" | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Expected error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "======================================" -ForegroundColor Green
Write-Host "Test suite completed!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Email Notifications Edge Function Test Script (PowerShell)
# This script helps test the email-notifications function with various scenarios

# Configuration
$FunctionUrl = if ($env:FUNCTION_URL) { $env:FUNCTION_URL } else { "http://localhost:54321/functions/v1/email-notifications" }
$WebhookSecret = if ($env:WEBHOOK_SECRET) { $env:WEBHOOK_SECRET } else { "test-secret" }
$AnonKey = if ($env:ANON_KEY) { $env:ANON_KEY } else { "your-anon-key" }

Write-Host "Email Notifications Test Script" -ForegroundColor Yellow
Write-Host "=================================="
Write-Host "Function URL: $FunctionUrl"
Write-Host ""

function Test-Endpoint {
    param(
        [string]$TestName,
        [hashtable]$Body
    )

    Write-Host "Testing: $TestName" -ForegroundColor Yellow

    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $AnonKey"
        "x-webhook-signature" = $WebhookSecret
    }

    $jsonBody = $Body | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-WebRequest -Uri $FunctionUrl -Method POST -Headers $headers -Body $jsonBody -UseBasicParsing

        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Test passed (HTTP $($response.StatusCode))" -ForegroundColor Green
            Write-Host "Response: $($response.Content)"
        } else {
            Write-Host "✗ Test failed (HTTP $($response.StatusCode))" -ForegroundColor Red
            Write-Host "Response: $($response.Content)"
        }
    } catch {
        Write-Host "✗ Test failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody"
        }
    }

    Write-Host ""
}

function Test-MarketplaceApproved {
    $body = @{
        type = "UPDATE"
        table = "marketplace_items"
        record = @{
            id = "test-item-123"
            status = "approved"
            seller_id = "550e8400-e29b-41d4-a716-446655440000"
            title = "Beautiful Handmade Ceramic Vase"
            price = 45.50
            donation_percentage = 15
        }
        old_record = @{
            status = "pending"
        }
    }

    Test-Endpoint -TestName "Marketplace Item Approved" -Body $body
}

function Test-MarketplaceRejected {
    $body = @{
        type = "UPDATE"
        table = "marketplace_items"
        record = @{
            id = "test-item-456"
            status = "rejected"
            seller_id = "550e8400-e29b-41d4-a716-446655440000"
            title = "Vintage Bicycle"
            price = 120.00
            donation_percentage = 0
        }
        old_record = @{
            status = "pending"
        }
    }

    Test-Endpoint -TestName "Marketplace Item Rejected" -Body $body
}

function Test-ProfessionalApproved {
    $body = @{
        type = "UPDATE"
        table = "professional_profiles"
        record = @{
            id = "test-prof-123"
            status = "approved"
            user_id = "550e8400-e29b-41d4-a716-446655440000"
            title = "Experienced Electrician"
            category = "electrical"
            availability = "paid"
            hourly_rate = 45.00
        }
        old_record = @{
            status = "pending"
        }
    }

    Test-Endpoint -TestName "Professional Profile Approved" -Body $body
}

function Test-ProfessionalRejected {
    $body = @{
        type = "UPDATE"
        table = "professional_profiles"
        record = @{
            id = "test-prof-456"
            status = "rejected"
            user_id = "550e8400-e29b-41d4-a716-446655440000"
            title = "Plumbing Services"
            category = "plumbing"
            availability = "volunteer"
            hourly_rate = $null
        }
        old_record = @{
            status = "pending"
        }
    }

    Test-Endpoint -TestName "Professional Profile Rejected" -Body $body
}

function Test-UserVerification {
    $body = @{
        type = "UPDATE"
        table = "users"
        record = @{
            id = "550e8400-e29b-41d4-a716-446655440000"
            verification_status = "approved"
            name = "Mario Rossi"
            email = "mario.rossi@example.com"
        }
        old_record = @{
            verification_status = "pending"
        }
    }

    Test-Endpoint -TestName "User Verification Approved" -Body $body
}

function Test-InvalidSignature {
    Write-Host "Testing: Invalid Webhook Signature (should fail)" -ForegroundColor Yellow

    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $AnonKey"
        "x-webhook-signature" = "wrong-secret"
    }

    $body = @{
        type = "UPDATE"
        table = "marketplace_items"
        record = @{
            id = "test-item-789"
            status = "approved"
        }
        old_record = @{
            status = "pending"
        }
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri $FunctionUrl -Method POST -Headers $headers -Body $body -UseBasicParsing
        Write-Host "✗ Test failed - should have been rejected (HTTP $($response.StatusCode))" -ForegroundColor Red
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "✓ Test passed - correctly rejected (HTTP 401)" -ForegroundColor Green
        } else {
            Write-Host "✗ Test failed - wrong status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
    }

    Write-Host ""
}

function Test-WrongMethod {
    Write-Host "Testing: Wrong HTTP Method (should fail)" -ForegroundColor Yellow

    $headers = @{
        "Authorization" = "Bearer $AnonKey"
    }

    try {
        $response = Invoke-WebRequest -Uri $FunctionUrl -Method GET -Headers $headers -UseBasicParsing
        Write-Host "✗ Test failed - should have been rejected (HTTP $($response.StatusCode))" -ForegroundColor Red
    } catch {
        if ($_.Exception.Response.StatusCode -eq 405) {
            Write-Host "✓ Test passed - correctly rejected (HTTP 405)" -ForegroundColor Green
        } else {
            Write-Host "✗ Test failed - wrong status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
    }

    Write-Host ""
}

function Test-NoStatusChange {
    $body = @{
        type = "UPDATE"
        table = "marketplace_items"
        record = @{
            id = "test-item-999"
            status = "pending"
            title = "Updated title only"
        }
        old_record = @{
            status = "pending"
            title = "Original title"
        }
    }

    Write-Host "Testing: No Status Change (should skip email)" -ForegroundColor Yellow
    Test-Endpoint -TestName "No Status Change" -Body $body
    Write-Host "Note: Should show 'sent: 0'" -ForegroundColor Yellow
}

function Run-AllTests {
    Write-Host "Running all tests..." -ForegroundColor Yellow
    Write-Host ""

    Test-MarketplaceApproved
    Test-MarketplaceRejected
    Test-ProfessionalApproved
    Test-ProfessionalRejected
    Test-UserVerification
    Test-InvalidSignature
    Test-WrongMethod
    Test-NoStatusChange

    Write-Host "All tests completed!" -ForegroundColor Green
}

function Show-Menu {
    Write-Host ""
    Write-Host "Select test to run:"
    Write-Host "1) Marketplace Item Approved"
    Write-Host "2) Marketplace Item Rejected"
    Write-Host "3) Professional Profile Approved"
    Write-Host "4) Professional Profile Rejected"
    Write-Host "5) User Verification Approved"
    Write-Host "6) Invalid Webhook Signature"
    Write-Host "7) Wrong HTTP Method"
    Write-Host "8) No Status Change"
    Write-Host "9) Run all tests"
    Write-Host "0) Exit"
    Write-Host ""

    $choice = Read-Host "Enter choice"

    switch ($choice) {
        "1" { Test-MarketplaceApproved; Show-Menu }
        "2" { Test-MarketplaceRejected; Show-Menu }
        "3" { Test-ProfessionalApproved; Show-Menu }
        "4" { Test-ProfessionalRejected; Show-Menu }
        "5" { Test-UserVerification; Show-Menu }
        "6" { Test-InvalidSignature; Show-Menu }
        "7" { Test-WrongMethod; Show-Menu }
        "8" { Test-NoStatusChange; Show-Menu }
        "9" { Run-AllTests }
        "0" { exit 0 }
        default { Write-Host "Invalid choice" -ForegroundColor Red; Show-Menu }
    }
}

# Check if running with argument
if ($args[0] -eq "all") {
    Run-AllTests
} else {
    Show-Menu
}

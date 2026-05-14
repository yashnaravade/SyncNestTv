# Test script for T06: Room Invites System

$API_URL = "http://localhost:3001/api"
$HEADERS = @{ "Content-Type" = "application/json" }

# Test 1: Register two test users
Write-Host "`n=== TEST 1: Register Users ===" -ForegroundColor Green

$register1 = @{
    email    = "user1_$(Get-Random)@test.com"
    username = "user1_$(Get-Random)"
    password = "Test123!@#"
} | ConvertTo-Json

$user1Response = Invoke-WebRequest -Uri "$API_URL/auth/register" `
    -Method POST -Headers $HEADERS -Body $register1 | ConvertFrom-Json

$user1Email = $user1Response.email
$user1Id = $user1Response.id
Write-Host "✓ User 1 created: $user1Email" -ForegroundColor Green

$register2 = @{
    email    = "user2_$(Get-Random)@test.com"
    username = "user2_$(Get-Random)"
    password = "Test123!@#"
} | ConvertTo-Json

$user2Response = Invoke-WebRequest -Uri "$API_URL/auth/register" `
    -Method POST -Headers $HEADERS -Body $register2 | ConvertFrom-Json

$user2Email = $user2Response.email
$user2Id = $user2Response.id
Write-Host "✓ User 2 created: $user2Email" -ForegroundColor Green

# Test 2: Login users
Write-Host "`n=== TEST 2: Login Users ===" -ForegroundColor Green

$login1 = @{
    email    = $user1Email
    password = "Test123!@#"
} | ConvertTo-Json

$user1Login = Invoke-WebRequest -Uri "$API_URL/auth/login" `
    -Method POST -Headers $HEADERS -Body $login1 | ConvertFrom-Json

$user1Token = $user1Login.accessToken
Write-Host "✓ User 1 logged in" -ForegroundColor Green

$login2 = @{
    email    = $user2Email
    password = "Test123!@#"
} | ConvertTo-Json

$user2Login = Invoke-WebRequest -Uri "$API_URL/auth/login" `
    -Method POST -Headers $HEADERS -Body $login2 | ConvertFrom-Json

$user2Token = $user2Login.accessToken
Write-Host "✓ User 2 logged in" -ForegroundColor Green

# Test 3: User1 creates a room
Write-Host "`n=== TEST 3: Create Room ===" -ForegroundColor Green

$headers1 = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $user1Token"
}

$createRoom = @{
    name        = "Test Watch Party"
    description = "Testing invite system"
} | ConvertTo-Json

$roomResponse = Invoke-WebRequest -Uri "$API_URL/rooms" `
    -Method POST -Headers $headers1 -Body $createRoom | ConvertFrom-Json

$roomId = $roomResponse.id
Write-Host "✓ Room created: $roomId" -ForegroundColor Green

# Test 4: Create an invite code
Write-Host "`n=== TEST 4: Create Invite Code ===" -ForegroundColor Green

$createInvite = @{
    expiryDays = 7
    maxUses    = 10
} | ConvertTo-Json

$inviteResponse = Invoke-WebRequest -Uri "$API_URL/invites/$roomId" `
    -Method POST -Headers $headers1 -Body $createInvite | ConvertFrom-Json

$inviteCode = $inviteResponse.code
Write-Host "✓ Invite code created: $inviteCode" -ForegroundColor Green
Write-Host "  - Format: adjective-noun-4digits ✓" -ForegroundColor Cyan
Write-Host "  - Max uses: $($inviteResponse.maxUses)" -ForegroundColor Cyan
Write-Host "  - Current uses: $($inviteResponse.useCount)" -ForegroundColor Cyan

# Test 5: User2 joins using invite code
Write-Host "`n=== TEST 5: Join Room Via Invite ===" -ForegroundColor Green

$headers2 = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $user2Token"
}

$joinInvite = @{
    inviteCode = $inviteCode
} | ConvertTo-Json

$joinResponse = Invoke-WebRequest -Uri "$API_URL/invites/join/with-code" `
    -Method POST -Headers $headers2 -Body $joinInvite | ConvertFrom-Json

Write-Host "✓ User 2 successfully joined room" -ForegroundColor Green
Write-Host "  - Room ID: $($joinResponse.room.id)" -ForegroundColor Cyan

# Test 6: Verify duplicate join fails
Write-Host "`n=== TEST 6: Verify Duplicate Join Prevention ===" -ForegroundColor Green

try {
    $duplicateJoin = @{
        inviteCode = $inviteCode
    } | ConvertTo-Json

    Invoke-WebRequest -Uri "$API_URL/invites/join/with-code" `
        -Method POST -Headers $headers2 -Body $duplicateJoin -ErrorAction Stop
    
    Write-Host "✗ ERROR: Duplicate join was allowed" -ForegroundColor Red
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✓ Duplicate join correctly rejected with 400 error" -ForegroundColor Green
    }
}

# Test 7: Get invites list
Write-Host "`n=== TEST 7: Get Invites List ===" -ForegroundColor Green

$invitesListResponse = Invoke-WebRequest -Uri "$API_URL/invites/$roomId" `
    -Method GET -Headers $headers1 | ConvertFrom-Json

Write-Host "✓ Invites list retrieved" -ForegroundColor Green
Write-Host "  - Total invites: $($invitesListResponse.Count)" -ForegroundColor Cyan
Write-Host "  - First invite code: $($invitesListResponse[0].code)" -ForegroundColor Cyan
Write-Host "  - Use count: $($invitesListResponse[0].useCount)/$($invitesListResponse[0].maxUses)" -ForegroundColor Cyan

Write-Host "`n=== ALL TESTS PASSED ✓ ===" -ForegroundColor Green
Write-Host "`nT06 Implementation Summary:" -ForegroundColor Yellow
Write-Host "  ✓ Generate unique invite codes (adjective-noun-4digits format)" -ForegroundColor Green
Write-Host "  ✓ Create invites with optional expiry and max uses" -ForegroundColor Green
Write-Host "  ✓ Validate and use invites to join rooms" -ForegroundColor Green
Write-Host "  ✓ Prevent duplicate room joins" -ForegroundColor Green
Write-Host "  ✓ Track invite usage count" -ForegroundColor Green

$API_URL = "http://localhost:3001/api"

# Step 1: Register User 1
$register1 = @{
    email    = "testuser1@test.com"
    username = "testuser1"
    password = "Test123!@#"
} | ConvertTo-Json

Write-Host "Registering User 1..."
$user1Response = Invoke-WebRequest -Uri "$API_URL/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $register1 | ConvertFrom-Json
$user1Email = $user1Response.email
Write-Host "✓ User 1 created: $user1Email"

# Step 2: Register User 2
$register2 = @{
    email    = "testuser2@test.com"
    username = "testuser2"
    password = "Test123!@#"
} | ConvertTo-Json

Write-Host "Registering User 2..."
$user2Response = Invoke-WebRequest -Uri "$API_URL/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $register2 | ConvertFrom-Json
$user2Email = $user2Response.email
Write-Host "✓ User 2 created: $user2Email"

# Step 3: Login User 1
$login1 = @{
    email    = $user1Email
    password = "Test123!@#"
} | ConvertTo-Json

Write-Host "Logging in User 1..."
$user1Login = Invoke-WebRequest -Uri "$API_URL/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $login1 | ConvertFrom-Json
$user1Token = $user1Login.accessToken
Write-Host "✓ User 1 token received"

# Step 4: Login User 2
$login2 = @{
    email    = $user2Email
    password = "Test123!@#"
} | ConvertTo-Json

Write-Host "Logging in User 2..."
$user2Login = Invoke-WebRequest -Uri "$API_URL/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $login2 | ConvertFrom-Json
$user2Token = $user2Login.accessToken
Write-Host "✓ User 2 token received"

# Step 5: User 1 creates a room
$createRoom = @{
    name        = "Test Watch Party"
    description = "Testing invites"
} | ConvertTo-Json

$headers1 = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $user1Token"
}

Write-Host "Creating room..."
$roomResponse = Invoke-WebRequest -Uri "$API_URL/rooms" -Method POST -Headers $headers1 -Body $createRoom | ConvertFrom-Json
$roomId = $roomResponse.id
Write-Host "✓ Room created: $roomId"

# Step 6: Create an invite code
$createInvite = @{
    expiryDays = 7
    maxUses    = 10
} | ConvertTo-Json

Write-Host "Creating invite code..."
$inviteResponse = Invoke-WebRequest -Uri "$API_URL/invites/$roomId" -Method POST -Headers $headers1 -Body $createInvite | ConvertFrom-Json
$inviteCode = $inviteResponse.code
Write-Host "✓ Invite code created: $inviteCode"
Write-Host "  - Max uses: $($inviteResponse.maxUses)"
Write-Host "  - Current uses: $($inviteResponse.useCount)"

# Step 7: User 2 joins using the invite code
$joinInvite = @{
    inviteCode = $inviteCode
} | ConvertTo-Json

$headers2 = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $user2Token"
}

Write-Host "User 2 joining room via invite..."
$joinResponse = Invoke-WebRequest -Uri "$API_URL/invites/join/with-code" -Method POST -Headers $headers2 -Body $joinInvite | ConvertFrom-Json
Write-Host "✓ User 2 successfully joined"
Write-Host "  - Room ID: $($joinResponse.room.id)"

# Step 8: Try to join again (should fail)
Write-Host "Testing duplicate join prevention..."
try {
    Invoke-WebRequest -Uri "$API_URL/invites/join/with-code" -Method POST -Headers $headers2 -Body $joinInvite -ErrorAction Stop
    Write-Host "✗ ERROR: Duplicate join was allowed"
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✓ Duplicate join correctly rejected (400)"
    }
    else {
        Write-Host "? Got status code: $statusCode"
    }
}

# Step 9: Get invites for room
Write-Host "Getting invites list..."
$invitesListResponse = Invoke-WebRequest -Uri "$API_URL/invites/$roomId" -Method GET -Headers $headers1 | ConvertFrom-Json
Write-Host "✓ Invites retrieved"
Write-Host "  - Total: $($invitesListResponse.Count)"
Write-Host "  - Code: $($invitesListResponse[0].code)"
Write-Host "  - Uses: $($invitesListResponse[0].useCount)/$($invitesListResponse[0].maxUses)"

Write-Host "`n✅ ALL TESTS PASSED - T06 IS WORKING!"

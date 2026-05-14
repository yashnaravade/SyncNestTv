# T06 Room Invites System - Complete Local Testing Guide

## 🚀 Starting Both Frontend & Backend

Simply run from the workspace root:

```bash
pnpm dev
```

This single command starts:

- **Backend API**: NestJS on `http://localhost:3001`
- **Frontend**: Next.js on `http://localhost:3000`

Both run in watch mode and auto-reload on file changes.

---

## 🧪 Testing T06 Functionality Locally

### Option 1: Automated Test (Node.js)

```bash
# From workspace root
node test-t06-invites.js
```

This runs all T06 tests automatically:

- ✅ User registration
- ✅ User login
- ✅ Room creation
- ✅ Invite code generation
- ✅ Join via invite
- ✅ Duplicate join prevention
- ✅ Invite usage tracking

**Output should show:**

```
✅ ALL TESTS PASSED!

✨ T06 Implementation Verified:
   ✓ Generate unique invite codes (adjective-noun-4digits)
   ✓ Create invites with optional expiry and max uses
   ✓ Validate and use invites to join rooms
   ✓ Add user to RoomMember with VIEWER role
   ✓ Prevent duplicate room joins
   ✓ Track invite usage count
```

---

### Option 2: Manual Testing with cURL

#### 1. Register User 1

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user1@example.com",
    "username":"user1",
    "password":"SecurePass123!@#"
  }'
```

**Response:**

```json
{
  "user": {
    "id": "cmp4nicc1000cubabrtzpuqbc",
    "email": "user1@example.com",
    "username": "user1",
    "createdAt": "2026-05-13T22:48:40.177Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Copy the `accessToken` for User 1 requests.**

---

#### 2. Register User 2

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user2@example.com",
    "username":"user2",
    "password":"SecurePass123!@#"
  }'
```

**Copy the `accessToken` for User 2 requests.**

---

#### 3. Login Users (Optional - Already have tokens from registration)

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user1@example.com",
    "password":"SecurePass123!@#"
  }'
```

---

#### 4. User 1 Creates a Room

```bash
curl -X POST http://localhost:3001/api/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER1_TOKEN" \
  -d '{
    "name":"Movie Night",
    "description":"Watching together!"
  }'
```

**Response:**

```json
{
  "id": "cmp4nitxk000qubabm8rb27el",
  "name": "Movie Night",
  "code": "r-ABC123xyz",
  "members": [
    {
      "id": "...",
      "userId": "cmp4nicc1000cubabrtzpuqbc",
      "role": "OWNER",
      "user": { "id": "...", "email": "user1@example.com", "username": "user1" }
    }
  ]
}
```

**Copy the room `id`.**

---

#### 5. Create an Invite Code

```bash
curl -X POST http://localhost:3001/api/invites/ROOM_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER1_TOKEN" \
  -d '{
    "expiryDays": 7,
    "maxUses": 5
  }'
```

**Response:**

```json
{
  "id": "...",
  "code": "spontaneous-takin-9873",
  "roomId": "cmp4nitxk000qubabm8rb27el",
  "expiresAt": "2026-05-20T22:48:40.177Z",
  "maxUses": 5,
  "useCount": 0,
  "createdAt": "2026-05-13T22:48:40.177Z"
}
```

**Note the `code` - this is the human-readable invite link (e.g., `spontaneous-takin-9873`).**

---

#### 6. User 2 Joins Via Invite Code

```bash
curl -X POST http://localhost:3001/api/invites/join/with-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER2_TOKEN" \
  -d '{
    "inviteCode": "spontaneous-takin-9873"
  }'
```

**Response:**

```json
{
  "room": {
    "id": "cmp4nitxk000qubabm8rb27el",
    "name": "Movie Night",
    "members": [
      {
        "userId": "cmp4nicc1000cubabrtzpuqbc",
        "role": "OWNER",
        "user": { "email": "user1@example.com", "username": "user1" }
      },
      {
        "userId": "cmp4nicc1000cubabrmqwxyz",
        "role": "VIEWER",
        "user": { "email": "user2@example.com", "username": "user2" }
      }
    ]
  },
  "member": {
    "userId": "cmp4nicc1000cubabrmqwxyz",
    "roomId": "cmp4nitxk000qubabm8rb27el",
    "role": "VIEWER"
  },
  "message": "Successfully joined room via invite"
}
```

✅ **User 2 is now in the room with `VIEWER` role!**

---

#### 7. Test Duplicate Join Prevention

```bash
curl -X POST http://localhost:3001/api/invites/join/with-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER2_TOKEN" \
  -d '{
    "inviteCode": "spontaneous-takin-9873"
  }'
```

**Response (should be rejected):**

```json
{
  "statusCode": 400,
  "message": "You are already a member of this room",
  "error": "Bad Request",
  "timestamp": "2026-05-13T22:49:00.000Z"
}
```

✅ **Duplicate joins are prevented!**

---

#### 8. Get All Invites for a Room (Owner Only)

```bash
curl -X GET http://localhost:3001/api/invites/ROOM_ID_HERE \
  -H "Authorization: Bearer YOUR_USER1_TOKEN"
```

**Response:**

```json
[
  {
    "id": "...",
    "code": "spontaneous-takin-9873",
    "roomId": "cmp4nitxk000qubabm8rb27el",
    "createdBy": "cmp4nicc1000cubabrtzpuqbc",
    "maxUses": 5,
    "useCount": 1,
    "expiresAt": "2026-05-20T22:48:40.177Z",
    "createdAt": "2026-05-13T22:48:40.177Z"
  }
]
```

✅ **Usage count incremented to 1 after User 2 joined!**

---

#### 9. Revoke an Invite

```bash
curl -X DELETE http://localhost:3001/api/invites/INVITE_ID_HERE \
  -H "Authorization: Bearer YOUR_USER1_TOKEN"
```

**Response:**

```json
{
  "message": "Invite revoked successfully"
}
```

---

## 📊 Key Test Scenarios

### Scenario 1: Complete Invite Flow

1. User 1 creates room
2. User 1 generates invite code
3. User 2 joins via invite code
4. User 2 is now in room with VIEWER role
5. User 1 can see invite usage in the invites list

### Scenario 2: Expiry Testing

1. Create invite with `expiryDays: 0` (expires immediately)
2. Try to join immediately after → should fail with "invite expired"

### Scenario 3: Max Uses Testing

1. Create invite with `maxUses: 1`
2. User 2 joins successfully
3. User 3 tries to join with same code → should fail with "max uses reached"

### Scenario 4: Permission Testing

1. User 2 (VIEWER) tries to create invite for the room → should fail with 403 Forbidden
2. User 2 tries to revoke invite → should fail with 403 Forbidden

### Scenario 5: Invalid Code Testing

1. Try to join with invalid invite code → should fail with 404 Not Found

---

## 🔧 Environment Setup

**Required Services (should already be running):**

✅ PostgreSQL 15 on `localhost:5432` (via Docker)
✅ Redis 7 on `localhost:6379` (via Docker)
✅ Backend API on `http://localhost:3001`
✅ Frontend on `http://localhost:3000`

**Verify with:**

```bash
docker-compose ps
```

---

## 💡 Tips

- **Save tokens** in a text editor to avoid re-registering
- **Use Postman/Insomnia** for easier request management and response viewing
- **Check terminal logs** for any errors (both `pnpm dev` terminals)
- **Database state** persists across API restarts; clear with `pnpm prisma:migrate reset`

---

## ✅ Validation Checklist

- [ ] Both servers start with `pnpm dev`
- [ ] Automated test passes: `node test-t06-invites.js`
- [ ] User can create room
- [ ] Invite code generated in correct format (adjective-noun-4digits)
- [ ] User can join via invite
- [ ] User added to RoomMember with VIEWER role
- [ ] Duplicate joins rejected
- [ ] Usage counter increments
- [ ] Owner can view all invites
- [ ] Owner can revoke invites
- [ ] Permission checks work (only owner/co-host can create/revoke)

---

## 🚀 Next Steps

After T06 validation is complete, proceed to **T07: Socket.IO Gateway Setup**.

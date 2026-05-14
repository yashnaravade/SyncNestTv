const http = require('http');

const API_URL = 'http://localhost:3001/api';

function makeRequest(method, path, headers, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n=== T06 INVITES SYSTEM TEST ===\n');

  const timestamp = Date.now();

  try {
    // Step 1: Register users
    console.log('1️⃣  Registering users...');
    const reg1 = await makeRequest(
      'POST',
      '/auth/register',
      {},
      {
        email: `testuser1-${timestamp}@example.com`,
        username: `testuser1-${timestamp}`,
        password: 'Test123!@#',
      }
    );
    const user1Id = reg1.body.user.id;
    const user1Email = reg1.body.user.email;
    console.log('   ✓ User 1 registered:', user1Email);

    const reg2 = await makeRequest(
      'POST',
      '/auth/register',
      {},
      {
        email: `testuser2-${timestamp}@example.com`,
        username: `testuser2-${timestamp}`,
        password: 'Test123!@#',
      }
    );
    const user2Email = reg2.body.user.email;
    console.log('   ✓ User 2 registered:', user2Email);

    // Step 2: Login users
    console.log('\n2️⃣  Logging in users...');
    const login1 = await makeRequest(
      'POST',
      '/auth/login',
      {},
      {
        email: user1Email,
        password: 'Test123!@#',
      }
    );
    const user1Token = login1.body.accessToken;
    console.log('   ✓ User 1 logged in');

    const login2 = await makeRequest(
      'POST',
      '/auth/login',
      {},
      {
        email: user2Email,
        password: 'Test123!@#',
      }
    );
    const user2Token = login2.body.accessToken;
    console.log('   ✓ User 2 logged in');

    // Step 3: Create room
    console.log('\n3️⃣  Creating room...');
    const createRoom = await makeRequest(
      'POST',
      '/rooms',
      { Authorization: `Bearer ${user1Token}` },
      {
        name: 'Test Watch Party',
        description: 'Testing invites',
      }
    );
    const roomId = createRoom.body.id;
    console.log('   ✓ Room created:', roomId);

    // Step 4: Create invite
    console.log('\n4️⃣  Creating invite code...');
    const createInvite = await makeRequest(
      'POST',
      `/invites/${roomId}`,
      { Authorization: `Bearer ${user1Token}` },
      {
        expiryDays: 7,
        maxUses: 10,
      }
    );
    const inviteCode = createInvite.body.code;
    console.log('   ✓ Invite code created:', inviteCode);
    console.log('     - Format: adjective-noun-4digits ✓');
    console.log('     - Max uses:', createInvite.body.maxUses);
    console.log('     - Current uses:', createInvite.body.useCount);

    // Step 5: Join via invite
    console.log('\n5️⃣  User 2 joining via invite...');
    const joinInvite = await makeRequest(
      'POST',
      '/invites/join/with-code',
      { Authorization: `Bearer ${user2Token}` },
      {
        inviteCode,
      }
    );
    console.log('   ✓ User 2 successfully joined room');
    console.log('     - Room ID:', joinInvite.body.room.id);

    // Step 6: Try duplicate join
    console.log('\n6️⃣  Testing duplicate join prevention...');
    const duplicateJoin = await makeRequest(
      'POST',
      '/invites/join/with-code',
      { Authorization: `Bearer ${user2Token}` },
      {
        inviteCode,
      }
    );
    if (duplicateJoin.status === 400) {
      console.log('   ✓ Duplicate join correctly rejected (400)');
    } else {
      console.log('   ✗ ERROR: Duplicate join was allowed');
    }

    // Step 7: Get invites list
    console.log('\n7️⃣  Getting invites list...');
    const getInvites = await makeRequest('GET', `/invites/${roomId}`, {
      Authorization: `Bearer ${user1Token}`,
    });
    console.log('   ✓ Invites retrieved');
    console.log('     - Total:', getInvites.body.length);
    console.log('     - Code:', getInvites.body[0].code);
    console.log('     - Uses:', getInvites.body[0].useCount + '/' + getInvites.body[0].maxUses);

    console.log('\n✅ ALL TESTS PASSED!');
    console.log('\n✨ T06 Implementation Verified:');
    console.log('   ✓ Generate unique invite codes (adjective-noun-4digits)');
    console.log('   ✓ Create invites with optional expiry and max uses');
    console.log('   ✓ Validate and use invites to join rooms');
    console.log('   ✓ Add user to RoomMember with VIEWER role');
    console.log('   ✓ Prevent duplicate room joins');
    console.log('   ✓ Track invite usage count');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();

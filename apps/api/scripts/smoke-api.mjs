/**
 * End-to-end smoke test for T04 (auth) + T05 (rooms).
 * Run with API server up: pnpm --filter syncnesttv-api start
 * Then: pnpm --filter syncnesttv-api smoke
 */
const base = process.env.API_URL || 'http://localhost:3001';

function cookieHeaderFromResponse(res) {
  const getSetCookie = res.headers.getSetCookie?.bind(res.headers);
  if (!getSetCookie) {
    const single = res.headers.get('set-cookie');
    if (!single) return '';
    return single.split(/,(?=[^;]+?=)/).map((p) => p.split(';')[0].trim()).join('; ');
  }
  return getSetCookie().map((c) => c.split(';')[0].trim()).join('; ');
}

async function register(email, username, password) {
  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`register failed ${res.status}: ${JSON.stringify(body)}`);
  return { ...body, cookie: cookieHeaderFromResponse(res) };
}

async function login(email, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`login failed ${res.status}: ${JSON.stringify(body)}`);
  return { ...body, cookie: cookieHeaderFromResponse(res) };
}

async function refresh(cookie) {
  const res = await fetch(`${base}/api/auth/refresh`, {
    method: 'POST',
    headers: cookie ? { Cookie: cookie } : {},
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`refresh failed ${res.status}: ${JSON.stringify(body)}`);
  const nextCookie = cookieHeaderFromResponse(res);
  return { accessToken: body.accessToken, cookie: nextCookie || cookie };
}

async function authMe(token) {
  const res = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`me failed ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function createRoom(token, name) {
  const res = await fetch(`${base}/api/rooms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description: 'smoke test' }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`createRoom failed ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function getRoom(token, id) {
  const res = await fetch(`${base}/api/rooms/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`getRoom failed ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function addMember(token, roomId, userId, role) {
  const res = await fetch(`${base}/api/rooms/${roomId}/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, role }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`addMember failed ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function health() {
  const res = await fetch(`${base}/api`);
  const body = await res.json();
  if (!res.ok) throw new Error(`health failed ${res.status}`);
  return body;
}

async function main() {
  console.log('API:', base);
  const h = await health();
  console.log('health:', h.status || h);

  const ts = Date.now();
  const emailA = `smoke-a-${ts}@example.com`;
  const emailB = `smoke-b-${ts}@example.com`;
  const pass = 'Password1x';

  const regA = await register(emailA, `sa${ts}`, pass);
  const regB = await register(emailB, `sb${ts}`, pass);
  console.log('register A/B ok', regA.user.id, regB.user.id);

  const meA = await authMe(regA.accessToken);
  console.log('me A ok', meA.user.email);

  const ref = await refresh(regA.cookie);
  console.log('refresh A ok (new access prefix)', ref.accessToken.slice(0, 12));

  const room = await createRoom(regA.accessToken, `Smoke room ${ts}`);
  console.log('create room ok', room.id, room.code);

  const detail = await getRoom(regA.accessToken, room.id);
  console.log('get room ok members=', detail.members?.length);

  const member = await addMember(regA.accessToken, room.id, regB.user.id, 'VIEWER');
  console.log('add member ok', member.role, member.user.username);

  const detail2 = await getRoom(regA.accessToken, room.id);
  if (detail2.members.length < 2) throw new Error('expected 2 members');
  console.log('room now has', detail2.members.length, 'members');

  const loginA = await login(emailA, pass);
  console.log('login A ok');

  const ref2 = await refresh(loginA.cookie);
  console.log('refresh after login ok', ref2.accessToken.slice(0, 8));

  console.log('\nAll T04–T05 smoke checks passed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

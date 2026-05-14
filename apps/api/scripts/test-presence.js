const { io } = require('socket.io-client');

const serverUrl = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
const namespace = '/presence';
const tokenA = process.argv[2];
const tokenB = process.argv[3];

if (!tokenA || !tokenB) {
  console.error('Usage: node test-presence.js <tokenA> <tokenB>');
  process.exit(1);
}

function createClient(token, label) {
  const socket = io(`${serverUrl}${namespace}`, {
    auth: { token },
    transports: ['websocket'],
    timeout: 5000,
  });

  socket.on('connect', () => {
    console.log(`[${label}] connected`, socket.id);
    socket.emit('presence:get');
  });

  socket.on('connect_error', (error) => {
    console.error(`[${label}] connect_error`, error.message);
  });

  socket.on('presence:update', (payload) => {
    console.log(`[${label}] presence:update`, payload);
  });

  socket.on('presence:join', (payload) => {
    console.log(`[${label}] presence:join`, payload);
  });

  socket.on('presence:leave', (payload) => {
    console.log(`[${label}] presence:leave`, payload);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[${label}] disconnected`, reason);
  });

  return socket;
}

async function main() {
  const a = createClient(tokenA, 'A');
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const b = createClient(tokenB, 'B');
  await new Promise((resolve) => setTimeout(resolve, 1200));

  console.log('Disconnecting B in 2 seconds...');
  await new Promise((resolve) => setTimeout(resolve, 2000));
  b.close();

  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log('Disconnecting A');
  a.close();

  await new Promise((resolve) => setTimeout(resolve, 1000));
  process.exit(0);
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});

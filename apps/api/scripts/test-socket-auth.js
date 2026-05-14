const { io } = require('socket.io-client');

const serverUrl = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
const namespace = '/sync';
const token = process.argv[2];

const socket = io(`${serverUrl}${namespace}`, {
  auth: token ? { token } : {},
  transports: ['websocket'],
  timeout: 5000,
});

socket.on('connect', () => {
  console.log('✅ Connected to /sync namespace', { socketId: socket.id });
  socket.emit('ping');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  socket.close();
});

socket.on('disconnect', (reason) => {
  console.log('ℹ️ Disconnected:', reason);
});

socket.on('pong', (message) => {
  console.log('🟢 Pong received:', message);
  socket.close();
});

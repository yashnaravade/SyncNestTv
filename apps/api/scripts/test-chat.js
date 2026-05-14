const { io } = require('socket.io-client');

const [tokenA, tokenB, roomId] = process.argv.slice(2);
if (!tokenA || !tokenB || !roomId) {
  console.error('Usage: node test-chat.js <tokenA> <tokenB> <roomId>');
  process.exit(1);
}

function createClient(token, label) {
  const socket = io('http://localhost:3001/chat', {
    auth: { token },
    transports: ['websocket'],
    timeout: 5000,
  });

  socket.on('connect', () => {
    console.log(`[${label}] connected`, socket.id);
    socket.emit('chat:join', { roomId });
  });

  socket.on('connect_error', (error) => {
    console.error(`[${label}] connect_error`, error.message);
  });

  socket.on('chat:joined', (payload) => {
    console.log(`[${label}] joined room`, payload);
    if (label === 'A') {
      socket.emit('chat:history', { roomId });
      setTimeout(() => {
        socket.emit('chat:typing:start', { roomId });
        setTimeout(() => {
          socket.emit('chat:typing:stop', { roomId });
          socket.emit('chat:message', { roomId, content: 'Hello from A!' });
        }, 500);
      }, 200);
    }
  });

  socket.on('chat:history', (payload) => {
    console.log(`[${label}] history`, payload.messages.length, 'messages');
  });

  socket.on('chat:message', (message) => {
    console.log(`[${label}] chat:message`, message.user.username, message.content, message.createdAt);
  });

  socket.on('chat:typing:start', (payload) => {
    console.log(`[${label}] typing:start`, payload);
  });

  socket.on('chat:typing:stop', (payload) => {
    console.log(`[${label}] typing:stop`, payload);
  });

  socket.on('chat:user:joined', (payload) => {
    console.log(`[${label}] user joined`, payload);
  });

  socket.on('chat:user:left', (payload) => {
    console.log(`[${label}] user left`, payload);
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

  await new Promise((resolve) => setTimeout(resolve, 5000));
  console.log('Closing B');
  b.close();
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log('Closing A');
  a.close();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

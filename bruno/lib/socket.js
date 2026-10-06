const { io } = require('socket.io-client');

function connect(baseUrl, token, namespace = '/queue') {
  return io(`${baseUrl}${namespace}`, {
    transports: ['websocket'],
    auth: token ? { token } : {},
    reconnection: false,
    forceNew: true,
  });
}

function waitFor(socket, event, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const handler = (payload) => {
      clearTimeout(timer);
      resolve(payload);
    };
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`timeout waiting for ${event}`));
    }, timeoutMs);
    socket.once(event, handler);
  });
}

function receives(socket, event, timeoutMs) {
  return waitFor(socket, event, timeoutMs).then(
    () => true,
    () => false,
  );
}

async function connectAs(baseUrl, token, namespace) {
  const socket = connect(baseUrl, token, namespace);
  await waitFor(socket, 'connect');
  return socket;
}

async function joinQueue(socket, mode) {
  const joined = waitFor(socket, 'queue.joined');
  socket.emit('queue.join', { mode });
  return joined;
}

async function leaveQueue(socket) {
  const left = waitFor(socket, 'queue.left');
  socket.emit('queue.leave');
  return left;
}

function closeAll(...sockets) {
  sockets.forEach((socket) => socket.disconnect());
}

module.exports = {
  connect,
  waitFor,
  receives,
  connectAs,
  joinQueue,
  leaveQueue,
  closeAll,
};

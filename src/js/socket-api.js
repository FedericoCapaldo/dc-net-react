import io from 'socket.io-client';
const socket = io('localhost:9000');

function sendMessage(message) {
  socket.emit('my-action', message);
}

function updateOutput(callback) {
  socket.on('system-message', (type, output) => {
    callback(type, output);
  });
}


export { sendMessage, updateOutput };

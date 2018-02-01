import io from 'socket.io-client';
const socket = io('localhost:9000');

// events emitted by the components
function sendParticipantResponse(result) {
  socket.emit('participant-response', result);
}

// events received from severs
function recordEvent(callback) {
  socket.on('system-message', (type, output) => {
    callback(type, output);
  });
}

function showChoiceDialog(callback) {
  socket.on('show-dialog', () => {
    callback();
  });
}

function receivedKeys(callback) {
  socket.on('key-exchange', (keyName, keyValue) => {
    callback(keyName, keyValue);
  });
}

export { recordEvent, showChoiceDialog, receivedKeys, sendParticipantResponse };

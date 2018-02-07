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

function startRound(callback) {
  socket.on('start-round', (type) => {
    callback(type);
  });
}

function showChoiceDialog(callback) {
  socket.on('show-dialog', () => {
    callback();
  });
}

function hideChoiceDialog(callback) {
  socket.on('hide-dialog', () => {
    callback();
  });
}

function receivedKeys(callback) {
  socket.on('key-exchange', (keyName, keyValue) => {
    callback(keyName, keyValue);
  });
}

function reset(callback) {
  socket.on('reset', () => {
    callback();
  });
}

function clearKeys(callback) {
  socket.on('clear-keys', () => {
    callback();
  });
}

export { recordEvent,
         startRound,
         showChoiceDialog,
         hideChoiceDialog,
         receivedKeys,
         sendParticipantResponse,
         reset,
         clearKeys };

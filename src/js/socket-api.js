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

function onConnection(callback) {
  socket.on('connecting', (name) => {
    callback(name);
  });
}

function onDisconnection(callback) {
  socket.on('disconnecting', (name) => {
    callback(name);
  });
}

function startRound(callback) {
  socket.on('start-round', () => {
    callback();
  });
}

function startGeneratingKey(callback) {
  socket.on('generating-keys', () => {
    callback();
  });
}

function receiveKey(callback) {
  socket.on('key-generated', (keyName, keyValue) => {
    callback(keyName, keyValue);
  });
}

function hideChoiceDialog(callback) {
  socket.on('hide-dialog', () => {
    callback();
  });
}

function messageRejectedWarning(callback) {
  socket.on('message-rejected', () => {
    callback();
  });
}

function receiveRoundResult(callback) {
  socket.on('round-result', (result) => {
    callback(result);
  });
}

export { onConnection, onDisconnection,
         recordEvent,
         startRound,
         startGeneratingKey,
         receiveRoundResult,
         hideChoiceDialog,
         receiveKey,
         messageRejectedWarning,
         sendParticipantResponse };

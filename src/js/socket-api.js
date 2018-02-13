import io from 'socket.io-client';
const socket = io('localhost:9000');

// events emitted by the components
function sendParticipantResponse(result) {
  socket.emit('participant-response', result);
}

// events received from severs
function connectionSetup(callback) {
  socket.on('connection-setup', (name) => {
    callback(name);
  });
}

function connectionEvent(callback) {
  socket.on('client-connection', (name) => {
    callback(name, 'connection');
  });

  socket.on('client-disconnection', (name) => {
    callback(name, 'disconnection');
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

export { connectionEvent,
         connectionSetup,
         hideChoiceDialog,
         messageRejectedWarning,
         receiveKey,
         receiveRoundResult,
         sendParticipantResponse,
         startGeneratingKey,
         startRound };

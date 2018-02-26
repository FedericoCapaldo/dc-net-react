import io from 'socket.io-client';
const socket = io('localhost:9000');

// events emitted by the components
function sendParticipantResponse(result) {
  socket.emit('participant-response', result);
}

// events received from severs
function timeToConnection(callback) {
  socket.on('timer', (secondsLeft) => {
    callback(secondsLeft);
  });
}

function waitingConnections(callback) {
  socket.on('waiting-connections', (leftToWait) => {
    callback(leftToWait);
  });
}

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
  socket.on('key-generated', (key) => {
    const keyName = key[0];
    const keyValue = key[1];
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

function abortRoundInProgress(callback) {
  socket.on('abort-round', (abortReason) => {
    callback(abortReason);
  });
}

export { abortRoundInProgress,
         connectionEvent,
         connectionSetup,
         hideChoiceDialog,
         messageRejectedWarning,
         receiveKey,
         receiveRoundResult,
         sendParticipantResponse,
         startGeneratingKey,
         startRound,
         timeToConnection,
         waitingConnections };

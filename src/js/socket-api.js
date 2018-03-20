import io from 'socket.io-client';
const socket = io('localhost:9000');

// events emitted by the components
function sendParticipantResponse(result) {
  socket.emit('participant-response', result);
}

function sendParticipantLengthRoundResponse(result) {
  socket.emit('participant-length-response', result);
}

function sendParticipantCommunicationRoundResponse(result) {
  socket.emit('participant-round-response', result);
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

function startVotingRound(callback) {
  socket.on('start-voting-round', () => {
    callback();
  });
}

function startLengthMesuramentRound(callback) {
  socket.on('start-length-round', () => {
    callback();
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

function receiveMessageKeys(callback) {
  socket.on('message-keys-generated', (key) => {
    const keyName = key[0];
    const arrayOfNkeys = key[1];
    callback(keyName, arrayOfNkeys);
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

function receiveLengthRoundResult(callback) {
  socket.on('length-round-result', (messageLength) => {
    callback(messageLength);
  });
}

function receiveCommunicationRoundResult(callback) {
  socket.on('communication-round-result', (singleAsciiLetter) => {
    callback(singleAsciiLetter);
  });
}

function abortRoundInProgress(callback) {
  socket.on('abort-round', (abortReason) => {
    callback(abortReason);
  });
}

function receiveGeneralMessage(callback) {
  socket.on('general-message', (message) => {
    callback(message);
  });
}

function showCommunicatedMessage(callback) {
  socket.on('show-communicated-message', () => {
    callback();
  });
}

export { abortRoundInProgress,
         connectionEvent,
         connectionSetup,
         hideChoiceDialog,
         messageRejectedWarning,
         receiveGeneralMessage,
         receiveMessageKeys,
         receiveKey,
         receiveLengthRoundResult,
         receiveRoundResult,
         receiveCommunicationRoundResult,
         sendParticipantResponse,
         sendParticipantLengthRoundResponse,
         sendParticipantCommunicationRoundResponse,
         showCommunicatedMessage,
         startGeneratingKey,
         startRound,
         startVotingRound,
         startLengthMesuramentRound,
         timeToConnection,
         waitingConnections };

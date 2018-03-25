import io from 'socket.io-client';
const socket = io('localhost:9000');

function debugBackEnd() {
  socket.emit('time-to-debug');
}

// events emitted by the components
function sendParticipantVotingResponse(result) {
  socket.emit('participant-voting-response', result);
}

function sendParticipantLengthRoundResponse(result) {
  socket.emit('participant-length-response', result);
}

function sendParticipantCommunicationRoundResponse(result) {
  socket.emit('participant-round-response', result);
}

// events received from severs
function connectionSetup(callback) {
  socket.on('connection-setup', (name) => {
    callback(name);
  });
}

function waitingConnections(callback) {
  socket.on('waiting-connections', (leftToWait) => {
    callback(leftToWait);
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

function startCommunicationRound(callback) {
  socket.on('start-communication-round', () => {
    callback();
  });
}

function receiveRoundKey(callback) {
  socket.on('round-key-generated', (key) => {
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

function receiveVotingRoundResult(callback) {
  socket.on('voting-round-result', (result) => {
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

function showCommunicatedMessage(callback) {
  socket.on('show-communicated-message', () => {
    callback();
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

function abortRoundInProgress(callback) {
  socket.on('abort-round', (abortReason) => {
    callback(abortReason);
  });
}

function updateSecondsToStart(callback) {
  socket.on('timer', (secondsToStart) => {
    callback(secondsToStart);
  });
}

function receiveGeneralMessage(callback) {
  socket.on('general-message', (message) => {
    callback(message);
  });
}

export { debugBackEnd,
         abortRoundInProgress,
         connectionEvent,
         connectionSetup,
         hideChoiceDialog,
         messageRejectedWarning,
         receiveGeneralMessage,
         receiveMessageKeys,
         receiveRoundKey,
         receiveLengthRoundResult,
         receiveVotingRoundResult,
         receiveCommunicationRoundResult,
         sendParticipantVotingResponse,
         sendParticipantLengthRoundResponse,
         sendParticipantCommunicationRoundResponse,
         showCommunicatedMessage,
         startCommunicationRound,
         startVotingRound,
         startLengthMesuramentRound,
         updateSecondsToStart,
         waitingConnections };

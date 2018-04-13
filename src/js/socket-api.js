import io from 'socket.io-client';
const socket = io();

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

function startLengthCalculationRound(callback) {
  socket.on('start-length-round', (attemptNumber) => {
    callback(attemptNumber);
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

function updateTimer(callback) {
  socket.on('timer', (time) => {
    callback(time.timerSeconds, time.timerMessage);
  });
}

function receiveGeneralMessage(callback) {
  socket.on('general-message', (message) => {
    callback(message);
  });
}

function substituteKeys(callback) {
  socket.on('substitute-keys', (newKeys) => {
    callback(newKeys);
  });
}

function substituteMessageKeys(callback) {
  socket.on('substitute-message-keys', (newMessageKeys) => {
    callback(newMessageKeys);
  });
}

function resetMessageSender(callback) {
  socket.on('reset-message-sender', () => {
    callback();
  });
}

function displayWaitingMessage(callback) {
  socket.on('display-waiting-message', () => {
    callback();
  });
}

function hideWaitingMessage(callback) {
  socket.on('hide-waiting-message', () => {
    callback();
  });
}

export { abortRoundInProgress,
         connectionEvent,
         connectionSetup,
         displayWaitingMessage,
         hideChoiceDialog,
         hideWaitingMessage,
         messageRejectedWarning,
         receiveGeneralMessage,
         receiveMessageKeys,
         receiveRoundKey,
         resetMessageSender,
         receiveLengthRoundResult,
         receiveVotingRoundResult,
         receiveCommunicationRoundResult,
         sendParticipantVotingResponse,
         sendParticipantLengthRoundResponse,
         sendParticipantCommunicationRoundResponse,
         showCommunicatedMessage,
         startCommunicationRound,
         startVotingRound,
         startLengthCalculationRound,
         substituteKeys,
         substituteMessageKeys,
         updateTimer,
         waitingConnections };

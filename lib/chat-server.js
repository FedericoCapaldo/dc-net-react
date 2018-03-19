const socketIo = require('socket.io');
let io;
const Promise = require('bluebird');
const randomNumber = require('random-number-csprng');
import { Participant } from './Participant';
import { Round } from './Round';
import { addPendingParticipants,
         generateUniqueRandomName,
         removeParticipant,
         removeMultipleParticipants,
         findParticipantbyId,
         generateAdjacencies,
         generateTwoOppositeRandomKeysofLength } from './utils';

let clients = [];
let adjacencies = [];
let currentRoundIndex = -1;
let rounds = [];
let initialCommunicationTimer ;
let simulationStarted = false;
let pendingClients = [];
let clientsToBeRemoved = [];
let messageSender ;
let messageLength ;

exports.listen = function(server) {
  io = socketIo.listen(server);
  io.sockets.on('connection', function(socket) {
    handleNewConnection(socket);
    handleDisconnection(socket);
    handleParticipantResponse(socket);
    handleLengthRoundPartipantResponse(socket);
  });
};

function handleNewConnection(socket) {
  // io.sockets.clients(); // to get a list of all connected clients
  var newParticipant = new Participant(generateUniqueRandomName(clients), socket.id);
  if(simulationStarted) {
    pendingClients = [...pendingClients, newParticipant];
    unicastMessage(newParticipant.id, 'connection-setup', newParticipant.name);
    broadcastMessage('client-connection', newParticipant.name);
  } else {
    clients = [...clients, newParticipant];
    unicastMessage(newParticipant.id, 'connection-setup', newParticipant.name);
    broadcastMessage('client-connection', newParticipant.name);
    updateWaitNumber();
    if (clients.length >= 3) {
      if(initialCommunicationTimer) {
        clearInterval(initialCommunicationTimer);
        broadcastMessage('timer', 0);
      }
      let timeleft = 4;
      initialCommunicationTimer = setInterval(function(){
        --timeleft;
        broadcastMessage('timer', timeleft);
        if(timeleft <= 0) {
          clearInterval(initialCommunicationTimer);
          beginCommunication();
          simulationStarted = true;
        }
      },1000);
    }
  }
};

function handleParticipantResponse(socket) {
  socket.on('participant-response', function(clientResultValue) {
    const senderClient = findParticipantbyId(clients, socket.id);
    const expectedValue = senderClient.participantExpectedXORValue();
    if(clientResultValue === expectedValue) {
      senderClient.roundMessage = clientResultValue;
    } else {
      if (rounds[currentRoundIndex].didSomeoneSendMessage) {
        // TODO: send message to client that he cannot send a message!
        // TODO: should send this unicast message at the end of round
        //   so as not to reveal that one of the previous sender already
        //   wanted to send a message.
        unicastMessage(socket.id, 'message-rejected');
        senderClient.roundMessage = expectedValue;
      } else {
        senderClient.roundMessage = clientResultValue;
        rounds[currentRoundIndex].didSomeoneSendMessage = true;
        messageSender = senderClient;
      }
    }
    if(Participant.prototype.areRoundMessagesReceived(clients)) {
      computeAndDistributeRoundResult();
    }
  });
}

function handleLengthRoundPartipantResponse(socket) {
  socket.on('participant-length-response', function(clientResultValue) {
    const senderClient = findParticipantbyId(clients, socket.id);
    const expectedValue = senderClient.participantExpectedValue();
    if(clientResultValue === expectedValue) {
      senderClient.roundMessage = clientResultValue;
    } else {
      if(senderClient.id === messageSender.id && !rounds[currentRoundIndex].didSomeoneSendMessage) {
        senderClient.roundMessage = clientResultValue;
        rounds[currentRoundIndex].didSomeoneSendMessage = true;
      } else {
        // should go here only if an attacker changes things manually
        unicastMessage(socket.id, 'message-rejected');
        senderClient.roundMessage = expectedValue;
      }
    }
    // debugPrintClientsFromArray();
    if(Participant.prototype.areRoundMessagesReceived(clients)) {
      computeAndDistributeLengthRoundResult();
    }
  });
}


function handleDisconnection(socket) {
  socket.on('disconnect', function() {
    let toBeRemoved = findParticipantbyId(clients,socket.id);
    if(!simulationStarted) {
      clients = removeParticipant(clients, socket.id);
      updateWaitNumber();
      if(clients.length < 3 && initialCommunicationTimer) {
        clearInterval(initialCommunicationTimer);
        broadcastMessage('timer', 0);
      }
    } else if (simulationStarted) {
      if(!toBeRemoved) {
        toBeRemoved = findParticipantbyId(pendingClients, socket.id);
        pendingClients = removeParticipant(pendingClients, socket.id);
      } else if (toBeRemoved) {
        clientsToBeRemoved = [...clientsToBeRemoved, toBeRemoved];
        const clientsLeft = clients.length - clientsToBeRemoved.length;
        if (clientsLeft < 3) {
          broadcastMessage('abort-round', 'Client Disconnected. No enough clients to guarantee anonymity.');
          clients = addPendingParticipants(clients, pendingClients);
          pendingClients.length = 0;
          clients = removeMultipleParticipants(clients, clientsToBeRemoved);
          clientsToBeRemoved.length = 0;
          updateWaitNumber();
          broadcastMessage('hide-dialog');
          simulationStarted = false;
          clients = Participant.prototype.resetParticipants(clients);
          if (clients.length >= 3) {
            simulationStarted = true;
            beginCommunication();
          }
        } else {
          if(toBeRemoved.roundMessage === -1) {
            toBeRemoved.roundMessage = toBeRemoved.participantExpectedXORValue();
          }
          if(Participant.prototype.areRoundMessagesReceived(clients)) {
            computeAndDistributeRoundResult();
          }
        }
      }
    }
    broadcastMessage('client-disconnection', toBeRemoved.name);
  });
}


// helpers
function broadcastMessage(event, message = '') {
  io.sockets.emit(event, message);
};

function unicastMessage(id, event, message = '') {
  io.sockets.to(id).emit(event, message);
}

function broadcastGeneralMessage(message) {
  io.sockets.emit('general-message', message);
}

function beginCommunication() {
  adjacencies = generateAdjacencies(clients);
  startVotingRound();
  generateAndExchangeKeys(adjacencies);
}

function startVotingRound() {
  broadcastMessage('start-voting-round');
  ++currentRoundIndex;
  rounds[currentRoundIndex] = new Round(currentRoundIndex+1);
}

function startLengthMesuramentRound() {
  broadcastMessage('start-length-round');
  ++currentRoundIndex;
  rounds[currentRoundIndex] = new Round(currentRoundIndex+1);
}

function startRound() {
  broadcastMessage('start-round');
  ++currentRoundIndex;
  rounds[currentRoundIndex] = new Round(currentRoundIndex+1);
}

function endRound(roundResult) {
  broadcastMessage('round-result', roundResult);
  rounds[currentRoundIndex].completed = true;
  rounds[currentRoundIndex].roundResult = roundResult;
}

function endLengthRound(length) {
  broadcastMessage('length-round-result', length);
  rounds[currentRoundIndex].completed = true;
  rounds[currentRoundIndex].roundResult = length;
}

function generateAndExchangeKeys(adjacencies) {
  // sleep somehow
  broadcastMessage('generating-keys');
  adjacencies.forEach(function(adjacency, index, array){
    Promise.try(function() {
      return randomNumber(0, 1);
    }).then(function(keyValue) {
      var keyName1 = 'Key' + adjacency.participant1.name + adjacency.participant2.name;
      var keyName2 = 'Key' + adjacency.participant2.name + adjacency.participant1.name;
      // server update
      adjacency.participant1.keys = [...adjacency.participant1.keys, {keyName1, keyValue}];
      adjacency.participant2.keys = [...adjacency.participant2.keys, {keyName2, keyValue}];
      // interface update
       // consider having a key object
      unicastMessage(adjacency.participant1.id, 'key-generated', [keyName1, keyValue]);
      unicastMessage(adjacency.participant2.id, 'key-generated', [keyName2, keyValue]);
    }).catch({code: 'RandomGenerationError'}, function(err) {
      // broadcastMessage('system-message', 'ERROR', 'Something went wrong! abort round');
      console.log('Something went wrong! abort round');
      // ABORT ROUND (SOMEHOW LATER ON)
    });
  });
}

function computeAndDistributeRoundResult() {
  const roundResult = Participant.prototype.calculateXORRoundResult(clients);
  endRound(roundResult);
  if(rounds[currentRoundIndex].didSomeoneSendMessage) {
    startDummyRoundtoHideLength();
    // CAFEUL: YOU MIGHT NOT NEED THE RETURN OTHERWISE WILL STOP WHOLE SESSION
    return;
  }
  // TODO: should check if there are participants waiting
  clients = Participant.prototype.resetParticipants(clients);
  clients = addPendingParticipants(clients, pendingClients);
  pendingClients.length = 0;
  clients = removeMultipleParticipants(clients, clientsToBeRemoved);
  clientsToBeRemoved.length = 0;
  adjacencies = generateAdjacencies(clients);
  setTimeout(function callback() {
    if (clients.length >= 3 && simulationStarted) {
      beginCommunication();
    }
  }, 1000);
}


function startDummyRoundtoHideLength() {
  clients = Participant.prototype.resetParticipants(clients);
  startLengthMesuramentRound();
  generateAndExchangeOppositeKeys();
}


function generateAndExchangeOppositeKeys() {
  broadcastMessage('generating-keys');
  adjacencies.forEach(function(adjacency, index, array){
    Promise.try(function() {
      return randomNumber(0, 255);
    }).then(function(keyValue) {
      var keyName1 = 'Key' + adjacency.participant1.name + adjacency.participant2.name;
      var keyName2 = 'Key' + adjacency.participant2.name + adjacency.participant1.name;

      adjacency.participant1.keys = [...adjacency.participant1.keys, {keyName1, keyValue}];
      unicastMessage(adjacency.participant1.id, 'key-generated', [keyName1, keyValue]);

      keyValue = -keyValue;
      adjacency.participant2.keys = [...adjacency.participant2.keys, {keyName2, keyValue}];
      unicastMessage(adjacency.participant2.id, 'key-generated', [keyName2, keyValue]);

    }).catch({code: 'RandomGenerationError'}, function(err) {
      // broadcastMessage('system-message', 'ERROR', 'Something went wrong! abort round');
      console.log('Something went wrong! abort round');
      // ABORT ROUND (SOMEHOW LATER ON)
    });
  });
}

function computeAndDistributeLengthRoundResult() {
  const roundResult = Participant.prototype.calculateRoundResult(clients);
  endLengthRound(roundResult);
  messageLength = roundResult;

  let myCounter = 5;
  const myInterval = setInterval(() => {
    --myCounter;
    broadcastMessage('timer', myCounter);
    if(myCounter <= 0) {
      startActualCommunicationRounds(messageLength);
      clearInterval(myInterval);
    }
  }, 1000);
}

function startActualCommunicationRounds(messageLength) {
  generateAndExchangeMessageKeyArray(messageLength);
  broadcastGeneralMessage(`Received Message Keys. ${messageLength} Keys.`);
  // could put some delay here
  startRound();
}

// what happens if someone is already disconneted and did not receive the keys yet?
function generateAndExchangeMessageKeyArray(n) {
  adjacencies.forEach(function callback(adjacency, index, array) {
    const keysNlength = generateTwoOppositeRandomKeysofLength(messageLength);
    var keyName1 = 'Key' + adjacency.participant1.name + adjacency.participant2.name;
    var keyName2 = 'Key' + adjacency.participant2.name + adjacency.participant1.name;
    let keyValues = keysNlength[0];
    adjacency.participant1.messageKeys = [...adjacency.participant1.messageKeys, {keyName1, keyValues}];
    unicastMessage(adjacency.participant1.id, 'message-keys-generated', [keyName1, keyValues]);
    keyValues = keysNlength[1];
    adjacency.participant2.messageKeys = [...adjacency.participant2.messageKeys, {keyName2, keyValues}];
    unicastMessage(adjacency.participant2.id, 'message-keys-generated', [keyName2, keyValues]);
  });
}


function updateWaitNumber() {
  const leftToWait = 3 - clients.length;
  broadcastMessage('waiting-connections', leftToWait);
}

// debugging
function debugPrintClientsFromArray() {
  clients.forEach(function(c, index, array) {
    console.log(c.name + "\n");
    console.log(c.roundResult + "\n");
  });
}

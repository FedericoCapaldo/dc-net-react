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
         generateAdjacencies } from './utils';

let clients = [];
let adjacencies = [];
let currentRoundIndex = -1;
let rounds = [];
let initialCommunicationTimer ;
let simulationStarted = false;
let pendingClients = [];
let clientsToBeRemoved = [];

exports.listen = function(server) {
  io = socketIo.listen(server);
  io.sockets.on('connection', function(socket) {
    handleNewConnection(socket);
    handleDisconnection(socket);
    handleParticipantResponse(socket);
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
    const expectedValue = senderClient.participantExpectedValue();
    if(clientResultValue === expectedValue) {
      senderClient.roundMessage = clientResultValue;
    } else {
      if (rounds[currentRoundIndex].didSomeoneSendMessage) {
        // TODO: send message to client that he cannot send a message!
        unicastMessage(socket.id, 'message-rejected');
        senderClient.roundMessage = expectedValue;
      } else {
        senderClient.roundMessage = clientResultValue;
        rounds[currentRoundIndex].didSomeoneSendMessage = true;
      }
    }
    if(Participant.prototype.areRoundMessagesReceived(clients)) {
      computeAndDistributeRoundResult();
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
        } else {
          toBeRemoved.roundMessage = toBeRemoved.participantExpectedValue();
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

function beginCommunication() {
  adjacencies = generateAdjacencies(clients);
  startRound();
  generateAndExchangeKeys(adjacencies);
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
      unicastMessage(adjacency.participant1.id, 'key-generated', [keyName1, keyValue]); // consider having a key object
      unicastMessage(adjacency.participant2.id, 'key-generated', [keyName2, keyValue]);
    }).catch({code: 'RandomGenerationError'}, function(err) {
      // broadcastMessage('system-message', 'ERROR', 'Something went wrong! abort round');
      console.log('Something went wrong! abort round');
      // ABORT ROUND (SOMEHOW LATER ON)
    });
  });
}

function computeAndDistributeRoundResult() {
  const roundResult = Participant.prototype.calculateRoundResult(clients);
  endRound(roundResult);
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

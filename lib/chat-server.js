const socketIo = require('socket.io');
let io;
const Promise = require('bluebird');
const randomNumber = require('random-number-csprng');
import { Participant } from './Participant';
import { Round } from './Round';
import { generateUniqueRandomName, removeParticipantFromArray, findParticipantbyId, generateAdjacencies } from './utils';

let clients = [];
let adjacencies = [];
let roundInProgress = false;
let currentRoundIndex = -1;
let rounds = [];

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
  var participant = new Participant(generateUniqueRandomName(clients), socket.id);
  clients = [...clients, participant];
  unicastMessage(socket.id, 'connection-setup', participant.name);
  broadcastMessage('client-connection', participant.name);
  if (clients.length == 3) {
    beginCommunication();
  } else if (clients.length > 3) {
    throw new Error ('too many clients');
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
    var toBeRemoved = findParticipantbyId(clients,socket.id).name;
    clients = removeParticipantFromArray(clients, socket.id);
    // TODO: should update adajacencies
    if (clients.length <= 2) {
      // throw new Error("Not enough clients connected to guarantee anonymity of the set.");
      roundInProgress = false;
      clients = Participant.prototype.resetParticipants(clients);
      broadcastMessage('hide-dialog');
      broadcastMessage('abort-round', 'Client Disconnected. No enough clients to guarantee anonymity.');
    }
    broadcastMessage('client-disconnection', toBeRemoved);
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
  roundInProgress = true;
  ++currentRoundIndex;
  rounds[currentRoundIndex] = new Round(currentRoundIndex+1);
}

function endRound(roundResult) {
  broadcastMessage('round-result', roundResult);
  rounds[currentRoundIndex].completed = true;
  rounds[currentRoundIndex].roundResult = roundResult;
  roundInProgress = false;
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
  beginCommunication();
}

// debugging
function debugPrintClientsFromArray() {
  clients.forEach(function(c, index, array) {
    console.log(c.name + "\n");
  });
}

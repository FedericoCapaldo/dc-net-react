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
let messageSender ;
let messageLength ;
let rejectedClientsVotingRound = [] ;
let roundNumber = 0;

exports.listen = function(server) {
  io = socketIo.listen(server);
  io.sockets.on('connection', function(socket) {
    handleNewConnection(socket);
    handleDisconnection(socket);
    handleVotingRoundParticipantResponse(socket);
    handleCommmunicationRoundReponse(socket);
    handleLengthRoundPartipantResponse(socket);
    socket.on('time-to-debug', function() {
      console.log('clients.length: ' + clients.length);
      clients.forEach(function(c, index, array) {
        // console.log(c.toString());
        console.log("client name: " + c.name);
        console.log("client id: " + c.id);
        for(var x=0; x<c.keys.length; x++) {
          console.log(`client key ${x}:` + c.keys[x].keyName + " " + c.keys[x].keyValue);
        }
        for(var x=0; x<c.messageKeys.length; x++) {
          console.log(`client message key ${x}:`
            + c.messageKeys[x].keyName + " " + c.messageKeys[x].keyValues);
        }
        console.log("client roundMessage: " + c.roundMessage);
        console.log();
      });
      console.log();
    });
  });
};

function handleNewConnection(socket) {
  // io.sockets.clients(); // to get a list of all connected clients
  var newParticipant = new Participant(generateUniqueRandomName(clients), socket.id);
  if(simulationStarted) {
    pendingClients = [...pendingClients, newParticipant];
    unicastEvent(newParticipant.id, 'connection-setup', newParticipant.name);
    broadcastEvent('client-connection', newParticipant.name);
  } else {
    clients = [...clients, newParticipant];
    unicastEvent(newParticipant.id, 'connection-setup', newParticipant.name);
    broadcastEvent('client-connection', newParticipant.name);
    updateWaitNumber();
    if (clients.length >= 3) {
      if(initialCommunicationTimer) {
        clearInterval(initialCommunicationTimer);
        broadcastEvent('timer', 0);
      }
      let timeleft = 4;
      initialCommunicationTimer = setInterval(function(){
        --timeleft;
        broadcastEvent('timer', timeleft);
        if(timeleft <= 0) {
          clearInterval(initialCommunicationTimer);
          beginCommunication();
          simulationStarted = true;
        }
      },1000);
    }
  }
};

function handleVotingRoundParticipantResponse(socket) {
  socket.on('participant-voting-response', function(clientResultValue) {
    const senderClient = findParticipantbyId(clients, socket.id);
    const expectedValue = senderClient.participantExpectedXORValue();
    if(clientResultValue === expectedValue) {
      senderClient.roundMessage = clientResultValue;
    } else {
      if (rounds[currentRoundIndex].didSomeoneSendMessage) {
        senderClient.roundMessage = expectedValue;
        rejectedClientsVotingRound = [...rejectedClientsVotingRound, senderClient];
      } else {
        senderClient.roundMessage = clientResultValue;
        rounds[currentRoundIndex].didSomeoneSendMessage = true;
        messageSender = senderClient;
      }
    }
    if(Participant.prototype.areRoundMessagesReceived(clients)) {
      computeAndDistributeVotingRoundResult();
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
        unicastEvent(socket.id, 'message-rejected');
        senderClient.roundMessage = expectedValue;
      }
    }
    // debugPrintClientsFromArray();
    if(Participant.prototype.areRoundMessagesReceived(clients)) {
      computeAndDistributeLengthRoundResult();
    }
  });
}

function handleCommmunicationRoundReponse(socket) {
  socket.on('participant-round-response', function(roundResult) {
    const senderClient = findParticipantbyId(clients, socket.id);
    const expectedValue =
      senderClient.participantExpectedCommunicationRoundValue(roundNumber);

      if (senderClient.id === messageSender.id) {
        if (roundResult === expectedValue) {
          // abort round because sender should include message
        } else {
          senderClient.roundMessage = roundResult;
        }
      } else {
        if (roundResult === expectedValue) {
          senderClient.roundMessage = roundResult;
        } else {
          // abort round because the keys or message have been
          // manually manipulated
        }
      }

    if(Participant.prototype.areRoundMessagesReceived(clients)) {
      computeAndDistributeCommunicationRoundResult();
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
        broadcastEvent('timer', 0);
      }
    } else if (simulationStarted) {
      if(!toBeRemoved) {
        toBeRemoved = findParticipantbyId(pendingClients, socket.id);
        pendingClients = removeParticipant(pendingClients, socket.id);
      } else if (toBeRemoved) {
        clients = removeParticipant(clients, socket.id);

        if (clients.length < 3) {
          broadcastEvent('abort-round', 'Client Disconnected. No enough clients to guarantee anonymity.');
          clients = addPendingParticipants(clients, pendingClients);
          pendingClients.length = 0;
          updateWaitNumber();
          simulationStarted = false;
          clients = Participant.prototype.resetParticipants(clients);
          roundNumber = 0;
          for (var x = 0; x < clients.length; x++) {
            clients[x].messageKeys.length = 0;
          }
          if (clients.length >= 3) {
            setTimeout(function() {
              simulationStarted = true;
              beginCommunication();
            }, 2000);
          }
          return;
        }

        if(messageSender && toBeRemoved.id === messageSender.id) {
          if(!Participant.prototype.areRoundMessagesReceived(clients) && rounds[currentRoundIndex].isVotingRound) {
            adjacencies = adjustAdjacenciesValuesAfterClientRemoval(adjacencies, toBeRemoved);
            adjacencies = generateAdjacencies(clients);
            rounds[currentRoundIndex].didSomeoneSendMessage = false;
            messageSender = null;
            return;
          }
          broadcastEvent('abort-round', 'Message sender disconnected before end of his communication.');
          clients = addPendingParticipants(clients, pendingClients);
          pendingClients.length = 0;
          updateWaitNumber();
          simulationStarted = false;
          clients = Participant.prototype.resetParticipants(clients);
          roundNumber = 0;
          for (var x = 0; x < clients.length; x++) {
            clients[x].messageKeys.length = 0;
          }
          if (clients.length >= 3) {
            setTimeout(function() {
              simulationStarted = true;
              beginCommunication();
            }, 2000);
          }
          return;
        }

        adjacencies = adjustAdjacenciesValuesAfterClientRemoval(adjacencies, toBeRemoved);
        adjacencies = generateAdjacencies(clients);
        if(Participant.prototype.areRoundMessagesReceived(clients)) {
          computeAndDistributeVotingRoundResult();
        }

      }
    }
    broadcastEvent('client-disconnection', toBeRemoved.name);
  });
}


function beginCommunication() {
  adjacencies = generateAdjacencies(clients);
  startVotingRound();
  generateAndExchangeKeys(adjacencies);
}

function startVotingRound() {
  clients = Participant.prototype.resetParticipants(clients);
  broadcastEvent('start-voting-round');
  ++currentRoundIndex;
  rounds[currentRoundIndex] = new Round(currentRoundIndex+1);
  rounds[currentRoundIndex].isVotingRound = true;
}

function startLengthRound() {
  clients = Participant.prototype.resetParticipants(clients);
  broadcastEvent('start-length-round');
  ++currentRoundIndex;
  rounds[currentRoundIndex] = new Round(currentRoundIndex+1);
}

function startCommunicationRound() {
  clients = Participant.prototype.resetParticipants(clients);
  broadcastEvent('start-communication-round');
  ++currentRoundIndex;
  rounds[currentRoundIndex] = new Round(currentRoundIndex+1);
}


function endVotingRound(roundResult) {
  broadcastEvent('voting-round-result', roundResult);
  rounds[currentRoundIndex].completed = true;
  rounds[currentRoundIndex].roundResult = roundResult;
}

function endLengthRound(length) {
  broadcastEvent('length-round-result', length);
  rounds[currentRoundIndex].completed = true;
  rounds[currentRoundIndex].roundResult = length;
}

function endCommunicationRound(roundResult) {
  broadcastEvent('communication-round-result', roundResult);
  rounds[currentRoundIndex].completed = true;
  rounds[currentRoundIndex].roundResult = roundResult;
  ++roundNumber;
  if(roundNumber >= messageLength) {
      broadcastEvent('show-communicated-message');

      roundNumber = 0;
      for (var x = 0; x < clients.length; x++) {
        clients[x].messageKeys.length = 0;
      }
      // collapse current session
      clients = addPendingParticipants(clients, pendingClients);
      pendingClients.length = 0;
      adjacencies = generateAdjacencies(clients);
      setTimeout(function callback() {
        if (clients.length >= 3 && simulationStarted) {
          beginCommunication();
        }
      }, 3000);
  } else {
    setTimeout(function() {
      startCommunicationRound()
    }, 1000);
  }
}


function generateAndExchangeKeys(adjacencies) {
  // sleep somehow
  adjacencies.forEach(function(adjacency, index, array){
    Promise.try(function() {
      return randomNumber(0, 1);
    }).then(function(keyValue) {
      var keyName1 = 'Key' + adjacency.participant1.name + adjacency.participant2.name;
      var keyName2 = 'Key' + adjacency.participant2.name + adjacency.participant1.name;
      // server update
      adjacency.participant1.keys = [...adjacency.participant1.keys, {keyName: keyName1, keyValue}];
      adjacency.participant2.keys = [...adjacency.participant2.keys, {keyName: keyName2, keyValue}];
      // interface update
       // consider having a key object
      unicastEvent(adjacency.participant1.id, 'round-key-generated', [keyName1, keyValue]);
      unicastEvent(adjacency.participant2.id, 'round-key-generated', [keyName2, keyValue]);
    }).catch({code: 'RandomGenerationError'}, function(err) {
      // broadcastEvent('system-message', 'ERROR', 'Something went wrong! abort round');
      console.log('Something went wrong! abort round');
      // ABORT ROUND (SOMEHOW LATER ON)
    });
  });
}

function computeAndDistributeVotingRoundResult() {
  communicateIfAnyRejected();
  const roundResult = Participant.prototype.calculateXORRoundResult(clients);
  endVotingRound(roundResult);
  if(rounds[currentRoundIndex].didSomeoneSendMessage) {
    startLengthRound();
    generateAndExchangeOppositeKeys();
    // CAFEUL: YOU MIGHT NOT NEED THE RETURN OTHERWISE WILL STOP WHOLE SESSION
    return;
  }
  // TODO: should check if there are participants waiting
  clients = Participant.prototype.resetParticipants(clients);
  clients = addPendingParticipants(clients, pendingClients);
  pendingClients.length = 0;
  adjacencies = generateAdjacencies(clients);
  setTimeout(function callback() {
    if (clients.length >= 3 && simulationStarted) {
      beginCommunication();
    }
  }, 1000);
}

function generateAndExchangeOppositeKeys() {
  adjacencies.forEach(function(adjacency, index, array){
    Promise.try(function() {
      return randomNumber(0, 255);
    }).then(function(keyValue) {
      var keyName1 = 'Key' + adjacency.participant1.name + adjacency.participant2.name;
      var keyName2 = 'Key' + adjacency.participant2.name + adjacency.participant1.name;

      adjacency.participant1.keys = [...adjacency.participant1.keys, {keyName: keyName1, keyValue}];
      unicastEvent(adjacency.participant1.id, 'round-key-generated', [keyName1, keyValue]);

      keyValue = -keyValue;
      adjacency.participant2.keys = [...adjacency.participant2.keys, {keyName: keyName2, keyValue}];
      unicastEvent(adjacency.participant2.id, 'round-key-generated', [keyName2, keyValue]);

    }).catch({code: 'RandomGenerationError'}, function(err) {
      // broadcastEvent('system-message', 'ERROR', 'Something went wrong! abort round');
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
    broadcastEvent('timer', myCounter);
    if(clients.length < 3 || !simulationStarted) {
      broadcastEvent('timer', 0);
      clearInterval(myInterval);
    }
    if(myCounter <= 0) {
      startActualCommunicationRounds(messageLength);
      clearInterval(myInterval);
    }
  }, 1000);
}

function startActualCommunicationRounds(messageLength) {
  if (messageLength === 0) {
    // fail silently
    return;
  }

  generateAndExchangeMessageKeyArray(messageLength);
  // metti next line in generation key message
  broadcastMessage(`Received Message Keys. ${messageLength} Keys.`);
  // could put some delay here
  startCommunicationRound();
}

function generateAndExchangeMessageKeyArray(n) {
  adjacencies.forEach(function callback(adjacency, index, array) {
    const keysNlength = generateTwoOppositeRandomKeysofLength(messageLength);
    var keyName1 = 'Key' + adjacency.participant1.name + adjacency.participant2.name;
    var keyName2 = 'Key' + adjacency.participant2.name + adjacency.participant1.name;
    let keyValues = keysNlength[0];
    adjacency.participant1.messageKeys = [...adjacency.participant1.messageKeys, {keyName: keyName1, keyValues}];
    unicastEvent(adjacency.participant1.id, 'message-keys-generated', [keyName1, keyValues]);
    keyValues = keysNlength[1];
    adjacency.participant2.messageKeys = [...adjacency.participant2.messageKeys, {keyName: keyName2, keyValues}];
    unicastEvent(adjacency.participant2.id, 'message-keys-generated', [keyName2, keyValues]);
  });
}

function computeAndDistributeCommunicationRoundResult() {
  const roundResult = Participant.prototype.calculateRoundResult(clients);
  endCommunicationRound(roundResult);
}


// helpers
function broadcastEvent(event, message = '') {
  io.sockets.emit(event, message);
};

function unicastEvent(id, event, message = '') {
  io.sockets.to(id).emit(event, message);
}

function broadcastMessage(message) {
  io.sockets.emit('general-message', message);
}

function updateWaitNumber() {
  const leftToWait = 3 - clients.length;
  broadcastEvent('waiting-connections', leftToWait);
}

function communicateIfAnyRejected() {
  if(rejectedClientsVotingRound.length) {
    rejectedClientsVotingRound.forEach(function(rejectedClient, index, arr) {
      unicastEvent(rejectedClient.id, 'message-rejected');
    })
    rejectedClientsVotingRound.length = 0;
  }
}


function adjustAdjacenciesValuesAfterClientRemoval(adjacencies, clientToBeRemoved) {

  var randomKeyReplacement ;

  adjacencies.forEach(function(pair, index, array) {
    if(pair.contains(clientToBeRemoved)) {
      let otherClient = pair.participant1.id === clientToBeRemoved.id ? pair.participant2 : pair.participant1;
      const recomposeKeyName = 'Key' + otherClient.name + clientToBeRemoved.name;

      if (otherClient.keys[0].keyName === recomposeKeyName) {
        if(randomKeyReplacement) {
          otherClient.keys[0].keyValue = -randomKeyReplacement;
          unicastEvent(otherClient.id, 'substitute-keys', otherClient.keys);
        } else {
          randomKeyReplacement = otherClient.keys[0].keyValue;
        }
      } else {
        if(randomKeyReplacement) {
          otherClient.keys[1].keyValue = -randomKeyReplacement;
          unicastEvent(otherClient.id, 'substitute-keys', otherClient.keys);
        } else {
          randomKeyReplacement = otherClient.keys[1].keyValue;
        }
      }

    }
  });
  return adjacencies;
  // adjacencies.forEach(function(pair, index, array) {
  //   console.log(pair.participant1);
  //   console.log("----------------");
  //   console.log(pair.participant2);
  //   console.log();
  //   console.log();
  //   console.log();
  // });
}

// debugging
function debugPrintClientsFromArray() {
  clients.forEach(function(c, index, array) {
    console.log(c.name + "\n");
    console.log(c.roundResult + "\n");
  });
}

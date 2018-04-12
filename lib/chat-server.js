const socketIo = require('socket.io');
let io;
const Promise = require('bluebird');
const randomNumber = require('random-number-csprng');
import { Participant } from './Participant';
import { Round } from './Round';
import { mergeArrays,
         generateUniqueRandomName,
         removeParticipant,
         removeMultipleParticipants,
         findParticipantbyId,
         generateAdjacencies,
         randomKeyArrayofLength } from './utils';

let participants = [];
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
let lengthRoundAttempt = 1;
let nonSenderClientsCount = 0;

exports.listen = function(server) {
  io = socketIo.listen(server);
  io.sockets.on('connection', function(socket) {
    handleNewConnection(socket);
    handleDisconnection(socket);
    handleVotingRoundParticipantResponse(socket);
    handleCommmunicationRoundReponse(socket);
    handleLengthRoundPartipantResponse(socket);
    socket.on('time-to-debug', function() {
      console.log('participants.length: ' + participants.length);
      participants.forEach(function(c, index, array) {
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
        console.log('is Connected?????: ' + c.socket.connected);
        console.log();
      });
      console.log();
      console.log();
    });
  });
};

function handleNewConnection(socket) {
  // io.sockets.clients(); // to get a list of all connected participants
  var newParticipant = new Participant(generateUniqueRandomName(participants), socket.id, socket);
  if(simulationStarted) {
    pendingClients = [...pendingClients, newParticipant];
    unicastEvent(newParticipant.id, 'connection-setup', newParticipant.name);
    unicastEvent(newParticipant.id, 'display-waiting-message');
    broadcastEvent('client-connection', newParticipant.name);
  } else {
    participants = [...participants, newParticipant];
    unicastEvent(newParticipant.id, 'connection-setup', newParticipant.name);
    broadcastEvent('client-connection', newParticipant.name);
    updateWaitNumber();
    if (participants.length >= 3) {
      if(initialCommunicationTimer) {
        clearInterval(initialCommunicationTimer);
        broadcastEvent('timer', {timerSeconds: 0, timerMessage: ''});
      }
      let timeleft = 4;
      initialCommunicationTimer = setInterval(function(){
        --timeleft;
        broadcastEvent('timer', {timerSeconds: timeleft, timerMessage: 'to start communication'});
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
    const senderClient = findParticipantbyId(participants, socket.id);
    const expectedValue = senderClient.participantExpectedXORValue();
    if(clientResultValue === expectedValue) {
      senderClient.roundMessage = clientResultValue;
      nonSenderClientsCount++;
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
    if(Participant.prototype.areRoundMessagesReceived(participants)) {
      computeAndDistributeVotingRoundResult();
    }
  });
}

function handleLengthRoundPartipantResponse(socket) {
  socket.on('participant-length-response', function(clientResultValue) {
    const senderClient = findParticipantbyId(participants, socket.id);
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
    if(Participant.prototype.areRoundMessagesReceived(participants)) {
      computeAndDistributeLengthRoundResult();
    }
  });
}

function handleCommmunicationRoundReponse(socket) {
  socket.on('participant-round-response', function(roundResult) {
    const senderClient = findParticipantbyId(participants, socket.id);
    const expectedValue =
      senderClient.participantExpectedCommunicationRoundValue(roundNumber);
      if (senderClient.id === messageSender.id) {
        if (roundResult === expectedValue) {
          // abort round because sender should include message
          console.error('Message Sender did not send his message round');
        } else {
          senderClient.roundMessage = roundResult;
        }
      } else {
        if (roundResult === expectedValue) {
          senderClient.roundMessage = roundResult;
        } else {
          // abort round because the keys or message have been
          // manually manipulated
          console.error('Non message sender tried to inject value. Possible attacker.');
        }
      }

    if(Participant.prototype.areRoundMessagesReceived(participants)) {
      computeAndDistributeCommunicationRoundResult();
    }
  });
}

function handleDisconnection(socket) {
  socket.on('disconnect', function() {
    let toBeRemoved = findParticipantbyId(participants,socket.id);
    if(!simulationStarted) {
      participants = removeParticipant(participants, socket.id);
      updateWaitNumber();
      if(participants.length < 3 && initialCommunicationTimer) {
        clearInterval(initialCommunicationTimer);
        broadcastEvent('timer', {timerSeconds: 0, timerMessage: ''});
      }
    } else if (simulationStarted) {
      if(!toBeRemoved) {
        toBeRemoved = findParticipantbyId(pendingClients, socket.id);
        pendingClients = removeParticipant(pendingClients, socket.id);
      } else if (toBeRemoved) {
        participants = removeParticipant(participants, socket.id);

        if (participants.length < 3) {
          broadcastEvent('abort-round', 'Client Disconnected. No enough participants to guarantee anonymity.');
          addPendingParticipants();
          updateWaitNumber();
          simulationStarted = false;
          participants = Participant.prototype.resetParticipants(participants);
          roundNumber = 0;
          for (var x = 0; x < participants.length; x++) {
            participants[x].messageKeys.length = 0;
          }
          if (participants.length >= 3) {
            setTimeout(function() {
              if (participants.length >= 3) {
                simulationStarted = true;
                beginCommunication();
              }
            }, 2000);
          }
          return;
        }

        if(messageSender && toBeRemoved.id === messageSender.id) {
          if(!Participant.prototype.areRoundMessagesReceived(participants) && rounds[currentRoundIndex].isVotingRound) {
            adjacencies = adjustAdjacenciesValuesAfterClientRemoval(adjacencies, toBeRemoved);
            adjacencies = generateAdjacencies(participants);
            rounds[currentRoundIndex].didSomeoneSendMessage = false;
            messageSender = null;
            return;
          }
          broadcastEvent('abort-round', 'Message sender disconnected before end of his communication.');
          addPendingParticipants();
          updateWaitNumber();
          simulationStarted = false;
          participants = Participant.prototype.resetParticipants(participants);
          roundNumber = 0;
          for (var x = 0; x < participants.length; x++) {
            participants[x].messageKeys.length = 0;
          }
          if (participants.length >= 3) {
            setTimeout(function() {
              if (participants.length >= 3) {
                simulationStarted = true;
                beginCommunication();
              }
            }, 2000);
          }
          return;
        }

        adjacencies = adjustAdjacenciesValuesAfterClientRemoval(adjacencies, toBeRemoved);
        adjacencies = generateAdjacencies(participants);
        if(Participant.prototype.areRoundMessagesReceived(participants) && rounds[currentRoundIndex].isVotingRound) {
          computeAndDistributeVotingRoundResult();
        }
      }
    }
    broadcastEvent('client-disconnection', toBeRemoved.name);
  });
}


function beginCommunication() {
  adjacencies = generateAdjacencies(participants);
  startVotingRound();
  generateAndExchangeKeys(adjacencies);
}

function startVotingRound() {
  participants = Participant.prototype.resetParticipants(participants);
  broadcastEvent('start-voting-round');
  ++currentRoundIndex;
  rounds[currentRoundIndex] = new Round(currentRoundIndex+1);
  rounds[currentRoundIndex].isVotingRound = true;
}

function startLengthRound(attemptNumber) {
  participants = Participant.prototype.resetParticipants(participants);
  broadcastEvent('start-length-round', attemptNumber);
  ++currentRoundIndex;
  rounds[currentRoundIndex] = new Round(currentRoundIndex+1);
  rounds[currentRoundIndex].isLengthRound = true;
}

function startCommunicationRound() {
  participants = Participant.prototype.resetParticipants(participants);
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
      for (var x = 0; x < participants.length; x++) {
        participants[x].messageKeys.length = 0;
      }
      // collapse current session
      addPendingParticipants();
      adjacencies = generateAdjacencies(participants);
      setTimeout(function callback() {
        if (participants.length >= 3 && simulationStarted) {
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
  const roundResult = Participant.prototype.calculateXORRoundResult(participants);
  endVotingRound(roundResult);
  if(rounds[currentRoundIndex].didSomeoneSendMessage) {
    if (nonSenderClientsCount) {
      startLengthRound(lengthRoundAttempt);
      generateAndExchangeOppositeKeys();
      nonSenderClientsCount = 0;
    } else {
      broadcastEvent('abort-round',
        'All participants tried to send a message. Anonymity is impaired due\
        to all participants but sender receiving a rejection warning.');
      addPendingParticipants();
      updateWaitNumber();
      simulationStarted = false;
      participants = Participant.prototype.resetParticipants(participants);
      roundNumber = 0;
      for (var x = 0; x < participants.length; x++) {
        participants[x].messageKeys.length = 0;
      }
      if (participants.length >= 3) {
        setTimeout(function() {
          if (participants.length >= 3) {
            simulationStarted = true;
            beginCommunication();
          }
        }, 2000);
      }
    }
    return;
  }
  nonSenderClientsCount = 0;
  participants = Participant.prototype.resetParticipants(participants);
  addPendingParticipants();
  adjacencies = generateAdjacencies(participants);
  setTimeout(function callback() {
    if (participants.length >= 3 && simulationStarted) {
      beginCommunication();
    }
  }, 1000);
}

function generateAndExchangeOppositeKeys() {
  adjacencies.forEach(function(adjacency, index, array){
    Promise.try(function() {
      return randomNumber(100, 999);
    }).then(function(keyValue) {
      var keyName1 = 'Key' + adjacency.participant1.name + adjacency.participant2.name;
      var keyName2 = 'Key' + adjacency.participant2.name + adjacency.participant1.name;

      adjacency.participant1.keys = [...adjacency.participant1.keys, {keyName: keyName1, keyValue}];
      adjacency.participant2.keys = [...adjacency.participant2.keys, {keyName: keyName2, keyValue}];
      unicastEvent(adjacency.participant1.id, 'round-key-generated', [keyName1, keyValue]);
      unicastEvent(adjacency.participant2.id, 'round-key-generated', [keyName2, keyValue]);
    }).catch({code: 'RandomGenerationError'}, function(err) {
      // broadcastEvent('system-message', 'ERROR', 'Something went wrong! abort round');
      console.log('Something went wrong! abort round');
      // ABORT ROUND (SOMEHOW LATER ON)
    });
  });
}

function computeAndDistributeLengthRoundResult() {
  const roundResult = Participant.prototype.calculateRoundResult(participants);
  endLengthRound(roundResult);

  if(roundResult === 0) {
    // if no message is inserted keep repeating length rounds
    ++lengthRoundAttempt;
    if (lengthRoundAttempt <= 3) {
      setTimeout(function() {
        startLengthRound(lengthRoundAttempt);
        generateAndExchangeOppositeKeys();
      }, 1000);
    } else {
      broadcastMessage('Message sender failed to provide his message within three attempts.');
      broadcastEvent('reset-message-sender');
      lengthRoundAttempt = 1;
      participants = Participant.prototype.resetParticipants(participants);
      addPendingParticipants();
      adjacencies = generateAdjacencies(participants);
      setTimeout(function callback() {
        if (participants.length >= 3 && simulationStarted) {
          beginCommunication();
        }
      }, 1000);
    }
    return;
  }
  lengthRoundAttempt = 1;
  messageLength = roundResult;

  let myCounter = 5;
  const myInterval = setInterval(() => {
    --myCounter;
    broadcastEvent('timer', {timerSeconds: myCounter, timerMessage: 'before actual message rounds'});
    if(participants.length < 3 || !simulationStarted) {
      broadcastEvent('timer', {timerSeconds: 0, timerMessage: ''});
      clearInterval(myInterval);
      return;
    }
    if(myCounter <= 0) {
      startActualCommunicationRounds(messageLength);
      clearInterval(myInterval);
    }
  }, 1000);
}

function startActualCommunicationRounds(messageLength) {
  generateAndExchangeMessageKeyArray(messageLength);
  // metti next line in generation key message
  broadcastMessage(`Received Message Keys. ${messageLength} Keys.`);
  // could put some delay here
  startCommunicationRound();
}

function generateAndExchangeMessageKeyArray(n) {
  adjacencies.forEach(function callback(adjacency, index, array) {
    const keyValues = randomKeyArrayofLength(messageLength);
    var keyName1 = 'Key' + adjacency.participant1.name + adjacency.participant2.name;
    var keyName2 = 'Key' + adjacency.participant2.name + adjacency.participant1.name;
    adjacency.participant1.messageKeys = [...adjacency.participant1.messageKeys, {keyName: keyName1, keyValues}];
    adjacency.participant2.messageKeys = [...adjacency.participant2.messageKeys, {keyName: keyName2, keyValues}];

    unicastEvent(adjacency.participant1.id, 'message-keys-generated', [keyName1, keyValues]);
    unicastEvent(adjacency.participant2.id, 'message-keys-generated', [keyName2, keyValues]);
  });
}

function computeAndDistributeCommunicationRoundResult() {
  const roundResult = Participant.prototype.calculateRoundResult(participants);
  endCommunicationRound(roundResult);
}


// helpers
function broadcastEventToAll(event, message = '') {
  io.sockets.emit(event, message);
};

function broadcastEvent(event, message = '') {
  participants.forEach(function(connectedClient, index, array) {
    io.sockets.to(connectedClient.id).emit(event, message);
  });
}

function unicastEvent(id, event, message = '') {
  io.sockets.to(id).emit(event, message);
}

function broadcastMessage(message) {
  participants.forEach(function(connectedClient, index, array) {
    io.sockets.to(connectedClient.id).emit('general-message', message);
  });
}

function broadcastMessageToAll(message) {
  io.sockets.emit('general-message', message);
}

function updateWaitNumber() {
  const leftToWait = 3 - participants.length;
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

function addPendingParticipants() {
  participants = mergeArrays(participants, pendingClients);
  pendingClients.forEach(function (pendingClient, index, array) {
    unicastEvent(pendingClient.id, 'hide-waiting-message');
  });
  pendingClients.length = 0;
}

function adjustAdjacenciesValuesAfterClientRemoval(adjacencies, clientToBeRemoved) {

  var randomKeyReplacement ;
  var messageKeys ;

  adjacencies.forEach(function(pair, index, array) {
    if(pair.contains(clientToBeRemoved)) {
      let otherClient = pair.participant1.id === clientToBeRemoved.id ? pair.participant2 : pair.participant1;
      const recomposeKeyName = 'Key' + otherClient.name + clientToBeRemoved.name;

      if (rounds[currentRoundIndex].isVotingRound || rounds[currentRoundIndex].isLengthRound) {
        if (otherClient.keys[0].keyName === recomposeKeyName) {
          if(randomKeyReplacement) {
            otherClient.keys[0].keyValue = randomKeyReplacement;
            unicastEvent(otherClient.id, 'substitute-keys', otherClient.keys);
          } else {
            randomKeyReplacement = otherClient.keys[0].keyValue;
          }
        } else { // otherClient.keys[1].keyName === recomposeKeyName
          if(randomKeyReplacement) {
            otherClient.keys[1].keyValue = randomKeyReplacement;
            unicastEvent(otherClient.id, 'substitute-keys', otherClient.keys);
          } else {
            randomKeyReplacement = otherClient.keys[1].keyValue;
          }
        }
      } else {
        // for communication rounds
        if(otherClient.messageKeys[0].keyName === recomposeKeyName) {
          if(messageKeys) {
            otherClient.messageKeys[0].keyValues = messageKeys;
            unicastEvent(otherClient.id, 'substitute-message-keys', otherClient.messageKeys);
          } {
            messageKeys = otherClient.messageKeys[0].keyValues;
          }
        } else { // otherClient.messageKeys[1].keyName === recomposeKeyName
          if(messageKeys) {
            otherClient.messageKeys[1].keyValues = messageKeys;
            unicastEvent(otherClient.id, 'substitute-message-keys', otherClient.messageKeys);
          } {
            messageKeys = otherClient.messageKeys[1].keyValues;
          }
        }
      }
    }
  });
  return adjacencies;
}

// debugging
function debugPrintClientsFromArray() {
  participants.forEach(function(c, index, array) {
    console.log(c.name + "\n");
    console.log(c.roundResult + "\n");
  });
}

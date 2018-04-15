const socketIo = require('socket.io');
let io;
import { Participant } from './Participant';
import { Round } from './Round';
import { generateUniqueRandomName,
         csprnGenerator,
         removeParticipant,
         removeMultipleParticipants,
         findParticipantbyId,
         generateAdjacencies,
         secureRandomKeyArrayOfLength } from './utils';

let participants = [];
let adjacencies = [];
let currentRoundIndex = -1;
let rounds = [];
let initialCommunicationTimer ;
let simulationStarted = false;
let pendingParticipants = [];
let messageSender ;
let messageLength ;
let rejectedParticipants = [] ;
let roundNumber = 0;
let lengthRoundAttempt = 1;
let nonSenderParticipantsCount = 0;

exports.listen = function(server) {
  io = socketIo.listen(server);
  io.sockets.on('connection', function(socket) {
    handleNewConnection(socket);
    handleDisconnection(socket);
    handleVotingRoundParticipantResponse(socket);
    handleCommmunicationRoundReponse(socket);
    handleLengthRoundPartipantResponse(socket);
  });
};

function handleNewConnection(socket) {
  // io.sockets.clients(); // to get a list of all connected participants
  var newParticipant = new Participant(generateUniqueRandomName(participants), socket.id, socket);
  unicastEvent(newParticipant.id, 'connection-setup', newParticipant.name);
  if(simulationStarted) {
    pendingParticipants = [...pendingParticipants, newParticipant];
    unicastEvent(newParticipant.id, 'display-waiting-message');
  } else {
    participants = [...participants, newParticipant];
    updateWaitNumber();
    if (participants.length >= 3) {
      // clear interaval if a new client connects.
      if(initialCommunicationTimer) {
        clearInterval(initialCommunicationTimer);
        broadcastEvent('timer', {timerSeconds: 0, timerMessage: ''});
      }
      // start interval to allow few seconds before the round starts.
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
  broadcastEvent('client-connection', newParticipant.name);
};

function handleVotingRoundParticipantResponse(socket) {
  socket.on('participant-voting-response', function(participantMessage) {
    const sender = findParticipantbyId(participants, socket.id);
    const expectedMessage = sender.participantExpectedXORValue();
    if(participantMessage === expectedMessage) {
      sender.roundMessage = participantMessage;
      nonSenderParticipantsCount++;
    } else {
      if (rounds[currentRoundIndex].didSomeoneSendMessage) {
        sender.roundMessage = expectedMessage;
      /* add participants to list of rejected participants.
        These will be notified of the rejection when all the
        round responses are received on the sever. */
        rejectedParticipants = [...rejectedParticipants, sender];
      } else {
        sender.roundMessage = participantMessage;
        rounds[currentRoundIndex].didSomeoneSendMessage = true;
        // make this sender, the message sender for this round
        messageSender = sender;
      }
    }
    if(Round.prototype.areRoundMessagesReceived(participants)) {
      computeAndDistributeVotingRoundResult();
    }
  });
}

function handleLengthRoundPartipantResponse(socket) {
  socket.on('participant-length-response', function(pariticpantMessage) {
    const sender = findParticipantbyId(participants, socket.id);
    const expectedValue = sender.participantExpectedXORValue();
    if(pariticpantMessage === expectedValue) {
      sender.roundMessage = pariticpantMessage;
    } else {
      if(sender.id === messageSender.id && !rounds[currentRoundIndex].didSomeoneSendMessage) {
        sender.roundMessage = pariticpantMessage;
        rounds[currentRoundIndex].didSomeoneSendMessage = true;
      } else {
        sender.roundMessage = expectedValue;
      }
    }
    if(Round.prototype.areRoundMessagesReceived(participants)) {
      computeAndDistributeLengthRoundResult();
    }
  });
}

function handleCommmunicationRoundReponse(socket) {
  socket.on('participant-round-response', function(roundResult) {
    const sender = findParticipantbyId(participants, socket.id);
    const expectedValue =
      sender.participantExpectedCommunicationRoundValue(roundNumber);
      if (sender.id === messageSender.id) {
        if (roundResult === expectedValue) {
          console.error('Message Sender did not send his message round');
        } else {
          sender.roundMessage = roundResult;
        }
      } else {
        if (roundResult === expectedValue) {
          sender.roundMessage = roundResult;
        } else {
          console.error('Non message sender tried to inject value. Possible attacker.');
        }
      }

    if(Round.prototype.areRoundMessagesReceived(participants)) {
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
        toBeRemoved = findParticipantbyId(pendingParticipants, socket.id);
        pendingParticipants = removeParticipant(pendingParticipants, socket.id);
      } else if (toBeRemoved) {
        participants = removeParticipant(participants, socket.id);

        if (participants.length < 3) {
          broadcastEvent('abort-round', 'Participant Disconnected. No enough participants to guarantee anonymity.');
          addPendingParticipantsToSimulation();
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
          if(!Round.prototype.areRoundMessagesReceived(participants) && rounds[currentRoundIndex].isVotingRound) {
            adjacencies = adjustAdjacenciesValuesAfterParticipantRemoval(adjacencies, toBeRemoved);
            adjacencies = generateAdjacencies(participants);
            rounds[currentRoundIndex].didSomeoneSendMessage = false;
            messageSender = null;
            return;
          }
          broadcastEvent('abort-round', 'Message sender disconnected before end of his communication.');
          addPendingParticipantsToSimulation();
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

        adjacencies = adjustAdjacenciesValuesAfterParticipantRemoval(adjacencies, toBeRemoved);
        adjacencies = generateAdjacencies(participants);
        if(Round.prototype.areRoundMessagesReceived(participants) && rounds[currentRoundIndex].isVotingRound) {
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
      addPendingParticipantsToSimulation();
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
  adjacencies.forEach(function(adjacency){
    csprnGenerator(0, 1, function (keyValue) {
      // create key names based on the name of the participants in the adjacency
      var keyName1 = 'Key' + adjacency.participant1.name + adjacency.participant2.name;
      var keyName2 = 'Key' + adjacency.participant2.name + adjacency.participant1.name;
      // store keys on the server
      adjacency.participant1.keys = [...adjacency.participant1.keys, {keyName: keyName1, keyValue}];
      adjacency.participant2.keys = [...adjacency.participant2.keys, {keyName: keyName2, keyValue}];
      // send keys to clients
      unicastEvent(adjacency.participant1.id, 'round-key-generated', [keyName1, keyValue]);
      unicastEvent(adjacency.participant2.id, 'round-key-generated', [keyName2, keyValue]);
    });
  });
}

function computeAndDistributeVotingRoundResult() {
  communicateIfAnyRejected();
  const roundResult = Round.prototype.calculateXORRoundResult(participants);
  endVotingRound(roundResult);
  if(rounds[currentRoundIndex].didSomeoneSendMessage) {
    if (nonSenderParticipantsCount) {
      startLengthRound(lengthRoundAttempt);
      generateAndExchangeLengthRoundKeys();
      nonSenderParticipantsCount = 0;
    } else {
      broadcastEvent('abort-round',
        'All participants tried to send a message. Anonymity is impaired due\
        to all participants but sender receiving a rejection warning.');
      addPendingParticipantsToSimulation();
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
  nonSenderParticipantsCount = 0;
  participants = Participant.prototype.resetParticipants(participants);
  addPendingParticipantsToSimulation();
  adjacencies = generateAdjacencies(participants);
  setTimeout(function callback() {
    if (participants.length >= 3 && simulationStarted) {
      beginCommunication();
    }
  }, 1000);
}

function generateAndExchangeLengthRoundKeys() {
  adjacencies.forEach(function(adjacency){
    csprnGenerator(100, 999, function (keyValue) {
      // create key names based on the name of the participants in the adjacency
      var keyName1 = 'Key' + adjacency.participant1.name + adjacency.participant2.name;
      var keyName2 = 'Key' + adjacency.participant2.name + adjacency.participant1.name;
      // store keys on the server
      adjacency.participant1.keys = [...adjacency.participant1.keys, {keyName: keyName1, keyValue}];
      adjacency.participant2.keys = [...adjacency.participant2.keys, {keyName: keyName2, keyValue}];
      // send keys to clients
      unicastEvent(adjacency.participant1.id, 'round-key-generated', [keyName1, keyValue]);
      unicastEvent(adjacency.participant2.id, 'round-key-generated', [keyName2, keyValue]);
    });
  });
}


function computeAndDistributeLengthRoundResult() {
  const roundResult = Round.prototype.calculateXORRoundResult(participants);
  endLengthRound(roundResult);

  if(roundResult === 0) {
    // if no message is inserted keep repeating length rounds
    ++lengthRoundAttempt;
    if (lengthRoundAttempt <= 3) {
      setTimeout(function() {
        startLengthRound(lengthRoundAttempt);
        generateAndExchangeLengthRoundKeys();
      }, 1000);
    } else {
      broadcastMessage('Message sender failed to provide his message within three attempts.');
      broadcastEvent('reset-message-sender');
      lengthRoundAttempt = 1;
      participants = Participant.prototype.resetParticipants(participants);
      addPendingParticipantsToSimulation();
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
  adjacencies.forEach(function callback(adjacency) {
    const keyValues = secureRandomKeyArrayOfLength(messageLength);
    // create key names based on the name of the participants in the adjacency
    var keyName1 = 'Key' + adjacency.participant1.name + adjacency.participant2.name;
    var keyName2 = 'Key' + adjacency.participant2.name + adjacency.participant1.name;
    // store keys on the server
    adjacency.participant1.messageKeys = [...adjacency.participant1.messageKeys, {keyName: keyName1, keyValues}];
    adjacency.participant2.messageKeys = [...adjacency.participant2.messageKeys, {keyName: keyName2, keyValues}];
    // send keys to clients
    unicastEvent(adjacency.participant1.id, 'message-keys-generated', [keyName1, keyValues]);
    unicastEvent(adjacency.participant2.id, 'message-keys-generated', [keyName2, keyValues]);
  });
}

function computeAndDistributeCommunicationRoundResult() {
  const roundResult = Round.prototype.calculateXORRoundResult(participants);
  endCommunicationRound(roundResult);
}


// helpers
function broadcastEvent(event, message = '') {
  participants.forEach(function(connectedParticipant) {
    io.sockets.to(connectedParticipant.id).emit(event, message);
  });
}

function broadcastMessage(message) {
  participants.forEach(function(connectedParticipant) {
    io.sockets.to(connectedParticipant.id).emit('general-message', message);
  });
}

function unicastEvent(id, event, message = '') {
  io.sockets.to(id).emit(event, message);
}

function updateWaitNumber() {
  const leftToWait = 3 - participants.length;
  broadcastEvent('waiting-connections', leftToWait);
}

function communicateIfAnyRejected() {
  if(rejectedParticipants.length) {
    rejectedParticipants.forEach(function(rejectedParticipant) {
      unicastEvent(rejectedParticipant.id, 'message-rejected');
    })
    rejectedParticipants.length = 0;
  }
}

function addPendingParticipantsToSimulation() {
  // join simulation by being added to participants array
  participants = [...participants, ...pendingParticipants];
  pendingParticipants.forEach(function (pendingParticipant) {
    unicastEvent(pendingParticipant.id, 'hide-waiting-message');
  });
  pendingParticipants.length = 0;
}

function adjustAdjacenciesValuesAfterParticipantRemoval(adjacencies, participantToBeRemoved) {

  var replacementKey ;
  var messageKeys ;

  adjacencies.forEach(function(pair) {
    if(pair.contains(participantToBeRemoved)) {
      let otherParticipant = pair.participant1.id === participantToBeRemoved.id ? pair.participant2 : pair.participant1;
      const recomposeKeyName = 'Key' + otherParticipant.name + participantToBeRemoved.name;

      if (rounds[currentRoundIndex].isVotingRound || rounds[currentRoundIndex].isLengthRound) {
        if (otherParticipant.keys[0].keyName === recomposeKeyName) {
          if(replacementKey) {
            otherParticipant.keys[0].keyValue = replacementKey;
            unicastEvent(otherParticipant.id, 'substitute-keys', otherParticipant.keys);
          } else {
            replacementKey = otherParticipant.keys[0].keyValue;
          }
        } else { // otherParticipant.keys[1].keyName === recomposeKeyName
          if(replacementKey) {
            otherParticipant.keys[1].keyValue = replacementKey;
            unicastEvent(otherParticipant.id, 'substitute-keys', otherParticipant.keys);
          } else {
            replacementKey = otherParticipant.keys[1].keyValue;
          }
        }
      } else {
        // for communication rounds
        if(otherParticipant.messageKeys[0].keyName === recomposeKeyName) {
          if(messageKeys) {
            otherParticipant.messageKeys[0].keyValues = messageKeys;
            unicastEvent(otherParticipant.id, 'substitute-message-keys', otherParticipant.messageKeys);
          } {
            messageKeys = otherParticipant.messageKeys[0].keyValues;
          }
        } else { // otherParticipant.messageKeys[1].keyName === recomposeKeyName
          if(messageKeys) {
            otherParticipant.messageKeys[1].keyValues = messageKeys;
            unicastEvent(otherParticipant.id, 'substitute-message-keys', otherParticipant.messageKeys);
          } {
            messageKeys = otherParticipant.messageKeys[1].keyValues;
          }
        }
      }
    }
  });
  return adjacencies;
}

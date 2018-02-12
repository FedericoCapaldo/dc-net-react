let socketIo = require('socket.io');
let io;
let o = require('./objects.js');
let Promise = require("bluebird");
let randomNumber = require("random-number-csprng");
let random_name = require('node-random-name');

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
  var participant = new o.Participant(generateUniqueRandomName(), socket.id);
  clients.push(participant);
  unicastMessage(socket.id, 'connecting', participant.name);
  broadcastMessage("system-message", "CONNECTION", "New user \"" + participant.name + "\" connected to the network");
  if (clients.length == 3) {
    beginCommunication();
  } else if (clients.length > 3) {
    throw new Error ("too many clients");
  }
};

function handleParticipantResponse(socket) {
  socket.on('participant-response', function(clientResultValue) {
    const senderClient = findClientbyId(clients, socket.id);
    const expectedValue = clientExpectedValue(senderClient);
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
    if(areRoundMessagesReceived(clients)) {
      computeAndDistributeRoundResult();
    }
  });
}

function handleDisconnection(socket) {
  socket.on('disconnect', function() {
    var toBeRemoved = findClientbyId(clients,socket.id).name;
    clients = removeClientFromArray(clients, socket.id);
    // TODO: should update adajacencies
    if (clients.length <= 2) {
      // throw new Error("Not enough clients connected to guarantee anonymity of the set.");
      roundInProgress = false;
      resetClients();
      broadcastMessage('clear-keys');
      broadcastMessage('hide-dialog');
    }
    broadcastMessage("system-message", "CONNECTION", toBeRemoved + " disconnected from the network");
  });
}


// helpers
function broadcastMessage(event, type = "", message = "") {
  io.sockets.emit(event, type, message);
};

function unicastMessageWithType(id, event, type = "", message = "") {
  io.sockets.to(id).emit(event, type, message);
}

function unicastMessage(id, event, message = "") {
  io.sockets.to(id).emit(event, message);
}

function findClientbyId(clients, id) {
  return clients.filter(ob => ob.id === id)[0];
}

function beginCommunication() {
  generateAdjacencies(clients);
  startRound();
  generateAndExchangeKeys(adjacencies);
}

//SHOULD Use adajencies from glgobal or receive it as a parameter?
function generateAdjacencies(clients) {
  adjacencies.length = 0;
  for (var x = 0; x < clients.length; ++x) {
    var current = x;
    var next = (x + 1) % clients.length;
    var adj = new o.Pair(clients[current], clients[next]);
    adjacencies.push(adj);
  }
}

function startRound() {
  broadcastMessage('start-round');
  roundInProgress = true;
  ++currentRoundIndex;
  rounds[currentRoundIndex] = new o.Round(currentRoundIndex+1);
}

function generateAndExchangeKeys(adjacencies) {
  // sleep();
  // can these two be broadcasted as one event?
  broadcastMessage('generating-keys');
  adjacencies.forEach(function(adjacency, index, array){
    Promise.try(function() {
      return randomNumber(0, 1);
    }).then(function(keyValue) {
      var keyName1 = "Key" + adjacency.participant1.name + adjacency.participant2.name;
      var keyName2 = "Key" + adjacency.participant2.name + adjacency.participant1.name;
      // server update
      adjacency.participant1.keys = [...adjacency.participant1.keys, {keyName1, keyValue}];
      adjacency.participant2.keys = [...adjacency.participant2.keys, {keyName2, keyValue}];
      // interface update
      unicastMessageWithType(adjacency.participant1.id, 'key-generated', keyName1, keyValue);
      unicastMessageWithType(adjacency.participant2.id, 'key-generated', keyName2, keyValue);
    }).catch({code: "RandomGenerationError"}, function(err) {
      broadcastMessage("system-message", "ERROR", "Something went wrong! abort round");
      console.log("Something went wrong! abort round");
      // ABORT ROUND (SOMEHOW LATER ON)
    });
  });
}

function areRoundMessagesReceived(clients) {
  return !clients.some(function isResultPending(client) {
    return client.roundMessage === -1;
  });
}

function computeAndDistributeRoundResult() {
  let roundResult = 0;
  for(var x=0; x<clients.length; ++x) {
    roundResult += clients[x].roundMessage;
  }
  roundResult = roundResult % 2;
  broadcastMessage("round-result", roundResult);
  rounds[currentRoundIndex].completed = true;
  rounds[currentRoundIndex].roundResult = roundResult;
  roundInProgress = false;
  // TODO: should check if there are participants waiting
  resetClients();
  setTimeout(function() {
    beginCommunication();
  }, 3000)
}


function resetClients() {
  clients.map((client) => {
    client.roundMessage = -1
    client.keys.length = 0;
  });
}


// force a delay to ease understanding of the simulation
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function generateUniqueRandomName() {
  do {
    var name = random_name({ first: true, gender: "male" });
  } while (isNameUsed(clients, name));
  return name;
}

function isNameUsed(clients, name) {
  if (clients.length == 0) {
      return false;
  }
  return clients.some(function isNameEqual(client) { return client.name === name; });
}

function removeClientFromArray(clients, id) {
  return clients.filter(client => client.id != id);
}

function clientExpectedValue(client) {
  let expectedResult = 0;
  for(var x =0; x < client.keys.length; x++) {
    expectedResult = expectedResult + client.keys[x].keyValue;
  }
  expectedResult = expectedResult % 2;
  return expectedResult;
}

// debugging
function debugPrintClientsFromArray() {
  clients.forEach(function(element, index, array) {
    console.log(element);
  });
}

export { isNameUsed, areRoundMessagesReceived, removeClientFromArray };

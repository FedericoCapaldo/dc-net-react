let socketIo = require('socket.io');
let io;
let o = require('./objects.js');
let Promise = require("bluebird");
let randomNumber = require("random-number-csprng");
let random_name = require('node-random-name');

let clients = [];
let adjacencies = [];

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
  io.sockets.to(socket.id).emit('reset');
  var participant = new o.Participant(generateUniqueRandomName(), socket.id);
  clients.push(participant);
  broadcastSystemMessage("CONNECTION", "New user \"" + participant.name + "\" connected");
  if (clients.length == 3) {
    generateAdjacencies(clients);
    generateAndExchangeKeys(adjacencies);
  } else if (clients.length > 3) {
    throw new Error ("too many clients");
  }
};

function handleParticipantResponse(socket) {
  socket.on('participant-response', function(value) {
    findClientbyId(clients, socket.id).roundResult = value;
    if(areRoundsResultsReceived(clients)) {
      computeAndDistributeFinalResult();
    } else {
      io.sockets.to(socket.id).emit('system-message', 'FINAL-ANSWER-PROGRESS', "Waiting for other clients responses");
    }
  });
}

function handleDisconnection(socket) {
  socket.on('disconnect', function() {
    // remove client from array of clients
    clients.splice(clients.indexOf(findClientbyId(clients, socket.id)), 1);
    if (clients.length <= 2) {
      // throw new Error("Not enough clients connected to guarantee anonymity of the set.");
    }
    broadcastSystemMessage("CONNECTION", "User disconnected");
  });
}


// helpers

function broadcastSystemMessage(type, message) {
  io.sockets.emit('system-message', type, message);
};

function findClientbyId(clients, id) {
  return clients.filter(ob => ob.id === id)[0];
}

function generateAndExchangeKeys(adjacencies) {
  // sleep();
  io.sockets.emit('system-message', "KEY-GENERATION", "KEY GENERATION IN PROGRESS.");
  io.sockets.emit('show-dialog', "DIALOG", "KEY GENERATION IN PROGRESS.");
  adjacencies.forEach(function(adjacency, index, array){
    Promise.try(function() {
      return randomNumber(0, 1);
    }).then(function(number) {
      var keyName1 = "Key" + adjacency.participant1.name + adjacency.participant2.name;
      var keyName2 = "Key" + adjacency.participant2.name + adjacency.participant1.name;
      io.sockets.to(adjacency.participant1.id).emit('key-exchange', keyName1, number);
      io.sockets.to(adjacency.participant2.id).emit('key-exchange', keyName2, number);
      // TODO: would you like to store key inside the pair object?
    }).catch({code: "RandomGenerationError"}, function(err) {
      broadcastSystemMessage("ERROR", "Something went wrong! abort round");
      console.log("Something went wrong! abort round");
      // ABORT ROUND (SOMEHOW LATER ON)
    });
  });
}

function generateAdjacencies(clients) {
  adjacencies.length = 0;
  for (var x = 0; x < clients.length; ++x) {
    var current = x;
    var next = (x + 1) % clients.length;
    var adj = new o.Pair(clients[current], clients[next]);
    adjacencies.push(adj);
  }
}

function areRoundsResultsReceived(clients) {
  return !clients.some(function isResultPending(client) {
    return client.roundResult === -1;
  });
}

function computeAndDistributeFinalResult() {
  var final = 0;
  for(var x=0; x<clients.length; ++x) {
    final += clients[x].roundResult;
  }
  final = final % 2;
  var finalMessage = "ROUND VALUE: " + final ;
  if(final) {
    finalMessage += ". A cryptographer paid for the dinner.";
  } else {
    finalMessage += ". The NSA paid for the dinner.";
  }
  broadcastSystemMessage("ROUND-RESULT", finalMessage);
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


// debugging
function debugPrintClientsFromArray() {
  clients.forEach(function(element, index, array) {
    console.log(element);
  });
}

export { isNameUsed, areRoundsResultsReceived };

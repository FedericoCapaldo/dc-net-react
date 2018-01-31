var socketIo = require('socket.io');
var io;
var o = require('./objects.js');
var Promise = require("bluebird");
var randomNumber = require("random-number-csprng");

var clients = [];
var adjacencies = [];
var valuesFromClients = 0;
var alphabeticNames = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase().split('').reverse();


exports.listen = function(server) {
  io = socketIo.listen(server);
  io.sockets.on('connection', function(socket) {
    handleNewConnection(socket);
    // handleMessage(socket);
    handleDisconnection(socket);
    handleIncomingClientValue(socket);
    socket.on('my-action', function(message){
      console.log('test on the server');
    });
  });
};

exports.dai = function() {
  console.log('test123');
};


function handleNewConnection(socket) {
  // io.sockets.clients(); // to get a list of all connected clients
  io.sockets.to(socket.id).emit('reset');
  var participant = new o.Participant(alphabeticNames.pop(), socket.id);
  clients.push(participant);
  broadcastSystemMessage("CONNECTION", "New user \"" + participant.name + "\" connected");
  if (clients.length == 3) {
    generateAdjacencies(clients);
    generateAndExchangeKeys(adjacencies);
  } else if (clients.length > 3) {
    throw new Error ("too many clients");
  }
};

// function handleMessage(socket) {
//   socket.on('in-message', function(sender, mes){
//     console.log(mes);
//   })
// };

function handleIncomingClientValue(socket) {
  socket.on('client-value', function(value) {
    findClientbyId(clients, socket.id).roundResult = value;
    ++valuesFromClients;
    if(valuesFromClients == clients.length) {
      computeAndDistributeFinalResult();
    } else {
      io.sockets.to(socket.id).emit('key-exchange-progress', "Waiting for other clients responses");
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

// debugging
function debugPrintClientsFromArray() {
  clients.forEach(function(element, index, array) {
    console.log(element);
  });
}

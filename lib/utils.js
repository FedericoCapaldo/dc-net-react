const random_name = require('node-random-name');
const crypto = require('crypto');
const Promise = require('bluebird');
const randomNumber = require('random-number-csprng');
import { Adjacency } from './Adjacency';

function removeParticipant(participants, id) {
  return participants.filter(p => p.id != id);
}

function removeMultipleParticipants(participants, participantsToBeRemoved) {
  return participants.filter( function( el ) {
    return !participantsToBeRemoved.includes( el );
  });
}

function findParticipantbyId(participants, id) {
  return participants.filter(ob => ob.id === id)[0];
}

function isNameUsed(participants, name) {
  if (participants.length == 0) {
      return false;
  }
  return participants.some(function isNameEqual(p) { return p.name === name; });
}

function generateUniqueRandomName(participants) {
  do {
    var name = random_name({ first: true });
  } while (isNameUsed(participants, name));
  return name;
}

function generateAdjacencies(participants) {
  let adjacencies = [];
  for (var x = 0; x < participants.length; ++x) {
    var current = x;
    var next = (x + 1) % participants.length;
    var adj = new Adjacency(participants[current], participants[next]);
    adjacencies = [...adjacencies, adj];
  }
  return adjacencies;
}

function csprnGenerator(minimum, maximum, callback) {
  Promise.try(function() {
    return randomNumber(minimum, maximum);
  }).then(function(secureRandom) {
    callback(secureRandom);
  }).catch({code: 'RandomGenerationError'}, function(err) {
    console.error('csprn generation error.');
  });
}

function secureRandomKeyArrayOfLength(n) {
  // 8 bits goes from 0 to 255
  let pseudoRandom = new Uint8Array(n);
  let bytes = crypto.randomBytes(n);
  pseudoRandom.set(bytes);
  return Array.from(pseudoRandom);
}

export { csprnGenerator,
         findParticipantbyId,
         isNameUsed,
         secureRandomKeyArrayOfLength,
         generateAdjacencies,
         generateUniqueRandomName,
         removeParticipant,
         removeMultipleParticipants };

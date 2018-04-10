const random_name = require('node-random-name');
const crypto = require('crypto');
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
    adjacencies.push(adj);
  }
  return adjacencies;
}

function mergeArrays(arr1, arr2) {
  return [...arr1, ...arr2];
}

function randomKeyArrayofLength(n) {
  // 8 bits goes from 0 to 255
  let pseudoRandom = new Uint8Array(n);
  let bytes = crypto.randomBytes(n);
  // set 1 bit for each entry of array
  pseudoRandom.set(bytes);
  return Array.from(pseudoRandom);
}

export { mergeArrays,
         findParticipantbyId,
         isNameUsed,
         randomKeyArrayofLength,
         generateAdjacencies,
         generateUniqueRandomName,
         removeParticipant,
         removeMultipleParticipants };

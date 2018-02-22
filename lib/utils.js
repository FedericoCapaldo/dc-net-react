const random_name = require('node-random-name');
import { Pair } from './Pair';

function removeParticipantFromArray(participants, id) {
  return participants.filter(p => p.id != id);
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
    var name = random_name({ first: true, gender: 'male' });
  } while (isNameUsed(participants, name));
  return name;
}

function generateAdjacencies(participants) {
  let adjacencies = [];
  for (var x = 0; x < participants.length; ++x) {
    var current = x;
    var next = (x + 1) % participants.length;
    var adj = new Pair(participants[current], participants[next]);
    adjacencies.push(adj);
  }
  return adjacencies;
}

export { generateUniqueRandomName, removeParticipantFromArray, findParticipantbyId, generateAdjacencies };

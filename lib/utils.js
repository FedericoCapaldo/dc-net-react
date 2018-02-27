const random_name = require('node-random-name');
import { Pair } from './Pair';

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

function addPendingParticipants(participants, pendingParticipants) {
  while(pendingParticipants.length > 0) {
    const pending = pendingParticipants.shift();
    participants = [...participants, pending];
  }
  return participants;
}

export { addPendingParticipants,
         findParticipantbyId,
         generateAdjacencies,
         generateUniqueRandomName,
         removeParticipant,
         removeMultipleParticipants };

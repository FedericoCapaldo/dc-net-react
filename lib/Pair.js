var Pair = function(participant1, participant2) {
  this.participant1 = participant1;
  this.participant2 = participant2;
}


Pair.prototype.contains = function(participant) {
  if (this.participant1.id === participant.id || this.participant2.id === participant.id) {
    return true;
  }
  return false;
}

export { Pair };

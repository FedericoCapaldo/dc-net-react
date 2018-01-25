exports.Participant = function(name, socketId) {
    this.name = name;
    this.id = socketId;
    this.roundResult = -1;
}

exports.Pair = function(participant1, participant2) {
  this.participant1 = participant1;
  this.participant2 = participant2;
}

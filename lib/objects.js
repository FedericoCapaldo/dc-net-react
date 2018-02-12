var Participant = function(name, socketId) {
    this.name = name;
    this.id = socketId;
    this.keys = [];
    this.roundMessage = -1;
}

Participant.prototype.whoami = function() {
  console.log('My name is: ' + this.name );
}

exports.Pair = function(participant1, participant2) {
  this.participant1 = participant1;
  this.participant2 = participant2;
}

exports.Round = function(number) {
  this.number = number;
  this.didSomeoneSendMessage = false;
  this.roundResult = -1;
  this.completed = false;
}

export { Participant };

var Participant = function(name, socketId) {
    this.name = name;
    this.id = socketId;
    this.keys = [];
    this.roundMessage = -1;
}

Participant.prototype.areRoundMessagesReceived = function(participants) {
  return !participants.some(function isResultPending(p) {
    return p.roundMessage === -1;
  });
}

Participant.prototype.resetParticipants = function(participants) {
  for(let i=0; i<participants.length; i++) {
      participants[i].keys.length = 0;
      participants[i].roundMessage = -1;
  }
  return participants;
}

Participant.prototype.participantExpectedValue = function() {
  let expectedResult = 0;
  for(var x =0; x < this.keys.length; x++) {
    expectedResult = expectedResult + this.keys[x].keyValue;
  }
  expectedResult = expectedResult % 2;
  return expectedResult;
}

Participant.prototype.calculateRoundResult = function(participants) {
  let roundResult = 0;
  for(var x=0; x<participants.length; ++x) {
    roundResult += participants[x].roundMessage;
  }
  roundResult = roundResult % 2;
  return roundResult;
}

export { Participant };
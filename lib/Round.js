var Round = function(number) {
  this.number = number;
  this.didSomeoneSendMessage = false;
  this.roundResult = -1;
  this.completed = false;
}

Round.prototype.calculateXORRoundResult = function(participants) {
  let roundResult = 0;
  for(var x=0; x < participants.length; ++x) {
    roundResult ^= participants[x].roundMessage;
  }
  return roundResult;
}

Round.prototype.areRoundMessagesReceived = function(participants) {
  return !participants.some(function isResultPending(p) {
    return p.roundMessage === -1;
  });
}

export { Round };

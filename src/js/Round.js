const Round = function Round(number) {
  this.number = number;
  this.isWaitingKeys = false;
  this.keys = [];
  this.participantResponse = -1;
  this.valueToServer = -1;
  this.isWaitingRoundResult = false;
  this.messageRejected = false;
  this.roundResult = -1;
  this.completed = false;
};

export { Round };

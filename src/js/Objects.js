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
  this.aborted = false;
  this.abortReason = '';
};

const Connection = function Connection(name, type) {
  this.name = name;
  this.type = type;
};

export { Round, Connection };

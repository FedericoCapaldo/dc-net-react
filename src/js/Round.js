const Round = function (number) {
  this.number = number;
  this.keys = [];
  this.participantResponse = -1;
  this.finalResult = -1;
  this.waiting = true;
  this.completed = false;
};

export { Round };

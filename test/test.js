let chai = require('chai');
let expect = chai.expect;

const { isNameUsed, removeParticipant } = require('../lib/utils');
// var Participant = require('../lib/Participant');

describe('Helper functions', function() {
  describe('Random name generator', function() {
    it('should return true if name is present in array', function() {
      let clients = [{name: "Alice", id: "xiu67324f"},
                 {name: "Bob", id: "chrqe9712bn"}];
      expect(isNameUsed(clients, "Bob")).to.equal(true);
    });

    it('should return false if name is not present in array', function() {
      let clients = [{name: "Alice", id: "xiu67324f"},
                 {name: "Bob", id: "chrqe9712bn"}];
      expect(isNameUsed(clients, "Charlie")).to.equal(false);
    });
  });


  describe.skip('Check All Round Results are present', function() {
    it('should return false if some values are not received', function() {
      let clients = [{name: "Alice", id: "xiu67324f", roundMessage: 1},
                     {name: "Bob", id: "chrqe9712bn", roundMessage: -1},
                     {name: "Charlie", id: "chrqe9712bn", roundMessage: 0}];
      expect(Participant.prototype.areRoundMessagesReceived(clients)).to.equal(false);
    });

    it('should return true if all values are received on the server', function() {
      let clients = [{name: "Alice", id: "xiu67324f", roundResult: 1},
                     {name: "Bob", id: "chrqe9712bn", roundResult: 0},
                     {name: "Charlie", id: "chrqe9712bn", roundResult: 0}];
      expect(Participant.prototype.areRoundMessagesReceived(clients)).to.equal(true);
    })
  });

  describe('Client removal happens correctly', function() {
    it('should remove the client with the provided id', function() {
      let clients = [{name: "Alice", id: "xiu67324f", roundResult: 1},
                     {name: "Bob", id: "chrqe9712bn", roundResult: 0},
                     {name: "Charlie", id: "aaarqe22bn", roundResult: 0}];
      const result = removeParticipant(clients, "chrqe9712bn");
      const clientsAfter = [{name: "Alice", id: "xiu67324f", roundResult: 1},
                            {name: "Charlie", id: "aaarqe22bn", roundResult: 0}];
      expect(result).to.eql(clientsAfter);
    })
  })
});

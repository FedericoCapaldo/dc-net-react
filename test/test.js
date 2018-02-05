let chai = require('chai');
let expect = chai.expect;

let chatHelpers = require('../lib/chat-server');


describe('Helper functions', function() {
  describe('Random name generator', function() {
    it('Returns true if name is present in array', function() {
      let clients = [{name: "Alice", id: "xiu67324f"},
                 {name: "Bob", id: "chrqe9712bn"}];
      expect(chatHelpers.isNameUsed(clients, "Bob")).to.equal(true);
    });

    it('Returns false if name is not present in array', function() {
      let clients = [{name: "Alice", id: "xiu67324f"},
                 {name: "Bob", id: "chrqe9712bn"}];
      expect(chatHelpers.isNameUsed(clients, "Charlie")).to.equal(false);
    });
  });
});

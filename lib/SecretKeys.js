var SecretKey = function(name, value) {
  this.keyName = name;
  this.keyValue = value;
}

var SecretMessageKey = function(name, value) {
  this.keyName = name;
  this.keyValues = value;
}

export { SecretKey, SecretMessageKey };

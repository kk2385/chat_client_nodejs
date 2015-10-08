//runs the chat server.
var net = require('net');
var ClientManager = require('./clientManager');
var commands = require('./commands');

var chatServer = net.createServer();

chatServer.on('connection', function(client) {
  var cm = new ClientManager(client);
  client.on('data', function(data) {
    cm.processClientData(data);
  });

  client.on('end', function() {
    cm.forceQuit(); //executes if connection ends ubruptly.
  });
});

chatServer.listen(9399);
console.log('Listening on port 9399...');

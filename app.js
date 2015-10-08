var net = require('net');
var clientManager = require('./clientManager');

var chatServer = net.createServer();

chatServer.on('connection', function(client) {
	var cm = new clientManager.ClientManager(client);
	//clientList.push(client);
	client.on('data', function(data) {
		cm.processClient(data);
	});

	client.on('end', function() {
		clientList.splice(clientList.indexOf(client), 1);
  });
});


chatServer.listen(9000);
console.log('Listening on port 9000...');

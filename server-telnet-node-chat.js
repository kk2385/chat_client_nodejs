// A Simple nod.js chat server using telent from O'reilly's node up and running


var net = require('net');

var chatServer = net.createServer();
var clientList = [];
var chatRooms = {'sauna':[], 'hottub': []};
var nameToClient = {};
var commands = ['/rooms', '/join', '/leave', '/quit'];

function writeToClient(client, message) {
	client.write('<= ' + message + '\n');
}

function promptClient(client) {
	client.write('=> ');
}

function processCommand(client, command) {
	var operation = command[0];
	var target = command[1];
	if (operation === '/rooms') {
		writeToClient(client, "Active rooms are:");
		for (var room in chatRooms) {
			writeToClient(client, "* " + room + "(" + chatRooms[room].length +")");
		}
	} else if (operation === '/join') {
		if (client.currRoom) { //leave current room.
			removeFromChatroom(client, client.currRoom);
		}
		if (chatRooms.hasOwnProperty(target)) { //join new room if room valid.
			client.currRoom = target;
			chatRooms[target].push(client);
		} else {
			writeToClient(client, "Room " + target + " does not exist");
		}
	} else if (operation === '/leave') {
		if (!client.currRoom) {
			writeToClient(client, "You are not in a chat room.");
		} else {
			client.currRoom = null;
			removeFromChatroom(client, target);
		}
	} else if (operation === '/quit') {

	} else {
		writeToClient(client, 'Please enter a proper command. Example: /rooms, /join)');
	}
}

function removeFromChatroom(client, room) {
	var idx = chatRooms[room].indexOf(client); //remove
	array.splice(idx, 1);
}

function processClient(client, data) {
	if (!client.name) { //namesetup
		var newName = data.toString().trim();
		if (nameToClient.hasOwnProperty(newName)) {
			writeToClient(client, "Sorry, name taken.");
			writeToClient(client, "Login Name?");
		} else {
			writeToClient(client, "Welcome " + newName + '!');
			client.name = newName;
			nameToClient[newName] = client;
		}
	} else {
		var msg = data.toString().trim();
		var isCommand = msg.charAt(0) === '/';
		if (isCommand) { //execute command
			var commandArgs = msg.split(/\s+/);
			processCommand(client, commandArgs);
		} else if (client.currRoom){ //talk to room.
			broadcast(msg, client, client.currRoom);
			return;
		} else { //still not in a chatroom.
			writeToClient(client, '"/join <roomName>" to start chatting with others.');
		}
	}
	promptClient(client);
}

chatServer.on('connection', function(client) {
	writeToClient(client, 'Welcome to the XYZ chat server');
	writeToClient(client, 'Login Name?');
	promptClient(client);
	// client.name = client.remoteAddress + ':' + client.remotePort;
	//client.write('Hi ' + client.name + '!\n');

	clientList.push(client);

	client.on('data', function(data) {
		processClient(client, data);
	});

	client.on('end', function() {
		clientList.splice(clientList.indexOf(client), 1);
  });

});

function broadcast(message, client, room) {
	// Echo the sending client's name to all clients receiving the message
	for(var i = 0; i < chatRooms[room].length; i++) {
		var currClient = chatRooms[room][i];
		var result = "";
		if (currClient !== client) {
			result += "\n";
		}
		result += "<= " + client.name + ": " + message + "\n";
		currClient.write(result);
		promptClient(currClient);
	}
}

chatServer.listen(9000);
console.log('Listening on port 9000...');

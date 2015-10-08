var chatRooms = {'sauna':[], 'hottub': []};
var nameToClientManager	 = {};
var commands = ['/rooms', '/join', '/leave', '/quit'];

function ClientManager(client) {
	this.client = client;
	this.username = undefined;
	this.roomname = undefined;
	this.writeToClient('Welcome to the XYZ chat server');
	this.writeToClient('Login Name?');
	this.promptClient();
}

ClientManager.prototype.writeToClient = function (message) {
	this.client.write('<= ' + message + '\n');
};

ClientManager.prototype.promptClient = function() {
	this.client.write('=> ');
};

ClientManager.prototype.roomWelcomeMessage = function(room) {
	var usersInRoom = chatRooms[room];
	this.writeToClient("entering room: " + room);
	for (var i = 0; i < usersInRoom.length; i++) {
		var user = usersInRoom[i].username;
		user += (user === this.username)? ' (** this is you)' : '';
		this.writeToClient(user);
	}
	this.writeToClient('end of list.');
};

ClientManager.prototype.processCommand = function(command) {
	var operation = command[0];
	var target = command[1];
	var client = this.client;
	if (operation === '/rooms') {
		this.writeToClient("Active rooms are:");
		for (var room in chatRooms) {
			this.writeToClient("* " + room + "(" + chatRooms[room].length +")");
		}
	} else if (operation === '/join') {
		if (this.roomname) { //leave current room.
			this.removeFromChatroom();
		}
		if (chatRooms.hasOwnProperty(target)) { //join new room if room valid.
			this.roomname = target;
			chatRooms[target].push(this);
			this.roomWelcomeMessage(target);
		} else {
			this.writeToClient("Room " + target + " does not exist");
		}
	} else if (operation === '/leave') {
		if (!this.roomname) {
			this.writeToClient("You are not in a chat room.");
		} else {
			this.removeFromChatroom();
		}
	} else if (operation === '/quit') {

	} else {
		this.writeToClient('Please enter a proper command. Example: /rooms, /join)');
	}
};

ClientManager.prototype.removeFromChatroom = function() {
	var client = this.client;
	var users = chatRooms[this.roomname];
	var idx = users.indexOf(client);
	users.splice(idx, 1); //remove client from users
	this.roomname = undefined; //remove room from client.
};

ClientManager.prototype.setName = function(data) {
	var client = this.client;
	var newName = data.toString().trim();
	if (nameToClientManager.hasOwnProperty(newName)) {
		this.writeToClient("Sorry, name taken.");
		this.writeToClient("Login Name?");
	} else {
		this.writeToClient("Welcome " + newName + '!');
		this.username = newName;
		nameToClientManager[newName] = this;
	}
};

ClientManager.prototype.processClient = function(data) {
	var client = this.client;
	if (!this.username) { //namesetup
		this.setName(data);
	} else {
		var msg = data.toString().trim();
		var isCommand = msg.charAt(0) === '/';
		if (isCommand) { //execute command
			var commandArgs = msg.split(/\s+/);
			this.processCommand(commandArgs);
		} else if (this.roomname){ //talk to room.
			this.broadcast(msg, this.roomname);
			return;
		} else { //still not in a chatroom.
			this.writeToClient('"/join <roomname>" to start chatting with others.');
		}
	}
	this.promptClient();
};

ClientManager.prototype.broadcast = function(message, room) {
	var client = this.client;
	for (var i = 0; i < chatRooms[room].length; i++) { //msg everyone on chatroom.
		var currClient = chatRooms[room][i];
	//	console.log("currClient name:", currClient.name, "sender name:", client.name,
	//	"manager name:", currClientManager.client.name);
		var result = "";
		if (currClient.username !== this.username) {
			result += "\n";
		}
		result += "<= " + this.username + ": " + message + "\n";
		currClient.client.write(result);
		currClient.promptClient();
	}
};


module.exports = {
  chatRooms: chatRooms,
  nameToClientManager: nameToClientManager,
  commands: commands,
  ClientManager: ClientManager
};

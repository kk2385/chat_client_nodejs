//manages all the interactions that a client has, such as joining and leaving
//a room.
var commands = require('./commands');

function ClientManager(client) {
	this.client = client;
	this.username = undefined;
	this.roomname = undefined;
	this.writeToClient('Welcome to the XYZ chat server');
	this.writeToClient('Login Name?');
	this.promptClient();
}

ClientManager.prototype.chatRooms = {'sauna':[], 'hottub': []};
ClientManager.prototype.nameToClientManager	= {}; //maps a username to a ClientManager

//this executes when user submits input.
ClientManager.prototype.processClientData = function(data) {
	if (!this.username) { //namesetup
		this.attemptSetName(data);
    this.promptClient();
	} else {
		var msg = data.toString().trim();
		var isCommand = msg.charAt(0) === '/';
		if (isCommand) { //execute command
			var commandArgs = msg.split(/\s+/);
			this.processCommand(commandArgs);
		} else if (this.roomname) { //talk to room.
			this.messageChatroom(msg, this.roomname);
		} else { //still not in a chatroom.
			this.writeToClient('"/join <roomname>" to start chatting with others.');
      this.promptClient();
		}
	}
};

ClientManager.prototype.processCommand = function(command) {
	var operation = command[0];
	var target = command[1]; //for whispers/joining room
  var msg = command[2]; //for whispers
  if (commands.hasOwnProperty(operation)) {
    commands[operation].call(this, target);
  } else {
    this.writeToClient('Please enter a proper command. Example: /rooms, /join)');
  }
};

ClientManager.prototype.writeToClient = function (message) {
	this.client.write('<= ' + message + '\n');
};

ClientManager.prototype.promptClient = function() {
	this.client.write('=> ');
};

//remove myself from a chatroom.
ClientManager.prototype.removeSelfFromChatroom = function() {
	var users = this.chatRooms[this.roomname];
	var idx = users.indexOf(this);
	users.splice(idx, 1); //remove client from users
	this.roomname = undefined; //remove room from client.
};

//validates data as a proper username and sets if it's valid.
ClientManager.prototype.attemptSetName = function(data) {
	var newName = data.toString().trim();
	if (this.nameToClientManager.hasOwnProperty(newName)) {
		this.writeToClient("Sorry, name taken.");
		this.writeToClient("Login Name?");
	} else {
		this.writeToClient("Welcome " + newName + '!');
		this.username = newName;
		this.nameToClientManager[newName] = this;
	}
};


//display all users in the chat room I just entered.
ClientManager.prototype.roomWelcomeMessage = function(room) {
	var usersInRoom = this.chatRooms[room];
	this.writeToClient("entering room: " + room);
	for (var i = 0; i < usersInRoom.length; i++) {
		var user = usersInRoom[i].username;
    var msg = ' * ' + user;
    msg += (user === this.username)? ' (** this is you)' : '';
		this.writeToClient(msg);
	}
	this.writeToClient('end of list.');
};

//tell everyone in the chatroom that you are leaving.
ClientManager.prototype.announceMeEntering = function() {
  var room = this.roomname;
  for (var i = 0; i < this.chatRooms[room].length; i++) { //msg everyone on chatroom.
		var currClient = this.chatRooms[room][i];
		if (currClient.username !== this.username) {
      var result = currClient.username;
      currClient.client.write('\n');
      currClient.writeToClient('* new user joined chat:' + result);
      currClient.promptClient();
		}
	}
};

//tell everyone in the chatroom that you are leaving.
ClientManager.prototype.announceMeLeaving = function() {
  var room = this.roomname;
  for (var i = 0; i < this.chatRooms[room].length; i++) { //msg everyone on chatroom.
		var currClient = this.chatRooms[room][i];
		var result = currClient.username;
		if (currClient.username === this.username) {
			result += ' (** this is you)';
		}
    if (currClient.username !== this.username) currClient.client.write('\n');
		currClient.writeToClient("* user has left chat:" + result);
    currClient.promptClient();
	}
};

//send a message to everyone in the room.
ClientManager.prototype.messageChatroom = function(message, room) {
	for (var i = 0; i < this.chatRooms[room].length; i++) { //msg everyone on chatroom.
		var currClient = this.chatRooms[room][i];
		var result = currClient.username !== this.username? '\n' : ''; //new line if i am sender.
		result += "<= " + this.username + ": " + message + "\n";
		currClient.client.write(result);
		currClient.promptClient();
	}
};

module.exports = ClientManager;

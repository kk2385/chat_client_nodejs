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

ClientManager.prototype.chatRooms = {
  'sauna': [], //example chatrooms that don't have a room opener.
  'hottub': []
};
ClientManager.prototype.nameToClientManager = {}; //maps a username to a ClientManager
ClientManager.prototype.roomMasters = {}; //maps a room name to a user name. keep track of users opening/closing rooms

ClientManager.prototype.writeToClient = function(message) {
  this.client.write('<= ' + message + '\n');
};

ClientManager.prototype.promptClient = function() {
  this.client.write('=> ');
};

//this executes when user submits input.
ClientManager.prototype.processClientData = function(data) {
  if (!this.username) { //namesetup
    this.attemptSetName(data);
    this.promptClient();
  } else {
    var msg = data.toString().trim();
    var isCommand = msg.charAt(0) === '/';
    if (isCommand) { //execute command
      var splitString = msg.split(/\s+/);
      var command = splitString[0];
      var target = splitString[1];
      var msgQuoted = msg.match(/"[\s\S]*"/); //gets double quoted string from input. for whispers in the form of /whisper jack "hello"
      var commandArgs = [command, target, msgQuoted ? msgQuoted[0] : undefined];
      //some commandArgs examples: ["/join", "chatroom1", undefined], ["/leave", undefined, undefined], ["/whisper", "jack", 'hello']
      this.processCommand(commandArgs);
    } else if (this.roomname) { //talk to room.
      this.messageChatroom(msg, this.roomname);
    } else { //still not in a chatroom.
      this.writeToClient('"/join <roomname>" to start chatting with others. Enter "/help" for all available commands');
      this.promptClient();
    }
  }
};

ClientManager.prototype.processCommand = function(command) {
  var operation = command[0];
  var target = command[1]; //for whispers/joining room
  var msg = command[2]; //for whispers
  if (commands.hasOwnProperty(operation)) {
    commands[operation].call(this, target, msg);
  } else {
    this.writeToClient('Please enter a valid command. Example: /rooms, /join. Enter "/help" for all available commands');
    this.promptClient();
  }
};

//validates data as a proper username and sets if it's valid.
ClientManager.prototype.attemptSetName = function(data) {
  var newName = data.toString().trim();
  if (!newName.match(/^[a-z0-9_-]{3,15}$/)) { //validate
    this.writeToClient("No spaces or special characters in name please!");
    this.writeToClient("Also, keep it between 3 and 15 letters");
    this.writeToClient("Login Name?");
  } else if (this.nameToClientManager.hasOwnProperty(newName)) {
    this.writeToClient("Sorry, name taken.");
    this.writeToClient("Login Name?");
  } else {
    this.writeToClient("Welcome " + newName + '!');
    this.username = newName;
    this.nameToClientManager[newName] = this;
  }
};

//remove myself from a chatroom.
ClientManager.prototype.removeSelfFromChatroom = function() {
  var users = this.chatRooms[this.roomname];
  var idx = users.indexOf(this);
  users.splice(idx, 1); //remove client from users
  this.roomname = undefined; //remove room from client.
};


//display all users in the chat room I just entered.
ClientManager.prototype.roomWelcomeMessage = function(room) {
  var usersInRoom = this.chatRooms[room];
  this.writeToClient("entering room: " + room);
  for (var i = 0; i < usersInRoom.length; i++) {
    var user = usersInRoom[i].username;
    var msg = ' * ' + user;
    msg += (user === this.username) ? ' (** this is you)' : '';
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
    if (currClient.username !== this.username) currClient.promptClient(); //avoid double printing prompt arrows <=
  }
};

//send a message to everyone in the room.
ClientManager.prototype.messageChatroom = function(message, room) {
  for (var i = 0; i < this.chatRooms[room].length; i++) { //msg everyone on chatroom.
    var currClient = this.chatRooms[room][i];
    var result = currClient.username !== this.username ? '\n' : ''; //new line if i am sender.
    result += "<= " + this.username + ": " + message + "\n";
    currClient.client.write(result);
    currClient.promptClient();
  }
};

//whisper to a certain user in the room.
ClientManager.prototype.whisperTo = function(destUser, message) {
  if (!message) {
    this.writeToClient('You can send a whisper to another person online by entering /whisper <name> "message". Use double quotes!');
  } else if (destUser === this.username) {
    this.writeToClient("Why are you whispering to yourself?");
  } else if (this.nameToClientManager.hasOwnProperty(destUser)) {
    var receiver = this.nameToClientManager[destUser];
    receiver.client.write('\n');
    receiver.writeToClient('Whisper from ' + this.username + ': ' + message);
    this.writeToClient('Whispered to ' + destUser + ': ' + message);
    receiver.promptClient();
  } else {
    this.writeToClient(destUser + " is not a valid username!");
  }
  this.promptClient();
};

module.exports = ClientManager;

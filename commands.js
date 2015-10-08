//all the viable commands.

//join a room.
function join(room) {
  if (this.roomname) { //leave current room.
    this.removeSelfFromChatroom();
  }
  if (this.chatRooms.hasOwnProperty(room)) { //join new room if room valid.
    this.roomname = room;
    this.chatRooms[room].push(this);
    this.roomWelcomeMessage(room);
    this.announceMeEntering();
  } else {
    this.writeToClient("Room " + room + " does not exist");
  }
  this.promptClient();
}

//leave a room.
function leave() {
  if (!this.roomname) {
    this.writeToClient("You are not in a chat room.");
  } else {
    this.announceMeLeaving();
    this.removeSelfFromChatroom();
  }
  this.promptClient();
}

//display all available rooms
function rooms() {
  this.writeToClient("Active rooms are:");
  var chatRooms = this.chatRooms;
  for (var room in chatRooms) {
    this.writeToClient("* " + room + "(" + chatRooms[room].length + ")");
  }
  this.promptClient();
}

//create a room.
function open(newRoom) {
  if (!this.chatRooms.hasOwnProperty(newRoom)) {
    this.chatRooms[newRoom] = [];
    this.writeToClient('opened new room '+ newRoom);
    this.roomMasters[newRoom] = this.username; //mark that I created this room.
  } else {
    this.writeToClient(newRoom + " already exists!");
  }
  this.promptClient();
}

//closes a room. Force-leaves everyone in the room beforehand.
function close(room) {
  if (!this.chatRooms.hasOwnProperty(room)) {
    this.writeToClient("no room named " + room);
  } else if (this.roomMasters[room] === this.username) {
    this.messageChatroom("Deleting this room so I am kicking y'all out!", room);
    this.chatRooms[room].forEach(function(c) {
      leave.call(c);
    });
    delete this.chatRooms[room];
    delete this.roomMasters[room];
    this.writeToClient('deleted room ' + room);
  } else {
    this.writeToClient("You are not the opener of room: " + room);
  }
  this.promptClient();
}

//send a private message to a person.
function whisper(user, message) {
  this.whisperTo(user, message);
}

//disconnect from server.
function quit() {
  if (this.roomname) {
    leave.call(this);
  }
  this.writeToClient('BYE');
  this.client.end();
}

function help() {
  this.writeToClient('-----------Commands:----------');
  this.writeToClient('/rooms : display all open rooms');
  this.writeToClient('/join <room> : join an open room');
  this.writeToClient('/leave : leave current room');
  this.writeToClient('/open <room> :  open up a new room');
  this.writeToClient('/close <room>: close a room that you opened');
  this.writeToClient('/whisper <user> "your message here": send a private message to a user');
  this.writeToClient('/quit : disconnect from chat server');
  this.writeToClient('/help : display all available commands');
  this.writeToClient('-----------------------------');
}
module.exports = {
  '/join': join,
  '/leave': leave,
  '/rooms': rooms,
  '/open': open,
  '/close' : close,
  '/whisper': whisper,
  '/quit': quit,
  '/help': help,
};

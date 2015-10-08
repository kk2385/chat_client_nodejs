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
function create(newRoom) {
  if (!this.chatRooms.hasOwnProperty(newRoom)) {
    this.chatRooms[newRoom] = [];
    this.writeToClient('created new room', newRoom);
  } else {
    this.writeToClient(newRoom, "already exists!");
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

module.exports = {
  '/join': join,
  '/leave': leave,
  '/rooms': rooms,
  '/create': create,
  '/whisper': whisper,
  '/quit': quit
};

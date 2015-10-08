//all the viable commands.
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

function leave() {
  if (!this.roomname) {
    this.writeToClient("You are not in a chat room.");
  } else {
    this.announceMeLeaving();
    this.removeSelfFromChatroom();
  }
  this.promptClient();
}

function rooms() {
  this.writeToClient("Active rooms are:");
  var chatRooms = this.chatRooms;
  for (var room in chatRooms) {
    this.writeToClient("* " + room + "(" + chatRooms[room].length +")");
  }
  this.promptClient();
}

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
  '/quit' : quit
};

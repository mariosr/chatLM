module.exports = function(io) {

/*
  O username e id nao irao do socket, vc pegara eles no php com jQuery
  e ira usá-los como identificadores no server socket
*/

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;
// rooms which are currently available in chat
var rooms = ['room1','room2','room3'];

io.sockets.on('connection', function (socket) {

var addedUser = false;
var session = socket.handshake.session;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {

    // we tell the client to execute 'new message'
    socket.broadcast.to(socket.room).emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this lis tens and executes
  socket.on('add user', function (username) {

    // send client to room 1
    socket.join('room1');
   
    // store the room name in the socket session for this client
    socket.room = 'room1';

    // we store the username in the socket session for this client
    socket.username = username;

    // add the client's username to the global list
    usernames[socket.id] = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });

    // echo globally (all clients) that a person has connected
    socket.broadcast.to('room1').emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });

    socket.emit('updaterooms', rooms, 'room1');


    var usernamesAux =  [].concat(usernames || []);
    console.log(usernamesAux)

    socket.broadcast.emit('updateusers', usernames);

  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.to(socket.room).emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.to(socket.room).emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list

    if (addedUser) {
      delete usernames[socket.id];
      --numUsers;

      // update list of users in chat, client-side
      socket.broadcast.emit('updateusers', usernames);

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });

      //eliminando usuario do room respectivo
      socket.leave(socket.room);

    }
  });

  //FUNCOES DE ROOM
  socket.on('switchRoom', function(newroom){

    // leave the current room (stored in session)
    socket.leave(socket.room);

    // join new room, received as function parameter
    socket.join(newroom);

    // sent message to OLD room
    socket.broadcast.to(socket.room).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });

    // update socket session room title
    socket.room = newroom;
    socket.broadcast.to(newroom).emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });

    socket.emit('updaterooms', rooms, newroom);
  });

});

};


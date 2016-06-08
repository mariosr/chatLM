module.exports = function(io) {

/*
  O username e id nao irao do socket, vc pegara eles no php com jQuery
  e ira usá-los como identificadores no server socket
*/

// usernames which are currently connected to the chat
var usernames = {};
var numUserPerRoom = {};
var numUsersTotal = 0;
// rooms which are currently available in chat
var rooms = ['room1','room2','room3'];

//incializando as salas com numeros de usuario = 0
for (var i = rooms.length - 1; i >= 0; i--) {
  var roomName = rooms[i];
  numUserPerRoom[roomName] = 0;
};

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

    numUserPerRoom[socket.room] =  numUserPerRoom[socket.room] + 1;

    // add the client's username to the global list
    usernames[socket.id] = username;
    ++numUsersTotal;
    addedUser = true;
    socket.emit('login', {
      numUsersTotal: numUsersTotal
    });

    // echo globally (all clients) that a person has connected
    socket.broadcast.to('room1').emit('user joined', {
      username: socket.username,
      numUsersTotal: numUsersTotal
    });

    socket.emit('updaterooms', rooms, 'room1');

    //var usernamesAux = JSON.parse(JSON.stringify(usernames));
    //io.sockets.emit envia mensagem pra todo mundo, inclusive pro SENDER

    io.sockets.emit('updateusers', usernames);

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
      --numUsersTotal;
      numUserPerRoom[socket.room] = numUserPerRoom[socket.room] - 1;

      // update list of users in chat, client-side
      io.sockets.emit('updateusers', usernames);

      // echo globally that this client has left
      socket.broadcast.to(socket.room).emit('user left', {
        username: socket.username,
        numUsersTotal: numUserPerRoom[socket.room]
      });

      //eliminando usuario do room respectivo
      socket.leave(socket.room);
    }
  });

  //FUNCOES DE ROOM
  socket.on('switchRoom', function(newroom){

    // leave the current room (stored in session)
    socket.leave(socket.room);

    //atualizando quantidade de usuarios sala antiga
    numUserPerRoom[socket.room] = numUserPerRoom[socket.room] - 1;

    //atualizando quantidade de usuarios sala nova
    numUserPerRoom[newroom] = numUserPerRoom[newroom] + 1;

    // join new room, received as function parameter
    socket.join(newroom);

    // sent message to OLD room
    socket.broadcast.to(socket.room).emit('user left', {
        username: socket.username,
        numUsersTotal: numUserPerRoom[socket.room]
      });

    // update socket session room title
    socket.room = newroom;
    socket.broadcast.to(newroom).emit('user joined', {
      username: socket.username,
      numUsersTotal: numUserPerRoom[newroom]
    });

    socket.emit('updaterooms', rooms, newroom);
  });

  //FUNCOES DE USER
  socket.on('switchUser', function(id){

    console.log('recebendo id' +id)

      if(socket.room != undefined || socket.room != ''){
        // leave the current room (stored in session)
        socket.leave(socket.room);
        //atualizando quantidade de usuarios sala antiga
        numUserPerRoom[socket.room] = numUserPerRoom[socket.room] - 1;               
        // sent message to OLD room
        socket.broadcast.to(socket.room).emit('user left', {
          username: socket.username,
          numUsersTotal: numUserPerRoom[socket.room]
        });
        
        // update socket session room title
        socket.room = '';
      }
  
      socket.to(id).emit('new message', {
        username: socket.username,
        message: "mensagem privada"
      });
   
  });


});

};


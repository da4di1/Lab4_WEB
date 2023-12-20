// Setting up and configuring express server
const express = require('express'); // Importing Express.js
const app = express(); // Creating an Express application
const path = require('path'); // Importing path module
const server = require('http').createServer(app); // Creating an HTTP server using Express app
const io = require('socket.io')(server); // Integrating Socket.IO with the server
const port = process.env.PORT || 8080; // Setting the port number

// Starting the server and listening on the defined port
server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Serving static files from the 'app' directory
app.use(express.static(path.join(__dirname, '../app')));

// Handling chatroom server events

let numOfUsers = 0; // Variable to track the number of users in the chatroom

// Handling socket connections
io.on('connection', (socket) => {
  let isUserAdded = false; // Variable to track if a user has been added

  // Handling 'new message' event when a user sends a message
  socket.on('new message', (data) => {
    // Broadcasting the new message to all connected clients except the sender
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data,
    });
  });

  // Handling 'add user' event when a new user joins the chat
  socket.on('add user', (username) => {
    if (isUserAdded) return; // If the user is already added, return

    socket.username = username; // Assigning a username to the socket
    ++numOfUsers; // Incrementing the number of users
    isUserAdded = true; // Marking the user as added

    // Emitting 'login' event to the client with the number of users
    socket.emit('login', {
      numOfUsers: numOfUsers,
    });

    // Broadcasting 'user joined' event to all clients with user information
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numOfUsers: numOfUsers,
    });
  });

  // Handling 'disconnect' event when a user leaves the chat
  socket.on('disconnect', () => {
    if (isUserAdded) {
      --numOfUsers; // Decreasing the number of users upon disconnection

      // Broadcasting 'user left' event to all clients with user information
      socket.broadcast.emit('user left', {
        username: socket.username,
        numOfUsers: numOfUsers,
      });
    }
  });
});
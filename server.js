const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create an express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with the HTTP server
const io = socketIo(server);


// Store the state of pieces and player instantiation counts
let pieces = [];
let playerInstantiations = {};  // Track pieces instantiated by each player

// Serve static files (the client-side code like HTML, JS, CSS, etc.)
app.use(express.static('public'));

// Listen for new WebSocket connections
io.on('connection', (socket) => {
  console.log('A new user connected:', socket.id);

  // Handle events for instantiating and updating pieces
socket.on('instantiatePiece', (pieceData) => {
  if (!playerInstantiations[socket.id]) {
    playerInstantiations[socket.id] = 0;
  }

  if (playerInstantiations[socket.id] < 7) {
    // Player can instantiate a new piece
    pieces.push(pieceData);
    playerInstantiations[socket.id]++;

    // Broadcast the new piece to all players
    io.emit('newPiece', pieceData);
  } else {
    // Player has hit the limit for instantiating pieces
    socket.emit('limitReached');
  }
});


  socket.on('updatePiece', (updatedPieceData) => {
    console.log('Piece updated:', updatedPieceData);
    io.emit('pieceUpdated', updatedPieceData); // Broadcast the updated piece to all connected clients
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start the server on the specified port
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store the state of pieces and player instantiation counts
let pieces = [];
let playerInstantiations = {};  // Track pieces instantiated by each player

// Serve static files (e.g., HTML, CSS, JS)
app.use(express.static('public'));

// Listen for new WebSocket connections
io.on('connection', (socket) => {
  console.log('A new user connected:', socket.id);

  // Initialize the player's instantiation count to 0
  playerInstantiations[socket.id] = 0;

  // Send the current state of pieces to the new player
  socket.emit('initialize', pieces);

  // Handle a player instantiating a new piece
  socket.on('instantiatePiece', (pieceData) => {
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

  // Handle movement or rotation of pieces
  socket.on('updatePiece', (updatedPieceData) => {
    // Update the piece's state in the server
    const index = pieces.findIndex(piece => piece.id === updatedPieceData.id);
    if (index !== -1) {
      pieces[index] = updatedPieceData;

      // Broadcast the updated piece to all players
      io.emit('pieceUpdated', updatedPieceData);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    delete playerInstantiations[socket.id];  // Remove the player from instantiation tracking
  });
});

// Start the server on the specified port
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


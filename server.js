const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store the state of pieces and player instantiation count
let pieces = [];
let playerInstantiations = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send the current state of pieces to the new player
  socket.emit('initialize', pieces);

  // Handle a player instantiating a new piece
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
  });
});

// Serve the app
server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

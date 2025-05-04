const express   = require('express');
const http      = require('http');
const socketIo  = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server);

let pieces               = [];
let playerInstantiations = {};
let currentModelIndex    = 0;

// serve your client app
app.use(express.static('public'));

io.on('connection', socket => {
  console.log('User connected:', socket.id);
  playerInstantiations[socket.id] = 0;
  // send everyone’s current board
  socket.emit('initialize', pieces);

  socket.on('pieceAction', ({ type, piece, data }) => {
    // ─────────── ADD ───────────
    if (type === 'add') {
      // limit to 7 per player
      if (playerInstantiations[socket.id] >= 7) {
        return socket.emit('limitReached');
      }

      // build the authoritative piece
      const newPiece = {
        id:         piece.id,
        modelIndex: currentModelIndex,    // 0–6 cycling
        color:      piece.color,
        position:   data.position,
        rotation:   data.rotation
      };

      // save it
      pieces.push(newPiece);
      playerInstantiations[socket.id]++;

      // cycle 0–6
      currentModelIndex = (currentModelIndex + 1) % 7;

      // broadcast it back as "newPiece"
      io.emit('newPiece', newPiece);
    }

    // ───────── MOVE / ROTATE ─────────
    else if (type === 'move' || type === 'rotate') {
      const idx = pieces.findIndex(p => p.id === piece.id);
      if (idx !== -1) {
        // merge in just the fields you sent
        pieces[idx] = {
          ...pieces[idx],
          ...data
        };
        io.emit('pieceUpdated', pieces[idx]);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete playerInstantiations[socket.id];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Listening on ${PORT}`));



require('dotenv').config();
const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const { Schema, model } = mongoose;

// Persistent piece state
const pieceSchema = new Schema({
  _id:         String,   // use your piece.id as the document _id
  modelIndex:  Number,
  color:       String,
  position:   { x:Number, y:Number, z:Number },
  rotation:   { x:Number, y:Number, z:Number },
  lastModifiedBy: String,
  ts:          Date
});

const Piece = model('Piece', pieceSchema);

// Optional: log every add/move/rotate
const actionSchema = new Schema({
  pieceId: String,
  type:    String,
  data:    Schema.Types.Mixed,
  userId:  String,
  ts:      Date
});

const Action = model('Action', actionSchema);

const express   = require('express');
const http      = require('http');
const socketIo  = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server);

// same colors your client uses
const rainbowColors = [
  "#D4A29C",
  "#E8B298",
  "#FDE8B3",
  "#BDE1B3",
  "#B0E1E3",
  "#97ADF6",
  "#C6A0D4",
];
// seed the seven template pieces
let pieces = rainbowColors.map((color, idx) => ({
  id:         `template-${idx}`,   // stable id
  modelIndex: idx,                 // which glb to load
  color,                           // client will recolor it
  position:   { x: 0, y: 0, z: 0 }, // no shift: use baked‑in verts
  rotation:   { x: 0, y: 0, z: 0 }
}));
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



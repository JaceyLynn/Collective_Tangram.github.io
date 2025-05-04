// server.js
require("dotenv").config(); // ← 1) Load your .env secret
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 2) Mongoose schemas & models
const { Schema, model } = mongoose;

const pieceSchema = new Schema({
  _id: String,
  modelIndex: Number,
  color: String,
  position: { x: Number, y: Number, z: Number },
  rotation: { x: Number, y: Number, z: Number },
  lastModifiedBy: String,
  ts: Date,
});
const Piece = model("Piece", pieceSchema);

const actionSchema = new Schema({
  pieceId: String,
  type: String,
  data: Schema.Types.Mixed,
  userId: String,
  ts: Date,
});
const Action = model("Action", actionSchema);

// 3) App‐level state & config
let pieces = []; // in‑memory copy
let playerInstantiations = {};
let currentModelIndex = 0;
const rainbowColors = [
  "#D4A29C",
  "#E8B298",
  "#FDE8B3",
  "#BDE1B3",
  "#B0E1E3",
  "#97ADF6",
  "#C6A0D4",
];

// 4) Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 5) Once DB is ready, load (and seed if empty), then start the server
mongoose.connection.once("open", async () => {
  // load existing pieces
  pieces = await Piece.find().lean();

  // seed templates if DB was empty
  if (pieces.length === 0) {
    const templates = rainbowColors.map((color, idx) => ({
      _id: `template-${idx}`,
      modelIndex: idx,
      color,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      lastModifiedBy: "system",
      ts: new Date(),
    }));
    await Piece.insertMany(templates);
    pieces = templates;
  }

  // 6) Serve your static client files
  app.use(express.static("public"));

  // 7) Socket.io logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    playerInstantiations[socket.id] = 0;

    // send the full board
    socket.emit("initialize", pieces);

    socket.on("pieceAction", async ({ type, piece, data, userId, ts }) => {
      if (type === "add") {
        if (playerInstantiations[socket.id] >= 7) {
          return socket.emit("limitReached");
        }
        const newPiece = {
          id: piece.id,
          modelIndex: currentModelIndex,
          color: piece.color,
          position: data.position,
          rotation: data.rotation,
          lastModifiedBy: userId,
          ts,
        };
        pieces.push(newPiece);
        playerInstantiations[socket.id]++;
        currentModelIndex = (currentModelIndex + 1) % rainbowColors.length;
        io.emit("newPiece", newPiece);

        // persist & log
        await Piece.findByIdAndUpdate(
          newPiece.id,
          { $set: newPiece },
          { upsert: true }
        );
        await Action.create({ pieceId: newPiece.id, type, data, userId, ts });
      } else if (type === "move" || type === "rotate") {
        const idx = pieces.findIndex((p) => p.id === piece.id);
        if (idx === -1) return;
        pieces[idx] = {
          ...pieces[idx],
          ...data,
          lastModifiedBy: userId,
          ts,
        };
        io.emit("pieceUpdated", pieces[idx]);
        await Piece.findByIdAndUpdate(
          piece.id,
          { $set: { ...data, lastModifiedBy: userId, ts } },
          { upsert: true }
        );
        await Action.create({ pieceId: piece.id, type, data, userId, ts });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      delete playerInstantiations[socket.id];
    });
  });

  // 8) And finally, start listening
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Listening on ${PORT}`));
});

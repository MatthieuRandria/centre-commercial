const mongoose = require("mongoose");
require('dotenv').config();

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const db = await mongoose.connect(process.env.DB_URI);
  isConnected = db.connections[0].readyState;
  console.log("MongoDB connecté");
}

module.exports = connectDB;
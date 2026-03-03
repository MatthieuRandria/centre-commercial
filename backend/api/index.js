const app = require("../src/app");
const connectDB = require("../src/config/database");

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Database connection failed:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
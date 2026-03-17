const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Bharat Money Manager API is running."));

// Export the Express app
module.exports = app;

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bycrypt = require("bcrypt");
const cors = require("cors");
const express = require("express");

const SALT_ROUNDS = 14;
const PORT = 3000;

const app = express();
app.use(express.json());
app.use(cors());

// Endpoints for login and authentication.

/***
 * Checks to see if credentials are unique before signup.
 */
app.post("/unique/:credential", async (req, res) => {
  const credential = req.params.credential;
  const userInput = req.body[credential];
  const databaseInfo = await prisma.user.findUnique({
    where: {
      [credential]: userInput,
    },
  });

  if (databaseInfo === null) {
    // Return OK if unique.
    res.status(200).json();
  } else {
    res.status(409).json();
  }
});

/***
 * Sign up for a user.
 */
app.post("/create", async (req, res) => {
  res.send().json();
});

/***
 * Attempts to log in using the provided credentials.
 * Returns 200 for successful log in attempt and a 401 otherwise.
 */
app.post("/login", async (req, res) => {
  res.send().json();
});

app.listen(PORT, () => {
  console.log("Server is running.");
});

const cors = require("cors");
const express = require("express");
const expressValidator = require("express-validator");

const PORT = 3000;

const app = express();
app.use(express.json());
app.use(cors());

const auth = require("./auth")(app);

app.listen(PORT, () => {
  console.log("Server is running.");
});

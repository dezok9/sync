const { PrismaClient } = require("@prisma/client");
const { Octokit, App } = require("@octokit/rest");

const prisma = new PrismaClient();
const cors = require("cors");
const express = require("express");
const expressValidator = require("express-validator");

const PORT = 3000;

const app = express();
app.use(express.json());
app.use(cors());

// Variables used by other endpoint functions.
let connectionsGraph = {};
let postGraphPoints = {};
let allTags = {}; // All tags and their count, where keys are the tag values and the values are the number of posts using that tags.

// Util files.
const { createGraph } = require("./util/connectionsUtil");

// Graph creation and running server.
createGraph()
  .then((graph) => (connectionsGraph = graph))
  .then(() => {
    // Endpoint files.
    const auth = require("./auth")(app, connectionsGraph);
    const github = require("./github")(app);
    const featuredProjects = require("./featuredProjects")(app);
    const user = require("./user")(app);
    const connections = require("./connections")(app, connectionsGraph);
    const interactions = require("./interactions")(app);
    const posts = require("./posts")(
      app,
      connectionsGraph,
      postGraphPoints,
      allTags
    );

    app.listen(PORT, () => {});
  });

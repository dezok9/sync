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

// Unviersal functions and variables used by other endpoint files.

// Connections graph.
let connectionsGraph = {};

/***
 * Function for creating an octokit instance after retrieving the accessToken for a user.
 */
async function createOctokit(githubHandle) {
  const user = await prisma.user.findUnique({
    where: { githubHandle: githubHandle },
  });

  const octokit = new Octokit({ auth: user.githubAccessToken });

  return octokit;
}

const auth = require("./auth")(app, createOctokit, connectionsGraph);
const github = require("./github")(app, createOctokit);
const featuredProjects = require("./featuredProjects")(app);
const connections = require("./connections")(
  app,
  createOctokit,
  connectionsGraph
);
const posts = require("./posts")(app, connectionsGraph);

app.listen(PORT, () => {});

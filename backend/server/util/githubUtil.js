const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cors = require("cors");
const express = require("express");

const { Octokit, App } = require("@octokit/rest");

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

module.exports = { createOctokit };

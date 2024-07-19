// Uses of the GitHub REST API performed in the backend to utilize octokit instance.

module.exports = function (app) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const cors = require("cors");
  const express = require("express");

  const { createOctokit } = require("./util/githubUtil");

  /***
   * Gets all of the GitHub repositories of some user given their GitHub handle.
   */
  app.get("/get-repos/:githubHandle", async (req, res) => {
    const githubHandle = req.params.githubHandle;

    const octokit = await createOctokit(githubHandle);

    const repositories = await octokit.request("GET /users/{owner}/repos", {
      owner: githubHandle,
    });

    res.status(200).json(repositories.data);
  });

  /***
   * Gets all of the deployments of a specific repository given the user's GitHub handle and the name of the repository.
   */
  app.get(
    "/all-deployments/:githubHandle/:repositoryName",
    async (req, res) => {
      const githubHandle = req.params.githubHandle;
      const repositoryName = req.params.repositoryName;

      const octokit = await createOctokit(githubHandle);

      const deployments = await octokit.request(
        "GET /repos/{owner}/{repo}/deployments",
        {
          owner: githubHandle,
          repo: repositoryName,
          headers: { "X-GitHub-Api-Version": "2022-11-28" },
        }
      );

      res.status(200).json(deployments);
    }
  );
};

// Endpoints for retrieval of user data.
// Exported to server.js.

module.exports = function (app) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const cors = require("cors");
  const express = require("express");

  /***
   * Stores a GitHub repository name for a featured project.
   * The repository name can then be used to retrieve all deployments for that repository.
   */
  app.put("/create/:userID/featured-project", async (req, res) => {
    const userID = req.params.userID;
    const { repositoryName } = req.body;

    await prisma.user.update({
      where: { id: userID },
      data: {
        featuredProjects: {
          push: repositoryName,
        },
      },
    });

    return res.status(200).json();
  });
};

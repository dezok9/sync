module.exports = function (app, connectionsGraph) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const cors = require("cors");
  const express = require("express");

  /***
   * Updates a user's profile picture.
   */
  app.put("/profile/picture/:userID", async (req, res) => {
    const { profilePicture } = req.body;
    const userID = req.params.userID;

    await prisma.user.update({
      where: { id: Number(userID) },
      data: { profilePicture: profilePicture },
    });

    res.status(200).json();
  });
};

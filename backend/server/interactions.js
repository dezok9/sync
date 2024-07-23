module.exports = async function (app) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const cors = require("cors");
  const express = require("express");

  /***
   * Get the interaction instances of a user given their userID.
   */
  app.get("/get-interactions/:userID", async (req, res) => {
    const userID = req.params.userID;

    const interactions = await prisma.interaction.findMany({
      where: {
        interactingUserID: Number(userID),
      },
    });

    res.status(200).json(interactions);
  });
};

module.exports = async function (app) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const cors = require("cors");
  const express = require("express");

  /***
   * Get the interaction instances of a user given their userID.
   */
  app.get("/interaction/:userID", async (req, res) => {
    const userID = req.params.userID;

    const interactions = await prisma.interaction.findMany({
      where: {
        interactingUserID: Number(userID),
      },
    });

    res.status(200).json(interactions);
  });

  /***
   * Creates an interaction instance.
   */
  app.post("/interaction", async (req, res) => {
    const {
      interactionDuration,
      date,
      timestamp,
      viewedProfile,
      viewedPost,
      postID,
      interactingUserID,
      targetUserID,
    } = req.body;

    await prisma.interaction.create({
      data: {
        interactionDuration: interactionDuration,
        date: date,
        timestamp: timestamp,
        viewedProfile: viewedProfile,
        viewedPost: viewedPost,
        postID: postID,
        interactingUserID: interactingUserID,
        targetUserID: targetUserID,
      },
    });

    res.status(200).json();
  });
};

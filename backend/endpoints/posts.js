// Endpoints for retrieval of user data.
// Exported to server.js.

module.exports = function (app) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const cors = require("cors");
  const express = require("express");
  const expressValidator = require("express-validator");

  // Determines how many posts should be loaded initailly to feed.
  const FEED_LOAD_POSTS = 20;

  /***
   * Gets the user data from the database.
   * If not found, returns a status of 404.
   */
  app.get("/user/:userHandle", async (req, res) => {
    try {
      const userHandle = req.params.userHandle;

      const user = await prisma.user.findUnique({
        where: { userHandle: userHandle },
      });

      const posts = await prisma.post.findMany({
        where: { authorID: user.id },
      });

      if (user) {
        const userData = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          githubHandle: user.githubHandle,
          email: user.email,
          userHandle: user.userHandle,
          businessAccount: user.businessAccount,
          profilePicture: user.profilePicture,
          featuredProjects: user.featuredProjects,
          posts: posts,
        };

        res.status(200).json(userData);
      }
    } catch (e) {
      res.status(404).json();
    }
  });

  /***
   * Gets the user's posts from the database.
   */
  app.get("/posts/:userID", async (req, res) => {
    const userID = req.params.userID;

    const userPosts = await prisma.post.findMany({
      where: {
        authorID: Number(userID),
      },
    });

    res.status(200).json(userPosts);
  });

  /***
   * Creates a post.
   */
  app.post("/create-post", async (req, res) => {
    const { title, date, timestamp, text, authorID, mediaURLs, tags } =
      req.body;

    await prisma.post.create({
      data: {
        title: title,
        date: date,
        timestamp: timestamp,
        text: text,
        authorID: authorID,
        mediaURLs: mediaURLs,
        tags: tags,
      },
    });

    res.status(200).json();
  });

  /***
   * Gets the all of the accepted connections of the user given the userID.
   */
  app.get("/:userID/connections", async (req, res) => {
    const userID = req.params.userID;

    const connections = await prisma.connection.findMany({
      where: {
        AND: [
          {
            OR: [{ senderID: Number(userID) }, { recipientID: Number(userID) }],
          },
          { accepted: true },
        ],
      },
    });

    res.status(200).json(connections);
  });

  /***
   * Gets feed for the user from the database.
   * Starts by getting the connections and then finding posts from those connections.
   */
  app.get("/:userID/feed", async (req, res) => {
    const userID = req.params.userID;

    const connections = await prisma.connection.findMany({
      where: {
        AND: [
          {
            OR: [{ senderID: Number(userID) }, { recipientID: Number(userID) }],
          },
          { accepted: true },
        ],
      },
    });

    let feedPosts = [];
    let connectionsIdx = 0;

    while (
      feedPosts.length < FEED_LOAD_POSTS &&
      connectionsIdx < connections.length
    ) {
      const connection = connections[connectionsIdx];

      let connectionID = -1;
      // Get the ID of the other user in the connection.
      if (connection.recipientID === userID) {
        connectionID = connection.senderID;
      } else {
        connectionID = connection.recipientID;
      }

      // Get the posts made by that user using the userID.
      const userPosts = await prisma.post.findMany({
        where: { authorID: connectionID },
      });

      // Append the most recent posts of that user to the array.
      connectionsIdx += 1;
    }

    res.status(200).json();
  });
};

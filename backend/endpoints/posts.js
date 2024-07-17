// Endpoints for retrieval of user data.
// Exported to server.js.

module.exports = function (app, connectionsGraph) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const cors = require("cors");
  const express = require("express");
  const expressValidator = require("express-validator");

  // Determines how many posts should be loaded initailly to feed.
  const FEED_LOAD_POSTS = 20;

  // Determines how many posts should be taken from each user.
  const USER_POSTS = 2;

  /***
   * Plots the point values of all posts.
   * Runs once--upon starting the server.
   */
  async function plotPosts() {
    let allPosts = await prisma.post.findMany();

    for (const postIndex in allPosts) {
      const comments = await prisma.comment.findMany({
        where: { postID: allPosts[postIndex].id },
      });

      const resharesCount = await prisma.post.count({
        where: { repostedSourceID: allPosts[postIndex].id },
      });

      const upvoteInfo = await prisma.upvote.findMany({
        where: { userUpvoteID: allPosts[postIndex].id },
      });

      allPosts[postIndex] = {
        ...allPosts[postIndex],
        comments: comments,
        resharesCount: resharesCount,
        upvoteInfo: upvoteInfo,
      };
    }
  }

  plotPosts();

  /***
   * Gets the user data from the database using the userHandle.
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
   * Gets the user's data from the database using the userID.
   */
  app.get("/user/id/:userID", async (req, res) => {
    try {
      const userID = req.params.userID;

      const user = await prisma.user.findUnique({
        where: { id: Number(userID) },
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
      orderBy: {
        id: "desc",
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
   * Gets a post based on postID.
   */
  app.get("/post/:postID", async (req, res) => {
    const postID = req.params.postID;

    let postData = await prisma.post.findUnique({
      where: { id: Number(postID) },
    });

    const comments = await prisma.comment.findMany({
      where: {
        postID: Number(postID),
      },
    });

    postData = { ...postData, comments: comments };

    res.status(200).json(postData);
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

      // Get the ID of the other user in the connection.
      let connectionID = -1;

      if (connection.recipientID === Number(userID)) {
        connectionID = connection.senderID;
      } else {
        connectionID = connection.recipientID;
      }

      // Get the posts made by that user using the userID.
      const userPosts = await prisma.post.findMany({
        where: { authorID: connectionID },
        orderBy: { id: "desc" },
        take: USER_POSTS,
      });

      // Append the most recent posts of that user to the array.
      feedPosts = feedPosts.concat(userPosts);
      connectionsIdx += 1;
    }

    res.status(200).json(feedPosts);
  });

  /***
   * Upvotes or downvotes a post.
   * Ensures and enforces that a user can only upvote a unique post once.
   */
  app.put("/upvote/:postID", async (req, res) => {
    const postID = req.params.postID;
    const { userID, newUpvotes } = req.body;

    const postUserLikes = await prisma.upvote.findMany({
      where: {
        postID: Number(postID),
        userUpvoteID: userID,
      },
    });

    if (postUserLikes.length === 0) {
      // The user has not liked this post before.
      await prisma.post.update({
        where: {
          id: Number(postID),
        },
        data: {
          upvoteCount: newUpvotes,
        },
      });

      await prisma.upvote.create({
        data: {
          postID: Number(postID),
          userUpvoteID: userID,
        },
      });
    } else {
      // The user has liked this post before.
      await prisma.post.update({
        where: {
          id: Number(postID),
        },
        data: {
          upvoteCount: newUpvotes - 2,
        },
      });

      await prisma.upvote.delete({
        where: {
          id: postUserLikes[0].id,
        },
      });
    }

    res.status(200).json();
  });

  /***
   * Creates a comment for a post.
   */
  app.post("/comment", async (req, res) => {
    const { commentText, date, timestamp, parentCommentID, postID, authorID } =
      req.body;

    await prisma.comment.create({
      data: {
        commentText: commentText,
        date: date,
        timestamp: timestamp,
        parentCommentID: parentCommentID,
        postID: Number(postID),
        authorID: Number(authorID),
      },
    });

    res.status(200).json();
  });

  /***
   * Gets post recommendations for a user.
   */
  app.get(
    "/posts/recommendations/:userID/:numberOfRecs",
    async (req, res) => {}
  );
};

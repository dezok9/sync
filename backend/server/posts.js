// Endpoints for retrieval of user data.
// Exported to server.js.

module.exports = async function (
  app,
  connectionsGraph,
  postGraphPoints,
  allTags
) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const cors = require("cors");
  const express = require("express");
  const spawn = require("child_process").spawn;

  const { plotPosts, tallyTags } = require("./util/postsUtil");
  const { intersection } = require("./util/generalUtil");

  const FEED_LOAD_POSTS = 20; // Determines how many posts should be loaded initailly to feed.
  const USER_POSTS = 2; // Determines how many posts should be taken from each user.
  const RECENT_POSTS_FOR_RECS = 50; // The number of recent posts used to calculate recommended posts.
  const TAG_RELATED_PERCENTAGE = 0.8; // The max percentage of recommendations that are related by tag for post recommendations; the rest are on new, adjacent topics.

  // Get counts of all tags.
  allTags = await tallyTags();

  // Gets the calculated points of all posts.
  const plots = await plotPosts(allTags);
  postGraphPoints = JSON.parse(plots.replaceAll("'", '"'));

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

    const userData = await prisma.user.findUnique({
      where: { id: Number(userID) },
    });

    const userPosts = await prisma.post.findMany({
      where: {
        authorID: Number(userID),
      },
      orderBy: {
        id: "desc",
      },
    });

    const userPostsData = userPosts.map((userPost) => ({
      ...userPost,
      authorData: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        userHandle: userData.userHandle,
        profilePicture: userData.profilePicture,
      },
    }));

    res.status(200).json(userPostsData);
  });

  /***
   * Creates a post.
   */
  app.post("/create-post", async (req, res) => {
    const { title, date, tldr, timestamp, text, authorID, mediaURLs, tags } =
      req.body;

    const createdPost = await prisma.post.create({
      data: {
        title: title,
        date: date,
        timestamp: timestamp,
        text: text,
        authorID: authorID,
        mediaURLs: mediaURLs,
        tags: tags.map((tag) => tag.toLowerCase()),
        tldr: tldr,
      },
    });

    for (const tag of tags) {
      if (tag in allTags) {
        allTags = { ...allTags, tag: allTags[tag] + 1 };
      } else {
        allTags = { ...allTags, tag: 1 };
      }
    }

    // Adds a point to the posts graph.
    const plot = await plotPosts(allTags, createdPost.id);
    const jsPlot = JSON.parse(plot.replaceAll("'", '"'));
    postGraphPoints = {
      ...postGraphPoints,
      [createdPost.id]: jsPlot[createdPost.id],
    };

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

    allPostData = { ...postData, comments: comments };

    res.status(200).json(allPostData);
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

    // Used to decide if the user has liked a post.
    const userUpvotes = [];

    const userUpvotesData = await prisma.upvote.findMany({
      where: { userUpvoteID: Number(userID) },
    });

    for (const upvote in userUpvotesData) {
      userUpvotes.push(upvote.userUpvoteID);
    }

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

      // Get the user's information.
      let userData = await prisma.user.findUnique({
        where: { id: connectionID },
      });

      // Get the posts made by that user using the userID.
      let userPosts = await prisma.post.findMany({
        where: { authorID: connectionID },
        orderBy: { id: "desc" },
        take: USER_POSTS,
      });

      // Append the most recent posts of that user to the array.
      feedPosts = feedPosts.concat(
        userPosts.map((userPost) => ({
          ...userPost,
          authenticatedUpvoted: userPost.id in userUpvotes,
          authorData: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            userHandle: userData.userHandle,
            profilePicture: userData.profilePicture,
          },
        }))
      );
      connectionsIdx += 1;
    }

    res.status(200).json(feedPosts);
  });

  /***
   * Upvotes a post.
   * Ensures and enforces that a user can only upvote a unique post once.
   */
  app.put("/upvote/:postID", async (req, res) => {
    const postID = req.params.postID;
    const { userID } = req.body;

    const pastUpvote = await prisma.upvote.findMany({
      where: { userUpvoteID: userID },
    });

    if (pastUpvote.length > 0) {
      res.status(409).json();
      return;
    }

    const upvotedPost = await prisma.post.findUnique({
      where: { id: Number(postID) },
    });

    await prisma.post.update({
      where: {
        id: Number(postID),
      },
      data: {
        upvoteCount: upvotedPost.upvoteCount + 1,
      },
    });

    await prisma.upvote.create({
      data: {
        postID: Number(postID),
        userUpvoteID: userID,
      },
    });
    res.status(200).json();
  });

  /***
   * Downvotes a post.
   */
  app.put("/downvote/:postID", async (req, res) => {
    const postID = req.params.postID;
    const { userID } = req.body;

    const userUpvote = await prisma.upvote.findMany({
      where: AND[({ userUpvoteID: userID }, { postID: Number(postID) })],
    });

    if (!userUpvote.length > 0) {
      res.status(409).json();
      return;
    }

    const upvotedPost = await prisma.post.findUnique({
      where: { id: Number(postID) },
    });

    await prisma.post.update({
      where: {
        id: Number(postID),
      },
      data: {
        upvoteCount: upvotedPost.upvoteCount - 1,
      },
    });

    await prisma.upvote.delete({
      where: {
        where: AND[({ userUpvoteID: userID }, { postID: Number(postID) })],
      },
    });

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
  app.get("/posts/recommendations/:userID/:numberOfRecs", async (req, res) => {
    const userID = req.params.userID;
    const numberOfRecs = req.params.numberOfRecs;

    let userInfo = await prisma.user.findUnique({
      where: { id: Number(userID) },
    });

    if (userInfo) {
      const connections = await prisma.connection.findMany({
        where: {
          AND: [
            {
              OR: [
                { recipientID: Number(userID) },
                { senderID: Number(userID) },
              ],
            },
            { accepted: true },
          ],
        },
      });

      const connectedUsersIDs = [];

      for (const connection of connections) {
        connectedUsersIDs.push(
          connection.recipientID === Number(userID)
            ? connection.senderID
            : connection.recipientID
        );
      }

      const upvotedPosts = await prisma.upvote.findMany({
        where: { userUpvoteID: Number(userID) },
        orderBy: { id: "desc" },
      });

      const recentUpvotedPostsInfo = [];
      const recentUpvotedPostsIDs = [];
      const allInteractedPosts = [];
      const recentTags = [];

      for (const upvotedPost of upvotedPosts) {
        const postInfo = await prisma.post.findUnique({
          where: { id: upvotedPost.postID },
        });

        allInteractedPosts.push(postInfo);

        if (recentUpvotedPostsIDs.length < RECENT_POSTS_FOR_RECS) {
          recentUpvotedPostsInfo.push(postInfo);
          recentUpvotedPostsIDs.push(upvotedPost.id);
          for (const tag of postInfo.tags) {
            if (!tag in recentTags) {
              recentTags.push(tag);
            }
          }
        }
      }

      userInfo = {
        ...userInfo,
        recentUpvotedPostsInfo: recentUpvotedPostsInfo,
        recentUpvotedPostsIDs: recentUpvotedPostsIDs,
        connectedUsersIDs: connectedUsersIDs,
        recentTags: recentTags,
      };

      const pyUserInfo = JSON.stringify(userInfo)
        .replaceAll('"', "'")
        .replaceAll("false", "False")
        .replaceAll("true", "True")
        .replaceAll("null", "None");

      const pyPostGraphPoints = JSON.stringify(postGraphPoints).replaceAll(
        '"',
        "'"
      );
      const pyNumberOfRecs = JSON.stringify(numberOfRecs);

      const getPostRecommendations = spawn("python3", [
        "util/postRecommendations/getRecommendations.py",
        pyUserInfo,
        pyPostGraphPoints,
        pyNumberOfRecs,
      ]);

      let similarPostIDs = []; // Get from Python script

      await new Promise((resolve, reject) => {
        getPostRecommendations.stdout.on("data", (data) => {
          const res = data.toString().replaceAll("'", '"');
          similarPostIDs = JSON.parse(res);
        });
        getPostRecommendations.stderr.on("data", (data) => {});
        getPostRecommendations.on("close", () => {
          resolve();
        });
      });

      let recommendedPostsInfo = [];
      const relatedPostsInfo = []; // Posts that don't exactly fit the user's interests based on tags but are similar in other aspects (i.e. interactions, length, etc.).

      // Gets the most relevant posts first before optionally adding on related posts depending on the number of recommendations requested.
      for (const recommendedPostID of similarPostIDs) {
        if (
          recommendedPostsInfo.length <
          numberOfRecs * TAG_RELATED_PERCENTAGE
        ) {
          let similarPostInfo = await prisma.post.findUnique({
            where: {
              id: recommendedPostID,
            },
          });

          const postAuthor = await prisma.user.findUnique({
            where: { id: similarPostInfo.authorID },
          });

          const userUpvotes = await prisma.upvote.findMany({
            where: { userUpvoteID: Number(userID) },
          });

          similarPostInfo = {
            ...similarPostInfo,
            authenticatedUpvoted: Number(userID) in userUpvotes,
            authorData: {
              firstName: postAuthor.firstName,
              lastName: postAuthor.lastName,
              userHandle: postAuthor.userHandle,
              profilePicture: postAuthor.profilePicture,
            },
          };

          if (
            similarPostInfo.authorID === Number(userID) ||
            similarPostInfo.authorID in userInfo.connectedUsersIDs
          ) {
            continue;
          } else if (
            intersection(similarPostInfo.tags, userInfo.recentTags).length > 0
          ) {
            recommendedPostsInfo.push(similarPostInfo);
          } else {
            relatedPostsInfo.push(similarPostInfo);
          }
        } else {
          break;
        }
      }

      // Add on posts that the user might be interested in.
      recommendedPostsInfo = recommendedPostsInfo.concat(
        relatedPostsInfo.slice(0, numberOfRecs - recommendedPostsInfo.length)
      );

      // Randomizes post order so that recommended feed is a mix of posts related by tag and post related by solely similar characteristics.
      recommendedPostsInfo.sort(() => Math.random() - 0.5);

      res.status(200).json(recommendedPostsInfo);
    } else {
      res.status(404).json();
    }
  });
};

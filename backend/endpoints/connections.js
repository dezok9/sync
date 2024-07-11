// Endpoints and graph for connections.

module.exports = function (app) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const cors = require("cors");
  const express = require("express");

  const SEED_RECENT_CONNECTIONS = 20; // Attempts to optimize time it takes to get connections while getting the most relevant recommendations.

  // Connections graph.
  let connectionsGraph = {};

  /***
   * Produces a score out of 100 giving how similar different two user profiles are, indicating if they should be recommended.
   */
  async function getUserSimilarityScore(userOneID, userTwoID) {
    /***
     * Gets the user data, post data, and upvoted posts of a user.
     */
    async function getUserData(id) {
      const data = await prisma.user.findUnique({ where: { id: id } });
      const posts = await prisma.post.findMany({ where: { authorID: id } });
      const upvotes = await prisma.upvote.findMany({
        where: { userUpvoteID: id },
      });

      const upvotedPosts = [];

      for (upvotesIndex in upvotes) {
        const postData = await prisma.post.findUnique({
          AND: [
            { id: upvotes[upvotesIndex].postID },
            { NOT: { authorID: id } },
          ],
        });
        upvotedPosts.concat(postData);
      }

      let tagFrequencies = {};
      let tagCount = 0;

      for (postsIndex in posts) {
        for (tagIndex in posts[postIndex].tags) {
          const tag = posts[postIndex].tags[tagIndex];
          if (Object.keys(tagFrequencies).includes(tag)) {
            tagFrequencies = {
              ...tagFrequencies,
              tag: tagFrequencies[tag] + 1,
            };
          } else {
            tagFrequencies = { ...tagFrequencies, tag: 1 };
          }
          tagCount += 1;
        }
      }

      for (const [tag, frequency] of Object.entries(tagFrequencies)) {
        tagFrequencies = { ...tagFrequencies, tag: frequency / tagCount };
      }

      const allUserData = {
        ...data,
        posts: posts,
        upvotedPosts: upvotedPosts,
        tagFrequencies: tagFrequencies,
      };

      return allUserData;
    }

    const userOneData = await getUserData(userOneID);
    const userTwoData = await getUserData(userTwoID);

    const recommendationScore = 0; // A score out of 100 where 0 is not recommended and 100 is highly recommended.

    // Evaluate the connection between the userOne and userTwo;

    return recommendationScore;
  }

  // Endpoints.

  /***
   * Creates the graph.
   * Called upon starting the server.
   */
  app.post("/create-graph", async (req, res) => {
    // Gets all users.

    const users = await prisma.user.findMany();

    // Creates graph by iterating through all users.
    for (user in users) {
      // Gets the connections for the specified user.
      const connections = await prisma.connection.findMany({
        where: {
          AND: [
            { accepted: true },
            {
              OR: [
                { senderID: Number(userID) },
                { recipientID: Number(userID) },
              ],
            },
          ],
        },
      });

      // Builds an array of the user's connections' IDs.
      const connectionsArray = [];

      for (index in connections) {
        const connectedUserID =
          connections[index]["senderID"] === Number(userID)
            ? connections[index]["recipientID"]
            : connections[index]["senderID"];

        connectionsArray.push(connectedUserID);
      }

      // Updates connections graph.
      connectionsGraph[userID] = connectionsArray;
    }
  });

  /***
   * Gets a connection.
   */
  app.get("/connection/:userID/:connectionID", async (req, res) => {
    const userID = req.params.userID;
    const connectionID = req.params.connectionID;

    const connection = await prisma.connection.findMany({
      where: {
        OR: [
          {
            AND: [
              { recipientID: Number(userID) },
              { senderID: Number(connectionID) },
            ],
          },
          {
            AND: [
              { recipientID: Number(connectionID) },
              { senderID: Number(userID) },
            ],
          },
        ],
      },
    });

    res.status(200).json(connection);
  });

  /***
   * Gets all  of a user's connections' data given a userID.
   */
  app.get("/connections/:userID", async (req, res) => {
    const userID = req.params.userID;

    const connections = await prisma.connection.findMany({
      where: {
        AND: {
          OR: [{ senderID: Number(userID) }, { recipientID: Number(userID) }],
          accepted: true,
        },
      },
    });

    const userConnectionsData = [];

    for (index in connections) {
      const connectedUserID =
        connections[index]["senderID"] === Number(userID)
          ? connections[index]["recipientID"]
          : connections[index]["senderID"];

      const allUserData = await prisma.user.findUnique({
        where: {
          id: connectedUserID,
        },
      });

      const userData = {
        id: allUserData.id,
        email: allUserData.email,
        firstName: allUserData.firstName,
        lastName: allUserData.lastName,
        profilePicture: allUserData.profilePicture,
        userHandle: allUserData.userHandle,
      };

      userConnectionsData.push(userData);
    }

    res.status(200).json(userConnectionsData);
  });

  /***
   * Updates the connections graph and database for the specified user.
   * Called when a connection with the specified user is accepted.
   */
  app.put("/connection/:userID/:connectionID", async (req, res) => {
    const userID = req.params.userID;
    const connectionID = req.params.connectionID;

    const connection = await prisma.connection.findMany({
      where: {
        AND: [
          { senderID: Number(connectionID) },
          { recipientID: Number(userID) },
        ],
      },
    });

    await prisma.connection.update({
      where: {
        id: connection[0].id,
      },
      data: {
        accepted: true,
      },
    });

    // Add connection to graph.

    res.status(200).json();
  });

  /***
   * Adds a pending connection to the database.
   * Called when a connection with a user requests a connection with another user.
   */
  app.post("/connection/:userID/:connectionID", async (req, res) => {
    const userID = req.params.userID;
    const connectionID = req.params.connectionID;

    await prisma.connection.create({
      data: {
        accepted: false,
        senderID: Number(userID),
        recipientID: Number(connectionID),
      },
    });

    res.status(200).json();
  });

  /***
   * Updates the connections graph and database for the specified user.
   * Called when a connection with the specified user is removed.
   */
  app.delete("/connection/:userID/:connectionID", async (req, res) => {
    const userID = req.params.userID;
    const connectionID = req.params.connectionID;

    await prisma.connection.deleteMany({
      where: {
        OR: [
          {
            AND: [
              { recipientID: Number(userID) },
              { senderID: Number(connectionID) },
            ],
          },
          {
            AND: [
              { recipientID: Number(connectionID) },
              { senderID: Number(userID) },
            ],
          },
        ],
      },
    });

    // Remove connection from graph.

    res.status(200).json();
  });

  /***
   * Retrieves the pending requests of some user.
   */
  app.get("/pending/:userID", async (req, res) => {
    const userID = req.params.userID;

    const connections = await prisma.connection.findMany({
      where: {
        AND: {
          OR: [{ senderID: Number(userID) }, { recipientID: Number(userID) }],
          accepted: false,
        },
      },
    });

    const userPendingConnectionsData = [];

    for (index in connections) {
      const connectedUserID =
        connections[index]["senderID"] === Number(userID)
          ? connections[index]["recipientID"]
          : connections[index]["senderID"];

      const allUserData = await prisma.user.findUnique({
        where: {
          id: connectedUserID,
        },
      });

      const userData = {
        id: allUserData.id,
        email: allUserData.email,
        firstName: allUserData.firstName,
        lastName: allUserData.lastName,
        profilePicture: allUserData.profilePicture,
        userHandle: allUserData.userHandle,
      };

      userPendingConnectionsData.push(userData);
    }

    res.status(200).json(userPendingConnectionsData);
  });

  /***
   * Gets a specified number of recommendations for a specified user.
   */
  app.get(
    "/connections/recommendations/:userID/:numberOfRecs",
    async (req, res) => {
      const userID = req.params.userID;
      const numberOfRecs = req.params.numberOfRecs;

      // Gets the user's data.
      const userData = await prisma.user.findUnique({
        where: { id: Number(userID) },
      });

      // Gets the connections of a user in order (most recent first; i.e. by ID of connection).
      const connections = await prisma.connection.findMany({
        where: {
          OR: [{ recipientID: Number(userID) }, { senderID: Number(userID) }],
        },
        orderBy: { id: "desc" },
      });

      // Builds an array of the user's connections' IDs.
      const userConnectionsIDs = [];

      for (index in connections) {
        const connectedUser =
          connections[index]["senderID"] === Number(userID)
            ? connections[index]["recipientID"]
            : connections[index]["senderID"];

        userConnectionsIDs.push(connectedUser);
      }

      const recommendations = [];

      // Gets "weighted" recommendations based on how many connections the user and their connections have in common.
      // The first n (numberOfRecs) are then returned.
      // More connections are looked through if enough recommendations have not been generated and the user still has connections to use to generate related connections.
      const weightedRecommendations = {};

      let connectionsPoolSize =
        SEED_RECENT_CONNECTIONS <= userConnectionsIDs.length
          ? SEED_RECENT_CONNECTIONS
          : userConnectionsIDs.length; // Determines how many recent connections we will be using for generating recommendations at any given time. Either the seed, or, if less than the seed, the length of the recommendations.
      let count = 0; // Counts how many of the connections have been gone through.

      while (recommendations < numberOfRecs) {
        // Retrieves the sorted connections of the user's connection (refered to as adjacent connections).
        const adjacentConnections = await prisma.connection.findMany({
          where: {
            AND: [
              {
                OR: [
                  { recipientID: Number(userConnectionsIDs[count]) },
                  { senderID: Number(userConnectionsIDs[count]) },
                ],
              },
              {
                NOT: [
                  {
                    OR: [
                      { recipientID: Number(userID) },
                      { senderID: Number(userID) },
                    ],
                  },
                ],
              },
              { accepted: true },
            ],
          },
          orderBy: { id: "desc" },
        });

        for (adjacentConnectionIdx in adjacentConnections) {
          // Checks if adjacent connection is already connected with user.

          const adjacentConnectionUserID =
            adjacentConnections[adjacentConnectionIdx].senderID ===
            Number(userID)
              ? adjacentConnections[adjacentConnectionIdx].recipientID
              : adjacentConnections[adjacentConnectionIdx].senderID;

          const connected = await prisma.connection.findMany({
            where: {
              OR: [
                {
                  AND: [
                    { recipientID: Number(userID) },
                    {
                      senderID: adjacentConnectionUserID,
                    },
                  ],
                },
                {
                  AND: [
                    {
                      recipientID: adjacentConnectionUserID,
                    },
                    { senderID: Number(userID) },
                  ],
                },
              ],
            },
          });

          // Calculates weights for recommendations if user is not connected with adjacent connection and has not requested a connection with that user.
          if (connected.length === 0) {
            const connectedUserRecommendationScore = getUserSimilarityScore(
              Number(userID),
              Number(userConnectionsIDs[count])
            );

            const adjacentUserRecommendationScore = getUserSimilarityScore(
              Number(userID),
              adjacentConnectionUserID
            );
          }
        }

        count += 1;

        // Widens the pool of recent connections to look through if algorithm hasn't yet found enough recommendations and there are more recommendations to look through.
        if (count < connectionsPoolSize) {
          continue;
        } else if (
          count < userConnectionsIDs.length &&
          count >= connectionsPoolSize &&
          recommendatioins.length < numberOfRecs
        ) {
          connectionsPoolSize =
            connectionsPoolSize * 2 <= userConnectionsIDs.length
              ? connectionsPoolSize * 2
              : userConnectionsIDs.length; // Doubles the number of recent connections we want to look through if this is less than the number of recommendations.
        } else {
          break;
        }
      }

      // Gets the most adjacent connections seen most frequently using the weighted connections values.

      res.status(200).json(recommendations);
    }
  );
};

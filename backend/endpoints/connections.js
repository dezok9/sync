// Endpoints and graph for connections.

const { connected } = require("process");

module.exports = async function (app) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const cors = require("cors");
  const express = require("express");

  const GITHUB_SIMILARITY_POINTS = 40;
  const ADJACENT_PROFILE_SIMILARITY_POINTS = 30;
  const RECOMMENDER_PROFILE_SIMILARITY_POINTS = 15;
  const RECENCY_POINTS = 15;

  const SEED_RECENT_CONNECTIONS = 20; // Attempts to optimize time it takes to get connections while getting the most relevant recommendations.

  // Connections graph.
  let connectionsGraph = {};
  await createGraph();

  /***
   * Creates the graph.
   * Called upon starting the server.
   */
  async function createGraph() {
    // Gets all users.
    const users = await prisma.user.findMany();

    // Creates graph by iterating through all users.
    for (userIndex in users) {
      // Gets the connections for the specified user.
      const userID = users[userIndex].id;

      const connections = await prisma.connection.findMany({
        where: {
          AND: [
            { accepted: true },
            {
              OR: [{ senderID: userID }, { recipientID: userID }],
            },
          ],
        },
      });

      // Builds an array of the user's connections' IDs.
      const connectionsArray = [];

      for (connectionIndex in connections) {
        const connectedUserID =
          connections[connectionIndex]["senderID"] === userID
            ? connections[connectionIndex]["recipientID"]
            : connections[connectionIndex]["senderID"];

        connectionsArray.push(connectedUserID);
      }

      // Updates connections graph.
      connectionsGraph = { ...connectionsGraph, [userID]: connectionsArray };
    }
  }

  // All tags.
  const tags = [];

  /***
   * Calculates the Jaccard similarity between two sets by comparing arrays of similar objects.
   * Both sets should be IDs of the same objects.
   * Gets a score of 0 if there are no objects to compare.
   */
  function jaccardSetSimilarity(setOne, setTwo) {
    let intersectionCount = 0;
    let unionCount = setOne.length + setTwo.length;

    for (setOneIndex in setOne) {
      if (setTwo.includes(setOne[setOneIndex])) {
        intersectionCount += 1;
        unionCount -= 1;
      }
    }

    return unionCount === 0 ? 0 : intersectionCount / unionCount;
  }

  /***
   * Produces a score out of 100 giving how similar different two user profiles are, indicating if they should be recommended.
   */
  async function getUserSimilarityScore(
    userOneID,
    userTwoID,
    maxSimilarityPoints
  ) {
    /***
     * Gets the user data, post data, and upvoted posts of a user for comparison.
     */
    async function getUserData(id) {
      const data = await prisma.user.findUnique({ where: { id: id } });
      const posts = await prisma.post.findMany({ where: { authorID: id } });
      const upvotes = await prisma.upvote.findMany({
        where: { userUpvoteID: id },
      });
      const connectionsData = await prisma.connection.findMany({
        where: {
          OR: [{ recipientID: id }, { senderID: id }],
        },
      });

      let upvotedPosts = [];
      let upvotedPostsIDs = [];

      for (upvotesIndex in upvotes) {
        const postData = await prisma.post.findUnique({
          where: { id: upvotes[upvotesIndex].postID },
        });
        upvotedPosts = upvotedPosts.concat(postData);
        upvotedPostsIDs = upvotedPostsIDs.concat(postData.id);
      }

      let connectedUsersIDs = [];

      for (connectionsDataIndex in connectionsData) {
        connectedUsersIDs = connectedUsersIDs.concat(
          connectionsData[connectionsDataIndex].senderID === id
            ? connectionsData[connectionsDataIndex].recipientID
            : connectionsData[connectionsDataIndex].senderID
        );
      }

      let tagFrequencies = {};
      let tagCount = 0;

      for (postsIndex in posts) {
        for (tagIndex in posts[postsIndex].tags) {
          const tag = posts[postsIndex].tags[tagIndex];
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
        upvotedPostsIDs: upvotedPostsIDs,
        tagFrequencies: tagFrequencies,
        connectedUsersIDs: connectedUsersIDs,
      };

      return allUserData;
    }

    const userOneData = await getUserData(userOneID);
    const userTwoData = await getUserData(userTwoID);

    // Evaluate the similarities between the userOne and userTwo;
    const upvotedPostsSimilarity = jaccardSetSimilarity(
      userOneData.upvotedPostsIDs,
      userTwoData.upvotedPostsIDs
    );

    const connectionsSimilarity = jaccardSetSimilarity(
      userOneData.connectedUsersIDs,
      userTwoData.connectedUsersIDs
    );

    const similarityScore =
      maxSimilarityPoints *
      ((upvotedPostsSimilarity + connectionsSimilarity) / 2);

    return similarityScore;
  }

  // Endpoints.

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
   * Gets a specific connection given two users.
   * If connection does not exit, returns empty array.
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

    connectionsGraph[userID].push(Number(connectionID));
    connectionsGraph[connectionID].push(Number(userID));

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

    connectionsGraph[userID].splice(
      connectionsGraph[userID].indexOf(Number(connectionID)),
      1
    );
    connectionsGraph[connectionID].splice(
      connectionsGraph[connectionID].indexOf(Number(userID)),
      1
    );

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

      const userConnectionsIDs = connectionsGraph[userID];

      const recommendations = [];

      // Gets "weighted" recommendations based on how many connections the user and their connections have in common.
      // The first n (numberOfRecs) are then returned.
      // More connections are looked through if enough recommendations have not been generated and the user still has connections to use to generate related connections.
      let weightedRecommendations = {};

      let connectionsPoolSize =
        SEED_RECENT_CONNECTIONS <= userConnectionsIDs.length
          ? SEED_RECENT_CONNECTIONS
          : userConnectionsIDs.length; // Determines how many recent connections we will be using for generating recommendations at any given time. Either the seed, or, if less than the seed, the length of the recommendations.
      let recencyPoints = RECENCY_POINTS; // Points for how recent a connection is. Cut by half each time we need to expand the pool we are looking for.
      let count = 0; // Counts how many of the connections have been gone through.

      while (recommendations < numberOfRecs) {
        // Retrieves the sorted connections of the user's connection (refered to as adjacent connections).
        // Excludes the recommendee user's in adjacent connections before proceeding.
        let adjacentConnectionsIDs = connectionsGraph[
          String(userConnectionsIDs[count])
        ].toSpliced(
          connectionsGraph[String(userConnectionsIDs[count])].indexOf(
            Number(userID)
          ),
          1
        );

        const reversedAdjacentConnectionsIDs = [];
        // Reverse the array to look at most recent connections first.
        for (adjacentConnectionsIDsIndex in adjacentConnectionsIDs) {
          reversedAdjacentConnectionsIDs.push(
            adjacentConnectionsIDs[
              adjacentConnectionsIDs.length - adjacentConnectionsIDsIndex - 1
            ]
          );
        }

        adjacentConnectionsIDs = reversedAdjacentConnectionsIDs;

        for (adjacentConnectionsIDsIndex in adjacentConnectionsIDs) {
          // Checks if adjacent connection is already connected with user.
          const connected = await prisma.connection.findMany({
            where: {
              OR: [
                {
                  AND: [
                    { recipientID: Number(userID) },
                    {
                      senderID:
                        adjacentConnectionsIDs[adjacentConnectionsIDsIndex],
                    },
                  ],
                },
                {
                  AND: [
                    {
                      recipientID:
                        adjacentConnectionsIDs[adjacentConnectionsIDsIndex],
                    },
                    { senderID: Number(userID) },
                  ],
                },
              ],
            },
          });

          // Calculates weights for recommendations if user is not connected with adjacent connection and has not requested a connection with that user.
          if (connected.length === 0) {
            const connectedUserRecommendationScore =
              await getUserSimilarityScore(
                Number(userID),
                Number(userConnectionsIDs[count]),
                RECOMMENDER_PROFILE_SIMILARITY_POINTS
              );

            const adjacentUserRecommendationScore =
              await getUserSimilarityScore(
                Number(userID),
                adjacentConnectionsIDs[adjacentConnectionsIDsIndex],
                ADJACENT_PROFILE_SIMILARITY_POINTS
              );

            // Recommendation score takes into accout the similarity of between the adjacent user and user and between the connected user and user.
            const recommendationScore =
              connectedUserRecommendationScore +
              adjacentUserRecommendationScore +
              recencyPoints;

            weightedRecommendations = {
              ...weightedRecommendations,
              [adjacentConnectionsIDs[adjacentConnectionsIDsIndex]]:
                recommendationScore,
            };
          }
        }

        // Gets the most highly relevant adjacent connections seen most frequently using the weighted connections values.
        while (
          recommendations.length < numberOfRecs &&
          Object.keys(weightedRecommendations).length > 0
        ) {
          const highestRecommendationScore = Math.max(
            Object.values(weightedRecommendations)
          );
          const hightestRecommendedUserID = Object.keys(
            weightedRecommendations
          ).find(
            (recommenedUserID) =>
              weightedRecommendations[recommenedUserID] ===
              highestRecommendationScore
          );

          recommendations.push(Number(hightestRecommendedUserID));
          delete weightedRecommendations[hightestRecommendedUserID];
        }

        count += 1;
        recencyPoints /= 2;

        // Widens the pool of recent connections to look through if algorithm hasn't yet found enough recommendations and there are more recommendations to look through.
        if (count < connectionsPoolSize) {
          continue;
        } else if (
          count < userConnectionsIDs.length &&
          count >= connectionsPoolSize &&
          recommendations.length < numberOfRecs
        ) {
          connectionsPoolSize =
            connectionsPoolSize * 2 <= userConnectionsIDs.length
              ? connectionsPoolSize * 2
              : userConnectionsIDs.length; // Doubles the number of recent connections we want to look through if this is less than the number of recommendations.
        } else {
          break;
        }
      }

      res.status(200).json(recommendations);
    }
  );
};

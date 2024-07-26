// Endpoints and graph for connections.

module.exports = async function (app, connectionsGraph) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const cors = require("cors");
  const express = require("express");

  const { createOctokit } = require("./util/githubUtil");
  const {
    ADJACENT_PROFILE_SIMILARITY_POINTS,
    RECOMMENDER_PROFILE_SIMILARITY_POINTS,
    RECENCY_POINTS,
    SEED_RECENT_CONNECTIONS,
    MAX_RECOMMENDATIONS,
    createGraph,
    compareGitHubs,
    getSyncProfileSimilarityScore,
    getPopularityRecommendations,
  } = require("./util/connectionsUtil");

  connectionsGraph = await createGraph();

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
   * Gets a specified number of user recommendations for a specified user.
   */
  app.get(
    "/connections/recommendations/:userID/:numberOfRecs",
    async (req, res) => {
      const userID = req.params.userID;
      const numberOfRecs =
        req.params.numberOfRecs > MAX_RECOMMENDATIONS
          ? MAX_RECOMMENDATIONS
          : req.params.numberOfRecs; // Sets max number of recs at one time to be 5 due to the number of GitHub request calls.

      const userData = await prisma.user.findUnique({
        where: { id: Number(userID) },
      });

      const octokit = await createOctokit(userData.githubHandle);

      const userConnectionsIDs = connectionsGraph[userID];

      let recommendations = [];

      if (userConnectionsIDs.length > 0) {
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

        while (recommendations.length < numberOfRecs) {
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

            // Gets the adjacent user's data.
            const adjacentUserData = await prisma.user.findUnique({
              where: {
                id: adjacentConnectionsIDs[adjacentConnectionsIDsIndex],
              },
            });

            // Calculates weights for recommendations if user is not connected with adjacent connection and has not requested a connection with that user.
            if (connected.length === 0) {
              const connectedUserRecommendationScore =
                await getSyncProfileSimilarityScore(
                  Number(userID),
                  Number(userConnectionsIDs[count]),
                  octokit,
                  RECOMMENDER_PROFILE_SIMILARITY_POINTS
                );

              const adjacentUserRecommendationScore =
                await getSyncProfileSimilarityScore(
                  Number(userID),
                  adjacentConnectionsIDs[adjacentConnectionsIDsIndex],
                  octokit,
                  ADJACENT_PROFILE_SIMILARITY_POINTS
                );

              const githubScore = await compareGitHubs(
                userData.githubHandle,
                adjacentUserData.githubHandle,
                octokit
              );

              // Recommendation score takes into account the similarity of between the adjacent user and user and between the connected user and user.
              const recommendationScore =
                connectedUserRecommendationScore +
                adjacentUserRecommendationScore +
                githubScore +
                recencyPoints;

              weightedRecommendations = {
                ...weightedRecommendations,
                [adjacentConnectionsIDs[adjacentConnectionsIDsIndex]]:
                  recommendationScore,
              };
            }
          }

          // Gets the most highly relevant adjacent connections using the weighted connections values.
          while (
            recommendations.length < numberOfRecs &&
            Object.keys(weightedRecommendations).length > 0
          ) {
            const highestRecommendationScore = Object.values(
              weightedRecommendations
            ).reduce((val1, val2) => Math.max(val1, val2), -Infinity);
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
      }

      if (recommendations.length < numberOfRecs) {
        const popularityRecommendations = await getPopularityRecommendations(
          userData,
          connectionsGraph,
          octokit
        );

        for (popularityRecommendation of popularityRecommendations) {
          if (recommendations.length < numberOfRecs) {
            if (!recommendations.includes(popularityRecommendation)) {
              recommendations = recommendations.concat(
                popularityRecommendation
              );
            } else {
              continue;
            }
          } else {
            break;
          }
        }
      }

      res.status(200).json(recommendations);
    }
  );
};

// Endpoints and graph for connections.

module.exports = function (app) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const cors = require("cors");
  const express = require("express");

  const SEED_RECENT_CONNECTIONS = 20; // Attempts to optimize time it takes to get connections while getting the most relevant recommendations.

  // Connections graph.
  let connectionsGraph = {};

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
            { where: { accepted: true } },
            {
              OR: [
                { where: { senderID: userID } },
                { where: { recipientID: userID } },
              ],
            },
          ],
        },
      });

      // Builds an array of the user's connections' IDs.
      const connectionsArray = [];

      for (connection in connections) {
        const connectedUser =
          connection[senderID] == userID
            ? connection[recipientID]
            : connectin[senderID];

        connectionsArray.push(connectedUser);
      }

      // Updates connections graph.
      connectionsGraph[userID] = connectionsArray;
    }
  });

  /***
   * Updates the connections graph and database for the specified user.
   * Called when a connection with the specified user is accepted.
   */
  app.put("/add-connection/:userID/:connectionID", async (req, res) => {
    const userID = req.params.userID;
    const connectionID = req.params.connectionID;

    await prisma.connection.update({
      where: {
        AND: [
          { where: { senderID: connectionID } },
          { where: { recipientID: userID } },
        ],
      },
      data: {
        accepted: true,
      },
    });

    connectionsGraph[userID].push(connectionID);
    connectionsGraph[connectionID].push(userID);

    res.send(200).json();
  });

  /***
   * Updates the connections graph and database for the specified user.
   * Called when a connection with the specified user is removed.
   */
  app.delete("/remove-connection/:userID/:connectionID", async (req, res) => {
    const userID = req.params.userID;
    const connectionID = req.params.connectionID;

    await prisma.connection.deleteMany({
      where: {
        OR: [
          {
            AND: [
              { where: { recipientID: userID } },
              { where: { senderID: connectionID } },
            ],
          },
          {
            AND: [
              { where: { recipientID: connectionID } },
              { where: { senderID: userID } },
            ],
          },
        ],
      },
    });

    connectionsGraph[userID].pop(connectionID);
    connectionsGraph[connectionID].pop(userID);

    res.send(200).json();
  });

  /***
   * Gets a specified number of recommendations for a specified user.
   */
  app.get("/get-recommendations/:userID/:numberOfRecs", async (req, res) => {
    const userID = req.params.userID;
    const numberOfRecs = req.params.numberOfRecs;

    // Gets the connections of a user in order (most recent first; i.e. by ID of connection).
    const connections = await prisma.connection.findMany({
      OR: [{ where: { recipientID: userID } }, { where: { senderID: userID } }],
      orderBy: { id: "desc" },
    });

    // Builds an array of the user's connections' IDs.
    const userConnections = [];

    for (connection in connections) {
      const connectedUser =
        connection[senderID] == userID
          ? connection[recipientID]
          : connectin[senderID];

      userConnections.push(connectedUser);
    }

    const recommendations = [];

    // Gets "weighted" recommendations based on how many connections the user and their connections have in common.
    // The first n (numberOfRecs) are then returned.
    // More connections are looked through if enough recommendations have not been generated and the user still has connections to use to generate related connections.
    const weightedRecommendations = {};

    let connectionsPoolSize = SEED_RECENT_CONNECTIONS; // Determines how many recent connections we will be using for generating recommendations at any given time.
    let count = 0; // Counts how many of the connections have been gone through.

    while (
      recommendations < numberOfRecs &&
      connections.length < connectionsPoolSize
    ) {
      while (count < connectionsPoolSize && count <= userConnections.length) {
        // Retrieves the sorted connections of the user's connection (refered to as adjacent connections).
        const adjacentConnections = await prisma.connection.findMany({
          OR: [
            { where: { recipientID: userID } },
            { where: { senderID: userID } },
          ],
          orderBy: { id: "desc" },
        });

        // Checks if adjacent connection is already connected with user.
        const connected = await prisma.connection.findMany({
          OR: [
            {
              AND: [
                { where: { recipientID: userID } },
                { where: { senderID: userConnections[count] } },
              ],
            },
            {
              AND: [
                { where: { recipientID: userConnections[count] } },
                { where: { senderID: userID } },
              ],
            },
          ],
        });

        // Tallies weighted recommendations if user is not connected with adjacent connection.
        if (connected.length == 0) {
          if (
            Object.keys(weightedRecommendations).includes(
              userConnections[count]
            )
          ) {
            weightedRecommendations[count] = weightedRecommendations[count] + 1;
          } else {
            weightedRecommendations[count] = 1;
          }
        }

        count += 1;
      }

      // Widens the pool of recent connections to look through if algorithm hasn't yet found enough recommendations.
      if (weightedRecommendations.length < numberOfRecs) {
        connectionsPoolSize *= 2; // Doubles the number of recent connections we want to look through.
      }
    }

    // Gets the most adjacent connections seen most frequently.

    res.send(200).json(recommendations);
  });
};

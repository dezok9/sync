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

      for (connection in connections) {
        const connectedUser =
          connection[senderID] == Number(userID)
            ? connection[recipientID]
            : connectin[senderID];

        connectionsArray.push(connectedUser);
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

    const pendingConnections = await prisma.connection.findMany({
      where: {
        AND: [{ senderID: Number(userID) }, { accepted: false }],
      },
    });

    res.status(200).json(pendingConnections);
  });

  /***
   * Gets a specified number of recommendations for a specified user.
   */
  app.get("/get-recommendations/:userID/:numberOfRecs", async (req, res) => {
    const userID = req.params.userID;
    const numberOfRecs = req.params.numberOfRecs;

    // Gets the connections of a user in order (most recent first; i.e. by ID of connection).
    const connections = await prisma.connection.findMany({
      where: {
        OR: [{ recipientID: Number(userID) }, { senderID: Number(userID) }],
      },
      orderBy: { id: "desc" },
    });

    // Builds an array of the user's connections' IDs.
    const userConnections = [];

    for (connection in connections) {
      const connectedUser =
        connection[senderID] == Number(userID)
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
          where: {
            OR: [{ recipientID: userID }, { senderID: userID }],
          },
          orderBy: { id: "desc" },
        });

        // Checks if adjacent connection is already connected with user.
        const connected = await prisma.connection.findMany({
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

    res.status(200).json(recommendations);
  });
};

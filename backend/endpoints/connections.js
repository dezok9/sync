// Endpoints and graph for connections.

const { connected } = require("process");

module.exports = async function (app, createOctokit, connectionsGraph) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const cors = require("cors");
  const express = require("express");

  const GITHUB_SIMILARITY_POINTS = 50;
  const ADJACENT_PROFILE_SIMILARITY_POINTS = 30;
  const RECOMMENDER_PROFILE_SIMILARITY_POINTS = 15;
  const RECENCY_POINTS = 5;

  const TOPIC_POINTS = 4;
  const COMMON_LANGUAGE_POINTS = 6;

  const SEED_RECENT_CONNECTIONS = 5; // Attempts to optimize time it takes to get connections while getting the most relevant recommendations.
  const ANALYZE_REPOS = 5; // Limits how many recent repositories are looked at (max) for deep analysis.

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
   * Returns the intersection of two sets.
   */
  function intersection(setOne, setTwo) {
    const intersection = [];

    for (setOneIndex in setOne) {
      if (
        setTwo.includes(setOne[setOneIndex]) &&
        !intersection.includes(setOne[setOneIndex])
      ) {
        intersection.push(setOne[setOneIndex]);
      }
    }

    return intersection;
  }

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
   * Compares the similarities of the GitHubs of two users.
   * Considers and weighs factors such as code breakdown of repositories, tags of repositories, etc.
   * Uses the octokit of the user who the recommendation is being used for.
   */
  async function compareGitHubs(
    userOneGitHubHandle,
    userTwoGitHubHandle,
    octokit
  ) {
    /***
     * Gets GitHub information, including repository information.
     */
    async function getGitHubInfo(githubHandle) {
      const repositoryResponse = await octokit.request(
        "GET /users/{owner}/repos",
        {
          sort: "pushed",
          owner: githubHandle,
        }
      );
      const repositories = repositoryResponse.data;

      let languages = {}; // Cumulative language makeup of recent repositories.
      const topics = [];
      let repositoriesIndex = 0;

      // Looks at the 5 most recent repositories for analysis of languages and topics.

      while (
        repositoriesIndex < repositories.length &&
        repositoriesIndex < ANALYZE_REPOS
      ) {
        // Getting and looking through data on repository languages.
        const responseRepositoryLanguages = await octokit.request(
          "GET /repos/{owner}/{repo}/languages",
          {
            owner: githubHandle,
            repo: repositories[repositoriesIndex].name,
            headers: {
              "X-GitHub-Api-Version": "2022-11-28",
            },
          }
        );

        const repositoryLanguages = responseRepositoryLanguages.data;

        const repositoryLanguagesNames = Object.keys(repositoryLanguages);

        for (let languagesNameIndex in repositoryLanguagesNames) {
          if (
            repositoryLanguagesNames[languagesNameIndex] in
            Object.keys(languages)
          ) {
            languages = {
              ...lanaguages,
              [repositoryLanguagesNames[languagesNameIndex]]:
                languages[repositoryLanguagesNames[languagesNameIndex]] +
                repositoryLanguages[
                  repositoryLanguagesNames[languagesNameIndex]
                ],
            };
          } else {
            languages = {
              ...languages,
              [repositoryLanguagesNames[languagesNameIndex]]:
                repositoryLanguages[
                  repositoryLanguagesNames[languagesNameIndex]
                ],
            };
          }
        }

        // Getting data on topics.
        for (topicsIndex in repositories[repositoriesIndex].topics) {
          if (
            !topics.includes(
              repositories[repositoriesIndex].topics[topicsIndex]
            )
          ) {
            topics.push(repositories[repositoriesIndex].topics[topicsIndex]);
          }
        }

        repositoriesIndex += 1;
      }

      const githubInfo = {
        repositories: repositories,
        recentRepositoryLanguages: languages,
        recentTopics: topics,
      };

      return githubInfo;
    }

    const userOneGitHubInfo = await getGitHubInfo(userOneGitHubHandle);
    const userTwoGitHubInfo = await getGitHubInfo(userTwoGitHubHandle);

    // Calculating topic overlap.
    // Topic similalrity can account for, max, two-fifths of GitHub similarity points.
    const commonRepositoryTopicsCount = intersection(
      userOneGitHubInfo.recentTopics,
      userTwoGitHubInfo.recentTopics
    );

    let commonRepositoryTopicsScoring = 0;

    if (userOneGitHubInfo.recentTopics === userTwoGitHubInfo.recentTopics) {
      commonRepositoryTopicsScoring = 2 * (GITHUB_SIMILARITY_POINTS / 5);
    } else {
      commonRepositoryTopicsScoring =
        commonRepositoryTopicsCount * TOPIC_POINTS >
        2 * (GITHUB_SIMILARITY_POINTS / 5)
          ? 2 * (GITHUB_SIMILARITY_POINTS / 5)
          : commonRepositoryTopicsCount * TOPIC_POINTS;
    }

    // Comparing recent coding languages used.
    // Language similalrity can account for, max, three-fifths of GitHub similarity points.
    const commonGitHubLanguagesCount = intersection(
      Object.keys(userOneGitHubInfo.recentRepositoryLanguages),
      Object.keys(userTwoGitHubInfo.recentRepositoryLanguages)
    ).length;

    let commonGithubLanguagesScoring = 0;

    if (
      Object.keys(userOneGitHubInfo.recentRepositoryLanguages) ===
      Object.keys(userTwoGitHubInfo.recentRepositoryLanguages)
    ) {
      commonGithubLanguagesScoring = 3 * (GITHUB_SIMILARITY_POINTS / 5);
    } else {
      commonGithubLanguagesScoring =
        commonGitHubLanguagesCount * COMMON_LANGUAGE_POINTS >
        3 * (GITHUB_SIMILARITY_POINTS / 5)
          ? 3 * (GITHUB_SIMILARITY_POINTS / 5)
          : commonGitHubLanguagesCount * COMMON_LANGUAGE_POINTS;
    }

    const githubScore =
      commonRepositoryTopicsScoring + commonGithubLanguagesScoring;

    return githubScore;
  }

  /***
   * Produces a score out of 100 giving how similar different two user profiles are, indicating if they should be recommended.
   */
  async function getSyncProfileSimilarityScore(
    userOneID,
    userTwoID,
    octokit,
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
      const numberOfRecs =
        req.params.numberOfRecs > 5 ? 5 : req.params.numberOfRecs; // Sets max number of recs at one time to be 5 due to the number of GitHub request calls.

      const userConnectionsIDs = connectionsGraph[userID];

      const recommendations = [];

      if (userConnectionsIDs.length > 0) {
        const userData = await prisma.user.findUnique({
          where: { id: Number(userID) },
        });

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

            // Gets the adjacent user's data.
            const adjacentUserData = await prisma.user.findUnique({
              where: {
                id: adjacentConnectionsIDs[adjacentConnectionsIDsIndex],
              },
            });

            const octokit = await createOctokit(userData.githubHandle);

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

              // Recommendation score takes into accout the similarity of between the adjacent user and user and between the connected user and user.
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

          // Gets the most highly relevant adjacent connections seen most frequently using the weighted connections values.
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

      res.status(200).json(recommendations);
    }
  );
};

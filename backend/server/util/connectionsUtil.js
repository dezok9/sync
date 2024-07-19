const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cors = require("cors");
const express = require("express");

const { intersection } = require("./generalUtil");

const GITHUB_SIMILARITY_POINTS = 50;
const ADJACENT_PROFILE_SIMILARITY_POINTS = 30;
const RECOMMENDER_PROFILE_SIMILARITY_POINTS = 15;
const RECENCY_POINTS = 5;

const TOPIC_POINTS = 4;
const COMMON_LANGUAGE_POINTS = 6;

const SEED_RECENT_CONNECTIONS = 5; // Attempts to optimize time it takes to get connections while getting the most relevant recommendations.
const ANALYZE_REPOS = 5; // Limits how many recent repositories are looked at (max) for deep analysis.

/***
 * Creates the graph.
 * Called upon starting the server.
 */
async function createGraph() {
  // Gets all users.
  const users = await prisma.user.findMany();
  let tmpGraph = {};

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
    tmpGraph = { ...tmpGraph, [userID]: connectionsArray };
  }
  return tmpGraph;
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
 * Gets GitHub information, including repository information.
 */
async function getGitHubInfo(githubHandle, octokit) {
  const repositoryResponse = await octokit.request("GET /users/{owner}/repos", {
    sort: "pushed",
    owner: githubHandle,
  });
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
        repositoryLanguagesNames[languagesNameIndex] in Object.keys(languages)
      ) {
        languages = {
          ...lanaguages,
          [repositoryLanguagesNames[languagesNameIndex]]:
            languages[repositoryLanguagesNames[languagesNameIndex]] +
            repositoryLanguages[repositoryLanguagesNames[languagesNameIndex]],
        };
      } else {
        languages = {
          ...languages,
          [repositoryLanguagesNames[languagesNameIndex]]:
            repositoryLanguages[repositoryLanguagesNames[languagesNameIndex]],
        };
      }
    }

    // Getting data on topics.
    for (topicsIndex in repositories[repositoriesIndex].topics) {
      if (
        !topics.includes(repositories[repositoriesIndex].topics[topicsIndex])
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
  const githubInfo = Promise.all([
    getGitHubInfo(userOneGitHubHandle, octokit),
    getGitHubInfo(userTwoGitHubHandle, octokit),
  ]);
  const [userOneGitHubInfo, userTwoGitHubInfo] = await githubInfo;

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
 * Gets the user data, post data, and upvoted posts of a user for comparison.
 */
async function getUserData(id) {
  const userData = Promise.all([
    prisma.user.findUnique({ where: { id: id } }),
    prisma.post.findMany({ where: { authorID: id } }),
    prisma.upvote.findMany({
      where: { userUpvoteID: id },
    }),
    prisma.connection.findMany({
      where: {
        OR: [{ recipientID: id }, { senderID: id }],
      },
    }),
  ]);

  const [data, posts, upvotes, connectionsData] = await userData;

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

/***
 * Produces a score out of 100 giving how similar different two user profiles are, indicating if they should be recommended.
 */
async function getSyncProfileSimilarityScore(
  userOneID,
  userTwoID,
  octokit,
  maxSimilarityPoints
) {
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

module.exports = {
  GITHUB_SIMILARITY_POINTS,
  ADJACENT_PROFILE_SIMILARITY_POINTS,
  RECOMMENDER_PROFILE_SIMILARITY_POINTS,
  RECENCY_POINTS,
  TOPIC_POINTS,
  COMMON_LANGUAGE_POINTS,
  SEED_RECENT_CONNECTIONS,
  ANALYZE_REPOS,
  createGraph,
  jaccardSetSimilarity,
  getGitHubInfo,
  compareGitHubs,
  getUserData,
  getSyncProfileSimilarityScore,
};

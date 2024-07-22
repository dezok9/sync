const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cors = require("cors");
const express = require("express");

// The process for plotting all posts via a Python script.
const spawn = require("child_process").spawn;

/***
 * Tallies up the freqency of all tags used in posts.
 */
async function tallyTags() {
  let tags = {};

  const allPosts = await prisma.post.findMany();

  for (const post of allPosts) {
    for (const tag of post.tags) {
      if (tag in tags) {
        tags = { ...tags, [tag]: tags[tag] + 1 };
      } else {
        tags = { ...tags, [tag]: 1 };
      }
    }
  }

  return tags;
}

/***
 * Plots the point values of all posts.
 * Runs once--upon starting the server.
 */
async function plotPosts(allTags) {
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

  // Convert post information to Python.
  const pyAllPostInfo = JSON.stringify(allPosts)
    .replaceAll('"', "'")
    .replaceAll("false", "False")
    .replaceAll("true", "True")
    .replaceAll("null", "None");

  // Convert tag information to Python.
  const pyAllTags = JSON.stringify(allTags)
    .replaceAll('"', "'")
    .replaceAll("false", "False")
    .replaceAll("true", "True")
    .replaceAll("null", "None");

  const generatePostPoints = spawn("python3", [
    "util/postRecommendations/plotPosts.py",
    pyAllPostInfo,
    pyAllTags,
  ]);

  let postPoints = [];

  await new Promise((resolve, reject) => {
    generatePostPoints.stdout.on("data", (data) => {
      postPoints = data.toString();
    });
    generatePostPoints.stderr.on("data", (data) => {});
    generatePostPoints.on("close", () => {
      resolve();
    });
  });

  return postPoints;
}

module.exports = { tallyTags, plotPosts };

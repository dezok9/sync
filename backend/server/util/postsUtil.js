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
 * Plots either one or all of the point values of the post(s).
 * Runs upon starting the server and creating a new post.
 */
async function plotPosts(allTags, postID) {
  let posts = [];

  if (postID) {
    posts = await prisma.post.findMany({ where: { id: postID } });
  } else {
    posts = await prisma.post.findMany();
  }

  for (const postIndex in posts) {
    const comments = await prisma.comment.findMany({
      where: { postID: posts[postIndex].id },
    });

    const resharesCount = await prisma.post.count({
      where: { repostedSourceID: posts[postIndex].id },
    });

    const upvoteInfo = await prisma.upvote.findMany({
      where: { userUpvoteID: posts[postIndex].id },
    });

    posts[postIndex] = {
      ...posts[postIndex],
      comments: comments,
      resharesCount: resharesCount,
      upvoteInfo: upvoteInfo,
    };
  }

  // Convert post information to Python.
  const pyAllPostInfo = JSON.stringify(posts)
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

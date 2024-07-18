module.exports = function () {
  // All tags and their count, where keys are the tag values and the values are the number of posts using that tags.
  let allTags = {};

  // The process for plotting all posts via a Python script.
  // TODO
  const spawn = require("child_process").spawn;
  const createPlotPosts = spawn("python3", []);

  /***
   * Plots the point values of all posts.
   * Runs once--upon starting the server.
   */
  async function plotPosts() {
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

    createPlotPosts.stdout.on("data", (data) => {});
    createPlotPosts.stderr.on("data", (data) => {});
    createPlotPosts.on("close", (code) => {});
  }
};

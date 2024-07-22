import { MONTHS } from "./enums";

const DATABASE = import.meta.env.VITE_DATABASE_ACCESS;
const WEB_ADDRESS = import.meta.env.VITE_WEB_ADDRESS;

/***
 * Gets the user feed data given the ID of the user.
 */
export async function getFeed(userID) {
  // Get posts from connections from database.
  try {
    const response = await fetch(`${DATABASE}/${userID}/feed`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const feedData = await response.json();
    return feedData;
  } catch (error) {}
}

/***
 * Getting post recommendations for feed.
 */
export async function getRecommendedPosts(userID, numberOfRecs) {
  try {
    let postRecommendations = [];

    const recommendationsDataResponse = await fetch(
      `${DATABASE}/posts/recommendations/${userID}/${numberOfRecs}`
    );
    const recommendationsData = await recommendationsDataResponse.json();

    return recommendationsData;
  } catch {}
}

/***
 * Gets the user data from the database given the userHandle of the user.
 */
export async function getUserData(userHandle) {
  try {
    const response = await fetch(`${DATABASE}/user/${userHandle}`);
    const userData = await response.json();

    return userData;
  } catch {
    window.location.assign(`${WEB_ADDRESS}/404`);
  }
}

/***
 * Gets the user data from the database given the userID of the user.
 */
export async function getUserDataID(userID) {
  try {
    const response = await fetch(`${DATABASE}/user/id/${userID}`);
    const userData = await response.json();

    return userData;
  } catch {
    window.location.assign(`${WEB_ADDRESS}/404`);
  }
}

/***
 * Gets the user's post given the ID of the user.
 */
export async function getUserPosts(userID) {
  try {
    const response = await fetch(`${DATABASE}/posts/${userID}`);

    if (response.ok) {
      const userPosts = await response.json();
      return userPosts;
    } else {
      return null;
    }
  } catch (e) {}
}

/***
 * Creates a post given the information to be stored.
 */
export async function createPost(postInfo) {
  const { title, text, authorID, mediaURLs, date, timestamp } = postInfo;

  try {
    const response = await fetch(`${DATABASE}/create-post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title,
        text: text,
        authorID: authorID,
        mediaURLs: mediaURLs,
        date: date,
        timestamp: timestamp,
        tags: [],
      }),
    });
  } catch {}
}

/***
 * Upvotes or downvotes post using endpoint.
 */
export async function upvotePost(postID, userID) {
  try {
    const response = await fetch(`${DATABASE}/upvote/${postID}`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
      body: JSON.stringify({
        userID: userID,
      }),
    });
  } catch {}
}

/***
 * Removes an upvote on a post.
 */
export async function removeUpvote(postID, userID) {
  try {
    const response = await fetch(`${DATABASE}/downvote/${postID}`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
      body: JSON.stringify({
        userID: userID,
      }),
    });
  } catch {}
}

/***
 * Gets a post based on a postID.
 */
export async function getPost(postID) {
  try {
    const response = await fetch(`${DATABASE}/post/${postID}`);
    const postData = await response.json();

    return postData;
  } catch {}
}

/***
 * Adds a new comment to a post.
 */
export async function createComment(commentData) {
  try {
    const { commentText, date, timestamp, parentCommentID, postID, authorID } =
      commentData;

    await fetch(`${DATABASE}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commentText: commentText,
        date: date,
        timestamp: timestamp,
        parentCommentID: parentCommentID,
        postID: postID,
        authorID: authorID,
      }),
    });
  } catch {}
}

/***
 * Gets all comments for a post given the postID.
 */
export async function getComments(postID) {
  try {
    const response = await fetch(`${DATABASE}/post/${postID}/comments`);
    const postComments = await response.json();

    return postComments;
  } catch {}
}

/***
 * Generates and returns the current date and time.
 */
export function generateDateTimestamp() {
  // Generate date and timestamp.
  const dateObject = new Date();

  const month = dateObject.getMonth();
  const day = dateObject.getDate();
  const year = dateObject.getFullYear();

  const hours = dateObject.getHours();
  const minutes = dateObject.getMinutes();

  const date = [MONTHS[month], day + ",", year].join(" ");

  let timestamp = [
    hours % 12 === 0 ? "12" : hours % 12,
    minutes.toString().length === 1 ? "0" + minutes : minutes,
  ].join(":");
  timestamp = timestamp + (hours <= 12 ? "AM" : "PM");

  return { date: date, timestamp: timestamp };
}

/***
 * Calculates how long ago a post was made.
 */
export function deriveTimeSincePost(postDate, postTimestamp) {
  const currentDateTime = generateDateTimestamp();
  const splitPostDate = postDate.split(" ");
  const splitCurrentDate = currentDateTime.date.split(" ");

  // If post was made today.
  if (currentDateTime.date === postDate) {
    // If post was made in the last hour.
    const currentHour = currentDateTime.timestamp.split(":")[0];
    const currentMinute = currentDateTime.timestamp.split(":")[1].slice(0, 3);
    const currentDayTime = currentDateTime.timestamp.slice(
      currentDateTime.timestamp.length - 3
    );

    const postHour = postTimestamp.split(":")[0];
    const postMinute = postTimestamp.split(":")[1].slice(0, 3);
    const postDayTime = postTimestamp.slice(postTimestamp.length - 3);

    if (currentHour === postHour && currentDayTime === postDayTime) {
      const minuteDiffernce = Number(currentMinute) - Number(postMinute);
      if (minuteDiffernce === 0) {
        return "now";
      } else {
        return `${minuteDiffernce} minutes ago`;
      }
    }
  }
  // If month and year are the same.
  else if (
    splitCurrentDate[0] === splitPostDate[0] &&
    splitCurrentDate[splitCurrentDate.length - 1] ===
      splitPostDate[splitPostDate.length - 1]
  ) {
    const dayDiffernece =
      Number(splitCurrentDate[1].replace(",", "")) -
      Number(splitPostDate[1].replace(",", ""));
    return `${dayDiffernece} days ago`;
  }
  // If year is different.
  else if (
    splitCurrentDate[splitCurrentDate.length - 1] !=
    splitPostDate[splitPostDate.length - 1]
  ) {
    const yearDifference =
      Number(splitCurrentDate[splitCurrentDate.length - 1]) -
      Number(splitPostDate[splitPostDate.length - 1]);
    return `${yearDifference} years ago`;
  }
  // If only month is different.
  else {
    const monthDiffernce =
      MONTHS.indexOf(splitCurrentDate[0]) - MONTHS.indexOf(splitPostDate[0]);
    return `${monthDiffernce} months ago`;
  }
}

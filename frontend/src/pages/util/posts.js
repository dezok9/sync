const DATABASE = import.meta.env.VITE_DATABASE_ACCESS;
const WEB_ADDRESS = import.meta.env.VITE_WEB_ADDRESS;

/***
 * Gets the user feed data given the ID of the user.
 */
export async function getFeed(userID) {
  // Get posts from connections from database.
  try {
    const response = await fetch(`${DATABASE}/${userID}/feed`);
    const feedData = await response.json();
    return feedData;
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
      }),
    });
  } catch {}
}

/***
 * Upvotes or downvotes post using endpoint.
 */
export async function upvotePost(postID, userID, newUpvotes) {
  try {
    const response = await fetch(`${DATABASE}/upvote/${postID}`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
      body: JSON.stringify({
        userID: userID,
        newUpvotes: newUpvotes,
      }),
    });
  } catch {}
}

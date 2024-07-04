const DATABASE = import.meta.env.VITE_DATABASE_ACCESS;

/***
 *
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
  } catch {}
}

/***
 * Creates a post given the information to be stored.
 */
export async function createPost(postInfo) {
  const { title, text, authorID, mediaURLs, date, timestamp } = postInfo;

  try {
    const response = await fetch(`${DATABASE}/create-post`);
  } catch {}
}

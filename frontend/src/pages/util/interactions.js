const DATABASE = import.meta.env.VITE_DATABASE_ACCESS;

/***
 * Creates an interaction instance in the interactions table
 */
export async function createInteraction(interactionInfo) {
  try {
    const {
      interactionDuration,
      date,
      timestamp,
      viewedProfile,
      viewedPost,
      postID,
      interactingUserID,
      targetUserID,
    } = interactionInfo;

    await fetch(`${DATABASE}/interaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        interactionDuration: interactionDuration,
        date: date,
        timestamp: timestamp,
        viewedProfile: viewedProfile,
        viewedPost: viewedPost,
        postID: postID,
        interactingUserID: interactingUserID,
        targetUserID: targetUserID,
      }),
    });
  } catch {}
}

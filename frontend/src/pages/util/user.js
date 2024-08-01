const DATABASE = import.meta.env.VITE_DATABASE_ACCESS;

/***
 * Updates a user's profile picture.
 */
export async function updateProfilePicture(profilePicture, userID) {
  await fetch(`${DATABASE}/profile/picture/${userID}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      profilePicture: profilePicture,
    }),
  });
}

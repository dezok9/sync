import { DATABASE } from "./data";

/***
  Check if credentials are unique before signup.
 */
export async function checkCredentials(userHandle, githubHandle, email) {
  const status = await fetch(`${DATABASE}/check-credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userHandle,
      githubHandle,
      email,
    }),
  });

  if (!status.ok) {
    return false;
  }

  return true;
}

import { DATABASE } from "./data";

/***
  Check if credentials are unique before signup.
 */
export async function checkCredentials(githubHandle) {
  const userHandleStatus = await fetch(`${DATABASE}/unique/userHandle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userHandle: { userHandle },
    }),
  });

  if (!userHandleStatus.ok) {
    return false;
  }

  const githubHandleStatus = await fetch(`${DATABASE}/unique/githubHandle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      githubHandle: { githubHandle },
    }),
  });

  if (!githubHandleStatus.ok) {
    return false;
  }

  const emailStatus = await fetch(`${DATABASE}/unique/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: { email },
    }),
  });

  if (!emailStatus.ok) {
    return false;
  }

  return true;
}

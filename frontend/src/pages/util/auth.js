import { DATABASE } from "./data";
import { checkCredentials } from "./userVerification";

const GITHUB_CODE_FETCH_URL = new URLSearchParams(
  new URL("https://github.com/login/oauth/authorize").search
);

/***
 * Handles user account creation.
 * Returns true or false depending on status of user creation.
 */
export async function handleSignUp(loginInfo) {
  const {
    firstName,
    lastName,
    userHandle,
    email,
    githubHandle,
    password,
    confirmPassword,
  } = loginInfo;

  if (
    !Object.values(loginInfo).some(
      (userInput) => userInput.replace(" ", "") === ""
    )
  ) {
    if (!(email && email.includes("."))) {
      // Invalid email address.
      return;
    }
    if (password !== confirmPassword) {
      // Passwords don't match.
      return;
    }
  } else {
    // Incomplete fields.
    return;
  }

  const areCredentialsUnique = checkCredentials(
    userHandle,
    githubHandle,
    email
  );

  if (areCredentialsUnique) {
    try {
      const userCreation = await fetch(`${DATABASE}/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          userHandle: userHandle,
          email: email,
          githubHandle: githubHandle,
          password: password,
        }),
      });

      return userCreation.ok;
    } catch (err) {}
  } else {
    return res.status;
  }
}

/***
 * Attempts to login.
 * Returns authentication key if successful or null otherwise.
 */
export async function handleLogin(user, password) {
  try {
    const validLogin = await fetch(`${DATABASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userHandle: user,
        password: password,
      }),
    });

    const userData = await validLogin.json();

    return [validLogin, userData.userData];
  } catch (err) {}
}

/***
 * Function for rerouting to GitHub for authentication.
 */
export async function githubAuth() {
  return;
}

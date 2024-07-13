import { Popup } from "../../components/Popup";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = import.meta.env.VITE_GITHUB_CLIENT_SECRET;
const GITHUB_PERSONAL_ACCESS_TOKEN = import.meta.env
  .VITE_GITHUB_PERSONAL_ACCESS_TOKEN;
const WEB_ADDRESS = import.meta.env.VITE_WEB_ADDRESS;
const HUNTER_API_KEY = import.meta.env.VITE_HUNTER_API_KEY;
const DATABASE = import.meta.env.VITE_DATABASE_ACCESS;

const GITHUB_IDENTITY_URL = "https://github.com/login/oauth/authorize";

/***
  Helper function to check if credentials are unique before signup.
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
      emailAPIKey: HUNTER_API_KEY,
      githubPersonalAccessToken: GITHUB_PERSONAL_ACCESS_TOKEN,
    }),
  });

  return status.ok;
}

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
    if (!(email && email.includes("@") && email.includes("."))) {
      // Invalid email address.
      return false;
    }

    if (password !== confirmPassword) {
      // Passwords don't match.
      return false;
    }
  } else {
    // Incomplete fields.
    return false;
  }

  const areCredentialsUnique = await checkCredentials(
    userHandle,
    githubHandle,
    email
  );

  if (await areCredentialsUnique) {
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
    // Credentials are not unique.
    return false;
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

    if (validLogin.ok) {
      const userData = await validLogin.json();

      return [validLogin, userData.userData];
    } else {
      return null;
    }
  } catch (err) {}
}

/***
 * Function for rerouting to GitHub for authentication.
 * Detailed instructions found here: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
 */
export async function getGithubIdentity(params) {
  // Retrieve user data, construct URL, & redirect for sign in.
  params["client_id"] = GITHUB_CLIENT_ID;
  const identityParams = new URLSearchParams(params);

  window.location.assign(`${GITHUB_IDENTITY_URL}?${identityParams}`);
}

/***
 * Function for retrieving the GitHub access token for endpoint access.
 * Detailed instructions found here: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
 */
export async function githubAuthentication() {
  const params = window.location.href.split("?")[1];
  const urlParams = new URLSearchParams(params);

  const code = urlParams.get("code");
  const state = urlParams.get("state");

  const clientID = GITHUB_CLIENT_ID;
  const clientSecret = GITHUB_CLIENT_SECRET;

  if (code && state) {
    if (state === localStorage.getItem("CSRFToken")) {
      const response = await fetch(`${DATABASE}/token-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientID: clientID,
          clientSecret: clientSecret,
          code: code,
        }),
      });

      const token = await response.json();

      if (token.access_token) {
        // Successful request and retrieval of token.
        // Store in database.
      } else {
        // Invalid or already fuffilled request for access token.
        if (localStorage.getItem("gitHubAuthToken")) {
          // Already fuffilled.
        } else {
          // Invalid request.
        }
      }
    } else {
      // Authentication failed.
    }

    window.location.assign(`${WEB_ADDRESS}/login`);
  } else {
    // Codes don't match.
  }
}

import { Popup } from "../../components/Popup";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = import.meta.env.VITE_GITHUB_CLIENT_ID;
const WEB_ADDRESS = import.meta.env.VITE_WEB_ADDRESS;
const DATABASE = import.meta.env.VITE_DATABASE_ACCESS;

const GITHUB_IDENTITY_URL = "https://github.com/login/oauth/authorize";
const GITHUB_ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";

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
    }),
  });

  return status.ok;
}

/***
 * Handles user account creation.
 * Returns true or false depending on status of user creation.
 */
export async function handleSignUp(
  loginInfo,
  validWarningOn,
  setValidWarningsOn
) {
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

    const userData = await validLogin.json();

    return [validLogin, userData.userData];
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

  const accessTokenParams = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    client_secret: GITHUB_CLIENT_SECRET,
    code: code,
    redirect_uri: `${WEB_ADDRESS}/login`,
  });

  if (state === localStorage.getItem("CSRFToken")) {
    window.location.assign(`${GITHUB_ACCESS_TOKEN_URL}?${accessTokenParams}`);
  } else {
    // Codes don't match.
  }
}

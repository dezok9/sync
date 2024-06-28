import { DATABASE } from "./data";
import { checkCredentials } from "./userVerification";

/***
 * Handles user account creation.
 * Navigates to new page with successful completion.
 */
export async function handleUserCreation(loginInfo) {
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

  const areCredentialsUnique = checkCredentials(loginInfo);

  if (areCredentialsUnique) {
    const user = await fetch(`${DATABASE}/create`, {
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
    return user;
  } else {
    return res.status;
  }
}

/***
 * Attempts to login.
 * Will inform the user if the provided credentials are incorrect.
 */
export async function login(user, password) {
  const res = await fetch(`${DATABASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user: user,
      password: password,
    }),
  });
}

import { DATABASE } from "./data";
import { checkCredentials } from "./userVerification";

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

    return validLogin.ok;
  } catch (err) {}
}

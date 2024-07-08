// Endpoints for login and authentication.

module.exports = function (app) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const cors = require("cors");
  const express = require("express");
  const expressValidator = require("express-validator");
  const bycrypt = require("bcrypt");

  const SALT_ROUNDS = 14;

  /***
   * Checks to see if credentials are unique before signup.
   * Additionally, checks for valid GitHub and email address.
   * Returns 200 (OK) if no records matching the provided handles are found in the database and verified fields.
   */
  app.post("/check-credentials", async (req, res) => {
    const { userHandle, githubHandle, email, emailAPIKey } = req.body;
    const databaseInfo = await prisma.user.findMany({
      where: {
        OR: [
          { userHandle: userHandle },
          { githubHandle: githubHandle },
          { email: email },
        ],
      },
    });

    // Checking if user exists.
    const validGithubUserResponse = await fetch(
      `https://api.github.com/users/${githubHandle}`
    );

    // Checking if email is valid.
    const emailValidationParams = new URLSearchParams({
      email: email,
      api_key: emailAPIKey,
    });

    const validEmailResponse = await fetch(
      `https://api.hunter.io/v2/email-verifier?${emailValidationParams}`,
      {
        method: "GET",
        "Content-Type": "application/json",
        Accept: "application/json",
      }
    );

    if (
      databaseInfo.length === 0 &&
      validGithubUserResponse.ok &&
      validEmailResponse.ok
    ) {
      // Return OK if unique and if GitHub's response after checking for a user is OK.
      res.status(200).json();
    } else {
      if (!validGithubUserResponse.ok) {
        res.status(404).json();
      } else if (!validEmailResponse.ok) {
        res.status(404).json();
      } else {
        res.status(409).json();
      }
    }
  });

  /***
   * Creates a new user.
   * Returns 201 if successful and 500 otherwise.
   */
  app.post("/create-user", async (req, res) => {
    const { firstName, lastName, userHandle, email, githubHandle, password } =
      req.body;

    bycrypt.hash(password, SALT_ROUNDS, async function (err, hashed) {
      try {
        await prisma.user.create({
          data: {
            firstName: firstName,
            lastName: lastName,
            userHandle: userHandle,
            email: email,
            githubHandle: githubHandle,
            encryptedPassword: hashed,
          },
        });

        res.status(201).json();
      } catch (err) {
        res.status(500).json({ "error:": err.message });
      }
    });
  });

  /***
   * Gets the user's GitHub authentication token and returns it.
   */
  app.post("/token-auth", async (req, res) => {
    const GITHUB_ACCESS_TOKEN_URL =
      "https://github.com/login/oauth/access_token";

    const { clientID, clientSecret, code } = req.body;

    const accessTokenParams = new URLSearchParams({
      client_id: clientID,
      client_secret: clientSecret,
      code: code,
    });

    const fetchURL = `${GITHUB_ACCESS_TOKEN_URL}?${accessTokenParams}`;

    const response = await fetch(fetchURL, {
      headers: {
        method: "POST",
        Accept: "application/json",
      },
    });

    const token = await response.json();

    if (token.access_token) {
      // If successful, hash and store token.
      res.status(200).json(token);
    } else {
      // Invalid or already fuffilled request for access token.
      if (true) {
        // Already fuffilled.
        // Fetch access code from database and return.
        res.status(200).json();
      } else {
        // Invalid request.
      }
    }
  });

  /***
   * Attempts to log in using the provided credentials.
   * Returns 200 for successful log in attempt and a 401 otherwise.
   */
  app.post("/login", async (req, res) => {
    const { userHandle, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { userHandle: userHandle },
    });

    bycrypt.compare(password, user.encryptedPassword, function (err, valid) {
      if (valid) {
        const userData = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          githubHandle: user.githubHandle,
          email: user.email,
          userHandle: user.userHandle,
          businessAccount: user.businessAccount,
        };

        res.status(200).json({ userData });
      } else {
        res.status(401).json({ "error:": err });
      }
    });
  });
};

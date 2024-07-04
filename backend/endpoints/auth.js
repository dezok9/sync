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
   * Returns 200 (OK) if no records matching the provided handles are found in the database.
   */
  app.post("/check-credentials", async (req, res) => {
    const { userHandle, githubHandle, email } = req.body;
    const databaseInfo = await prisma.user.findMany({
      where: {
        OR: [
          { userHandle: userHandle },
          { githubHandle: githubHandle },
          { email: email },
        ],
      },
    });

    if (databaseInfo.length === 0) {
      // Return OK if unique.
      res.status(200).json();
    } else {
      res.status(409).json();
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

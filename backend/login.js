const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient
const cors = require('cors')
const express = require('express')

const app = express();
app.use(express.json());
app.use(cors());

// Endpoints for login and authentication.

/***
 * Attempts to log in using the provided credentials.
 * Returns 200 for successful log in attempt and a 401 otherwise.
 */
app.get("/login", async (req, res) => {
    res.send().json()
})

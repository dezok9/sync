const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cors = require("cors");
const express = require("express");

const app = express();
app.use(express.json());
app.use(cors());

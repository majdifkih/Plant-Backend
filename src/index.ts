import express, { Request, Response } from "express";
import dotenv from "dotenv";
import prisma from "./utils/db";
import testDatabaseConnection from "./utils/dbconn";
import Auth from "./routes/authRoutes";
import Post from "./routes/postRoutes";
import Plant from "./routes/plantRoutes";
import Versions from "./routes/versionRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const cors = require("cors");

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.use("/api/auth", Auth);
app.use("/api/plants", Plant);
app.use("/api/posts", Post);
app.use("/api/plants", Versions);

async function startServer() {
  await testDatabaseConnection().then(() => {
    try {
      app.listen(port, () => {
        console.log(`🟢 Server is running on port ${port}`);
      });
    } catch (error) {
      console.log(`🔴`, error);
      if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    }
  });
}

startServer();


export default app;

import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import cors from "cors";
import { UserContextFactory } from "./user-context/userContextFactory";
import { UserController } from "./user-context/infrastructure/userController";

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/test-db";

app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from MEVN backend!" });
});

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", db: mongoose.connection.readyState });
});

app.get("/api/message", async (req: Request, res: Response) => {
  try {
    const extApiRes = await fetch("http://ext-api-service:8080/api/mock");
    if (extApiRes.ok) {
      const data = await extApiRes.json();
      res.json({
        text: `Success: Backend received "${data.message}" from external service.`,
      });
    } else {
      res.json({
        text:
          "Error: Call to external service failed with status " +
          extApiRes.status,
      });
    }
  } catch {
    res.json({ text: "Error: Could not reach external service." });
  }
});

// Database connection
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Backend is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

async function bootstrap() {
  try {
    // TODO: use an environment variable
    await mongoose.connect(MONGO_URI);
    const mongoClient =
      mongoose.connection.getClient() as unknown as MongoClient;

    const authContext = UserContextFactory.create();
    const authController = new UserController(authContext.authPort);

    app.post("/api/login", (req, res) => authController.login(req, res));

    // TODO: use an environment variable
    app.listen(3000, () => {
      console.log("Server started on http://localhost:3000/");
    });
  } catch (error) {
    console.error("Error starting the server: ", error);
    process.exit(1);
  }
}

bootstrap();

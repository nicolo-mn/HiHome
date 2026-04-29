import "dotenv/config";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import { UserContextFactory } from "./user-context/userContextFactory";
import { UserController } from "./user-context/infrastructure/userController";
import { authMiddleware } from "./authMiddleware";

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/test-db";

app.use(cors());
app.use(express.json());

const authContext = UserContextFactory.create();
const authController = new UserController(authContext.authPort);

app.post("/api/login", (req, res) => authController.login(req, res));

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", db: mongoose.connection.readyState });
});

app.use(authMiddleware);

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Protected: Hello from MEVN backend!" });
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

export async function bootstrap() {
  try {
    await mongoose.connect(MONGO_URI);
    app.listen(PORT, () => {
      console.log(`Backend is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server: ", error);
  }
}

if (process.env.NODE_ENV !== "test") {
  bootstrap();
}

export default app;

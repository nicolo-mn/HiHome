import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";

// User Context
import { MongoUserRepository } from "./user-context/infrastructure/mongo-user-repository";
import { LoginService } from "./user-context/application/login-service";
import { createUserRoutes } from "./user-context/infrastructure/user-routes";
import { seedUsers } from "./user-context/infrastructure/seed-users";

// Core Context
import { MongoComponentRepository } from "./core-context/infrastructure/mongo-component-repository";
import { HomeService } from "./core-context/application/home-service";
import { createHomeRoutes } from "./core-context/infrastructure/home-routes";
import { setupSensorWebSocket } from "./core-context/infrastructure/sensor-websocket";
import { seedComponents } from "./core-context/infrastructure/seed-components";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hihome";

app.use(cors());
app.use(express.json());

// --- Wire up User Context ---
const userRepository = new MongoUserRepository();
const loginService = new LoginService(userRepository);
app.use("/api/users", createUserRoutes(loginService));

// --- Wire up Core Context ---
const componentRepository = new MongoComponentRepository();
const homeService = new HomeService(componentRepository);
app.use("/api/homes", createHomeRoutes(homeService));

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", db: mongoose.connection.readyState });
});

// Create HTTP server for both Express and WebSocket
const server = http.createServer(app);

// Attach WebSocket for sensor streaming
setupSensorWebSocket(server, homeService);

// Database connection and server start
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    // Seed data
    await seedUsers();
    await seedComponents();

    server.listen(PORT, () => {
      console.log(`Backend is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

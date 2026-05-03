import "dotenv/config";
import express, { Request, Response } from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import { UserContextFactory } from "./user-context/userContextFactory";
import { UserController } from "./user-context/infrastructure/userController";
import { authMiddleware } from "./authMiddleware";
import { InMemoryHomeRepository } from "./home-context/infrastructure/inMemoryHomeRepository";
import { SocketIOSensorUpdatePort } from "./home-context/infrastructure/socketIOSensorUpdatePort";
import { HomeService } from "./home-context/application/homeService";
import { HomeController } from "./home-context/infrastructure/homeController";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*" } });

const sensorUpdatePort = new SocketIOSensorUpdatePort(io, "1");
const homeRepo = new InMemoryHomeRepository(sensorUpdatePort);
const homeService = new HomeService(homeRepo);
const homeController = new HomeController(homeService);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/test-db";

app.use(cors());
app.use(express.json());

const authContext = UserContextFactory.create();
const authController = new UserController(authContext.authPort);

app.post("/api/login", (req, res) => authController.login(req, res));

// --- Home Context routes ---
app.get("/home/:id/components/types", (req, res) =>
  homeController.getComponentTypes(req, res),
);
app.get("/home/:id/components/types/:type", (req, res) =>
  homeController.getComponentsByType(req, res),
);
app.get("/home/:id/components", (req, res) =>
  homeController.getComponents(req, res),
);
app.post("/home/:id/components", (req, res) =>
  homeController.addComponent(req, res),
);
app.get("/home/:id/components/:componentId", (req, res) =>
  homeController.getComponent(req, res),
);
app.post("/home/:id/components/:componentId/:action", (req, res) => {
  homeController.executeAction(req, res);
});
app.get("/home/:id/sensors/types", (req, res) =>
  homeController.getSensorTypes(req, res),
);

// --- Socket.IO for sensor updates ---
const activeHomes = new Map<
  string,
  { count: number; interval: NodeJS.Timeout }
>();

io.on("connection", (socket) => {
  const homeId = socket.handshake.query.homeId as string;
  if (!homeId) {
    socket.disconnect();
    return;
  }

  socket.join(`home-${homeId}`);

  const entry = activeHomes.get(homeId);
  if (entry) {
    entry.count++;
  } else {
    const interval = setInterval(async () => {
      try {
        const home = await homeRepo.getHome(homeId);
        if (home) {
          home.getAllSensors().forEach((sensor) => sensor.sendUpdate());
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000);
    activeHomes.set(homeId, { count: 1, interval });
  }

  socket.on("disconnect", () => {
    const e = activeHomes.get(homeId);
    if (e) {
      e.count--;
      if (e.count <= 0) {
        clearInterval(e.interval);
        activeHomes.delete(homeId);
      }
    }
  });
});

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
    server.listen(PORT, () => {
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
export { server, io };

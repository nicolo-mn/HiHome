import "dotenv/config";
import express, { Request, Response } from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import mongoose from "mongoose";
import cors from "cors";
import { UserContextFactory } from "./user-context/userContextFactory";
import { UserController } from "./user-context/infrastructure/userController";
import { authMiddleware } from "./authMiddleware";
import {
  InMemoryHomeRepository,
  globalWsPort,
} from "./home-context/infrastructure/inMemoryHomeRepository";
import { HomeService } from "./home-context/application/homeService";
import { HomeController } from "./home-context/infrastructure/homeController";
import { SensorUpdate } from "./home-context/domain";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const homeRepo = new InMemoryHomeRepository();
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
app.get("/home-:id/components/types", (req, res) =>
  homeController.getComponentTypes(req, res),
);
app.get("/home-:id/components/:type", (req, res, next) => {
  if (req.params.type === "light" || req.params.type === "thermometer") {
    homeController.getComponentsByType(req, res);
  } else {
    next();
  }
});
app.get("/home-:id/components", (req, res) =>
  homeController.getComponents(req, res),
);
app.post("/home-:id/components", (req, res) =>
  homeController.addComponent(req, res),
);
app.get("/home-:id/components/:componentId", (req, res) =>
  homeController.getComponent(req, res),
);
app.post("/home-:id/components/:componentId/:action", (req, res, next) => {
  homeController.executeAction(req, res);
});
app.get("/home-:id/sensors/types", (req, res) =>
  homeController.getSensorTypes(req, res),
);

// --- WebSocket for sensor updates ---
wss.on("connection", (ws: WebSocket, req) => {
  const url = req.url || "";
  const match = url.match(/\/home-(.+)/);
  if (match) {
    const homeId = match[1];

    const onSensorData = (update: SensorUpdate) => {
      ws.send(
        JSON.stringify({
          event: "sensorUpdate",
          type: "thermometer",
          ...update,
        }),
      );
    };
    globalWsPort.listeners.push(onSensorData);

    const interval = setInterval(async () => {
      try {
        const home = await homeRepo.getHome(homeId);
        if (home) {
          home.getAllSensors().forEach((sensor) => {
            sensor.sendUpdate();
          });
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000);

    ws.on("close", () => {
      clearInterval(interval);
      globalWsPort.listeners = globalWsPort.listeners.filter(
        (l) => l !== onSensorData,
      );
    });
  } else {
    ws.close();
  }
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
export { server };

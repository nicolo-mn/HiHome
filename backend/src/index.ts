import "dotenv/config";
import express, { Request, Response } from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import { UserContextFactory } from "./user-context/UserContextFactory";
import { UserController } from "./user-context/infrastructure/UserController";
import { authMiddleware } from "./home-context/infrastructure/middlewares/RoutesMiddlewares";
import { InMemoryHomeRepository } from "./home-context/infrastructure/InMemoryHomeRepository";
import { MongoHomeRepository } from "./home-context/infrastructure/MongoHomeRepository";
import { SocketIOSensorUpdateAdapter } from "./home-context/infrastructure/SocketIOSensorUpdateAdapter";
import { HomeService } from "./home-context/application/HomeService";
import { HomeController } from "./home-context/infrastructure/controllers/HomeController";
import { NotificationContextFactory } from "./notification-context/NotificationContextFactory";
import { ChatService } from "./home-context/application/ChatService";
import { ChatController } from "./home-context/infrastructure/controllers/ChatController";
import { HomeRouter } from "./home-context/infrastructure/routes/HomeRouter";
import { ExtApiServiceDataAdapter } from "./home-context/infrastructure/ExtApiServiceDataAdapter";
import {
  wsAuthMiddleware,
  wsHomeIdMiddleware,
} from "./home-context/infrastructure/middlewares/WebSocketMiddlewares";
import { RuleService } from "./rule-context/application/RuleService";
import { InMemoryRuleRepository } from "./rule-context/infrastructure/InMemoryRuleRepository";
import { MongoRuleRepository } from "./rule-context/infrastructure/MongoRuleRepository";
import { RuleController } from "./rule-context/infrastructure/controllers/RuleController";
import { RuleRouter } from "./rule-context/infrastructure/routes/RuleRouter";
import { NotificationController } from "./notification-context/infrastructure/controllers/NotificationController";
import { NotificationRouter } from "./notification-context/infrastructure/routes/NotificationRouter";
import { AsyncBus } from "./rule-context/infrastructure/AsyncBus";
import { EventEmitter } from "events";
import { ActionExecutionAdapter } from "./rule-context/infrastructure/ActionExecutionAdapter";
import { InMemorySensorRegistry } from "./home-context/infrastructure/InMemorySensorRegistry";
import { seedDatabase } from "./bootstrap/seedDatabase";
import { AsyncBusRuleServiceAdapter } from "./home-context/infrastructure/AsyncBusRuleServiceAdapter";
import { HomeRepository } from "./home-context/domain";
import { NotificationContextAdapter } from "./home-context/infrastructure/NotificationPortAdapter";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*" } });

const notificationContext = NotificationContextFactory.create(io);
const homeNotificationPort = new NotificationContextAdapter(
  notificationContext.notificationPort,
);
const notificationController = new NotificationController(
  notificationContext.notificationPort,
);
const notificationRouter = new NotificationRouter(notificationController);

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
const DEEPSEEK_API_BASE_URL =
  process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com";
const EXT_API_BASE_URL =
  process.env.EXT_API_BASE_URL || "http://ext_api_service:8080";
const CHAT_MAX_HISTORY = Number(process.env.CHAT_MAX_HISTORY || 20);

// --- Home Context Setup ---
const sensorUpdatePort = new SocketIOSensorUpdateAdapter(homeNotificationPort);
const eventEmitter = new EventEmitter();
const ruleServicePort = new AsyncBusRuleServiceAdapter(
  eventEmitter,
  "observables-updated",
);
const externalSensorsDataPort = new ExtApiServiceDataAdapter(EXT_API_BASE_URL);
const sensorRegistry = new InMemorySensorRegistry();
const homeRepo =
  process.env.NODE_ENV === "test"
    ? new InMemoryHomeRepository()
    : new MongoHomeRepository();
const homeService = new HomeService(
  homeRepo,
  sensorRegistry,
  sensorUpdatePort,
  ruleServicePort,
  externalSensorsDataPort,
);
export const homeController = new HomeController(
  homeService,
  homeNotificationPort,
);
const homeRouter = new HomeRouter(homeController);

// --- Rule Context Setup ---
const ruleRepo =
  process.env.NODE_ENV === "test"
    ? new InMemoryRuleRepository()
    : new MongoRuleRepository();
const actionExecutor = new ActionExecutionAdapter(homeService);
const ruleService = new RuleService(ruleRepo, actionExecutor);
export const ruleController = new RuleController(ruleService);
const ruleRouter = new RuleRouter(ruleController);
const ruleBus = new AsyncBus(eventEmitter, "observables-updated", ruleService);

// --- User context setup ---
const authContext = UserContextFactory.create();
const authController = new UserController(authContext.authPort);

const chatService = new ChatService(homeService, {
  apiKey: DEEPSEEK_API_KEY,
  model: DEEPSEEK_MODEL,
  apiBaseUrl: DEEPSEEK_API_BASE_URL,
  extApiBaseUrl: EXT_API_BASE_URL,
  maxHistory: CHAT_MAX_HISTORY,
});
const chatController = new ChatController(chatService);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/test-db";

// --- Routes and Middlewares setup ---
app.use(cors());
app.use(express.json());

// --- Non authenticated routes ---
app.post("/api/login", (req, res) => authController.login(req, res));
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", db: mongoose.connection.readyState });
});
app.post("/api/home/:id/sensors/internal-temperature", (req, res) => {
  homeController.updateInternalTemperature(req, res);
});

// --- Authenticated routes ---
app.use(authMiddleware);
app.use("/api/home", homeRouter.router);
app.use("/api/home", ruleRouter.router);
app.use("/api/home", notificationRouter.router);
// --- Socket.IO for sensor updates ---
io.use(wsAuthMiddleware);
io.use(wsHomeIdMiddleware);

const EXTERNAL_SENSORS_POLL_INTERVAL_MS = Number(
  process.env.EXTERNAL_SENSORS_POLL_INTERVAL_MS || 200000,
);

setInterval(async () => {
  try {
    await homeService.pollAllHomesExternalSensorsData();
  } catch (error) {
    console.error("Error polling external sensors data:", error);
  }
}, EXTERNAL_SENSORS_POLL_INTERVAL_MS);

io.on("connection", (socket) => {
  const homeId = socket.handshake.query.homeId as string;
  if (!homeId) {
    socket.disconnect();
    return;
  }

  socket.join(`home-${homeId}`);
  void sensorUpdatePort.registerClient(homeId, socket);

  socket.on(
    "chat:send",
    async (
      payload: {
        message?: string;
        username?: string;
        history?: Array<{ role: "user" | "assistant"; content: string }>;
      },
      callback?: (response: { reply?: string; error?: string }) => void,
    ) => {
      const respond = (response: { reply?: string; error?: string }) => {
        if (typeof callback === "function") {
          callback(response);
        }
      };

      if (!payload?.message || !payload.username) {
        respond({ error: "Message and username are required" });
        return;
      }

      try {
        const safeHistory = Array.isArray(payload.history)
          ? payload.history
          : [];
        const reply = await chatService.chat(
          homeId,
          payload.username,
          payload.message,
          safeHistory,
        );
        respond({ reply });
      } catch (error: any) {
        respond({ error: error.message ?? "Chat failed" });
      }
    },
  );
});

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Protected: Hello from MEVN backend!" });
});

app.post("/api/chat", (req: Request, res: Response) => {
  chatController.chat(req, res);
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
    await seedDatabase(homeRepo);
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
export { server, io, sensorRegistry };

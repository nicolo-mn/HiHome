import "dotenv/config";
import express, { Request, Response } from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import { UserContextFactory } from "./user-context/UserContextFactory";
import { UserController } from "./user-context/infrastructure/controllers/UserController";
import { authMiddleware } from "./home-context/infrastructure/middlewares/RoutesMiddlewares";
import { InMemoryHomeRepository } from "./home-context/infrastructure/repositories/InMemoryHomeRepository";
import { MongoHomeRepository } from "./home-context/infrastructure/repositories/MongoHomeRepository";
import { SocketIOSensorUpdateAdapter } from "./home-context/infrastructure/adapters/SocketIOSensorUpdateAdapter";
import { SocketIODeviceUpdateAdapter } from "./home-context/infrastructure/adapters/SocketIODeviceUpdateAdapter";
import { HomeService } from "./home-context/application/services/HomeService";
import { ActionService } from "./home-context/application/services/ActionService";
import { UsageService } from "./home-context/application/services/UsageService";
import { HomeController } from "./home-context/infrastructure/controllers/HomeController";
import { UsageController } from "./home-context/infrastructure/controllers/UsageController";
import { NotificationContextFactory } from "./notification-context/NotificationContextFactory";
import { UserContextAdapter } from "./notification-context/infrastructure/adapters/UserContextAdapter";
import { PreferencesController } from "./notification-context/infrastructure/controllers/PreferencesController";
import { PreferencesRouter } from "./notification-context/infrastructure/routes/PreferencesRouter";
import { UserManagementController } from "./user-context/infrastructure/controllers/UserManagementController";
import { UserRouter } from "./user-context/infrastructure/routes/UserRouter";
import { ChatService } from "./home-context/application/services/ChatService";

import { HomeRouter } from "./home-context/infrastructure/routes/HomeRouter";
import { ExtApiServiceDataAdapter } from "./home-context/infrastructure/adapters/ExtApiServiceDataAdapter";
import { DeepSeekChatCompletionAdapter } from "./home-context/infrastructure/adapters/DeepSeekChatCompletionAdapter";
import {
  wsAuthMiddleware,
  wsHomeIdMiddleware,
} from "./home-context/infrastructure/middlewares/WebSocketMiddlewares";
import { RuleService } from "./rule-context/application/services/RuleService";
import { InMemoryRuleRepository } from "./rule-context/infrastructure/repositories/InMemoryRuleRepository";
import { MongoRuleRepository } from "./rule-context/infrastructure/repositories/MongoRuleRepository";
import { RuleController } from "./rule-context/infrastructure/controllers/RuleController";
import { RuleRouter } from "./rule-context/infrastructure/routes/RuleRouter";
import { NotificationController } from "./notification-context/infrastructure/controllers/NotificationController";
import { NotificationRouter } from "./notification-context/infrastructure/routes/NotificationRouter";
import { AsyncBus } from "./rule-context/infrastructure/AsyncBus";
import { EventEmitter } from "events";
import { ActionExecutionAdapter } from "./rule-context/infrastructure/adapters/ActionExecutionAdapter";
import { NotificationContextAdapter as RuleNotificationContextAdapter } from "./rule-context/infrastructure/adapters/NotificationContextAdapter";
import { HomeServiceDeviceNameResolver } from "./rule-context/infrastructure/adapters/HomeServiceDeviceNameResolver";
import { HomeServiceRuleEvaluationTrigger } from "./rule-context/infrastructure/adapters/HomeServiceRuleEvaluationTrigger";
import { InMemorySensorRegistry } from "./home-context/infrastructure/InMemorySensorRegistry";
import { InMemoryHistoricalWeatherRepository } from "./home-context/infrastructure/repositories/InMemoryHistoricalWeatherRepository";
import { seedDatabase } from "./bootstrap/seedDatabase";
import { AsyncBusRuleServiceAdapter } from "./home-context/infrastructure/adapters/AsyncBusRuleServiceAdapter";
import { RuleServiceRuleUsageAdapter } from "./home-context/infrastructure/adapters/RuleServiceRuleUsageAdapter";
import { NotificationContextAdapter } from "./home-context/infrastructure/adapters/NotificationPortAdapter";
import { SocketIOChatStreamAdapter } from "./home-context/infrastructure/adapters/SocketIOChatStreamAdapter";
import { ChatStreamEventType } from "./home-context/application/ports/ChatStreamPort";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*" } });

// --- User context setup (must happen before notification context) ---
const authContext = UserContextFactory.create();
const authController = new UserController(authContext.authPort);
const userManagementController = new UserManagementController(
  authContext.userManagementService,
);
const userRouter = new UserRouter(userManagementController);

const userContextAdapter = new UserContextAdapter(
  authContext.userManagementService,
);
const notificationContext = NotificationContextFactory.create(
  io,
  userContextAdapter,
);
const preferencesController = new PreferencesController(
  notificationContext.preferencesService,
);
const preferencesRouter = new PreferencesRouter(preferencesController);
const homeNotificationPort = new NotificationContextAdapter(
  notificationContext.notificationPort,
);
const notificationController = new NotificationController(
  notificationContext.notificationPort,
);
const notificationRouter = new NotificationRouter(notificationController);

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";
const DEEPSEEK_API_BASE_URL =
  process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com";
const EXT_API_BASE_URL =
  process.env.EXT_API_BASE_URL || "http://ext_api_service:8080";
const CHAT_MAX_HISTORY = Number(process.env.CHAT_MAX_HISTORY || 30);
const OUTDOOR_SENSORS_POLL_INTERVAL_MS = Number(
  process.env.OUTDOOR_SENSORS_POLL_INTERVAL_MS || 200000,
);
const HOUR_IN_MS = 60 * 60 * 1000;

// --- Home Context Setup ---
const sensorUpdatePort = new SocketIOSensorUpdateAdapter(
  io,
  homeNotificationPort,
);
const deviceUpdatePort = new SocketIODeviceUpdateAdapter(io);
const eventEmitter = new EventEmitter();
const ruleServicePort = new AsyncBusRuleServiceAdapter(
  eventEmitter,
  "observables-updated",
);
const outdoorSensorsDataPort = new ExtApiServiceDataAdapter(EXT_API_BASE_URL);
const sensorRegistry = new InMemorySensorRegistry();
const historicalWeatherRepo = new InMemoryHistoricalWeatherRepository();
const homeRepo =
  process.env.NODE_ENV === "test"
    ? new InMemoryHomeRepository()
    : new MongoHomeRepository();
const ruleUsagePort = new RuleServiceRuleUsageAdapter(
  (): RuleService => ruleService,
);
const homeService = new HomeService(
  homeRepo,
  sensorRegistry,
  sensorUpdatePort,
  ruleServicePort,
  outdoorSensorsDataPort,
  deviceUpdatePort,
  ruleUsagePort,
);
export const homeController = new HomeController(
  homeService,
  homeNotificationPort,
);
const usageService = new UsageService(homeRepo, historicalWeatherRepo);
const usageController = new UsageController(usageService);
const homeRouter = new HomeRouter(homeController, usageController);

// --- Rule Context Setup ---
const ruleRepo =
  process.env.NODE_ENV === "test"
    ? new InMemoryRuleRepository()
    : new MongoRuleRepository();
const actionService = new ActionService(homeRepo, deviceUpdatePort);
const actionExecutor = new ActionExecutionAdapter(actionService);
const ruleNotificationAdapter = new RuleNotificationContextAdapter(
  notificationContext.notificationPort,
);
const deviceNameResolver = new HomeServiceDeviceNameResolver(homeService);
const ruleEvaluationTrigger = new HomeServiceRuleEvaluationTrigger(homeService);
const ruleService = new RuleService(
  ruleRepo,
  actionExecutor,
  ruleNotificationAdapter,
  deviceNameResolver,
  ruleEvaluationTrigger,
);
export const ruleController = new RuleController(ruleService);
const ruleRouter = new RuleRouter(ruleController);
const ruleBus = new AsyncBus(eventEmitter, "observables-updated", ruleService);

const forecastPort = outdoorSensorsDataPort;
const chatCompletionPort = new DeepSeekChatCompletionAdapter(
  {
    apiKey: DEEPSEEK_API_KEY,
    apiBaseUrl: DEEPSEEK_API_BASE_URL,
  },
  forecastPort,
  homeService,
  ruleService,
);
const chatService = new ChatService(chatCompletionPort, homeService, {
  model: DEEPSEEK_MODEL,
  maxHistory: CHAT_MAX_HISTORY,
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/test-db";

// --- Routes and Middlewares setup ---
app.use(cors());
app.use(express.json());

// --- Non authenticated routes ---
app.post("/api/v1/login", (req, res) => authController.login(req, res));
app.get("/api/v1/health", (req: Request, res: Response) => {
  res.json({ status: "ok", db: mongoose.connection.readyState });
});
app.post("/api/v1/home/:id/sensors/indoor-temperature", (req, res) => {
  homeController.updateIndoorTemperature(req, res);
});

// --- Authenticated routes ---
app.use(authMiddleware);
app.use("/api/v1/home", homeRouter.router);
app.use("/api/v1/home", ruleRouter.router);
app.use("/api/v1/home", notificationRouter.router);
app.use("/api/v1/home", preferencesRouter.router);
app.use("/api/v1/home", userRouter.router);

// --- Socket.IO ---
io.use(wsAuthMiddleware);
io.use(wsHomeIdMiddleware);

io.on("connection", (socket) => {
  const homeId = socket.handshake.query.homeId as string;
  if (!homeId) {
    socket.disconnect();
    return;
  }

  socket.join(`home-${homeId}`);
  const username = (socket as any).user?.username;
  if (typeof username === "string" && username.length > 0) {
    socket.join(`user-${username}`);
  }
  void homeService.sendOutdoorSensorsUpdate(homeId).catch((error) => {
    console.error(
      `Failed to send outdoor sensors snapshot for home ${homeId}:`,
      error,
    );
  });
  void homeService.sendIndoorSensorsUpdate(homeId).catch((error) => {
    console.error(
      `Failed to send indoor sensors snapshot for home ${homeId}:`,
      error,
    );
  });

  socket.on(
    "chat:send",
    async (
      payload: {
        message?: string;
        username?: string;
        history?: Array<{ role: "user" | "assistant"; content: string }>;
      },
      callback?: (response: { error?: string }) => void,
    ) => {
      const ack = (response: { error?: string }) => {
        if (typeof callback === "function") {
          callback(response);
        }
      };

      if (!payload?.message || !payload.username) {
        ack({ error: "Message and username are required" });
        return;
      }

      ack({});

      const chatStreamPort = new SocketIOChatStreamAdapter(socket);

      const isAdmin = ((socket as any).user as any)?.role === "Admin";

      try {
        const safeHistory = Array.isArray(payload.history)
          ? payload.history
          : [];
        const reply = await chatService.streamChat(
          homeId,
          payload.username,
          payload.message,
          safeHistory,
          chatStreamPort,
          isAdmin,
        );
        chatStreamPort.emit({
          type: ChatStreamEventType.Done,
          content: reply,
        });
      } catch (error: any) {
        const message = error.message ?? "Chat failed";
        chatStreamPort.emit({
          type: ChatStreamEventType.Error,
          error: message,
        });
      }
    },
  );
});

// --- Scheduling helpers (defined here, called only inside bootstrap) ---
const runUpdate = () => {
  void homeService.applyHourlyTemperaturePlan().catch((error) => {
    console.error("Error applying hourly temperature plan:", error);
  });
};

const pollHistoricalWeatherData = async () => {
  const homes = await homeRepo.getAllHomes();

  await Promise.all(
    homes.map(async (home) => {
      try {
        const summary = await outdoorSensorsDataPort.getHistoricalSummary(
          home.coordinates,
        );
        if (!summary) return;
        historicalWeatherRepo.setForHome(home.id, summary);
      } catch (error) {
        console.error(
          `Error fetching historical weather data for home ${home.id}:`,
          error,
        );
      }
    }),
  );
};

const scheduleHourlyPlanUpdates = () => {
  runUpdate();
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(now.getHours() + 1);
  const delay = nextHour.getTime() - now.getTime();
  setTimeout(() => {
    runUpdate();
    setInterval(() => runUpdate(), HOUR_IN_MS);
  }, delay);
};

export async function bootstrap() {
  try {
    await mongoose.connect(MONGO_URI);
    await seedDatabase(homeRepo, ruleRepo);

    await homeService.pollAllHomesOutdoorSensorsData();
    await pollHistoricalWeatherData();
    await scheduleHourlyPlanUpdates();
    setInterval(() => {
      void pollHistoricalWeatherData();
    }, HOUR_IN_MS);
    setInterval(async () => {
      try {
        await homeService.pollAllHomesOutdoorSensorsData();
      } catch (error) {
        console.error("Error polling outdoor sensors data:", error);
      }
    }, OUTDOOR_SENSORS_POLL_INTERVAL_MS);

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

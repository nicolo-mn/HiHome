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
import { SocketIOComponentUpdateAdapter } from "./home-context/infrastructure/adapters/SocketIOComponentUpdateAdapter";
import { HomeService } from "./home-context/application/services/HomeService";
import { ActionService } from "./home-context/application/services/ActionService";
import { UsageService } from "./home-context/application/services/UsageService";
import { HomeController } from "./home-context/infrastructure/controllers/HomeController";
import { UsageController } from "./home-context/infrastructure/controllers/UsageController";
import { NotificationContextFactory } from "./notification-context/NotificationContextFactory";
import { UserPreferencesAdapter } from "./user-context/infrastructure/repositories/adapters/UserPreferencesAdapter";
import { PreferencesController } from "./user-context/infrastructure/controllers/PreferencesController";
import { PreferencesRouter } from "./user-context/infrastructure/routes/PreferencesRouter";
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
import { HomeServiceComponentNameResolver } from "./rule-context/infrastructure/adapters/HomeServiceComponentNameResolver";
import { InMemorySensorRegistry } from "./home-context/infrastructure/InMemorySensorRegistry";
import { InMemoryHistoricalWeatherRepository } from "./home-context/infrastructure/repositories/InMemoryHistoricalWeatherRepository";
import { seedDatabase } from "./bootstrap/seedDatabase";
import { AsyncBusRuleServiceAdapter } from "./home-context/infrastructure/adapters/AsyncBusRuleServiceAdapter";
import { NotificationContextAdapter } from "./home-context/infrastructure/adapters/NotificationPortAdapter";
import { SocketIOChatStreamAdapter } from "./home-context/infrastructure/adapters/SocketIOChatStreamAdapter";
import { ChatStreamEventType } from "./home-context/application/ports/ChatStreamPort";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*" } });

// --- User context setup (must happen before notification context) ---
const authContext = UserContextFactory.create();
const authController = new UserController(authContext.authPort);
const userPreferencesAdapter = new UserPreferencesAdapter(
  authContext.preferencesRepository,
);
const preferencesController = new PreferencesController(
  authContext.preferencesRepository,
);
const preferencesRouter = new PreferencesRouter(preferencesController);
const userManagementController = new UserManagementController(
  authContext.userManagementService,
);
const userRouter = new UserRouter(userManagementController);

const notificationContext = NotificationContextFactory.create(
  io,
  userPreferencesAdapter,
);
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
const CHAT_MAX_HISTORY = Number(process.env.CHAT_MAX_HISTORY || 30);
const EXTERNAL_SENSORS_POLL_INTERVAL_MS = Number(
  process.env.EXTERNAL_SENSORS_POLL_INTERVAL_MS || 200000,
);
const HOUR_IN_MS = 60 * 60 * 1000;

// --- Home Context Setup ---
const sensorUpdatePort = new SocketIOSensorUpdateAdapter(
  io,
  homeNotificationPort,
);
const componentUpdatePort = new SocketIOComponentUpdateAdapter(io);
const eventEmitter = new EventEmitter();
const ruleServicePort = new AsyncBusRuleServiceAdapter(
  eventEmitter,
  "observables-updated",
);
const externalSensorsDataPort = new ExtApiServiceDataAdapter(EXT_API_BASE_URL);
const sensorRegistry = new InMemorySensorRegistry();
const historicalWeatherRepo = new InMemoryHistoricalWeatherRepository();
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
  componentUpdatePort,
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
const actionService = new ActionService(homeRepo, componentUpdatePort);
const actionExecutor = new ActionExecutionAdapter(actionService);
const ruleNotificationAdapter = new RuleNotificationContextAdapter(
  notificationContext.notificationPort,
);
const componentNameResolver = new HomeServiceComponentNameResolver(homeService);
const ruleService = new RuleService(
  ruleRepo,
  actionExecutor,
  ruleNotificationAdapter,
  componentNameResolver,
);
export const ruleController = new RuleController(ruleService);
const ruleRouter = new RuleRouter(ruleController);
const ruleBus = new AsyncBus(eventEmitter, "observables-updated", ruleService);

const forecastPort = externalSensorsDataPort;
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
app.use("/api/home", preferencesRouter.router);
app.use("/api/home", userRouter.router);

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
  void homeService.sendExternalSensorsUpdate(homeId).catch((error) => {
    console.error(
      `Failed to send external sensors snapshot for home ${homeId}:`,
      error,
    );
  });
  void homeService.sendInternalSensorsUpdate(homeId).catch((error) => {
    console.error(
      `Failed to send internal sensors snapshot for home ${homeId}:`,
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
        const summary = await externalSensorsDataPort.getHistoricalSummary(
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
    await seedDatabase(homeRepo);

    await homeService.pollAllHomesExternalSensorsData();
    await pollHistoricalWeatherData();
    await scheduleHourlyPlanUpdates();
    setInterval(() => {
      void pollHistoricalWeatherData();
    }, HOUR_IN_MS);
    setInterval(async () => {
      try {
        await homeService.pollAllHomesExternalSensorsData();
      } catch (error) {
        console.error("Error polling external sensors data:", error);
      }
    }, EXTERNAL_SENSORS_POLL_INTERVAL_MS);

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

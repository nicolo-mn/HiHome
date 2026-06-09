import { randomUUID } from "crypto";
import {
  Fan,
  Home,
  HomeRepository,
  Light,
  Room,
  SmartLock,
  Thermostat,
  Window,
  DeviceEvent,
  DeviceTypes,
} from "../home-context/domain";
import { RuleRepository } from "../rule-context/application/repositories/RuleRepository";
import {
  WeatherCondition,
  WeatherEqualityOperator,
  WeatherForecast,
} from "../rule-context/domain/Observables";
import { WindowCloseAction } from "../rule-context/domain/Actions";
import { UserModel } from "../user-context/infrastructure/models/UserModel";

type SeedUser = {
  id: string;
  homeId: string;
  username: string;
  password: string;
  role: string;
};

const seedUsers: SeedUser[] = [
  {
    id: "user-1",
    homeId: "1",
    username: "admin",
    password: "admin",
    role: "Admin",
  },
  {
    id: "user-2",
    homeId: "1",
    username: "standard",
    password: "standard",
    role: "StandardUser",
  },
];

export async function seedDatabase(
  homeRepo: HomeRepository,
  ruleRepo: RuleRepository,
): Promise<void> {
  await seedHome(homeRepo);
  await seedRules(ruleRepo);
  await seedUsersIfMissing();
}

async function seedHome(homeRepo: HomeRepository): Promise<void> {
  const existingHome = await homeRepo.getHome("1");
  if (existingHome) return;

  const seededHome = new Home(
    "1",
    { latitude: 44.13889, longitude: 12.24444, locationName: "Cesena" },
    [
      new Room("room-1", "Living Room", [
        new Light("light-1", "Main Light", "room-1", true),
        new Window("window-1", "Main Window", "room-1", false),
        new Window("window-2", "Patio Window", "room-1", false),
        new SmartLock("lock-1", "Door Lock", "room-1", true),
        new Fan("fan-1", "Ceiling Fan", "room-1", "medium"),
        new Thermostat("thermostat-1", "Thermostat", "room-1", 20),
      ]),
      new Room("room-2", "Bedroom", [
        new Light("light-2", "Main Light", "room-2", false),
        new Window("window-3", "Window", "room-2", true),
        new SmartLock("lock-2", "Balcony Lock", "room-2", true),
        new Fan("fan-2", "Ceiling Fan", "room-2", "off"),
      ]),
      new Room("room-3", "Kitchen", [
        new Light("light-3", "Main Light", "room-3", true),
        new Window("window-4", "Window", "room-3", false),
        new SmartLock("lock-3", "Backdoor Lock", "room-3", false),
        new Fan("fan-3", "Hood Fan", "room-3", "high"),
      ]),
      new Room("room-4", "Bathroom", [
        new Light("light-4", "Main Light", "room-4", false),
        new Window("window-5", "Window", "room-4", false),
        new SmartLock("lock-4", "Door Lock", "room-4", false),
        new Fan("fan-4", "Extractor Fan", "room-4", "low"),
      ]),
      new Room("room-5", "Garage", [
        new Light("light-5", "Main Light", "room-5", false),
        new Window("window-6", "Skylight", "room-5", false),
        new SmartLock("lock-5", "Garage Lock", "room-5", true),
        new Fan("fan-5", "Exhaust Fan", "room-5", "off"),
      ]),
    ],
  );

  await homeRepo.saveHome(seededHome);
  console.log("Seeded home with id 1");
}

async function seedRules(ruleRepo: RuleRepository): Promise<void> {
  const existingRules = await ruleRepo.getHomeRules("1");
  if (existingRules.length > 0) return;

  await ruleRepo.addRule(
    "1",
    "Close windows when raining",
    new WeatherCondition(new WeatherEqualityOperator(WeatherForecast.Rain)),
    [
      new WindowCloseAction("1", "window-1"),
      new WindowCloseAction("1", "window-2"),
      new WindowCloseAction("1", "window-3"),
      new WindowCloseAction("1", "window-4"),
      new WindowCloseAction("1", "window-5"),
      new WindowCloseAction("1", "window-6"),
    ],
    0,
  );
  console.log("Seeded rules for home 1");
}

async function seedUsersIfMissing(): Promise<void> {
  await Promise.all(
    seedUsers.map(async (user) => {
      const existingUser = await UserModel.findOne({
        homeId: user.homeId,
        username: user.username,
      }).exec();
      if (!existingUser) {
        await UserModel.create(user);
        console.log(`Seeded user ${user.username}`);
      }
    }),
  );
}

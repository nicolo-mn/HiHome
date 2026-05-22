import {
  Home,
  HomeRepository,
  Light,
  Room,
  Thermostat,
  Window,
} from "../home-context/domain";
import { Role } from "../user-context/domain/Entities";
import { UserModel } from "../user-context/infrastructure/models/UserModel";

type SeedUser = {
  id: string;
  homeId: string;
  username: string;
  password: string;
  role: Role;
};

const seedUsers: SeedUser[] = [
  {
    id: "user-1",
    homeId: "1",
    username: "admin",
    password: "admin",
    role: Role.Admin,
  },
  {
    id: "user-2",
    homeId: "1",
    username: "operator",
    password: "operator",
    role: Role.Operator,
  },
  {
    id: "user-3",
    homeId: "1",
    username: "viewer",
    password: "viewer",
    role: Role.Viewer,
  },
];

export async function seedDatabase(homeRepo: HomeRepository): Promise<void> {
  await seedHome(homeRepo);
  await migrateLegacyRoles();
  await seedUsersIfMissing();
}

async function seedHome(homeRepo: HomeRepository): Promise<void> {
  const existingHome = await homeRepo.getHome("1");
  if (existingHome) return;

  const seededHome = new Home("1", { latitude: 45.4642, longitude: 9.19 }, [
    new Room("room-1", "Living Room", [
      new Window("window-1", "Front Window", "room-1", false),
      new Window("window-2", "Side Window", "room-1", false),
      new Light("light-1", "Main Light", "room-1", false),
      new Thermostat("thermostat-1", "Main Thermostat", "room-1", 20),
    ]),
    new Room("room-2", "Bedroom", [
      new Window("window-3", "Bedroom Window", "room-2", false),
      new Light("light-2", "Bed Light", "room-2", false),
    ]),
  ]);

  await homeRepo.saveHome(seededHome);
  console.log("Seeded home with id 1");
}

async function migrateLegacyRoles(): Promise<void> {
  const result = await UserModel.updateMany(
    { role: "StandardUser" },
    { $set: { role: Role.Operator } },
  ).exec();
  if (result.modifiedCount > 0) {
    console.log(
      `Migrated ${result.modifiedCount} StandardUser record(s) to ${Role.Operator}`,
    );
  }
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

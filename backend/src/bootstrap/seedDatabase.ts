import {
  Home,
  HomeRepository,
  Light,
  Room,
  Thermostat,
  Window,
} from "../home-context/domain";
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

export async function seedDatabase(homeRepo: HomeRepository): Promise<void> {
  await seedHome(homeRepo);
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

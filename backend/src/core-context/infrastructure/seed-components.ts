import { ComponentModel } from "./mongo-component-repository";

const SEED_COMPONENTS = [
  // home-1 components
  {
    homeId: "home-1",
    name: "Living Room Light",
    type: "light",
    status: { on: true },
  },
  {
    homeId: "home-1",
    name: "Kitchen Window",
    type: "window",
    status: { openDegree: 45 },
  },
  {
    homeId: "home-1",
    name: "AC System",
    type: "climatization",
    status: { mode: "cool", targetTemp: 22 },
  },
  // home-2 components
  {
    homeId: "home-2",
    name: "Bedroom Light",
    type: "light",
    status: { on: false },
  },
  {
    homeId: "home-2",
    name: "Garage Door",
    type: "window",
    status: { openDegree: 0 },
  },
  {
    homeId: "home-2",
    name: "Heater",
    type: "climatization",
    status: { mode: "heat", targetTemp: 25 },
  },
];

export async function seedComponents(): Promise<void> {
  for (const comp of SEED_COMPONENTS) {
    await ComponentModel.updateOne(
      { homeId: comp.homeId, name: comp.name },
      { $set: comp },
      { upsert: true },
    );
  }
  console.log(`Seeded ${SEED_COMPONENTS.length} home components`);
}

import { UserModel } from "./mongo-user-repository";

const SEED_USERS = [
  { username: "alice", homeIds: ["home-1", "home-2"] },
  { username: "bob", homeIds: ["home-1"] },
  { username: "charlie", homeIds: ["home-2"] },
];

export async function seedUsers(): Promise<void> {
  for (const user of SEED_USERS) {
    await UserModel.updateOne(
      { username: user.username },
      { $set: user },
      { upsert: true },
    );
  }
  console.log(`Seeded ${SEED_USERS.length} users`);
}

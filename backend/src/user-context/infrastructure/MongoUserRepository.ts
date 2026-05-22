import { User } from "../domain/Entities";
import { UserRepository } from "../domain/UserRepository";
import {
  PreferencesRepository,
  UserPrefsRecord,
  ALL_NOTIFICATION_TYPES,
} from "../domain/PreferencesRepository";
import { UserModel } from "./models/UserModel";

type UserRecord = {
  id: string;
  homeId: string;
  username: string;
  password: string;
  role: string;
  notificationPreferences?: string[];
};

export class MongoUserRepository
  implements UserRepository, PreferencesRepository
{
  async findByUsernameAndHomeId(
    homeId: string,
    username: string,
  ): Promise<User | null> {
    const doc = await UserModel.findOne({ homeId, username })
      .lean<UserRecord>()
      .exec();
    if (!doc) return null;

    return {
      id: doc.id,
      homeId: doc.homeId,
      username: doc.username,
      password: doc.password,
      role: doc.role,
      notificationPreferences: doc.notificationPreferences,
    };
  }

  async findAllByHome(homeId: string): Promise<UserPrefsRecord[]> {
    const docs = await UserModel.find({ homeId })
      .select("username role notificationPreferences")
      .lean<
        Pick<UserRecord, "username" | "role" | "notificationPreferences">[]
      >()
      .exec();
    return docs.map((d) => ({
      username: d.username,
      role: d.role,
      notificationPreferences: d.notificationPreferences ?? [
        ...ALL_NOTIFICATION_TYPES,
      ],
    }));
  }

  async findPreferences(
    homeId: string,
    username: string,
  ): Promise<string[] | null> {
    const doc = await UserModel.findOne({ homeId, username })
      .select("notificationPreferences")
      .lean<Pick<UserRecord, "notificationPreferences">>()
      .exec();
    if (!doc) return null;
    return doc.notificationPreferences ?? [...ALL_NOTIFICATION_TYPES];
  }

  async updatePreferences(
    homeId: string,
    username: string,
    types: string[],
  ): Promise<void> {
    await UserModel.updateOne(
      { homeId, username },
      { $set: { notificationPreferences: types } },
    ).exec();
  }
}

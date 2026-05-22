import { parseRole, User } from "../domain/Entities";
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

    return new User(
      doc.id,
      doc.homeId,
      doc.username,
      doc.password,
      parseRole(doc.role),
      doc.notificationPreferences,
    );
  }
}

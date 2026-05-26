import { Role } from "../../domain/Role";
import { User } from "../../domain/User";
import { UserRepository } from "../../domain/UserRepository";
import {
  PreferencesRepository,
  UserPrefsRecord,
  ALL_NOTIFICATION_TYPES,
} from "../../domain/PreferencesRepository";
import { UserModel } from "../models/UserModel";

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
    return doc ? this.toUser(doc) : null;
  }

  async findById(userId: string): Promise<User | null> {
    const doc = await UserModel.findOne({ id: userId })
      .lean<UserRecord>()
      .exec();
    return doc ? this.toUser(doc) : null;
  }

  async findAdminsByHome(homeId: string): Promise<User[]> {
    const docs = await UserModel.find({ homeId, role: Role.admin().name })
      .lean<UserRecord[]>()
      .exec();
    return docs.map((d) => this.toUser(d));
  }

  async listUsersOfHome(homeId: string): Promise<User[]> {
    const docs = await UserModel.find({ homeId }).lean<UserRecord[]>().exec();
    return docs.map((d) => this.toUser(d));
  }

  async save(user: User): Promise<void> {
    await UserModel.updateOne(
      { id: user.id },
      {
        $set: {
          role: user.role.name,
          notificationPreferences: user.notificationPreferences,
        },
      },
    ).exec();
  }

  private toUser(doc: UserRecord): User {
    return new User(
      doc.id,
      doc.homeId,
      doc.username,
      doc.password,
      Role.parse(doc.role),
      doc.notificationPreferences ?? [],
    );
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

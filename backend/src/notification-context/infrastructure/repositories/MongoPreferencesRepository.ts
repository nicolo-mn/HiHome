import { PreferencesRepository } from "../../domain/PreferencesRepository";
import { NotificationPreferenceModel } from "../models/NotificationPreferenceModel";

type PreferenceRecord = {
  homeId: string;
  username: string;
  notificationPreferences: string[];
};

export class MongoPreferencesRepository implements PreferencesRepository {
  async findByUser(homeId: string, username: string): Promise<string[] | null> {
    const doc = await NotificationPreferenceModel.findOne({ homeId, username })
      .lean<PreferenceRecord>()
      .exec();
    return doc ? doc.notificationPreferences : null;
  }

  async update(
    homeId: string,
    username: string,
    types: string[],
  ): Promise<void> {
    await NotificationPreferenceModel.updateOne(
      { homeId, username },
      { $set: { notificationPreferences: types } },
      { upsert: true },
    ).exec();
  }
}

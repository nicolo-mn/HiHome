import mongoose, { Schema, model } from "mongoose";

const notificationPreferenceSchema = new Schema(
  {
    homeId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    notificationPreferences: { type: [String], required: true },
  },
  { timestamps: true },
);

notificationPreferenceSchema.index(
  { homeId: 1, username: 1 },
  { unique: true },
);

export type NotificationPreferenceDocument = mongoose.HydratedDocument<
  mongoose.InferSchemaType<typeof notificationPreferenceSchema>
>;

export const NotificationPreferenceModel =
  mongoose.models.NotificationPreference ??
  model("NotificationPreference", notificationPreferenceSchema);

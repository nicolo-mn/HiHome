import mongoose, { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    homeId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        "AirQualityThresholdBreach",
        "AutomationRuleExecuted",
        "ComponentAction",
      ],
    },
    message: { type: String, required: true },
    createdAt: { type: Date, required: true },
    read: { type: Boolean, required: true, default: false },
  },
  { timestamps: false },
);

notificationSchema.index({ homeId: 1, createdAt: -1 });

export type NotificationDocument = mongoose.HydratedDocument<
  mongoose.InferSchemaType<typeof notificationSchema>
>;

export const NotificationModel =
  mongoose.models.Notification ?? model("Notification", notificationSchema);

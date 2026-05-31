import mongoose, { Schema, model } from "mongoose";

const conditionSchema = new Schema(
  {
    type: { type: String, required: true },
    operator: { type: String, required: true },
    target: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const actionSchema = new Schema(
  {
    type: { type: String, required: true },
    homeId: { type: String, required: true },
    deviceId: { type: String, required: true },
    targetTemperature: { type: Number },
    mode: { type: String },
  },
  { _id: false },
);

const timeWindowSchema = new Schema(
  {
    days: { type: [Number] },
    start: { type: String },
    end: { type: String },
  },
  { _id: false },
);

const ruleSchema = new Schema(
  {
    homeId: { type: String, required: true },
    name: { type: String, required: true },
    order: { type: Number, required: true },
    condition: { type: conditionSchema, required: true },
    actions: { type: [actionSchema], default: [] },
    timeWindow: { type: timeWindowSchema, required: false },
  },
  { timestamps: true },
);

ruleSchema.index({ homeId: 1, order: 1 });

export type RuleDocument = mongoose.HydratedDocument<
  mongoose.InferSchemaType<typeof ruleSchema>
>;

export const RuleModel = mongoose.models.Rule ?? model("Rule", ruleSchema);

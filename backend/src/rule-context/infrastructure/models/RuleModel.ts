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
    componentId: { type: String, required: true },
    targetTemperature: { type: Number },
  },
  { _id: false },
);

const ruleSchema = new Schema(
  {
    homeId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    condition: { type: conditionSchema, required: true },
    actions: { type: [actionSchema], default: [] },
  },
  { timestamps: true },
);

export type RuleDocument = mongoose.HydratedDocument<
  mongoose.InferSchemaType<typeof ruleSchema>
>;

export const RuleModel = mongoose.models.Rule ?? model("Rule", ruleSchema);

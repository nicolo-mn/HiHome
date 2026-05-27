import mongoose, { Schema, model } from "mongoose";
import { ComponentTypes } from "../../domain";

const coordinatesSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false },
);

const componentSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    roomId: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: Object.values(ComponentTypes),
    },
    isOn: { type: Boolean },
    isOpen: { type: Boolean },
    isLocked: { type: Boolean },
    temperature: { type: Number },
    mode: { type: String },
  },
  { _id: false },
);

const componentEventActorSchema = new Schema(
  {
    username: { type: String, required: true },
    role: { type: String, required: true },
  },
  { _id: false },
);

const componentEventSchema = new Schema(
  {
    id: { type: String, required: true },
    componentId: { type: String, required: true },
    componentName: { type: String },
    componentType: {
      type: String,
      required: true,
      enum: Object.values(ComponentTypes),
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        "LightTurnedOn",
        "LightTurnedOff",
        "WindowOpened",
        "WindowClosed",
        "ThermostatSet",
        "LockLocked",
        "LockUnlocked",
        "FanModeSet",
      ],
    },
    targetTemperature: { type: Number },
    mode: { type: String },
    actor: { type: componentEventActorSchema },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const roomSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    components: { type: [componentSchema], default: [] },
  },
  { _id: false },
);

const homeSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    coordinates: { type: coordinatesSchema, required: true },
    rooms: { type: [roomSchema], default: [] },
    hourlyTemperatures: {
      type: [Number],
      default: () => new Array(24).fill(20),
    },
    eventLog: { type: [componentEventSchema], default: [] },
  },
  { timestamps: true },
);

export type HomeDocument = mongoose.HydratedDocument<
  mongoose.InferSchemaType<typeof homeSchema>
>;

export const HomeModel = mongoose.models.Home ?? model("Home", homeSchema);

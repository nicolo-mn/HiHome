import mongoose, { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    homeId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
  },
  { timestamps: true },
);

userSchema.index({ homeId: 1, username: 1 });

export type UserDocument = mongoose.HydratedDocument<
  mongoose.InferSchemaType<typeof userSchema>
>;

export const UserModel = mongoose.models.User ?? model("User", userSchema);

import mongoose, { Schema, Document } from "mongoose";

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

export interface UserDocument extends Omit<Document, "_id"> {
  _id: string;
  username: string;
  hashedPassword: string;
  role: UserRole;
  houseId: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    _id: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    hashedPassword: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.USER,
    },
    houseId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false,
  },
);

export const UserModel = mongoose.model<UserDocument>("User", UserSchema);

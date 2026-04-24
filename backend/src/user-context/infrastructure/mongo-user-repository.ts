import mongoose, { Schema, Document } from "mongoose";
import { User } from "../domain/user";
import { UserRepository } from "../domain/user-repository";

interface UserDocument extends Document {
  username: string;
  homeIds: string[];
}

const userSchema = new Schema<UserDocument>({
  username: { type: String, required: true, unique: true },
  homeIds: { type: [String], required: true },
});

const UserModel = mongoose.model<UserDocument>("User", userSchema);

export class MongoUserRepository implements UserRepository {
  async findByUsername(username: string): Promise<User | null> {
    const doc = await UserModel.findOne({ username });
    if (!doc) return null;
    return new User(doc.username, doc.homeIds);
  }
}

export { UserModel };

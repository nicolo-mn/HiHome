import { User } from "../domain/Entities";
import { UserRepository } from "../domain/UserRepository";
import { UserModel } from "./models/UserModel";

type UserRecord = {
  id: string;
  homeId: string;
  username: string;
  password: string;
  role: string;
};

export class MongoUserRepository implements UserRepository {
  async findByUsernameAndHomeId(
    homeId: string,
    username: string,
  ): Promise<User | null> {
    const doc = await UserModel.findOne({ homeId, username })
      .lean<UserRecord>()
      .exec();
    if (!doc) return null;

    return {
      id: doc.id,
      homeId: doc.homeId,
      username: doc.username,
      password: doc.password,
      role: doc.role,
    };
  }
}

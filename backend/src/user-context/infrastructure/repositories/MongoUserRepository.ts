import { Role } from "../../domain/Role";
import { User } from "../../domain/User";
import { UserRepository } from "../../domain/UserRepository";
import { UserModel } from "../models/UserModel";

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
    return doc ? this.toUser(doc) : null;
  }

  async findById(userId: string): Promise<User | null> {
    const doc = await UserModel.findOne({ id: userId })
      .lean<UserRecord>()
      .exec();
    return doc ? this.toUser(doc) : null;
  }

  async findAdminsByHome(homeId: string): Promise<User[]> {
    const docs = await UserModel.find({ homeId, role: Role.admin().name })
      .lean<UserRecord[]>()
      .exec();
    return docs.map((d) => this.toUser(d));
  }

  async listUsersOfHome(homeId: string): Promise<User[]> {
    const docs = await UserModel.find({ homeId }).lean<UserRecord[]>().exec();
    return docs.map((d) => this.toUser(d));
  }

  async save(user: User): Promise<void> {
    await UserModel.updateOne(
      { id: user.id },
      {
        $set: {
          role: user.role.name,
        },
      },
    ).exec();
  }

  private toUser(doc: UserRecord): User {
    return new User(
      doc.id,
      doc.homeId,
      doc.username,
      doc.password,
      Role.parse(doc.role),
    );
  }
}

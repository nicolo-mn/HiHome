import { User, Admin, StandardUser } from "../../../domain/model/entities";
import { UserDocument } from "./userSchema";

export class AdminMapper {
  static toDomain(raw: UserDocument): User {
    if (raw.role === "admin") {
      return new Admin(raw._id, raw.houseId, raw.username, raw.hashedPassword);
    } else {
      return new StandardUser(
        raw.username,
        raw.hashedPassword,
        raw._id,
        raw.houseId,
      );
    }
  }

  //   static toPersistence(admin: Administrator): any {
  //     return {
  //       email: admin.email,
  //       hashedPassword: admin.hashedPassword,
  //       _id: admin.id,
  //     };
  //   }
}

import { Role } from "../domain/Role";
import { User } from "../domain/User";
import { UserRepository } from "../domain/UserRepository";

export class UserManagementService {
  constructor(private userRepo: UserRepository) {}

  async listUsersOfHome(homeId: string): Promise<User[]> {
    return this.userRepo.listUsersOfHome(homeId);
  }

  async changeUserRole(
    actorHomeId: string,
    actorUsername: string,
    targetUserId: string,
    newRole: Role,
  ): Promise<User> {
    const actor = await this.userRepo.findByUsernameAndHomeId(
      actorHomeId,
      actorUsername,
    );
    if (!actor) {
      throw new Error("Actor not found");
    }

    const target = await this.userRepo.findById(targetUserId);
    if (!target) {
      throw new Error("Target user not found");
    }

    const isDemotionFromAdmin = target.role.isAdmin() && !newRole.isAdmin();
    const otherAdmins = isDemotionFromAdmin
      ? (await this.userRepo.findAdminsByHome(target.homeId)).filter(
          (u) => u.id !== target.id,
        )
      : [];

    target.changeRoleTo(newRole, actor, otherAdmins);

    await this.userRepo.save(target);
    return target;
  }
}

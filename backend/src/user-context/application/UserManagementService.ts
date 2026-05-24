import { User } from "../domain/Entities";
import { UserRepository } from "../domain/UserRepository";
import { RoleAssignmentPolicy, RoleName } from "../domain/RoleAssignmentPolicy";

export class UserManagementService {
  constructor(private userRepo: UserRepository) {}

  async changeUserRole(
    actorHomeId: string,
    actorUsername: string,
    targetUserId: string,
    newRole: RoleName,
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

    const admins = await this.userRepo.findAdminsByHome(target.homeId);
    RoleAssignmentPolicy.assertCanAssign(actor, target, newRole, admins);

    const updated: User = { ...target, role: newRole };
    await this.userRepo.save(updated);
    return updated;
  }
}

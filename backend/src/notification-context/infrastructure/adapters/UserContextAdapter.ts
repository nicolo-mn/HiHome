import { UserManagementService } from "../../../user-context/application/services/UserManagementService";
import { HomeUser, HomeUsersPort } from "../../application/ports/HomeUsersPort";

export class UserContextAdapter implements HomeUsersPort {
  constructor(private userManagementService: UserManagementService) {}

  async listUsersOfHome(homeId: string): Promise<HomeUser[]> {
    const users = await this.userManagementService.listUsersOfHome(homeId);
    return users.map((u) => ({ username: u.username, role: u.role.name }));
  }
}

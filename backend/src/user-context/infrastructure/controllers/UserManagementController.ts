import { Request, Response } from "express";
import { UserManagementService } from "../../application/UserManagementService";
import { parseRole, RoleName } from "../../domain/RoleAssignmentPolicy";

type AuthenticatedRequest = Request & {
  user?: { username?: string; homeId?: string; role?: string };
};

export class UserManagementController {
  constructor(private service: UserManagementService) {}

  async changeRole(req: Request, res: Response): Promise<void> {
    const homeId = req.params.id as string;
    const targetUserId = req.params.userId as string;

    let role: RoleName;
    try {
      role = parseRole(req.body?.role);
    } catch (e: any) {
      res.status(400).json({ error: e?.message ?? "Invalid role" });
      return;
    }

    const actor = (req as AuthenticatedRequest).user;
    if (!actor?.username) {
      res.status(401).json({ error: "Unauthorized: missing actor identity" });
      return;
    }

    try {
      const updated = await this.service.changeUserRole(
        homeId,
        actor.username,
        targetUserId,
        role,
      );
      res.json({
        user: {
          id: updated.id,
          homeId: updated.homeId,
          username: updated.username,
          role: updated.role,
        },
      });
    } catch (e: any) {
      const message = e?.message ?? "Failed to change role";
      if (/not found/i.test(message)) {
        res.status(404).json({ error: message });
        return;
      }
      res.status(403).json({ error: message });
    }
  }
}

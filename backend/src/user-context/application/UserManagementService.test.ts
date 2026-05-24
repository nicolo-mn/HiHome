import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserManagementService } from "./UserManagementService";
import { UserRepository } from "../domain/UserRepository";
import { User } from "../domain/Entities";

const userOf = (
  id: string,
  role: string,
  homeId = "home-1",
  username = `u-${id}`,
): User => ({
  id,
  homeId,
  username,
  password: "pwd",
  role,
});

describe("UserManagementService.changeUserRole", () => {
  let repo: UserRepository;
  let service: UserManagementService;

  beforeEach(() => {
    repo = {
      findByUsernameAndHomeId: vi.fn(),
      findById: vi.fn(),
      findAdminsByHome: vi.fn(),
      listUsersOfHome: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    };
    service = new UserManagementService(repo);
  });

  it("promotes a StandardUser to Admin and persists the updated user", async () => {
    const actor = userOf("a1", "Admin");
    const target = userOf("u1", "StandardUser");
    vi.mocked(repo.findByUsernameAndHomeId).mockResolvedValue(actor);
    vi.mocked(repo.findById).mockResolvedValue(target);
    vi.mocked(repo.findAdminsByHome).mockResolvedValue([actor]);

    const updated = await service.changeUserRole(
      "home-1",
      "u-a1",
      "u1",
      "Admin",
    );

    expect(updated.role).toBe("Admin");
    expect(updated.id).toBe("u1");
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "u1", role: "Admin" }),
    );
  });

  it("throws when the actor is unknown", async () => {
    vi.mocked(repo.findByUsernameAndHomeId).mockResolvedValue(null);
    await expect(
      service.changeUserRole("home-1", "ghost", "u1", "Admin"),
    ).rejects.toThrow(/Actor/);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("throws when the target is unknown", async () => {
    vi.mocked(repo.findByUsernameAndHomeId).mockResolvedValue(
      userOf("a1", "Admin"),
    );
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(
      service.changeUserRole("home-1", "u-a1", "ghost", "Admin"),
    ).rejects.toThrow(/Target/);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("propagates policy violations (e.g. self-change)", async () => {
    const actor = userOf("a1", "Admin");
    vi.mocked(repo.findByUsernameAndHomeId).mockResolvedValue(actor);
    vi.mocked(repo.findById).mockResolvedValue(actor);
    vi.mocked(repo.findAdminsByHome).mockResolvedValue([actor]);

    await expect(
      service.changeUserRole("home-1", "u-a1", "a1", "StandardUser"),
    ).rejects.toThrow(/own role/);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("propagates policy violations (last Admin)", async () => {
    const actor = userOf("a1", "Admin");
    const onlyAdmin = userOf("a2", "Admin");
    vi.mocked(repo.findByUsernameAndHomeId).mockResolvedValue(actor);
    vi.mocked(repo.findById).mockResolvedValue(onlyAdmin);
    vi.mocked(repo.findAdminsByHome).mockResolvedValue([onlyAdmin]);

    await expect(
      service.changeUserRole("home-1", "u-a1", "a2", "StandardUser"),
    ).rejects.toThrow(/At least one Admin/);
    expect(repo.save).not.toHaveBeenCalled();
  });
});

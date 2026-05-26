import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserManagementService } from "../UserManagementService";
import { UserRepository } from "../../domain/UserRepository";
import { Role } from "../../domain/Role";
import { User } from "../../domain/User";

const userOf = (
  id: string,
  role: Role,
  homeId = "home-1",
  username = `u-${id}`,
): User => new User(id, homeId, username, "pwd", role);

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
    const actor = userOf("a1", Role.admin());
    const target = userOf("u1", Role.standard());
    vi.mocked(repo.findByUsernameAndHomeId).mockResolvedValue(actor);
    vi.mocked(repo.findById).mockResolvedValue(target);

    const updated = await service.changeUserRole(
      "home-1",
      "u-a1",
      "u1",
      Role.admin(),
    );

    expect(updated.role.isAdmin()).toBe(true);
    expect(updated.id).toBe("u1");
    expect(repo.save).toHaveBeenCalledWith(target);
    expect(target.role.isAdmin()).toBe(true);
  });

  it("throws when the actor is unknown", async () => {
    vi.mocked(repo.findByUsernameAndHomeId).mockResolvedValue(null);
    await expect(
      service.changeUserRole("home-1", "ghost", "u1", Role.admin()),
    ).rejects.toThrow(/Actor/);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("throws when the target is unknown", async () => {
    vi.mocked(repo.findByUsernameAndHomeId).mockResolvedValue(
      userOf("a1", Role.admin()),
    );
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(
      service.changeUserRole("home-1", "u-a1", "ghost", Role.admin()),
    ).rejects.toThrow(/Target/);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("propagates policy violations (e.g. self-change)", async () => {
    const actor = userOf("a1", Role.admin());
    vi.mocked(repo.findByUsernameAndHomeId).mockResolvedValue(actor);
    vi.mocked(repo.findById).mockResolvedValue(actor);
    vi.mocked(repo.findAdminsByHome).mockResolvedValue([actor]);

    await expect(
      service.changeUserRole("home-1", "u-a1", "a1", Role.standard()),
    ).rejects.toThrow(/own role/);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("propagates policy violations (last Admin)", async () => {
    const actor = userOf("a1", Role.admin());
    const onlyAdmin = userOf("a2", Role.admin());
    vi.mocked(repo.findByUsernameAndHomeId).mockResolvedValue(actor);
    vi.mocked(repo.findById).mockResolvedValue(onlyAdmin);
    vi.mocked(repo.findAdminsByHome).mockResolvedValue([onlyAdmin]);

    await expect(
      service.changeUserRole("home-1", "u-a1", "a2", Role.standard()),
    ).rejects.toThrow(/At least one Admin/);
    expect(repo.save).not.toHaveBeenCalled();
  });
});

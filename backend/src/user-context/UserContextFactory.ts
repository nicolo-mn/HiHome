import { AuthInboundPort } from "./application/ports/AuthInboundPort";
import { AuthFacade } from "./application/AuthFacade";
import { AuthService } from "./application/services/AuthService";
import { UserManagementService } from "./application/services/UserManagementService";
import { InMemoryUserRepository } from "./infrastructure/repositories/InMemoryUserRepository";
import { MongoUserRepository } from "./infrastructure/repositories/MongoUserRepository";
import { BcryptPasswordHasher } from "./infrastructure/adapters/BcryptPasswordHasher";

export interface UserContext {
  authPort: AuthInboundPort;
  facade: AuthFacade;
  userManagementService: UserManagementService;
}

export class UserContextFactory {
  static create(): UserContext {
    const repository =
      process.env.NODE_ENV === "test"
        ? new InMemoryUserRepository()
        : new MongoUserRepository();
    const passwordHasher = new BcryptPasswordHasher();
    const service = new AuthService(repository, passwordHasher);
    const facade = new AuthFacade(service);
    const userManagementService = new UserManagementService(repository);

    return {
      authPort: service,
      facade: facade,
      userManagementService,
    };
  }
}

import { AuthInboundPort } from "./application/ports/AuthInboundPort";
import { AuthFacade } from "./application/AuthFacade";
import { AuthService } from "./application/services/AuthService";
import { UserManagementService } from "./application/services/UserManagementService";
import { PreferencesRepository } from "./domain/PreferencesRepository";
import { InMemoryUserRepository } from "./infrastructure/repositories/InMemoryUserRepository";
import { MongoUserRepository } from "./infrastructure/repositories/MongoUserRepository";

export interface UserContext {
  authPort: AuthInboundPort;
  facade: AuthFacade;
  preferencesRepository: PreferencesRepository;
  userManagementService: UserManagementService;
}

export class UserContextFactory {
  static create(): UserContext {
    const repository =
      process.env.NODE_ENV === "test"
        ? new InMemoryUserRepository()
        : new MongoUserRepository();
    const service = new AuthService(repository);
    const facade = new AuthFacade(service);
    const userManagementService = new UserManagementService(repository);

    return {
      authPort: service,
      facade: facade,
      preferencesRepository: repository,
      userManagementService,
    };
  }
}

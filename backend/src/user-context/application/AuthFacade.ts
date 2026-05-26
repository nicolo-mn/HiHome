import { AuthService } from "./services/AuthService";

export class AuthFacade {
  constructor(private readonly authService: AuthService) {}
}

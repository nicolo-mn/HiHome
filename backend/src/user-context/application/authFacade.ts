import { AuthService } from "./services/authService";

export class AuthFacade {
  constructor(private readonly authService: AuthService) {}
}

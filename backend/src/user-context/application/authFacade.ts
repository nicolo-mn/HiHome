import { AuthService } from "./authService";

export class AuthFacade {
  constructor(private readonly authService: AuthService) {}
}

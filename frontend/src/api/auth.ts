import { apiFetch } from "./client";

export interface LoginRequest {
  houseId: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/login", {
    method: "POST",
    body: payload,
    auth: false,
  });
}

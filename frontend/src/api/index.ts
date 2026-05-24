export {
  apiFetch,
  setUnauthorizedHandler,
  setAuthTokenProvider,
} from "./client";
export type { ApiRequestOptions } from "./client";
export {
  ApiError,
  UnauthorizedError,
  NetworkError,
  TimeoutError,
} from "./errors";
export * as authApi from "./auth";
export type { LoginRequest, LoginResponse } from "./auth";
export * as componentsApi from "./components";
export type {
  HomeComponent,
  ThermostatComponent,
  ToggleableComponent,
  ToggleableType,
  BaseComponent,
  ComponentType,
  CreateComponentInput,
} from "./components";
export * as notificationsApi from "./notifications";
export type { NotificationDTO } from "./notifications";
export * as preferencesApi from "./preferences";
export type { NotificationType } from "./preferences";
export { ALL_NOTIFICATION_TYPES, TYPE_LABELS } from "./preferences";
export type { SensorReading } from "./sensors";
export * as rulesApi from "./rules";
export type {
  RuleDto,
  ConditionDto,
  ActionDto,
  CreateRulePayload,
} from "./rules";
export * as eventLogApi from "./event-log";
export type { ComponentEventDTO } from "./event-log";
export * as usersApi from "./users";
export type { UserSummary, RoleName } from "./users";
export { ALL_ROLES, ROLE_LABELS } from "./users";
export * as usageApi from "./usage";
export type { UsageReport, UsageRange } from "./usage";

import { apiFetch } from "./client";
import type { DeviceType } from "./devices";

export type ConditionDto = {
  type: string;
  operator: string;
  target: string | number;
};

export type FanMode = "off" | "low" | "medium" | "high";

export type ActionDto = {
  type: string;
  deviceId: string;
  targetTemperature?: number;
  mode?: FanMode;
};

export type TimeWindowDto = {
  days?: number[];
  start?: string;
  end?: string;
};

export type RuleDto = {
  id: string;
  name: string;
  order: number;
  condition: ConditionDto;
  actions: ActionDto[];
  timeWindow?: TimeWindowDto;
};

export type CreateRulePayload = {
  ruleName: string;
  observableId: string;
  operator: string;
  operatorTarget: string | number;
  actions: {
    deviceId: string;
    deviceType: DeviceType;
    command: string;
    targetTemp?: number;
  }[];
  timeWindow?: TimeWindowDto;
};

export async function getRules(homeId: string): Promise<RuleDto[]> {
  const res = await apiFetch<{ rules: RuleDto[] }>(
    `/api/v1/home/${encodeURIComponent(homeId)}/rules`,
  );
  return res.rules;
}

export async function createRule(
  homeId: string,
  payload: CreateRulePayload,
): Promise<string> {
  const res = await apiFetch<{ ruleId: string }>(
    `/api/v1/home/${encodeURIComponent(homeId)}/rules`,
    { method: "POST", body: payload },
  );
  return res.ruleId;
}

export async function deleteRule(
  homeId: string,
  ruleId: string,
): Promise<void> {
  await apiFetch(
    `/api/v1/home/${encodeURIComponent(homeId)}/rules/${encodeURIComponent(ruleId)}`,
    { method: "DELETE" },
  );
}

export async function reorderRules(
  homeId: string,
  ruleIds: string[],
): Promise<void> {
  await apiFetch(`/api/v1/home/${encodeURIComponent(homeId)}/rules/order`, {
    method: "PUT",
    body: { ruleIds },
  });
}

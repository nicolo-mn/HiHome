import { apiFetch } from "./client";
import type { ComponentType } from "./components";

export type ConditionDto = {
  type: string;
  operator: string;
  target: string | number;
};

export type ActionDto = {
  type: string;
  componentId: string;
  targetTemperature?: number;
};

export type RuleDto = {
  id: string;
  name: string;
  condition: ConditionDto;
  actions: ActionDto[];
};

export type CreateRulePayload = {
  ruleName: string;
  observableId: string;
  operator: string;
  operatorTarget: string | number;
  actions: {
    componentId: string;
    componentType: ComponentType;
    command: string;
    targetTemp?: number;
  }[];
};

export async function getRules(homeId: string): Promise<RuleDto[]> {
  const res = await apiFetch<{ rules: RuleDto[] }>(
    `/api/home/${encodeURIComponent(homeId)}/rules`,
  );
  return res.rules;
}

export async function createRule(
  homeId: string,
  payload: CreateRulePayload,
): Promise<string> {
  const res = await apiFetch<{ ruleId: string }>(
    `/api/home/${encodeURIComponent(homeId)}/rules`,
    { method: "POST", body: payload },
  );
  return res.ruleId;
}

export async function deleteRule(ruleId: string): Promise<void> {
  await apiFetch(`/api/home/rules/${encodeURIComponent(ruleId)}`, {
    method: "DELETE",
  });
}

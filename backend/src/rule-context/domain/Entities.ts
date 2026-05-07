// condition to execute an action
export type RuleTrigger = {
  observableId: string;
  operator: "gt" | "lt" | "gte" | "lte" | "eq" | "is";
  value: number | string;
};

// action to execute when a trigger condition is met
export type RuleAction = {
  componentId: string;
  capabilityId: string;
  commandId: string;
  params?: Record<string, number>; // optional number parameters for commands
};

// a rule that links triggers to actions
export type Rule = {
  id: string;
  homeId: string;
  name: string;
  enabled: boolean;
  trigger: RuleTrigger;
  actions: RuleAction[];
};

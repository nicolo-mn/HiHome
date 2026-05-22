export interface RuleExecutionRecap {
  ruleName: string;
  actions: string[];
}

export interface RulesExecutedEvent {
  executions: RuleExecutionRecap[];
}

export interface RuleNotificationPort {
  notifyRulesExecuted(homeId: string, event: RulesExecutedEvent): Promise<void>;
}

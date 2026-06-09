import { RuleService } from "../../../rule-context/application/services/RuleService";
import { RuleUsagePort } from "../../application/ports/RuleUsagePort";

// Resolves device-in-rule usage by querying the rule context's RuleService.
export class RuleServiceRuleUsageAdapter implements RuleUsagePort {
  constructor(private getRuleService: () => RuleService) {}

  async getRuleNamesUsingDevice(
    homeId: string,
    deviceId: string,
  ): Promise<string[]> {
    const rules = await this.getRuleService().getRulesForHome(homeId);
    return rules
      .filter((rule) =>
        rule.actions.some((action) => action.getDeviceId() === deviceId),
      )
      .map((rule) => rule.name);
  }
}

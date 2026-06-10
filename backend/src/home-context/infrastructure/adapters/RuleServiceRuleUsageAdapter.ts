import { RuleService } from "../../../rule-context/application/services/RuleService";
import { RuleUsagePort } from "../../application/ports/RuleUsagePort";

export class RuleServiceRuleUsageAdapter implements RuleUsagePort {
  constructor(private getRuleService: () => RuleService) {}

  async getRuleNamesUsingDevice(
    homeId: string,
    deviceId: string,
  ): Promise<string[]> {
    return await this.getRuleService().getRuleNamesUsingDevice(
      homeId,
      deviceId,
    );
  }
}

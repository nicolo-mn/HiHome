import { HomeService } from "../../../home-context/application/services/HomeService";
import { RuleEvaluationTriggerPort } from "../../application/ports/RuleEvaluationTriggerPort";

export class HomeServiceRuleEvaluationTrigger implements RuleEvaluationTriggerPort {
  constructor(private homeService: HomeService) {}

  requestEvaluation(homeId: string): void {
    void this.homeService.evaluateRulesNow(homeId).catch((error) => {
      console.error(
        `Failed to evaluate rules for home ${homeId} after rule creation:`,
        error,
      );
    });
  }
}

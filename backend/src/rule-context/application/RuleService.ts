import { RuleRepository } from "./RuleRepository";
import { Rule, RuleAction, RuleTrigger } from "../domain/Entities";
import { HomeServicePort } from "./HomeServicePort";
//TODO: considera ACL o shared kernel
import { CapabilityCatalog } from "../../home-context/application/CapabilityRegistry";

export class RuleService {
  constructor(
    private ruleRepo: RuleRepository,
    private homeServicePort: HomeServicePort,
  ) {}

  async getRulesForHome(homeId: string): Promise<Rule[]> {
    return await this.ruleRepo.getHomeRules(homeId);
  }

  async addRule(
    homeId: string,
    name: string,
    trigger: RuleTrigger,
    actions: RuleAction[],
  ): Promise<Rule> {
    return await this.ruleRepo.addRule(homeId, name, trigger, actions);
  }

  async deleteRule(ruleId: string): Promise<void> {
    await this.ruleRepo.deleteRule(ruleId);
  }

  async getRules(homeId: string): Promise<[CapabilityCatalog, Rule[]]> {
    const catalog = await this.homeServicePort.getCapabilityCatalog(homeId);
    const rules = await this.ruleRepo.getHomeRules(homeId);
    return [catalog, rules];
  }
}

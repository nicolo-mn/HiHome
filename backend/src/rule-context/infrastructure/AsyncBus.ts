import { EventEmitter } from "events";
import { RuleService } from "../application/RuleService";
import { ObservablesUpdatedDomainEvent } from "../domain/Observables";

export class AsyncBus {
  constructor(
    private readonly eventEmitter: EventEmitter,
    private readonly eventName: string,
    private readonly ruleService: RuleService,
  ) {
    this.eventEmitter.on(this.eventName, this.handleEvent.bind(this));
  }

  private async handleEvent(
    homeId: string,
    update: ObservablesUpdatedDomainEvent,
  ): Promise<void> {
    try {
      await this.ruleService.executeRulesForHome(homeId, update);
    } catch (error) {
      console.error(
        `Error executing rules for home ${homeId} on event ${this.eventName}:`,
        error,
      );
    }
  }
}

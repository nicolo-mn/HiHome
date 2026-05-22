import { describe, it, expect, vi, beforeEach } from "vitest";
import { RuleService } from "./RuleService";
import { RuleRepository } from "./RuleRepository";
import { Rule } from "../domain/Rule";
import { HomeRuleSet } from "../domain/HomeRuleSet";
import {
  ObservablesUpdatedDomainEvent,
  ObservableCondition,
  WeatherForecast,
  WeatherCondition,
} from "../domain/Observables";
import { ComponentAction, LightTurnOnAction } from "../domain/Actions";
import { AddRuleDto } from "./RuleService";
import { ActionExecutionPort } from "../domain/ActionExecutionPort";
import { RuleNotificationPort } from "./RuleNotificationPort";

function makeRule(partial: Partial<Rule> & Pick<Rule, "id" | "order">): Rule {
  return {
    homeId: "home-1",
    name: `Rule ${partial.id}`,
    condition: {} as ObservableCondition,
    actions: [],
    ...partial,
  };
}

describe("RuleService", () => {
  let ruleService: RuleService;
  let mockRuleRepository: RuleRepository;
  let mockActionExecutionPort: ActionExecutionPort;
  let mockRuleNotificationPort: RuleNotificationPort;

  beforeEach(() => {
    mockRuleRepository = {
      getHomeRules: vi.fn(),
      addRule: vi.fn(),
      deleteRule: vi.fn(),
      getRule: vi.fn(),
      findHomeRuleSet: vi.fn(),
      reorderRules: vi.fn(),
    } as unknown as RuleRepository;

    mockActionExecutionPort = {
      executeWindowOpen: vi.fn(),
      executeWindowClose: vi.fn(),
      executeThermostatSetTemperature: vi.fn(),
      executeLightTurnOn: vi.fn(),
      executeLightTurnOff: vi.fn(),
    } as unknown as ActionExecutionPort;

    mockRuleNotificationPort = {
      notifyRulesExecuted: vi.fn().mockResolvedValue(undefined),
    };

    ruleService = new RuleService(
      mockRuleRepository,
      mockActionExecutionPort,
      mockRuleNotificationPort,
    );
  });

  it("should get rules for a home", async () => {
    const rules: Rule[] = [makeRule({ id: "rule-1", order: 0 })];
    vi.mocked(mockRuleRepository.getHomeRules).mockResolvedValue(rules);

    const result = await ruleService.getRulesForHome("home-1");

    expect(result).toBe(rules);
    expect(mockRuleRepository.getHomeRules).toHaveBeenCalledWith("home-1");
  });

  it("should add a rule with order equal to existing rules count", async () => {
    const existing = [
      makeRule({ id: "r1", order: 0 }),
      makeRule({ id: "r2", order: 1 }),
    ];
    vi.mocked(mockRuleRepository.findHomeRuleSet).mockResolvedValue(
      HomeRuleSet.fromPersisted("home-1", existing),
    );
    const createdRule: Rule = makeRule({ id: "new-rule-id", order: 2 });
    vi.mocked(mockRuleRepository.addRule).mockResolvedValue(createdRule);

    const dto: AddRuleDto = {
      homeId: "home-1",
      ruleName: "New Rule",
      observableId: "weather",
      operatorTarget: "Rain",
      actions: [
        { componentType: "light", command: "turnOn", componentId: "comp-1" },
      ],
    };

    const result = await ruleService.addRule(dto);

    expect(result).toBe(createdRule);
    const [homeId, name, condition, actions, order] = vi.mocked(
      mockRuleRepository.addRule,
    ).mock.calls[0];
    expect(homeId).toBe("home-1");
    expect(name).toBe("New Rule");
    expect(condition).toBeInstanceOf(WeatherCondition);
    expect(actions[0]).toBeInstanceOf(LightTurnOnAction);
    expect(order).toBe(2);
  });

  it("should add the first rule with order 0", async () => {
    vi.mocked(mockRuleRepository.findHomeRuleSet).mockResolvedValue(
      HomeRuleSet.empty("home-1"),
    );
    vi.mocked(mockRuleRepository.addRule).mockResolvedValue(
      makeRule({ id: "r1", order: 0 }),
    );

    await ruleService.addRule({
      homeId: "home-1",
      ruleName: "First",
      observableId: "weather",
      operatorTarget: "Rain",
      actions: [
        { componentType: "light", command: "turnOn", componentId: "c" },
      ],
    });

    const [, , , , order] = vi.mocked(mockRuleRepository.addRule).mock.calls[0];
    expect(order).toBe(0);
  });

  it("should delete a rule and recompact remaining orders", async () => {
    const existing = [
      makeRule({ id: "r1", order: 0 }),
      makeRule({ id: "r2", order: 1 }),
      makeRule({ id: "r3", order: 2 }),
    ];
    vi.mocked(mockRuleRepository.getRule).mockResolvedValue(existing[1]);
    vi.mocked(mockRuleRepository.findHomeRuleSet).mockResolvedValue(
      HomeRuleSet.fromPersisted("home-1", existing),
    );

    await ruleService.deleteRule("r2");

    expect(mockRuleRepository.deleteRule).toHaveBeenCalledWith("r2");
    expect(mockRuleRepository.reorderRules).toHaveBeenCalledWith("home-1", [
      { id: "r1", order: 0 },
      { id: "r3", order: 1 },
    ]);
  });

  it("should reorder rules through the aggregate", async () => {
    const existing = [
      makeRule({ id: "r1", order: 0 }),
      makeRule({ id: "r2", order: 1 }),
      makeRule({ id: "r3", order: 2 }),
    ];
    vi.mocked(mockRuleRepository.findHomeRuleSet).mockResolvedValue(
      HomeRuleSet.fromPersisted("home-1", existing),
    );

    await ruleService.reorderRules("home-1", ["r3", "r1", "r2"]);

    expect(mockRuleRepository.reorderRules).toHaveBeenCalledWith("home-1", [
      { id: "r3", order: 0 },
      { id: "r1", order: 1 },
      { id: "r2", order: 2 },
    ]);
  });

  it("should reject a reorder that is not a full permutation", async () => {
    const existing = [
      makeRule({ id: "r1", order: 0 }),
      makeRule({ id: "r2", order: 1 }),
    ];
    vi.mocked(mockRuleRepository.findHomeRuleSet).mockResolvedValue(
      HomeRuleSet.fromPersisted("home-1", existing),
    );

    await expect(ruleService.reorderRules("home-1", ["r1"])).rejects.toThrow();
    expect(mockRuleRepository.reorderRules).not.toHaveBeenCalled();
  });

  it("should execute rules for home", async () => {
    const update: ObservablesUpdatedDomainEvent = {
      externalTemperature: 20,
      internalTemperature: 22,
      airQuality: 50,
      windSpeed: 10,
      weatherForecast: WeatherForecast.Clear,
    };

    const mockAction1 = {
      getComponentId: vi.fn().mockReturnValue("comp-1"),
      accept: vi.fn().mockResolvedValue(undefined),
    } as unknown as ComponentAction;
    const mockAction2 = {
      getComponentId: vi.fn().mockReturnValue("comp-2"),
      accept: vi.fn().mockResolvedValue(undefined),
    } as unknown as ComponentAction;
    const mockAction3 = {
      getComponentId: vi.fn().mockReturnValue("comp-1"),
      accept: vi.fn().mockResolvedValue(undefined),
    } as unknown as ComponentAction;

    const mockConditionTrue = {
      verify: vi.fn().mockReturnValue(true),
    } as unknown as ObservableCondition;
    const mockConditionFalse = {
      verify: vi.fn().mockReturnValue(false),
    } as unknown as ObservableCondition;

    const rules: Rule[] = [
      makeRule({
        id: "rule-1",
        order: 0,
        condition: mockConditionFalse,
        actions: [mockAction1],
      }),
      makeRule({
        id: "rule-2",
        order: 1,
        condition: mockConditionTrue,
        actions: [mockAction2],
      }),
      makeRule({
        id: "rule-3",
        order: 2,
        condition: mockConditionTrue,
        actions: [mockAction3],
      }),
    ];
    vi.mocked(mockRuleRepository.getHomeRules).mockResolvedValue(rules);

    await ruleService.executeRulesForHome("home-1", update);

    expect(mockRuleRepository.getHomeRules).toHaveBeenCalledWith("home-1");
    expect(mockConditionFalse.verify).toHaveBeenCalledWith(update);
    expect(mockConditionTrue.verify).toHaveBeenCalledTimes(2);

    expect(mockAction1.accept).not.toHaveBeenCalled();
    expect(mockAction2.accept).toHaveBeenCalled();
    expect(mockAction3.accept).toHaveBeenCalled();
  });

  it("should execute actions only on false-to-true transitions", async () => {
    ruleService = new RuleService(mockRuleRepository, mockActionExecutionPort);
    const update: ObservablesUpdatedDomainEvent = {
      externalTemperature: 20,
      internalTemperature: 22,
      airQuality: 50,
      windSpeed: 10,
      weatherForecast: WeatherForecast.Clear,
    };

    const mockAction = {
      getComponentId: vi.fn().mockReturnValue("comp-1"),
      accept: vi.fn().mockResolvedValue(undefined),
    } as unknown as ComponentAction;

    const mockConditionTrue = {
      verify: vi.fn().mockReturnValue(true),
    } as unknown as ObservableCondition;

    const rules: Rule[] = [
      makeRule({
        id: "rule-1",
        order: 0,
        condition: mockConditionTrue,
        actions: [mockAction],
      }),
    ];
    vi.mocked(mockRuleRepository.getHomeRules).mockResolvedValue(rules);

    await ruleService.executeRulesForHome("home-1", update);
    await ruleService.executeRulesForHome("home-1", update);

    expect(mockAction.accept).toHaveBeenCalledTimes(1);
  });

  it("should re-arm when condition becomes false", async () => {
    ruleService = new RuleService(mockRuleRepository, mockActionExecutionPort);
    const update: ObservablesUpdatedDomainEvent = {
      externalTemperature: 20,
      internalTemperature: 22,
      airQuality: 50,
      windSpeed: 10,
      weatherForecast: WeatherForecast.Clear,
    };

    const mockAction = {
      getComponentId: vi.fn().mockReturnValue("comp-1"),
      accept: vi.fn().mockResolvedValue(undefined),
    } as unknown as ComponentAction;

    const mockConditionSequence = {
      verify: vi
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true),
    } as unknown as ObservableCondition;

    const rules: Rule[] = [
      makeRule({
        id: "rule-1",
        order: 0,
        condition: mockConditionSequence,
        actions: [mockAction],
      }),
    ];
    vi.mocked(mockRuleRepository.getHomeRules).mockResolvedValue(rules);

    await ruleService.executeRulesForHome("home-1", update);
    await ruleService.executeRulesForHome("home-1", update);
    await ruleService.executeRulesForHome("home-1", update);

    expect(mockAction.accept).toHaveBeenCalledTimes(2);
  });

  it("should execute one action for component when multiple are accepted", async () => {
    const update: ObservablesUpdatedDomainEvent = {
      externalTemperature: 20,
      internalTemperature: 22,
      airQuality: 50,
      windSpeed: 10,
      weatherForecast: WeatherForecast.Clear,
    };

    const mockAction1Comp1 = {
      getComponentId: vi.fn().mockReturnValue("comp-1"),
      accept: vi.fn().mockResolvedValue(undefined),
    } as unknown as ComponentAction;
    const mockAction2Comp2 = {
      getComponentId: vi.fn().mockReturnValue("comp-2"),
      accept: vi.fn().mockResolvedValue(undefined),
    } as unknown as ComponentAction;
    const mockAction3Comp1 = {
      getComponentId: vi.fn().mockReturnValue("comp-1"),
      accept: vi.fn().mockResolvedValue(undefined),
    } as unknown as ComponentAction;
    const mockAction4Comp2 = {
      getComponentId: vi.fn().mockReturnValue("comp-2"),
      accept: vi.fn().mockResolvedValue(undefined),
    } as unknown as ComponentAction;
    const mockAction5Comp2 = {
      getComponentId: vi.fn().mockReturnValue("comp-2"),
      accept: vi.fn().mockResolvedValue(undefined),
    } as unknown as ComponentAction;

    const mockConditionTrue = {
      verify: vi.fn().mockReturnValue(true),
    } as unknown as ObservableCondition;
    const mockConditionFalse = {
      verify: vi.fn().mockReturnValue(false),
    } as unknown as ObservableCondition;

    const rules: Rule[] = [
      makeRule({
        id: "rule-1",
        order: 0,
        condition: mockConditionTrue,
        actions: [mockAction1Comp1],
      }),
      makeRule({
        id: "rule-2",
        order: 1,
        condition: mockConditionFalse,
        actions: [mockAction2Comp2],
      }),
      makeRule({
        id: "rule-3",
        order: 2,
        condition: mockConditionTrue,
        actions: [mockAction3Comp1],
      }),
      makeRule({
        id: "rule-4",
        order: 3,
        condition: mockConditionTrue,
        actions: [mockAction4Comp2],
      }),
      makeRule({
        id: "rule-5",
        order: 4,
        condition: mockConditionTrue,
        actions: [mockAction5Comp2],
      }),
    ];
    vi.mocked(mockRuleRepository.getHomeRules).mockResolvedValue(rules);

    await ruleService.executeRulesForHome("home-1", update);

    expect(mockAction1Comp1.accept).toHaveBeenCalled();
    expect(mockAction2Comp2.accept).not.toHaveBeenCalled();
    expect(mockAction3Comp1.accept).not.toHaveBeenCalled();
    expect(mockAction4Comp2.accept).toHaveBeenCalled();
    expect(mockAction5Comp2.accept).not.toHaveBeenCalled();
  });

  it("should notify rules executed with only actually executed actions per rule", async () => {
    const update: ObservablesUpdatedDomainEvent = {
      externalTemperature: 20,
      internalTemperature: 22,
      airQuality: 50,
      windSpeed: 10,
      weatherForecast: WeatherForecast.Clear,
    };

    const mockConditionTrue = {
      verify: vi.fn().mockReturnValue(true),
    } as unknown as ObservableCondition;

    const ruleAAction = new LightTurnOnAction("home-1", "light-1");
    const ruleBActionShadowed = new LightTurnOnAction("home-1", "light-1");
    const ruleBActionExecuted = new LightTurnOnAction("home-1", "light-2");

    const rules: Rule[] = [
      makeRule({
        id: "rule-a",
        order: 0,
        condition: mockConditionTrue,
        name: "Rule A",
        actions: [ruleAAction],
      }),
      makeRule({
        id: "rule-b",
        order: 1,
        condition: mockConditionTrue,
        name: "Rule B",
        actions: [ruleBActionShadowed, ruleBActionExecuted],
      }),
    ];
    vi.mocked(mockRuleRepository.getHomeRules).mockResolvedValue(rules);

    await ruleService.executeRulesForHome("home-1", update);

    expect(mockRuleNotificationPort.notifyRulesExecuted).toHaveBeenCalledWith(
      "home-1",
      {
        executions: [
          { ruleName: "Rule A", actions: ["Turn on light light-1"] },
          { ruleName: "Rule B", actions: ["Turn on light light-2"] },
        ],
      },
    );
  });

  it("should not notify when no actions executed", async () => {
    const update: ObservablesUpdatedDomainEvent = {
      externalTemperature: 20,
      internalTemperature: 22,
      airQuality: 50,
      windSpeed: 10,
      weatherForecast: WeatherForecast.Clear,
    };

    const mockConditionFalse = {
      verify: vi.fn().mockReturnValue(false),
    } as unknown as ObservableCondition;

    vi.mocked(mockRuleRepository.getHomeRules).mockResolvedValue([
      makeRule({
        id: "rule-1",
        order: 0,
        condition: mockConditionFalse,
        actions: [],
      }),
    ]);

    await ruleService.executeRulesForHome("home-1", update);

    expect(mockRuleNotificationPort.notifyRulesExecuted).not.toHaveBeenCalled();
  });
});

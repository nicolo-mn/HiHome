import { describe, it, expect, vi, beforeEach } from "vitest";
import { RuleService } from "./RuleService";
import { RuleRepository } from "./RuleRepository";
import { Rule } from "../domain/Rule";
import {
  ObservablesUpdatedDomainEvent,
  ObservableCondition,
  WeatherForecast,
  WeatherCondition,
} from "../domain/Observables";
import {
  ComponentAction,
  LightTurnOffAction,
  LightTurnOnAction,
  ThermostatSetTemperatureAction,
  WindowCloseAction,
  WindowOpenAction,
} from "../domain/Actions";
import { AddRuleDto } from "./RuleService";
import { ActionExecutionPort } from "../domain/ActionExecutionPort";
import { ActionExecutionAdapter } from "../infrastructure/ActionExecutionAdapter";

describe("RuleService", () => {
  let ruleService: RuleService;
  let mockRuleRepository: RuleRepository;
  let mockActionExecutionPort: ActionExecutionPort;

  beforeEach(() => {
    mockRuleRepository = {
      getHomeRules: vi.fn(),
      addRule: vi.fn(),
      deleteRule: vi.fn(),
      getRule: vi.fn(),
      updateRule: vi.fn(),
    } as unknown as RuleRepository;

    mockActionExecutionPort = {
      executeWindowOpen: vi.fn(),
      executeWindowClose: vi.fn(),
      executeThermostatSetTemperature: vi.fn(),
      executeLightTurnOn: vi.fn(),
      executeLightTurnOff: vi.fn(),
    } as unknown as ActionExecutionPort;

    ruleService = new RuleService(mockRuleRepository, mockActionExecutionPort);
  });

  it("should get rules for a home", async () => {
    const rules: Rule[] = [
      {
        id: "rule-1",
        homeId: "home-1",
        name: "Rule 1",
        condition: {} as ObservableCondition,
        actions: [],
      },
    ];
    vi.mocked(mockRuleRepository.getHomeRules).mockResolvedValue(rules);

    const result = await ruleService.getRulesForHome("home-1");

    expect(result).toBe(rules);
    expect(mockRuleRepository.getHomeRules).toHaveBeenCalledWith("home-1");
  });

  it("should add a rule", async () => {
    const createdRule: Rule = {
      id: "new-rule-id",
      homeId: "home-1",
      name: "New Rule",
      condition: {} as ObservableCondition,
      actions: [],
    };
    vi.mocked(mockRuleRepository.addRule).mockResolvedValue(createdRule);

    const dto: AddRuleDto = {
      homeId: "home-1",
      ruleName: "New Rule",
      observableId: "weather",
      operatorTarget: "Rain",
      actions: [
        {
          componentType: "light",
          command: "turnOn",
          componentId: "comp-1",
        },
      ],
    };

    const result = await ruleService.addRule(dto);

    expect(result).toBe(createdRule);
    const [homeId, name, condition, actions] = vi.mocked(
      mockRuleRepository.addRule,
    ).mock.calls[0];
    expect(homeId).toBe("home-1");
    expect(name).toBe("New Rule");
    expect(condition).toBeInstanceOf(WeatherCondition);
    expect(actions[0]).toBeInstanceOf(LightTurnOnAction);
  });

  it("should delete rule delegating the call to the repository", async () => {
    await ruleService.deleteRule("rule-1");
    expect(mockRuleRepository.deleteRule).toHaveBeenCalledWith("rule-1");
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
      {
        id: "rule-1",
        homeId: "home-1",
        name: "Rule 1",
        condition: mockConditionFalse,
        actions: [mockAction1],
      },
      {
        id: "rule-2",
        homeId: "home-1",
        name: "Rule 2",
        condition: mockConditionTrue,
        actions: [mockAction2],
      },
      {
        id: "rule-3",
        homeId: "home-1",
        name: "Rule 3",
        condition: mockConditionTrue,
        actions: [mockAction3],
      },
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
      {
        id: "rule-1",
        homeId: "home-1",
        name: "Rule 1",
        condition: mockConditionTrue,
        actions: [mockAction1Comp1],
      },
      {
        id: "rule-2",
        homeId: "home-1",
        name: "Rule 2",
        condition: mockConditionFalse,
        actions: [mockAction2Comp2],
      },
      {
        id: "rule-3",
        homeId: "home-1",
        name: "Rule 3",
        condition: mockConditionTrue,
        actions: [mockAction3Comp1],
      },
      {
        id: "rule-4",
        homeId: "home-1",
        name: "Rule 4",
        condition: mockConditionTrue,
        actions: [mockAction4Comp2],
      },
      {
        id: "rule-5",
        homeId: "home-1",
        name: "Rule 5",
        condition: mockConditionTrue,
        actions: [mockAction5Comp2],
      },
    ];
    vi.mocked(mockRuleRepository.getHomeRules).mockResolvedValue(rules);

    await ruleService.executeRulesForHome("home-1", update);

    expect(mockAction1Comp1.accept).toHaveBeenCalled();
    expect(mockAction2Comp2.accept).not.toHaveBeenCalled();
    expect(mockAction3Comp1.accept).not.toHaveBeenCalled();
    expect(mockAction4Comp2.accept).toHaveBeenCalled();
    expect(mockAction5Comp2.accept).not.toHaveBeenCalled();
  });
});

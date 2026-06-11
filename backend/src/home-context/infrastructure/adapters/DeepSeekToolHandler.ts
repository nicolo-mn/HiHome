import type {
  ForecastPort,
  ForecastSummary,
} from "../../application/ports/ForecastPort";
import { HomeService } from "../../application/services/HomeService";
import { DeviceStateSerializer } from "../DeviceStateSerializer";
import type { DeviceSerialization } from "../../application/dtos/DeviceDTO";
import { DeviceTypes } from "../../domain";
import type { AddRuleDto } from "../../../rule-context/application/services/RuleService";
import { RuleService } from "../../../rule-context/application/services/RuleService";
import { DeepSeekToolName } from "./DeepSeekToolDefinitions";
import type {
  DeepSeekToolCall,
  DeepSeekMessage,
} from "./DeepSeekToolDefinitions";

export class DeepSeekToolHandler {
  private stateSerializer = new DeviceStateSerializer();

  constructor(
    private forecastPort: ForecastPort,
    private homeService: HomeService,
    private ruleService: RuleService,
  ) {}

  async handleToolCalls(
    toolCalls: DeepSeekToolCall[],
    homeId: string,
  ): Promise<DeepSeekMessage[]> {
    const responses: DeepSeekMessage[] = [];

    for (const toolCall of toolCalls) {
      console.log(
        `Handling tool call: ${toolCall.function.name} with args ${toolCall.function.arguments}`,
      );
      try {
        const content = await this.executeTool(toolCall, homeId);
        responses.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content,
        });
      } catch (error: any) {
        responses.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: error?.message ?? "Tool execution failed.",
        });
      }
    }

    return responses;
  }

  private async executeTool(
    toolCall: DeepSeekToolCall,
    homeId: string,
  ): Promise<string> {
    switch (toolCall.function.name) {
      case DeepSeekToolName.GetForecastSummary:
        return this.handleGetForecast(homeId);
      case DeepSeekToolName.GetDeviceStates:
        return this.handleGetDeviceStates(homeId);
      case DeepSeekToolName.AddRule:
        return this.handleAddRule(toolCall.function.arguments, homeId);
      case DeepSeekToolName.AddDevice:
        return this.handleAddDevice(toolCall.function.arguments, homeId);
      case DeepSeekToolName.ExecuteDeviceActions:
        return this.handleExecuteDeviceActions(
          toolCall.function.arguments,
          homeId,
        );
      default:
        return "Unsupported tool call.";
    }
  }

  private async handleGetForecast(homeId: string): Promise<string> {
    const coords = await this.homeService.getHomeCoordinates(homeId);
    const summary = await this.forecastPort.getForecastSummary({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    if (!summary) {
      return "Forecast unavailable.";
    }
    return this.formatForecast(summary);
  }

  private async handleGetDeviceStates(homeId: string): Promise<string> {
    const devices = await this.homeService.getDevices(homeId);
    return this.formatDeviceStates(
      devices.map((device) => device.accept(this.stateSerializer)),
    );
  }

  private async handleAddRule(
    rawArgs: string,
    homeId: string,
  ): Promise<string> {
    const args = this.parseRuleArguments(rawArgs);
    const dto: AddRuleDto = {
      homeId,
      ruleName: args.ruleName,
      observableId: args.observableId,
      operator: args.operator,
      operatorTarget: args.operatorTarget,
      actions: args.actions,
      timeWindow: args.timeWindow,
    };
    const newRule = await this.ruleService.addRule(dto);
    return `Rule created with id ${newRule.id}.`;
  }

  private async handleAddDevice(
    rawArgs: string,
    homeId: string,
  ): Promise<string> {
    const args = JSON.parse(rawArgs) as {
      name: string;
      type: string;
      roomId: string;
    };
    const device = await this.homeService.addDevice(homeId, {
      name: args.name,
      type: args.type as DeviceTypes,
      roomId: args.roomId,
    });
    return `Device "${device.name}" (${device.getType()}) added with id ${device.id}.`;
  }

  private async handleExecuteDeviceActions(
    rawArgs: string,
    homeId: string,
  ): Promise<string> {
    const args = JSON.parse(rawArgs) as {
      actions: Array<{
        deviceId: string;
        action: string;
        param?: number | string;
      }>;
    };

    if (!Array.isArray(args.actions) || args.actions.length === 0) {
      throw new Error("No actions provided.");
    }

    const results: string[] = [];
    for (const actionItem of args.actions) {
      try {
        const { device } = await this.homeService.executeAction(
          homeId,
          actionItem.deviceId,
          actionItem.action,
          actionItem.param,
        );
        results.push(
          `OK: ${device.name} (${device.id}) -> ${actionItem.action}`,
        );
      } catch (error: any) {
        results.push(
          `FAILED: ${actionItem.deviceId} -> ${actionItem.action} (${error?.message ?? "error"})`,
        );
      }
    }

    return results.join("\n");
  }

  private parseRuleArguments(raw: string): {
    ruleName: string;
    observableId: AddRuleDto["observableId"];
    operator?: AddRuleDto["operator"];
    operatorTarget: AddRuleDto["operatorTarget"];
    actions: AddRuleDto["actions"];
    timeWindow?: AddRuleDto["timeWindow"];
  } {
    try {
      return JSON.parse(raw) as {
        ruleName: string;
        observableId: AddRuleDto["observableId"];
        operator?: AddRuleDto["operator"];
        operatorTarget: AddRuleDto["operatorTarget"];
        actions: AddRuleDto["actions"];
        timeWindow?: AddRuleDto["timeWindow"];
      };
    } catch {
      throw new Error("Invalid tool arguments.");
    }
  }

  private formatDeviceStates(devices: DeviceSerialization[]): string {
    if (devices.length === 0) {
      return "No devices in this home.";
    }

    return devices
      .map((device) => {
        const head = `${device.name} (id ${device.id}, ${device.type})`;
        if ("isOn" in device) {
          return `${head}: ${device.isOn ? "on" : "off"}`;
        }
        if ("isOpen" in device) {
          return `${head}: ${device.isOpen ? "open" : "closed"}`;
        }
        if ("temperature" in device) {
          return `${head}: set to ${device.temperature}C`;
        }
        if ("isLocked" in device) {
          return `${head}: ${device.isLocked ? "locked" : "unlocked"}`;
        }
        if ("mode" in device) {
          return `${head}: mode ${device.mode}`;
        }
        return head;
      })
      .join("\n");
  }

  private formatForecast(summary: ForecastSummary) {
    return summary.days
      .map((day) => {
        const daylightHours = day.daylightDuration / 3600;
        const aqiStr = day.hourlyAirQuality
          .map(
            (h) => `${h.time.split("T")[1].substring(0, 5)}=${h.europeanAqi}`,
          )
          .join(" ");

        return [
          `${day.date}:`,
          `${day.weatherForecast},`,
          `${day.temperatureMin.toFixed(1)}-${day.temperatureMax.toFixed(1)}C,`,
          `wind ${day.windSpeedMax.toFixed(1)} m/s ${day.windDirectionDominant.toFixed(0)} deg,`,
          `precip ${day.precipitationSum.toFixed(1)} mm (${day.precipitationHours.toFixed(1)}h),`,
          `daylight ${daylightHours.toFixed(1)}h.`,
          `Hourly AQI: ${aqiStr}`,
        ].join(" ");
      })
      .join("\n");
  }
}

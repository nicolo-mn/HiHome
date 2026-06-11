export enum DeepSeekToolName {
  GetForecastSummary = "get_forecast_summary",
  GetDeviceStates = "get_device_states",
  ExecuteDeviceActions = "execute_device_actions",
  AddRule = "add_rule",
  AddDevice = "add_device",
}

// DTO to be sent to the model when invoking it, to let it know about the possible tools
export type DeepSeekTool = {
  type: "function";
  function: {
    name: DeepSeekToolName;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
};

// Represents a tool invocation request by the model
// index is used to identify which tool call the fragment belogs to
// id is used after streaming to send the result back to the model
export type DeepSeekToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

// DTO used for requests to DeepSeek APIs
// if role is "tool", content contains the tool response and tool_call_id identifies which tool call this is responding to
// if role is "assistant", content contains the model reply and reasoning_content contains the model reasoning trace
export type DeepSeekMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  reasoning_content?: string | null;
  tool_call_id?: string;
  tool_calls?: DeepSeekToolCall[];
};

export function buildTools(isAdmin: boolean): DeepSeekTool[] {
  const tools = [
    buildForecastTool(),
    buildDeviceStatesTool(),
    buildDeviceActionsTool(),
  ];
  if (isAdmin) {
    tools.push(buildAddRuleTool(), buildAddDeviceTool());
  }
  return tools;
}

function buildDeviceStatesTool(): DeepSeekTool {
  return {
    type: "function",
    function: {
      name: DeepSeekToolName.GetDeviceStates,
      description:
        "Get the current, up-to-date state of every device in the home " +
        "(light on/off, window open/closed, thermostat target temperature, " +
        "lock locked/unlocked, fan mode). Call this whenever the user asks " +
        "about the current status of one or more devices, since the device " +
        "list in the system prompt does not include live state.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  };
}

function buildDeviceActionsTool(): DeepSeekTool {
  return {
    type: "function",
    function: {
      name: DeepSeekToolName.ExecuteDeviceActions,
      description:
        "Execute one or more actions on devices in the current home. " +
        "Use this when the user asks to control devices (including bulk actions like 'turn off all lights'). " +
        "Each action item must include a deviceId and action. Supported actions: " +
        "turnOn, turnOff, open, close, setTemperature, lock, unlock, setMode. " +
        "For setTemperature, provide param as a number. For setMode, param is one of off, low, medium, high.",
      parameters: {
        type: "object",
        properties: {
          actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                deviceId: { type: "string" },
                action: {
                  type: "string",
                  enum: [
                    "turnOn",
                    "turnOff",
                    "open",
                    "close",
                    "setTemperature",
                    "lock",
                    "unlock",
                    "setMode",
                  ],
                },
                param: { type: ["string", "number"] },
              },
              required: ["deviceId", "action"],
            },
          },
        },
        required: ["actions"],
      },
    },
  };
}

function buildForecastTool(): DeepSeekTool {
  return {
    type: "function",
    function: {
      name: DeepSeekToolName.GetForecastSummary,
      description: "Get a concise forecast summary for the current home.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  };
}

function buildAddRuleTool(): DeepSeekTool {
  return {
    type: "function",
    function: {
      name: DeepSeekToolName.AddRule,
      description:
        "Create an automation rule for the current home. Use this tool only after collecting all required fields. " +
        "Fields: ruleName (short label), observableId (weather|outdoor-thermometer|indoor-thermometer|wind-speed|air-quality). " +
        "For weather: operatorTarget must be one of Clear, Drizzle, Fog, Overcast, Cloudy, Rain, Snow, Thunderstorm and operator is omitted. " +
        "For numeric observables: operator is gt|lt|eq and operatorTarget is a number or numeric string. " +
        "Actions is a non-empty array; each action has deviceType (light|window|thermostat|lock|fan), command, deviceId, and targetTemp required only when command is setTemperature. Commands by type: light -> turnOn|turnOff, window -> open|close, thermostat -> setTemperature, lock -> lock|unlock, fan -> setOff|setLow|setMedium|setHigh. " +
        "Optionally, provide a timeWindow to restrict when the rule applies. Its fields: days (array of 0-6 where 0=Sun 6=Sat; omit for every day), start (HH:MM string; omit for start of day), end (HH:MM string; omit for end of day).",
      parameters: {
        type: "object",
        properties: {
          ruleName: {
            type: "string",
            description: "Human-friendly rule label.",
          },
          observableId: {
            type: "string",
            enum: [
              "weather",
              "outdoor-thermometer",
              "indoor-thermometer",
              "wind-speed",
              "air-quality",
            ],
          },
          operator: {
            type: "string",
            enum: ["gt", "lt", "eq"],
            description: "Required for numeric observables; omit for weather.",
          },
          operatorTarget: {
            type: ["string", "number"],
            description: "Weather forecast string or numeric boundary value.",
          },
          actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                deviceType: {
                  type: "string",
                  enum: ["light", "window", "thermostat", "lock", "fan"],
                },
                command: {
                  type: "string",
                  enum: [
                    "turnOn",
                    "turnOff",
                    "open",
                    "close",
                    "setTemperature",
                    "lock",
                    "unlock",
                    "setOff",
                    "setLow",
                    "setMedium",
                    "setHigh",
                  ],
                },
                deviceId: { type: ["string", "number"] },
                targetTemp: { type: ["string", "number"] },
              },
              required: ["deviceType", "command", "deviceId"],
            },
          },
          timeWindow: {
            type: "object",
            properties: {
              days: {
                type: "array",
                items: {
                  type: "number",
                  enum: [0, 1, 2, 3, 4, 5, 6],
                },
                description:
                  "Subset of 0..6 (0=Sun, 6=Sat). Omit or empty means every day.",
              },
              start: {
                type: "string",
                description: "HH:MM start time (24h). Omit for start of day.",
              },
              end: {
                type: "string",
                description: "HH:MM end time (24h). Omit for end of day.",
              },
            },
          },
        },
        required: ["ruleName", "observableId", "operatorTarget", "actions"],
      },
    },
  };
}

function buildAddDeviceTool(): DeepSeekTool {
  return {
    type: "function",
    function: {
      name: DeepSeekToolName.AddDevice,
      description:
        "Add a new smart device to a room in the current home. " +
        "Fields: name (human-friendly label), type (light|window|thermostat|lock|fan), roomId (the ID of the room to place the device in).",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Human-friendly label for the device.",
          },
          type: {
            type: "string",
            enum: ["light", "window", "thermostat", "lock", "fan"],
            description: "The type of smart device to add.",
          },
          roomId: {
            type: "string",
            description: "The ID of the room to place the device in.",
          },
        },
        required: ["name", "type", "roomId"],
      },
    },
  };
}

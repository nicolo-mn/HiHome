---
layout: default
title: Implementation
nav_order: 5
---

# Implementation

The application is a monorepo, with a directory for each architectural component.

## Technology stack

The programming language used both for the backend and the frontend is **TypeScript**, to benefit from strong typing and object-oriented constructs.

The backend runs on **Node.js** and uses **Express** as the HTTP layer, **MongoDB** as the persistence engine accessed through **Mongoose**, and **Socket.IO** for real-time communication with the client.
Authentication relies on stateless **JWT** tokens, implemented with the `jsonwebtoken` library.

The frontend relies on **Nginx** as web server and reverse proxy; the user interface is designed using **Vue** and **Tailwind**, with state management provided by **Pinia**.

The AI assistant uses the **DeepSeek** chat completion API.

The external API service is a separate **Go** application that exposes REST APIs.

The application is fully containerized using **Docker**, each architectural component is shipped inside a separate container. The containers are orchestrated using **Docker Compose** and shipped through **GitHub Container Registry** as a result of each release.


## Weather service

The Weather service is implemented as a server written in **Go**. It exposes REST APIs to allow the backend to get information about environmental conditions, in particular:
- `/api/v1/environment/current`: Returns current weather and current air quality index (AQI).
- `/api/v1/environment/forecast`: Returns the 7-day weekly forecast with daily weather data and hourly AQI details.
- `/api/v1/environment/historical`: Returns historical weather and air quality conditions for the past 7 days.
Similarly to other services, it also exposes a `/health` endpoint to allow inspection of the service's state.

The Weather service obtains the requested information through the Weather and Air Quality APIs from OpenMeteo. From a DDD perspective, an outbound port was built to hide implementation details regarding the specific API providers used. This port returns Domain value objects, as follows:
```go
type EnvironmentInfoProvider interface {
  FetchCurrentWeather(lat, lon float64) (*WeatherInfo, error)
  FetchCurrentAirQuality(lat, lon float64) (*AirQualityInfo, error)
  FetchWeeklyForecast(lat, lon float64) (*WeeklyForecast, error)
  FetchHistoricalForecast(lat, lon float64) (*WeeklyForecast, error)
}
```

An adapter (`OpenMeteoClient`) is then used to implement such port and contact `api.open-meteo.com` and `air-quality-api.open-meteo.com`.

## Home context

### Visitor pattern for devices

Devices (Light, Window, Thermostat, Fan, SmartLock) form a polymorphic hierarchy. All operations that need to distinguish device types go through a `DeviceVisitor<T>`, avoiding `instanceof` checks scattered across the codebase. Each device class implements a single `accept` method:

```typescript
export class Light implements Device {
  accept<T>(visitor: DeviceVisitor<T>): T {
    return visitor.visitLight(this);
  }
}
```

The generic type parameter lets the same interface serve different behaviours. Three concrete visitors exist: `DeviceStateSerializer` (maps devices to API response DTOs), `DeviceActionExecutionVisitor` (executes rule-triggered actions, returns `Promise<void>`), and `ActionDescriptionVisitor` (produces human-readable descriptions for notifications). When a new device type is added, the compiler flags every visitor that has not handled it, making the pattern exhaustive by construction.

### Live updates

Socket.IO connections are organised into rooms keyed by home and user. On connection a socket joins `home-${homeId}`; authenticated users also join `user-${username}`. Adapters broadcast to the room directly:

```typescript
io.on("connection", (socket) => {
  socket.join(`home-${homeId}`);
  if (username) socket.join(`user-${username}`);
  void homeService.sendOutdoorSensorsUpdate(homeId);
  void homeService.sendIndoorSensorsUpdate(homeId);
});
```

```typescript
export class SocketIOSensorUpdateAdapter implements SensorUpdatePort {
  sendOutdoorTemperatureUpdate(home: Home, update: TemperatureState): void {
    this.io.to(`home-${home.id}`).emit("sensor:outdoor-temperature", {
      temperature: update.temperature,
    });
  }
}
```

On connection the client receives a snapshot of the current sensor state, then only incremental pushes going forward.
Web sockets are also used to send push notifications for actions, and live updates on the devices' state, to keep the application synced when other users are performing actions on the devices or an automation executes.

### Event log

Device events are modelled as a **TypeScript discriminated union**: each event type carries a literal `eventType` field used for exhaustive narrowing.

```typescript
export type ThermostatSetEvent = DeviceEventBase & {
  eventType: "ThermostatSet";
  targetTemperature: number;
};

export type DeviceEvent =
  | LightTurnedOnEvent
  | LightTurnedOffEvent
  | ThermostatSetEvent
  | ...;
```

When deserialising from MongoDB a `switch` on `eventType` reconstructs the correct shape, ensuring completeness as the compiler will flag the switch as non-exhaustive if some events are not covered.

Each event also carries an optional `actor` field (the username and role of the user who triggered the action). A `null` actor means the event was fired by an automation rule rather than a human. This distinction is used both in usage analytics and in notification filtering.

### Usage analytics

The `UsageService` derives energy and activity metrics directly from the event log, with no separate aggregation store. Two calculation modes are needed for different questions: the total on-time of all individual devices (relevant for energy consumption, since each device draws power independently), and the union of intervals across devices (relevant for general understanding of how long lights have been turned on or windows have been opened, which does not double-count overlapping periods).

`OnOffIntervalCalculator` implements both computations. For each device it builds a list of `[on, off]` intervals clipped to the requested range. If the last event *before* the range start is an `on` event, the interval opens at `rangeStart` rather than being discarded, correctly accounting for devices that were already active when the window begins. The union variant merges the per-device intervals with a single sorted sweep:

```typescript
for (const [start, end] of intervals) {
  if (mergeStart === null) { mergeStart = start; mergeEnd = end; }
  else if (start <= mergeEnd!) { if (end > mergeEnd!) mergeEnd = end; }
  else {
    totalMs += mergeEnd!.getTime() - mergeStart.getTime();
    mergeStart = start; mergeEnd = end;
  }
}
```

## Rule context

### Aggregate root and rule ordering

Rule evaluation work under the assumption that each rule has a priority: if multiple rules' condition are satisfied, the resulting set of actions is deterministic, and the higher priority rule will execute all its actions as a whole, while lower priority rules may have only a subset of their actions executed, depending on overrides.

The ordered list of rules for a home is modelled as a DDD aggregate root, `HomeRuleSet`. It owns the invariant that every rule's `order` field is unique and contiguous from zero. Business operations such as `remove` and `reorder` are methods on the aggregate rather than ad-hoc logic in the service layer:

```typescript
remove(ruleId: string): void {
  const index = this._rules.findIndex((r) => r.id === ruleId);
  if (index === -1) throw new Error("Rule not found");
  this._rules.splice(index, 1);
  this._rules = this._rules.map((r, i) => ({ ...r, order: i }));
}

reorder(orderedRuleIds: string[]): void {
  if (orderedRuleIds.length !== this._rules.length)
    throw new Error("Reorder must include every rule of the home exactly once");
  // ...reassigns contiguous order values
}
```

After every mutating operation, `RuleService` calls `ruleRepo.reorderRules` to persist the new positions, keeping the database consistent with the aggregate's invariant.

### Rule conditions

In the model, a condition is either numeric (temperature, wind speed, air quality) or categorical (weather). The two differ only in the operators they accept: numeric conditions compare with greater than, lower than or equals, while categorical ones only check equality, as in weather is sunny.

Each rule carries exactly one condition, and a condition pairs an observable, the sensor reading it watches, with an operator, the comparison applied to that reading. The readings arrive together in a single snapshot, and the condition simply reads its own field and reports whether it is satisfied.

The comparison is factored out behind a generic interface:

```typescript
interface Operator<T> {
  evaluate(value: T): boolean;
  getBoundaryValue(): T;
}
```

This keeps two concerns apart: the condition decides which observable to read, the operator decides how to compare it against a stored target. Any condition can then reuse any compatible operator, instead of writing one class for every observable and comparison. The generic parameter lets the same interface serve both the numeric readings and the weather enum.

The numeric conditions implement the `Operator` interface, accepting the operation lambda as a constructor parameter.

```typescript
abstract class NumericOperator implements Operator<number> {
  protected constructor(
    private readonly operation: (value: number) => boolean,
    private readonly boundaryValue: number,
  ) {}

  evaluate(value: number): boolean {
    return this.operation(value);
  }

  getBoundaryValue(): number {
    return this.boundaryValue;
  }
}
```

Then, an implementation for each specific operator is provided.

```typescript
export class NumericGreaterOperator extends NumericOperator {
  constructor(target: number) {
    super((n) => n > target, target);
  }
}
```

`BoundedNumericCondition` are conditions which take a `NumericOperator` and carry a range, enforced both when the rule is created and when it is evaluated. A target outside that range raises a `BoundaryViolationError`, so an unsatisfiable rule is rejected at the application boundary.

The final class is sensor-specific, and builds the final shape of the condition for each sensor with the selected operator, applying specific boundaries values and naming the condition.

```typescript
export class OutdoorTemperatureCondition extends BoundedNumericCondition {
  static readonly MIN_TEMP = 10;
  static readonly MAX_TEMP = 30;

  constructor(operator: NumericOperator) {
    super(
      operator,
      OutdoorTemperatureCondition.MIN_TEMP,
      OutdoorTemperatureCondition.MAX_TEMP,
      "OutdoorTemperatureCondition",
    );
  }

  accept<R>(visitor: ConditionVisitor<R>): R {
    return visitor.visitTemperatureCondition(this);
  }

  verify(update: ObservablesUpdatedDomainEvent): boolean {
    return this.assertInRangeAndEvaluate(update.outdoorTemperature);
  }
}
```

### Cross-context event bus

The Home and Rule contexts are decoupled through a lightweight in-process event bus built on Node.js's `EventEmitter`. When fresh sensor data arrives, the Home context calls its `RuleServicePort` to trigger the Rule context. The adapter emits a named event on a shared emitter; the `AsyncBus` on the Rule context side subscribes to that event and invokes the rule service to handle rule execution:

```typescript
// Home side: the adapter the Home context calls
export class AsyncBusRuleServiceAdapter implements RuleServicePort {
  evaluateRules(homeId: string, ...): void {
    this.eventEmitter.emit(this.eventName, homeId, event);
  }
}

// Rule side: the bus that drives the service
export class AsyncBus {
  constructor(...) {
    this.eventEmitter.on(this.eventName, this.handleEvent.bind(this));
  }
  private async handleEvent(homeId: string, update: ObservablesUpdatedDomainEvent) {
    await this.ruleService.executeRulesForHome(homeId, update);
  }
}
```

### Rule evaluation

#### Edge detection
Rules fire only on the transition from unsatisfied to satisfied, not on every sensor poll while the condition holds. The service keeps a `lastMatchByRuleId` map and fires a rule only when `currentMatch && !prevMatch`:

```typescript
const prevMatch = this.lastMatchByRuleId.get(rule.id) ?? false;
const shouldFire = currentMatch && !prevMatch;
this.lastMatchByRuleId.set(rule.id, currentMatch);
```

#### Conflict resolution
When multiple rules would act on the same device, only the highest-priority rule's action is kept. An `actionPerDevice` map is built during the priority walk; later rules skip devices already claimed:

```typescript
for (const action of rule.actions) {
  if (actionPerDevice.has(action.getDeviceId())) continue;
  actionPerDevice.set(action.getDeviceId(), action);
}
```

#### Sequential evaluation per home
Sensor updates can arrive faster than rule evaluation completes. To avoid concurrent evaluations for the same home, each evaluation is chained on the previous one:

```typescript
const prev = this.evalChains.get(homeId) ?? Promise.resolve();
const next = prev.catch(() => {}).then(() => this.runRuleEvaluation(homeId, update));
this.evalChains.set(homeId, next);
```

When the chain resolves and no newer evaluation is pending, the entry is removed from the map to prevent unbounded memory growth.

### Time windows

Rules can be restricted to days of the week and time ranges, evaluated in the **Europe/Rome** timezone. The implementation uses `Intl.DateTimeFormat.formatToParts` to handle daylight-saving transitions correctly, avoiding manual UTC offset arithmetic. Time ranges crossing midnight (e.g. 22:00 to 06:00) are detected when `start > end` and handled with a logical OR:

```typescript
if (start <= end) {
  return minutes >= start && minutes <= end;
}
return minutes >= start || minutes <= end; // crosses midnight
```

## Notification context

`NotificationService` handles three event types — `AirQualityThresholdBreach`, `AutomationRuleExecuted`, and `DeviceAction` — with distinct delivery semantics for each.

For air quality alerts, a configurable threshold is read from a `NotificationPolicy` (Strategy pattern), making the threshold replaceable without touching the service. A 1-hour suppression window is enforced directly in the service: before delivering an alert it checks the timestamp of the most recent notification of the same type and skips delivery if less than an hour has passed.

```typescript
private async shouldNotifyAirQuality(homeId: string): Promise<boolean> {
  const last = await this.repository.findLatestByHomeAndType(homeId, "AirQualityThresholdBreach");
  if (last && Date.now() - last.createdAt.getTime() < 60 * 60 * 1000) return false;
  return true;
}
```

Device action notifications are filtered by actor role: actions performed by an Admin are not surfaced to users, since admin operations are considered authoritative, while standard user may need additional supervision.

Delivery is opt-in per user, per notification type. Before sending, the service queries `UserPreferencesPort.getEnabledUsernamesForType`, so a notification only reaches users who have explicitly subscribed to that category. This means a single incoming event may produce zero, one, or many `Notification` domain objects, one per opted-in user. Each is stored in the database and delivered individually using Socket.IO's `user-${username}` room, so each notification reaches exactly its intended recipient regardless of how many connections that user has open.

## AI assistant

The AI assistant is built around a conversational loop that exposes a controlled set of tools to the language model (DeepSeek). `ChatCompletionPort` is an outbound port that exposes a `streamChat`, which produces an assistant reply given a conversational history:
```typescript
export interface ChatCompletionPort {
  streamChat(
    messages: ChatMessage[],
    model: string,
    homeId: string,
    streamPort: ChatStreamPort,
    isAdmin: boolean,
  ): Promise<string>;
}
```
A `ChatStreamPort` instance is passed to emit single tokens to the frontend through its websocket connection. Each time the user sends a message, the chat history is sent from the client (saved client-side through `LocalStorage`); then, the call is passed to `DeepSeekChatCompletionAdapter`, the adapter implementing `ChatCompletionPort`, to handle the communication with DeepSeek APIs.

### Streaming and multi-turn tool loop

The adapter drives a loop that calls the model and, if tool calls are requested, executes them and returns their response to the model. The tool calling is capped at five round trips, to avoid the model looping indefinitely. The AI model is used in streaming mode, to push chunks dynamically to the client, reducing waiting times to enhance the user experience.  Each SSE chunk from DeepSeek is parsed and forwarded token-by-token to the client through `ChatStreamPort`:

Because tool call arguments arrive fragmented across SSE chunks as well, they are accumulated per-index before dispatching.

```typescript
for (const tc of delta.tool_calls) {
  if (!toolCallAccumulators.has(tc.index)) {
    toolCallAccumulators.set(tc.index, {
      id: tc.id ?? "",
      name: tc.function?.name ?? "",
      arguments: "",
    });
  }
  const acc = toolCallAccumulators.get(tc.index)!;
  if (tc.id) acc.id = tc.id;
  if (tc.function?.name) acc.name = tc.function.name;
  if (tc.function?.arguments) {
    acc.arguments += tc.function.arguments;
  }
}
```

### Role-gated tools

The tool set exposed to the model depends on the caller's role. All users can query device states, execute device actions, and request the weather forecast. Therefore, `streamChat` method of `ChatCompletionPort` accepts a flag to signal if the user is an admin. When the adapter takes on the request, admin users additionally receive tools to add automation rules and add new devices:

```typescript
private buildTools(isAdmin: boolean): DeepSeekTool[] {
  const tools = [this.buildForecastTool(), this.buildDeviceStatesTool(), this.buildDeviceActionsTool()];
  if (isAdmin) tools.push(this.buildAddRuleTool(), this.buildAddDeviceTool());
  return tools;
}
```

### Dynamic system prompt

Before each conversation turn the service fetches the current device and room list and injects it into the system prompt. This grounds the model in the live state of the home without requiring it to call a tool for basic context.

Device IDs are included for the model's internal resolution but the system prompt instructs the model never to expose them to the user, keeping the conversation at a human-readable level.

## User context

### JWT authentication

On login the `AuthService` signs a token embedding the user's `homeId`, `username`, and `role`. Including the role in the token means authorization checks on protected operations need no database round-trip:

```typescript
const payload = { homeId: user.homeId, username: user.username, role: user.role.name };
const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
```

The token is verified by shared middleware that attaches the decoded claims to both the Express request and the Socket.IO socket handshake, making the caller's identity available to any downstream handler.

### Role value object

`Role` is modelled as a value object with a private constructor and two named factory methods (`Role.admin()`, `Role.standard()`). A `Role.parse(value)` static validates untrusted input (e.g. from JWT claims) and throws on unrecognised values. This makes invalid role strings impossible to construct silently and keeps role-comparison logic (`isAdmin()`) close to the type itself.


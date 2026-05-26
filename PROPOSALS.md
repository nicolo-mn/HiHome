# Smart Component Proposals

Five additions that build on the existing architecture without requiring structural changes.
All proposals reuse current patterns: hexagonal architecture, the visitor pattern for conditions
and actions, the existing notification pipeline, and Socket.io for real-time delivery.

---

## 1. Time-Based Rule Conditions (`TimeCondition`)

**What it adds**  
A new `ObservableCondition` subtype that triggers rules at a specific time of day or on a
recurring schedule (e.g. "every weekday at 07:30", "at sunset ±offset"). Most real-world
automations are time-driven, and right now the rule engine only reacts to sensor readings.

**Integration path**  
- Add `TimeCondition` as a new leaf in the `ObservableCondition` union, identical in shape to
  `WeatherCondition` or `ExternalTemperatureCondition`.
- Implement `ConditionVisitor` for it inside `RuleService`: instead of comparing sensor values,
  compare the current server time to the configured schedule.
- Add a lightweight scheduler (a `node-cron` job, one per home) that fires `ObservablesUpdatedDomainEvent`
  on the `AsyncBus` at the right tick — the rest of the rule evaluation pipeline runs unchanged.
- Extend the `RuleRepository` Mongoose schema with a new condition discriminator.
- Add the new condition type to the rule-creation form in the frontend (new branch in the
  condition-type selector, same UI components as numeric conditions).

No changes are needed to `ActionExecutionAdapter`, notification services, or any other context.

---

## 2. Scene Manager

**What it adds**  
A "scene" is a named preset of device states (e.g. _Movie Night_: lights off, thermostat 20 °C,
windows closed). Users activate scenes manually from the dashboard or from a rule action. Scenes
reduce repetitive rule creation and give users a familiar smart-home concept.

**Integration path**  
- Add a `Scene` aggregate to the Home bounded context: `{ id, homeId, name, actions: ComponentAction[] }`.
  `ComponentAction` is already a rich polymorphic type — scenes just hold a saved list of them.
- Add `SceneRepository` (Mongoose-backed, same pattern as `HomeRepository`).
- Add a `SceneService` with `activateScene(sceneId)` that feeds the existing `ActionExecutionAdapter`
  — no new action-execution logic is needed.
- Add a new `ComponentActionVisitor` leaf `ActivateSceneAction` so rules can trigger scenes
  (condition met → activate scene), fitting naturally into the existing action dispatch chain.
- Frontend: a new _Scenes_ view (list + creation form) and a one-click activate button per scene
  card, wired to a new Pinia store.

---

## 3. Component Usage Tracker (Energy / Activity Dashboard)

**What it adds**  
Records every state change for each component (on/off, open/close, temperature set) and exposes
aggregated metrics: daily light-on hours, thermostat average setpoint over the last 7 days,
window open duration. This gives users actionable insights beyond point-in-time device control.

**Integration path**  
- Add a `ComponentUsageEvent` domain event emitted by `HomeService` every time an action is
  executed (the emit point already exists — it currently fires rule evaluation and notifications).
- Add a `UsageRepository` that persists `{ homeId, componentId, action, timestamp }` entries to
  a MongoDB capped/time-series collection.
- Add a `UsageService` with pre-computed aggregation queries (Mongoose aggregation pipeline).
- Expose a `GET /api/home/:homeId/usage` endpoint returning per-component stats.
- Frontend: a new _Insights_ widget on the dashboard showing sparklines and totals using the
  existing sensor-display UI patterns.
- The AI chat context (already includes home state and rules) can be extended with usage summaries
  so the assistant can suggest optimisations ("your lights were on for 14 hours yesterday").

---

## 4. Internal Temperature Threshold Alerts

**What it adds**  
The existing `NotificationPolicy` already enforces AQI threshold breaches with a 1-per-hour
cooldown. Internal room temperature currently only drives rules but never generates stand-alone
alerts. This component adds configurable cold/heat alerts per room (e.g. "notify me if any room
drops below 16 °C").

**Integration path**  
- Add `InternalTemperatureThresholdBreach` to the `NotificationType` union alongside
  `AirQualityThresholdBreach`.
- Extend `NotificationPolicy` with a `internalTempThreshold: { min: number, max: number }` field
  and the same 1-per-hour-per-room cooldown already used for AQI.
- In `HomeService.updateInternalTemperature` (the handler for the existing sensor webhook), add a
  call to `NotificationService` after updating the registry — mirroring the AQI check already
  present in the sensor-polling path.
- Extend the user preferences schema and the frontend _Settings_ view with a toggle for this
  notification type (the preferences infrastructure already handles per-type opt-in/out).

This is the smallest proposal in scope — it reuses every existing abstraction unchanged.

---

## 5. Away / Presence Mode

**What it adds**  
A global home state flag (`home` / `away`) that rules and notifications can reference. When set
to _away_, automations can enforce a security baseline (close all windows, turn off lights) and
suppress non-critical notifications. When switching back to _home_, a "welcome back" scene can
be activated automatically.

**Integration path**  
- Add a `PresenceMode` value object (`{ homeId, mode: 'home' | 'away', updatedAt }`) to the
  Home context, persisted in MongoDB and cached in a `PresenceModeRegistry` (similar to
  `SensorRegistry`).
- Add a `PresenceCondition` leaf to `ObservableCondition` so rules can say "if mode == away,
  close all windows". The `AsyncBus` emits a `PresenceChangedDomainEvent` when the flag flips,
  triggering rule evaluation exactly as sensor updates do today.
- Add a `POST /api/home/:homeId/presence` endpoint (admin-only, matching existing auth
  middleware patterns).
- Extend `NotificationPolicy` with a `suppressInAwayMode: boolean` per notification type so
  non-critical alerts are silenced while away.
- Frontend: a prominent toggle in the header or dashboard with an "Away" badge, wired to the
  Socket.io channel so all connected users see the mode change in real time.

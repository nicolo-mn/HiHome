# Smart Component Proposals

Five new device types to add to the existing polymorphic component model.
The current components are `Light`, `Window`, and `Thermostat`. Each proposal below
follows the same pattern: a new `Component` subclass with its own state shape,
a `ComponentVisitor` implementation, and one or more `ComponentAction` leaves.

---

## 1. Smart Blind / Shutter

**State:** `{ position: number }` — 0 (fully closed) to 100 (fully open).

**Why it's interesting**  
Blinds are the natural complement to windows and lights. A blind reacts to multiple
existing conditions: close when `ExternalTemperature` exceeds a threshold (to block
heat), open when `WeatherCondition == sunny` to maximise natural light, or close
when `WindSpeed` is high. It interacts with every sensor the system already tracks.

**Integration**  
- Add `Blind extends Component` with `position: number`.
- Add `BlindSetPositionAction` to the `ComponentAction` union.
- Implement the action in the existing `ComponentActionVisitor`.
- The frontend component card gets a slider instead of a toggle.

---

## 2. Smart Lock

**State:** `{ isLocked: boolean }`.

**Why it's interesting**  
Security is a first-class use case for any smart home. A lock is the simplest possible
boolean-state device (same shape as `Light`) but with high semantic value. It pairs well
with an "away" routine: a rule could lock all doors when wind picks up past a threshold,
or users can lock/unlock manually from the components view.

**Integration**  
- Add `Lock extends Component` with `isLocked: boolean`.
- Add `LockAction` and `UnlockAction` to the `ComponentAction` union.
- Implement both in `ComponentActionVisitor` — identical in structure to
  `LightTurnOnAction` / `LightTurnOffAction`.
- The frontend card shows a padlock icon that toggles on click.

---

## 3. Air Purifier

**State:** `{ isOn: boolean, mode: 'auto' | 'turbo' | 'silent' }`.

**Why it's interesting**  
The system already monitors AQI via `AirQualityCondition` and fires breach notifications
at a configurable threshold. An air purifier is the natural actuator on the other side of
that signal: "if AQI > 80, turn purifier on in turbo mode". This closes the feedback loop
between sensing and acting on air quality — currently nothing actually *does* anything
about bad air.

**Integration**  
- Add `AirPurifier extends Component` with `isOn: boolean` and `mode` enum.
- Add `AirPurifierTurnOnAction`, `AirPurifierTurnOffAction`, `AirPurifierSetModeAction`.
- Implement in `ComponentActionVisitor`.
- A default rule template (shown in the rule-creation form) can pre-fill an
  AQI condition → purifier turbo-on action as a suggested starting point.

---

## 4. Smart Plug

**State:** `{ isOn: boolean }`.

**Why it's interesting**  
A smart plug is a universal adapter: it turns any dumb appliance (coffee maker, floor lamp,
fan, TV) into a smart one. It is the simplest component possible (boolean, same as `Light`)
but its value is in flexibility — users label the plug themselves ("coffee machine",
"desk fan") so the system gains coverage of arbitrary real-world devices without needing a
dedicated component type for each.

**Integration**  
- Add `SmartPlug extends Component` with `isOn: boolean` and a user-defined `label: string`.
- Reuse `LightTurnOnAction` / `LightTurnOffAction` visitor methods, or add typed
  `PlugTurnOnAction` / `PlugTurnOffAction` as thin aliases.
- The component-creation form adds a free-text label field when `SmartPlug` is selected.
- No condition changes needed — existing rules already target any component by ID.

---

## 5. Smart Irrigation Controller

**State:** `{ isActive: boolean, zone: string }`.

**Why it's interesting**  
Irrigation is highly sensor-driven: skip watering if it is raining (`WeatherCondition ==
rain`), reduce if wind is strong (`WindSpeedCondition`), or trigger when external
temperature exceeds a threshold. All three relevant conditions are already in the system.
It also introduces the concept of *zones* (front garden, back garden, pots), making it the
first component where multiple instances per home have meaningfully different labels.

**Integration**  
- Add `IrrigationController extends Component` with `isActive: boolean` and `zone: string`.
- Add `IrrigationStartAction` and `IrrigationStopAction` to `ComponentAction`.
- Implement in `ComponentActionVisitor`.
- The frontend card shows the zone name and an active/idle status with a water-drop icon.
- A suggested rule template in the creation form: WeatherCondition == rain → stop irrigation.

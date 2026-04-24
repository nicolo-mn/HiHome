<script setup lang="ts">
import { onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth-store";
import { useHomeStore } from "../stores/home-store";

const router = useRouter();
const authStore = useAuthStore();
const homeStore = useHomeStore();

const temperature = computed(
  () => homeStore.sensorReadings.find((r) => r.type === "temperature") || null,
);

const weather = computed(
  () => homeStore.sensorReadings.find((r) => r.type === "weather") || null,
);

const airQuality = computed(
  () => homeStore.sensorReadings.find((r) => r.type === "air_quality") || null,
);

const aqiLevel = computed(() => {
  const val = Number(airQuality.value?.value ?? 0);
  if (val <= 50) return { label: "Good", color: "#00e676" };
  if (val <= 100) return { label: "Moderate", color: "#ffc107" };
  if (val <= 150) return { label: "Unhealthy (SG)", color: "#ff9800" };
  return { label: "Unhealthy", color: "#ff5252" };
});

const weatherEmoji = computed(() => {
  const map: Record<string, string> = {
    sunny: "☀️",
    cloudy: "☁️",
    rainy: "🌧️",
    partly_cloudy: "⛅",
    stormy: "⛈️",
  };
  return map[String(weather.value?.value)] || "🌡️";
});

const weatherLabel = computed(() => {
  const map: Record<string, string> = {
    sunny: "Sunny",
    cloudy: "Cloudy",
    rainy: "Rainy",
    partly_cloudy: "Partly Cloudy",
    stormy: "Stormy",
  };
  return map[String(weather.value?.value)] || "N/A";
});

function componentIcon(type: string): string {
  const icons: Record<string, string> = {
    light: "💡",
    window: "🪟",
    climatization: "❄️",
  };
  return icons[type] || "🏠";
}

function componentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    light: "Light",
    window: "Window / Door",
    climatization: "Climate Control",
  };
  return labels[type] || type;
}

function toggleLight(comp: { id: string; status: Record<string, unknown> }) {
  homeStore.updateComponentStatus(comp.id, {
    on: !comp.status.on,
  });
}

function setWindowDegree(comp: { id: string }, degree: number) {
  homeStore.updateComponentStatus(comp.id, {
    openDegree: degree,
  });
}

function setClimateMode(
  comp: { id: string; status: Record<string, unknown> },
  mode: string,
) {
  homeStore.updateComponentStatus(comp.id, {
    mode,
    targetTemp: comp.status.targetTemp as number,
  });
}

function setClimateTemp(
  comp: { id: string; status: Record<string, unknown> },
  temp: number,
) {
  homeStore.updateComponentStatus(comp.id, {
    mode: comp.status.mode as string,
    targetTemp: temp,
  });
}

function handleLogout() {
  homeStore.$reset();
  authStore.logout();
  router.push({ name: "login" });
}

onMounted(async () => {
  await homeStore.fetchComponents();
  homeStore.connectSensors();
});

onUnmounted(() => {
  homeStore.disconnectSensors();
});
</script>

<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="dash-header">
      <div class="header-left">
        <h1 class="header-title">
          <span class="header-icon">🏠</span>
          HiHome
        </h1>
        <div class="header-meta">
          <span class="meta-badge">
            <svg viewBox="0 0 16 16" fill="currentColor" class="meta-icon">
              <path
                d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z"
              />
            </svg>
            {{ authStore.username }}
          </span>
          <span class="meta-badge meta-badge--home">
            <svg viewBox="0 0 16 16" fill="currentColor" class="meta-icon">
              <path
                d="M8.543 2.232a.75.75 0 0 0-1.085 0l-5.25 5.5A.75.75 0 0 0 2.75 9H4v4a1 1 0 0 0 1 1h1.5a.5.5 0 0 0 .5-.5V12a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 0 .5.5H11a1 1 0 0 0 1-1V9h1.25a.75.75 0 0 0 .543-1.268l-5.25-5.5Z"
              />
            </svg>
            {{ authStore.homeId }}
          </span>
        </div>
      </div>
      <button id="logout-btn" class="logout-btn" @click="handleLogout">
        <svg viewBox="0 0 20 20" fill="currentColor" class="logout-icon">
          <path
            fill-rule="evenodd"
            d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z"
            clip-rule="evenodd"
          />
          <path
            fill-rule="evenodd"
            d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z"
            clip-rule="evenodd"
          />
        </svg>
        Logout
      </button>
    </header>

    <!-- Sensor Bar -->
    <section class="sensor-bar">
      <div class="sensor-card sensor-card--weather">
        <div class="sensor-emoji">{{ weatherEmoji }}</div>
        <div class="sensor-info">
          <span class="sensor-label">Weather</span>
          <span class="sensor-value">{{ weatherLabel }}</span>
        </div>
      </div>

      <div class="sensor-card sensor-card--temp">
        <div class="sensor-emoji">🌡️</div>
        <div class="sensor-info">
          <span class="sensor-label">Temperature</span>
          <span class="sensor-value">
            {{ temperature?.value ?? "--" }}{{ temperature ? "°C" : "" }}
          </span>
        </div>
      </div>

      <div class="sensor-card sensor-card--aqi">
        <div class="sensor-emoji">🍃</div>
        <div class="sensor-info">
          <span class="sensor-label">Air Quality</span>
          <span class="sensor-value">
            <span
              class="aqi-dot"
              :style="{ background: aqiLevel.color }"
            ></span>
            {{ airQuality?.value ?? "--" }} AQI
            <span class="aqi-label">{{ aqiLevel.label }}</span>
          </span>
        </div>
      </div>
    </section>

    <!-- Components -->
    <section class="components-section">
      <h2 class="section-title">Home Components</h2>

      <div v-if="homeStore.isLoading" class="loading-state">
        <div class="loader"></div>
        <p>Loading components...</p>
      </div>

      <div v-else-if="homeStore.error" class="error-state">
        <p>{{ homeStore.error }}</p>
      </div>

      <div v-else class="components-grid">
        <div
          v-for="comp in homeStore.components"
          :key="comp.id"
          class="component-card"
          :class="{
            'component-card--active':
              comp.type === 'light'
                ? comp.status.on
                : comp.type === 'window'
                  ? (comp.status.openDegree as number) > 0
                  : comp.status.mode !== 'off',
          }"
        >
          <div class="comp-header">
            <span class="comp-icon">{{ componentIcon(comp.type) }}</span>
            <span class="comp-type-badge">{{
              componentTypeLabel(comp.type)
            }}</span>
          </div>

          <h3 class="comp-name">{{ comp.name }}</h3>

          <!-- Light Controls -->
          <div v-if="comp.type === 'light'" class="comp-controls">
            <div class="toggle-row">
              <span class="control-label">{{
                comp.status.on ? "On" : "Off"
              }}</span>
              <button
                :id="`toggle-light-${comp.id}`"
                class="toggle-switch"
                :class="{ 'toggle-switch--on': comp.status.on }"
                @click="toggleLight(comp)"
              >
                <span class="toggle-knob"></span>
              </button>
            </div>
          </div>

          <!-- Window Controls -->
          <div v-if="comp.type === 'window'" class="comp-controls">
            <div class="slider-row">
              <span class="control-label"
                >Open: {{ comp.status.openDegree }}%</span
              >
              <input
                :id="`slider-window-${comp.id}`"
                type="range"
                min="0"
                max="100"
                :value="comp.status.openDegree"
                class="range-slider"
                @change="
                  setWindowDegree(
                    comp,
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              />
            </div>
          </div>

          <!-- Climatization Controls -->
          <div v-if="comp.type === 'climatization'" class="comp-controls">
            <div class="mode-row">
              <button
                :id="`mode-cool-${comp.id}`"
                class="mode-btn"
                :class="{ 'mode-btn--active': comp.status.mode === 'cool' }"
                @click="setClimateMode(comp, 'cool')"
              >
                ❄️ Cool
              </button>
              <button
                :id="`mode-heat-${comp.id}`"
                class="mode-btn"
                :class="{ 'mode-btn--active': comp.status.mode === 'heat' }"
                @click="setClimateMode(comp, 'heat')"
              >
                🔥 Heat
              </button>
              <button
                :id="`mode-off-${comp.id}`"
                class="mode-btn"
                :class="{ 'mode-btn--active': comp.status.mode === 'off' }"
                @click="setClimateMode(comp, 'off')"
              >
                ⏹ Off
              </button>
            </div>
            <div class="slider-row">
              <span class="control-label"
                >Target: {{ comp.status.targetTemp }}°C</span
              >
              <input
                :id="`temp-slider-${comp.id}`"
                type="range"
                min="16"
                max="30"
                :value="comp.status.targetTemp"
                class="range-slider"
                @change="
                  setClimateTemp(
                    comp,
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--bg-primary);
  padding-bottom: 2rem;
}

/* ========== HEADER ========== */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 2rem;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--glass-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-icon {
  -webkit-text-fill-color: initial;
}

.header-meta {
  display: flex;
  gap: 0.6rem;
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.meta-badge--home {
  color: var(--accent-primary);
  border-color: rgba(0, 210, 255, 0.2);
  background: rgba(0, 210, 255, 0.08);
}

.meta-icon {
  width: 14px;
  height: 14px;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 82, 82, 0.1);
  border: 1px solid rgba(255, 82, 82, 0.25);
  border-radius: 10px;
  color: var(--color-error);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
}

.logout-btn:hover {
  background: rgba(255, 82, 82, 0.2);
  transform: translateY(-1px);
}

.logout-icon {
  width: 16px;
  height: 16px;
}

/* ========== SENSOR BAR ========== */
.sensor-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  padding: 1.5rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.sensor-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease both;
}

.sensor-card:nth-child(2) {
  animation-delay: 0.1s;
}

.sensor-card:nth-child(3) {
  animation-delay: 0.2s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sensor-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.sensor-emoji {
  font-size: 2rem;
  line-height: 1;
}

.sensor-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.sensor-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}

.sensor-value {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.3s ease;
}

.aqi-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  transition: background 0.3s ease;
}

.aqi-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-tertiary);
}

/* ========== COMPONENTS SECTION ========== */
.components-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1rem 0 1.25rem;
  color: var(--text-primary);
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.loader {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.component-card {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: 1.5rem;
  transition: all 0.35s ease;
  animation: fadeInUp 0.5s ease both;
}

.component-card:nth-child(2) {
  animation-delay: 0.08s;
}

.component-card:nth-child(3) {
  animation-delay: 0.16s;
}

.component-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
}

.component-card--active {
  border-color: rgba(0, 210, 255, 0.25);
  box-shadow: 0 0 20px rgba(0, 210, 255, 0.08);
}

.comp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.comp-icon {
  font-size: 1.75rem;
}

.comp-type-badge {
  padding: 0.25rem 0.65rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
}

.comp-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: var(--text-primary);
}

.comp-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Toggle Switch */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.control-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.toggle-switch {
  position: relative;
  width: 52px;
  height: 28px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.toggle-switch--on {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  box-shadow: 0 0 12px rgba(0, 210, 255, 0.4);
}

.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch--on .toggle-knob {
  transform: translateX(24px);
}

/* Range Slider */
.slider-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.range-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: var(--accent-primary);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 210, 255, 0.4);
  transition: transform 0.2s ease;
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.range-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: var(--accent-primary);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 210, 255, 0.4);
}

/* Mode Buttons */
.mode-row {
  display: flex;
  gap: 0.5rem;
}

.mode-btn {
  flex: 1;
  padding: 0.5rem 0.4rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
}

.mode-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.mode-btn--active {
  background: rgba(0, 210, 255, 0.15);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  box-shadow: 0 0 8px rgba(0, 210, 255, 0.2);
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .dash-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .header-left {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }

  .sensor-bar {
    padding: 1rem;
    grid-template-columns: 1fr;
  }

  .components-section {
    padding: 0 1rem;
  }

  .components-grid {
    grid-template-columns: 1fr;
  }
}
</style>

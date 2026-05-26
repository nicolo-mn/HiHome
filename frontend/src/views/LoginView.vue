<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAsyncAction } from "@/composables/useAsyncAction";
import { ApiError, NetworkError, TimeoutError } from "@/api/errors";
import BaseIcon from "@/components/BaseIcon.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const homeId = ref("");
const username = ref("");
const password = ref("");
const showPw = ref(false);
const touched = ref(false);

const focus = reactive<Record<string, boolean>>({});
function setFocus(key: string, v: boolean) {
  focus[key] = v;
}

const valid = computed(
  () =>
    !!homeId.value.trim() &&
    !!username.value.trim() &&
    password.value.length >= 4,
);

const submitError = ref<unknown>(null);

const { run: submit, isLoading } = useAsyncAction(
  async () => {
    submitError.value = null;
    try {
      await authStore.login(homeId.value, username.value, password.value);
    } catch (e) {
      submitError.value = e;
      throw e;
    }
    const redirect = route.query.redirect;
    router.push(
      typeof redirect === "string" ? redirect : { name: "dashboard" },
    );
  },
  { action: "sign in" },
);

const credentialsError = computed(
  () =>
    submitError.value instanceof ApiError && submitError.value.status === 401,
);

const networkError = computed(
  () =>
    submitError.value instanceof NetworkError ||
    submitError.value instanceof TimeoutError,
);

function handleLogin() {
  touched.value = true;
  if (valid.value) submit();
}

function borderFor(key: string, hasError: boolean, accentClass: string) {
  if (touched.value && hasError) return "border-rose-500";
  if (focus[key]) return accentClass;
  return "border-gray-800";
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-gray-200 antialiased">
    <div
      class="mx-auto w-full max-w-[1280px] px-5 sm:px-8 md:px-10 lg:px-12 pt-6 md:pt-10"
    >
      <div
        class="min-h-[calc(100vh-80px)] grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-12 items-center pt-2 md:pt-6"
      >
        <div class="hidden lg:flex flex-col gap-8 pr-8">
          <div class="flex items-center gap-4">
            <div
              class="relative w-20 h-20 rounded-[28px] bg-gradient-to-br from-gray-700 to-gray-700/40 shadow-2xl flex items-center justify-center"
            >
              <BaseIcon name="home" :size="44" class="text-yellow-500" />
              <span
                class="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gray-900 border-[3px] border-sky-500"
              />
            </div>
            <span class="font-bold text-[40px] tracking-tight text-gray-200">
              HiHome
            </span>
          </div>
          <div
            class="font-bold text-[56px] xl:text-[64px] leading-[1.05] tracking-tight text-gray-200 max-w-[640px]"
          >
            One home,<br />every device,
            <span class="text-yellow-500">your way.</span>
          </div>
          <div
            class="text-[18px] xl:text-[20px] text-gray-400 max-w-[520px] leading-[1.5]"
          >
            Manage devices, set rules, and keep an eye on your home — all from
            the same place, on any screen.
          </div>
        </div>

        <form
          class="w-full max-w-[460px] mx-auto lg:mx-0 flex flex-col gap-7"
          @submit.prevent="handleLogin"
        >
          <div class="flex lg:hidden flex-col gap-4">
            <div
              class="relative w-20 h-20 rounded-[24px] bg-gradient-to-br from-gray-700 to-gray-700/40 shadow-2xl flex items-center justify-center"
            >
              <BaseIcon name="home" :size="42" class="text-yellow-500" />
              <span
                class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 border-[3px] border-sky-500"
              />
            </div>
            <div>
              <div
                class="font-bold text-[40px] sm:text-[48px] leading-[1.05] tracking-tighter text-gray-200"
              >
                Welcome back
              </div>
              <div
                class="mt-2 text-[16px] sm:text-[18px] leading-[1.4] text-gray-400"
              >
                Sign in to your home to manage devices, rules and routines.
              </div>
            </div>
          </div>

          <div class="hidden lg:block">
            <div
              class="font-bold text-[40px] leading-[1.05] tracking-tighter text-gray-200"
            >
              Welcome back
            </div>
            <div class="mt-2 text-[17px] text-gray-400">
              Sign in to your home to continue.
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <div
              :class="[
                'rounded-[24px] md:rounded-[28px] bg-gray-800/50 border-2 px-5 py-4 transition-colors',
                borderFor('home', !homeId.trim(), 'border-sky-500'),
              ]"
            >
              <div
                :class="[
                  'text-[12px] md:text-[13px] font-medium uppercase tracking-wider',
                  touched && !homeId.trim()
                    ? 'text-rose-500'
                    : focus.home
                      ? 'text-sky-500'
                      : 'text-gray-400',
                ]"
              >
                Home ID
              </div>
              <div class="flex items-center gap-3">
                <BaseIcon
                  name="home"
                  :size="24"
                  :class="
                    focus.home || homeId ? 'text-sky-500' : 'text-gray-500'
                  "
                />
                <input
                  v-model="homeId"
                  type="text"
                  placeholder="e.g. 1"
                  class="flex-1 bg-transparent border-0 outline-none text-gray-200 font-medium text-[18px] md:text-[20px] leading-[28px] placeholder:text-gray-600 min-w-0"
                  @focus="setFocus('home', true)"
                  @blur="setFocus('home', false)"
                />
              </div>
              <div
                v-if="touched && !homeId.trim()"
                class="text-[13px] text-rose-500 mt-0.5"
              >
                Home ID is required
              </div>
            </div>

            <div
              :class="[
                'rounded-[24px] md:rounded-[28px] bg-gray-800/50 border-2 px-5 py-4 transition-colors',
                borderFor('user', !username.trim(), 'border-emerald-500'),
              ]"
            >
              <div
                :class="[
                  'text-[12px] md:text-[13px] font-medium uppercase tracking-wider',
                  touched && !username.trim()
                    ? 'text-rose-500'
                    : focus.user
                      ? 'text-emerald-500'
                      : 'text-gray-400',
                ]"
              >
                Username
              </div>
              <div class="flex items-center gap-3">
                <BaseIcon
                  name="user"
                  :size="24"
                  :class="
                    focus.user || username
                      ? 'text-emerald-500'
                      : 'text-gray-500'
                  "
                />
                <input
                  v-model="username"
                  type="text"
                  placeholder="your.name"
                  class="flex-1 bg-transparent border-0 outline-none text-gray-200 font-medium text-[18px] md:text-[20px] leading-[28px] placeholder:text-gray-600 min-w-0"
                  @focus="setFocus('user', true)"
                  @blur="setFocus('user', false)"
                />
              </div>
              <div
                v-if="touched && !username.trim()"
                class="text-[13px] text-rose-500 mt-0.5"
              >
                Username is required
              </div>
            </div>

            <div
              :class="[
                'rounded-[24px] md:rounded-[28px] bg-gray-800/50 border-2 px-5 py-4 transition-colors',
                borderFor('pw', password.length < 4, 'border-violet-500'),
              ]"
            >
              <div
                :class="[
                  'text-[12px] md:text-[13px] font-medium uppercase tracking-wider',
                  touched && password.length < 4
                    ? 'text-rose-500'
                    : focus.pw
                      ? 'text-violet-500'
                      : 'text-gray-400',
                ]"
              >
                Password
              </div>
              <div class="flex items-center gap-3">
                <BaseIcon
                  name="lock"
                  :size="24"
                  :class="
                    focus.pw || password ? 'text-violet-500' : 'text-gray-500'
                  "
                />
                <input
                  v-model="password"
                  :type="showPw ? 'text' : 'password'"
                  placeholder="At least 4 characters"
                  class="flex-1 bg-transparent border-0 outline-none text-gray-200 font-medium text-[18px] md:text-[20px] leading-[28px] placeholder:text-gray-600 min-w-0"
                  @focus="setFocus('pw', true)"
                  @blur="setFocus('pw', false)"
                />
                <button
                  type="button"
                  class="text-sm font-medium text-gray-400 px-2.5 py-1.5 rounded-xl hover:bg-white/5 shrink-0"
                  @click="showPw = !showPw"
                >
                  {{ showPw ? "Hide" : "Show" }}
                </button>
              </div>
              <div
                v-if="touched && password.length < 4"
                class="text-[13px] text-rose-500 mt-0.5"
              >
                Password must be at least 4 characters
              </div>
            </div>
          </div>

          <div
            v-if="credentialsError"
            role="alert"
            aria-live="polite"
            class="rounded-[20px] border-2 border-rose-500/30 bg-rose-500/[0.08] px-4 py-3.5 flex gap-3 items-start"
          >
            <div
              class="w-9 h-9 rounded-2xl bg-gray-900/40 flex items-center justify-center text-rose-500 shrink-0"
            >
              <BaseIcon name="info" :size="20" />
            </div>
            <div class="min-w-0">
              <div class="font-semibold text-[14px] text-rose-500">
                We couldn't sign you in
              </div>
              <div class="text-[13px] text-gray-300 mt-0.5">
                The Home ID, username or password don't match.
              </div>
              <div class="text-[12px] text-gray-400 mt-1">
                Double-check each field and try again.
              </div>
            </div>
          </div>

          <ErrorBanner
            v-else-if="submitError && networkError"
            :error="submitError"
            action="sign in"
            :on-retry="() => submit()"
          />

          <ErrorBanner
            v-else-if="submitError"
            :error="submitError"
            action="sign in"
          />

          <button
            type="submit"
            :disabled="!valid || isLoading"
            :class="[
              'w-full h-[64px] md:h-[72px] rounded-[28px] md:rounded-[36px] font-bold text-[18px] md:text-[22px] tracking-tight flex items-center justify-center gap-3 transition-colors',
              valid && !isLoading
                ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400'
                : 'bg-yellow-500/25 text-gray-400 cursor-not-allowed',
            ]"
          >
            <BaseIcon name="power" :size="24" />
            {{ isLoading ? "Signing in…" : "Sign in to HiHome" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

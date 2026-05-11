import { ref } from "vue";

export interface UseAsyncActionOptions {
  onError?: (e: unknown) => string | null;
}

export function useAsyncAction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  opts: UseAsyncActionOptions = {},
) {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function run(...args: TArgs): Promise<TResult | undefined> {
    isLoading.value = true;
    error.value = null;
    try {
      return await fn(...args);
    } catch (e) {
      error.value =
        opts.onError?.(e) ?? (e instanceof Error ? e.message : "Action failed");
      return undefined;
    } finally {
      isLoading.value = false;
    }
  }

  function reset() {
    error.value = null;
    isLoading.value = false;
  }

  return { run, isLoading, error, reset };
}

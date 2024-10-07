const DEBUG_LOG = true;

export function getErrorMessage(e: unknown): string {
  if ((e as Error).message != null) {
    return (e as Error).message;
  }
  return "unknown error";
}

function getStackTrace(e: unknown): string {
  if ((e as Error).message != null) {
    return (e as Error).stack ?? "undefined stack";
  }
  return "unknown error";
}

/**
 * Given func, return new function with the same signature that wraps any errors func throws with a log
 */
export function wrap<TInput extends any[], TOutput>(
  prefix: string,
  func: (...args: TInput) => TOutput,
): (...args: TInput) => TOutput {
  return (...args: TInput) => {
    try {
      return func(...args);
    } catch (e) {
      const message = `${prefix}: ${getErrorMessage(e)}`;
      d(`Error: ${message}`);
      d(`stack: ${getStackTrace(e)}`);
      throw new Error(message, { cause: e });
    }
  };
}

// Async version of wrap
export function pwrap<TInput extends any[], TOutput>(
  prefix: string,
  func: (...args: TInput) => Promise<TOutput>,
): (...args: TInput) => Promise<TOutput> {
  return async (...args: TInput) => {
    try {
      return await func(...args);
    } catch (e) {
      const message = `${prefix}: ${getErrorMessage(e)}`;
      d(`Error: ${message}`);
      d(`stack: ${getStackTrace(e)}`);
      throw new Error(message, { cause: e });
    }
  };
}

export function pswallow<TInput extends any[], TOutput>(
  defaultValue: TOutput,
  func: (...args: TInput) => Promise<TOutput>,
): (...args: TInput) => Promise<TOutput> {
  return async (...args: TInput) => {
    try {
      return await func(...args);
    } catch (e) {
      d(`Swallowing error ${getErrorMessage(e)}, returning default`);
      return Promise.resolve(defaultValue);
    }
  };
}

export const d = DEBUG_LOG
  ? (...args: unknown[]) => console.log(...args)
  : (..._unused: unknown[]) => {};

import type { ClaudeSdkModule } from "./types.js";

let claudeSdkPromise: Promise<ClaudeSdkModule> | undefined;

export async function loadClaudeSdk(): Promise<ClaudeSdkModule> {
  claudeSdkPromise ??= import("./claude-sdk-bundle.js");
  return claudeSdkPromise;
}

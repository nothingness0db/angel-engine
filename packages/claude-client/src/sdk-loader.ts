import * as claudeSdk from "./claude-sdk-bundle.js";

import type { ClaudeSdkModule } from "./types.js";

export async function loadClaudeSdk(): Promise<ClaudeSdkModule> {
  return claudeSdk;
}

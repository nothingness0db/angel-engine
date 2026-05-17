import type { AgentRuntime } from "@shared/agents";

export function chatRuntimeProviderKey(
  chatId: string,
  runtime: AgentRuntime,
  suffix?: string,
): string {
  const key = `chat:${chatId}:${runtime}`;
  return suffix !== undefined && suffix.length > 0 ? `${key}:${suffix}` : key;
}

export function workspaceRuntimePageKey({
  chatRuntime,
  draftProjectId,
  selectedChatId,
  settingsActive,
}: {
  chatRuntime?: AgentRuntime;
  draftProjectId?: string;
  selectedChatId?: string;
  settingsActive: boolean;
}): string {
  if (selectedChatId !== undefined) {
    return `chat:${selectedChatId}:${chatRuntime ?? "pending"}`;
  }

  if (settingsActive) {
    return "settings";
  }

  return draftProjectId !== undefined
    ? `draft:project:${draftProjectId}`
    : "draft";
}

export function draftRuntimeKeyFromProjectId(projectId: string | undefined) {
  return projectId !== undefined ? `project:${projectId}` : "create";
}

export function draftAgentConfigKey(
  runtimePageKey: string,
  runtime: AgentRuntime,
): string {
  return `${runtimePageKey}:${runtime}`;
}

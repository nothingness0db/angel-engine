import { EngineEventElicitationDecision } from "@angel-engine/client-napi";
import { describe, expect, it } from "vitest";
import { permissionDecision } from "../utils";

describe("permissionDecision", () => {
  it("maps approval responses to engine decisions", () => {
    expect(permissionDecision({ type: "allow" })).toBe(
      EngineEventElicitationDecision.Allow,
    );
    expect(permissionDecision({ type: "allowForSession" })).toBe(
      EngineEventElicitationDecision.AllowForSession,
    );
    expect(permissionDecision({ type: "deny" })).toBe(
      EngineEventElicitationDecision.Deny,
    );
    expect(permissionDecision({ type: "cancel" })).toBe(
      EngineEventElicitationDecision.Cancel,
    );
  });

  it("maps structured responses to engine decision payloads", () => {
    expect(
      permissionDecision({
        answers: [{ id: "question-1", value: "Plan" }],
        type: "answers",
      }),
    ).toEqual({
      [EngineEventElicitationDecision.Answers]: [
        { id: "question-1", value: "Plan" },
      ],
    });
    expect(
      permissionDecision({ success: false, type: "dynamicToolResult" }),
    ).toEqual({
      [EngineEventElicitationDecision.DynamicToolResult]: { success: false },
    });
    expect(permissionDecision({ type: "externalComplete" })).toBe(
      EngineEventElicitationDecision.ExternalComplete,
    );
    expect(
      permissionDecision({ type: "raw", value: "provider-value" }),
    ).toEqual({
      [EngineEventElicitationDecision.Raw]: "provider-value",
    });
  });
});

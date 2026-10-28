import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConfigService } from "@nestjs/config";
import { OpenAiPlanner } from "../src/modules/planning/openai.planner";
import type { AppEnvironment } from "../src/config/environment";

const validIntent = {
  schemaVersion: 1,
  name: "API summary",
  purpose: "Read and summarize an API response",
  trigger: { type: "manual.trigger", version: 1, config: {} },
  actions: [{ id: "fetch", type: "http.get", version: 1, label: "HTTP GET", config: { url: "https://example.com/data.json" } }],
  unsupportedSteps: [],
  assumptions: [],
  dataRead: ["API response"],
  dataWritten: [],
  timingUnknowns: [],
};

describe("OpenAiPlanner", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retries invalid structured output within bounds and then validates it", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validIntent) } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const values: Record<string, unknown> = {
      LLM_API_KEY: "server-only-key",
      LLM_MODEL: "configured-model",
      LLM_BASE_URL: "https://provider.example/v1",
      LLM_MAX_RETRIES: 1,
      LLM_TIMEOUT_MS: 1000,
    };
    const config = { get: vi.fn((key: string) => values[key]) } as unknown as ConfigService<AppEnvironment, true>;
    const result = await new OpenAiPlanner(config).generate({ message: "Summarize my API", timezone: "UTC", history: [] });
    expect(result.name).toBe("API summary");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.schema.type).toBe("object");
  });
});

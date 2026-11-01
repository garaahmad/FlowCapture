import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConfigService } from "@nestjs/config";
import { OpenAiPlanner } from "../src/modules/planning/openai.planner";
import type { AppEnvironment, RemotePlannerMode } from "../src/config/environment";

const validIntent = {
  schemaVersion: 1,
  name: "API summary",
  purpose: "Read and summarize an API response",
  trigger: { type: "manual.trigger", version: 1, config: {} },
  actions: [{ id: "fetch", type: "http.get", version: 1, label: "HTTP GET", config: { url: "https://example.com/data.json" } }],
  unsupportedSteps: [], assumptions: [], dataRead: ["API response"], dataWritten: [], timingUnknowns: [],
};

describe("OpenAiPlanner", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retries invalid structured output within bounds and then validates it", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response("{}"))
      .mockResolvedValueOnce(response(JSON.stringify(validIntent)));
    vi.stubGlobal("fetch", fetchMock);
    const config = configWith({
      LLM_API_KEY: "server-only-key", LLM_MODEL: "configured-model",
      LLM_BASE_URL: "https://provider.example/v1", LLM_MAX_RETRIES: 1, LLM_TIMEOUT_MS: 1000,
    });
    const result = await new OpenAiPlanner(config).generate({ message: "Summarize my API", timezone: "UTC", history: [] });
    expect(result.name).toBe("API summary");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const body = requestBody(fetchMock);
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.schema.type).toBe("object");
  });

  it.each([
    ["gemini", "https://generativelanguage.googleapis.com/v1beta/openai", "gemini-test-model"],
    ["groq", "https://api.groq.com/openai/v1", "groq-test-model"],
  ] as const)("uses the dedicated %s endpoint and server-side credential", async (provider: RemotePlannerMode, baseUrl: string, model: string) => {
    const fetchMock = vi.fn().mockResolvedValue(response(JSON.stringify(validIntent)));
    vi.stubGlobal("fetch", fetchMock);
    const prefix = provider.toUpperCase();
    const config = configWith({
      [`${prefix}_API_KEY`]: `${provider}-test-key`,
      [`${prefix}_MODEL`]: model,
      [`${prefix}_BASE_URL`]: baseUrl,
      LLM_MAX_RETRIES: 0, LLM_TIMEOUT_MS: 1000,
    });
    await new OpenAiPlanner(config, provider).generate({ message: "Summarize my API", timezone: "UTC", history: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${baseUrl}/chat/completions`);
    expect(requestBody(fetchMock).model).toBe(model);
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).headers).toMatchObject({ authorization: `Bearer ${provider}-test-key` });
  });

  it("does not retry a non-retryable provider response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);
    const config = configWith({
      LLM_API_KEY: "server-only-key", LLM_MODEL: "configured-model",
      LLM_BASE_URL: "https://provider.example/v1", LLM_MAX_RETRIES: 2, LLM_TIMEOUT_MS: 1000,
    });
    await expect(new OpenAiPlanner(config).generate({ message: "Test", timezone: "UTC", history: [] })).rejects.toThrow("bounded attempts");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

function response(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
}

function configWith(values: Record<string, unknown>): ConfigService<AppEnvironment, true> {
  return { get: vi.fn((key: string) => values[key]) } as unknown as ConfigService<AppEnvironment, true>;
}

interface PlannerRequestBody {
  model: string;
  response_format: { json_schema: { strict: boolean; schema: { type: string } } };
}

function requestBody(fetchMock: ReturnType<typeof vi.fn>): PlannerRequestBody {
  return JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string) as PlannerRequestBody;
}

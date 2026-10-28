import { describe, expect, it } from "vitest";
import { getExecutableNodes, getNodeDefinition, NODE_REGISTRY } from "../src";

describe("node registry", () => {
  it("has unique stable type/version identifiers", () => {
    const ids = NODE_REGISTRY.map((node) => `${node.type}@${node.version}`);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses strict configuration schemas", () => {
    const http = getNodeDefinition("http.get");
    expect(http?.configSchema.safeParse({
      url: "https://example.com",
      command: "not-allowed",
    }).success).toBe(false);
  });

  it("does not advertise schema-only nodes as executable", () => {
    expect(NODE_REGISTRY.length).toBeGreaterThan(0);
    expect(getExecutableNodes()).toEqual([]);
  });
});

import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import { LoginDto, RegisterDto } from "../src/modules/auth/auth.dto";

describe("authentication DTOs", () => {
  it("normalizes email addresses and accepts a strong-length password", async () => {
    const input = plainToInstance(RegisterDto, {
      email: "  USER@EXAMPLE.COM ",
      password: "a-long-password",
      displayName: "  Flow User  ",
    });
    expect(await validate(input)).toHaveLength(0);
    expect(input.email).toBe("user@example.com");
    expect(input.displayName).toBe("Flow User");
  });

  it("rejects short passwords", async () => {
    const input = plainToInstance(RegisterDto, {
      email: "user@example.com",
      password: "short",
      displayName: "Flow User",
    });
    const errors = await validate(input);
    expect(errors.some((error) => error.property === "password")).toBe(true);
  });

  it("limits login password input size", async () => {
    const input = plainToInstance(LoginDto, {
      email: "user@example.com",
      password: "x".repeat(129),
    });
    expect((await validate(input)).some((error) => error.property === "password")).toBe(true);
  });
});

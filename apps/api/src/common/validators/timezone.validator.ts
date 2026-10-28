import { registerDecorator, type ValidationOptions } from "class-validator";
import { isValidTimezone } from "@flowcapture/workflow-schema";

export function IsIanaTimezone(options?: ValidationOptions): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: "isIanaTimezone",
      target: object.constructor,
      propertyName: String(propertyName),
      options: { message: "timezone must be a valid IANA timezone", ...options },
      validator: {
        validate(value: unknown) {
          return typeof value === "string" && isValidTimezone(value);
        },
      },
    });
  };
}

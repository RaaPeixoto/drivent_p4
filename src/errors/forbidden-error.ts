import { ApplicationError } from "@/protocols";

export function forbiddenError(message: string): ApplicationError {
  return {
    name: "forbiddenError",
    message,
  };
}

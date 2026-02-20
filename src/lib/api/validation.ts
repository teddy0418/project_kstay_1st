import { ZodError, type ZodType } from "zod";
import { apiError } from "@/lib/api/response";

type ValidationSuccess<T> = {
  ok: true;
  data: T;
};

type ValidationFailure = {
  ok: false;
  response: Response;
};

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function formatZodIssue(error: ZodError) {
  const first = error.issues[0];
  if (!first) return "Invalid request body";
  const path = first.path.length > 0 ? first.path.join(".") : "body";
  return `${path}: ${first.message}`;
}

export async function parseJsonBody<T>(
  req: Request,
  schema: ZodType<T>
): Promise<ValidationResult<T>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { ok: false, response: apiError(400, "BAD_REQUEST", "Invalid JSON body") };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      response: apiError(400, "BAD_REQUEST", formatZodIssue(parsed.error)),
    };
  }

  return { ok: true, data: parsed.data };
}

export class ZodError extends Error {
  issues: Array<{ path: (string | number)[]; message: string }>;

  constructor(message: string, issues: Array<{ path: (string | number)[]; message: string }>) {
    super(message);
    this.name = "ZodError";
    this.issues = issues;
  }
}

class BaseSchema<T> {
  optional(): BaseSchema<T | undefined> {
    return new OptionalSchema(this);
  }

  nullable(): BaseSchema<T | null> {
    return new NullableSchema(this);
  }

  parse(value: unknown, path: (string | number)[] = []): T {
    throw new Error("parse() not implemented");
  }

  safeParse(value: unknown): { success: true; data: T } | { success: false; error: ZodError } {
    try {
      const data = this.parse(value);
      return { success: true, data };
    } catch (err) {
      if (err instanceof ZodError) {
        return { success: false, error: err };
      }
      throw err;
    }
  }
}

class OptionalSchema<T> extends BaseSchema<T | undefined> {
  constructor(private inner: BaseSchema<T>) {
    super();
  }

  parse(value: unknown, path: (string | number)[] = []): T | undefined {
    if (value === undefined) return undefined;
    return this.inner.parse(value, path);
  }
}

class NullableSchema<T> extends BaseSchema<T | null> {
  constructor(private inner: BaseSchema<T>) {
    super();
  }

  parse(value: unknown, path: (string | number)[] = []): T | null {
    if (value === null) return null;
    return this.inner.parse(value, path);
  }
}

class LiteralSchema<T> extends BaseSchema<T> {
  constructor(private literal: T) {
    super();
  }

  parse(value: unknown, path: (string | number)[] = []): T {
    if (value !== this.literal) {
      throw new ZodError(`Expected literal ${String(this.literal)}`, [{ path, message: `Expected literal ${String(this.literal)}` }]);
    }
    return this.literal;
  }
}

class StringSchema extends BaseSchema<string> {
  parse(value: unknown, path: (string | number)[] = []): string {
    if (typeof value !== "string") {
      throw new ZodError("Expected string", [{ path, message: "Expected string" }]);
    }
    return value;
  }
}

class NumberSchema extends BaseSchema<number> {
  parse(value: unknown, path: (string | number)[] = []): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new ZodError("Expected number", [{ path, message: "Expected number" }]);
    }
    return value;
  }
}

class BooleanSchema extends BaseSchema<boolean> {
  parse(value: unknown, path: (string | number)[] = []): boolean {
    if (typeof value !== "boolean") {
      throw new ZodError("Expected boolean", [{ path, message: "Expected boolean" }]);
    }
    return value;
  }
}

class AnySchema extends BaseSchema<any> {
  parse(value: unknown): any {
    return value;
  }
}

class ArraySchema<T> extends BaseSchema<T[]> {
  constructor(private element: BaseSchema<T>) {
    super();
  }

  parse(value: unknown, path: (string | number)[] = []): T[] {
    if (!Array.isArray(value)) {
      throw new ZodError("Expected array", [{ path, message: "Expected array" }]);
    }
    return value.map((item, index) => this.element.parse(item, [...path, index]));
  }
}

type Shape = Record<string, BaseSchema<any>>;

class ObjectSchema<T extends Shape> extends BaseSchema<any> {
  constructor(private shape: T) {
    super();
  }

  parse(value: unknown, path: (string | number)[] = []): any {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new ZodError("Expected object", [{ path, message: "Expected object" }]);
    }
    const input = value as Record<string, unknown>;
    const result: Record<string, unknown> = { ...input };

    for (const key of Object.keys(this.shape)) {
      const schema = this.shape[key];
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        result[key] = schema.parse(input[key], [...path, key]);
      } else {
        const parsed = schema.parse(undefined, [...path, key]);
        if (parsed !== undefined) {
          result[key] = parsed;
        } else {
          delete result[key];
        }
      }
    }

    return result;
  }
}

export const z = {
  literal<T>(value: T): BaseSchema<T> {
    return new LiteralSchema(value);
  },
  string(): BaseSchema<string> {
    return new StringSchema();
  },
  number(): BaseSchema<number> {
    return new NumberSchema();
  },
  boolean(): BaseSchema<boolean> {
    return new BooleanSchema();
  },
  any(): BaseSchema<any> {
    return new AnySchema();
  },
  array<T>(schema: BaseSchema<T>): BaseSchema<T[]> {
    return new ArraySchema(schema);
  },
  object<T extends Shape>(shape: T): BaseSchema<any> {
    return new ObjectSchema(shape);
  },
};

export type infer<T> = T extends BaseSchema<infer U> ? U : never;

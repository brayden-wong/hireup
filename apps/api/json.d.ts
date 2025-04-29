type Stringified<T> = string & { source: T };

type JsonValue<T> = T extends string | number | boolean | null
  ? T
  : T extends { toJSON(): infer R }
  ? R
  : T extends undefined | ((...args: any[]) => any)
  ? never
  : T extends object
  ? JsonObject<T>
  : never;

type JsonObject<T> = {
  [Key in keyof T as [JsonValue<T[Key]>] extends [never]
    ? never
    : Key]: JsonValue<T[Key]>;
};

interface JSON {
  stringify<T>(
    value: T,
    replacer?: null | undefined,
    space?: string | number
  ): Stringified<T>;
  parse<T>(source: Stringified<T>, replacer?: null | undefined): T;
}

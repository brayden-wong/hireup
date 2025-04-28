class TypedError<T extends string> extends Error {
  readonly message: T;

  constructor(message: T, options?: ErrorOptions) {
    super(message, options);

    this.message = message;
  }
}

export { TypedError };

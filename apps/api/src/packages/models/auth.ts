import { Elysia, t } from "elysia";

export const AuthModel = new Elysia({ name: "Auth Model" }).model({
  sign_up: t.Object({
    firstName: t.String({
      minLength: 2,
      errorMessage: { minLength: "First name is required" },
    }),
    lastName: t.String({
      minLength: 2,
      errorMessage: { minLength: "Last name is required" },
    }),
    email: t.String({ format: "email" }),
    password: t.String({
      minLength: 8,
      pattern: "^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9])",
      errorMessage: {
        minLength: "Password must be at least 8 characters",
        pattern:
          "Password must contain at least one uppercase letter, one lowercase letter, and one special character",
      },
    }),
  }),
  sign_in: t.Object({
    email: t.String({ format: "email" }),
    password: t.String(),
  }),
});

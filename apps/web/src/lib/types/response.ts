import { AuthError } from "./auth";

export type Success<T> = { success: true; data: T };

export type Err<E extends string> = { success: false; error: E | AuthError };

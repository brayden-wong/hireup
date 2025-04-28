import { clsx } from "clsx";
import superjson from "superjson";
import { twMerge } from "tailwind-merge";
import type { ClassValue } from "clsx";

import { AuthError } from "./types/auth";
import { Err, Success } from "./types/response";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type GetOptions = { method: "GET" };

type MutationOptions = {
  method: "POST" | "PATCH" | "DELETE";
  body?: string | FormData | Buffer;
};

type Cookie = {
  credentials?: undefined;
  cookie: `${string}=${string}` | `${string}=${string}`[];
};

type Credentials = {
  credentials: RequestInit["credentials"];
  cookie?: undefined;
};

type Options = { session: string } & (
  | GetOptions
  | Omit<MutationOptions, "credentials">
);

type RequestOptions = Options &
  Omit<RequestInit, "method" | "body"> & { superjson?: boolean };

export async function request<T, E extends string = AuthError>(
  url: string,
  {
    session,
    superjson: SuperJson = true,
    headers: initialHeaders,
    ...options
  }: RequestOptions,
) {
  const headers = {
    "Content-Type": "application/json",
    "x-session-key": session,
    ...initialHeaders,
  };

  const response = await fetch(url, {
    headers: headers,
    credentials: options.credentials ?? undefined,
    ...options,
  });

  if (!SuperJson) {
    const json = await response.json();

    if (!response.ok) {
      const error: Err<E> = json;

      console.error(error);
      return error;
    }

    const data: Success<T> = json;
    return data;
  }

  const text = await response.text();

  if (!response.ok) {
    const error: Err<E> = superjson.parse(text);
    console.error(error);

    return error;
  }

  const data: Success<T> = superjson.parse(text);

  return data;
}

type ClientRequestOptions = ((Credentials | Cookie) &
  (GetOptions | Omit<MutationOptions, "credentials">)) &
  Omit<RequestInit, "method" | "body"> & { superjson?: boolean };

export async function clientRequest<T>(
  url: string,
  {
    headers: initialHeaders,
    superjson: SuperJson = true,
    ...options
  }: ClientRequestOptions,
) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.cookie
      ? {
          Cookie: Array.isArray(options.cookie)
            ? options.cookie.join("; ")
            : options.cookie,
        }
      : {}),
    ...initialHeaders,
  };

  const response = await fetch(url, {
    ...options,
    headers: headers,
    credentials: options.credentials ?? undefined,
  });

  if (!SuperJson) {
    const data: T = await response.json();

    return data;
  }

  const data: T = superjson.parse(await response.text());

  return data;
}

type UnauthenticatedRequestOptions = Partial<Cookie> &
  (GetOptions | MutationOptions) &
  Omit<RequestInit, "method" | "body">;

export async function unauthenticatedRequest<T, E extends string = AuthError>(
  url: string,
  { headers, ...options }: UnauthenticatedRequestOptions,
) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  console.log(response);

  const text = await response.text();

  console.log(text);

  if (!response.ok) {
    const error: Err<E> = superjson.parse(text);
    console.error(error);

    return error;
  }

  const data: Success<T> = superjson.parse(text);

  return data;
}

export function formatName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

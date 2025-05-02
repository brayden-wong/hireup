import { createStore, useStore } from "zustand";

import { useContext } from "react";

import { AuthContext, UserContext } from "../contexts/user-context";

export type Account = "user" | "recruiter" | "admin";

export type User = {
  id: number;
  slug: string;
  firstName: string;
  lastName: string;
  account: Account;
};

type LoggedIn = {
  user: User;
  sessionId: string;
  authenticated: true;
};

type LoggedOut = {
  user: null;
  sessionId: null;
  authenticated: false;
};

export type UserStore = LoggedIn | LoggedOut;

type UserActions = {
  setStatus: (status: UserStore) => void;
};

type CreateUserStoreParams = UserStore;

export function createUserStore(params: CreateUserStoreParams) {
  return createStore<UserStore & UserActions>((set) => ({
    ...params,
    setStatus: (status) => set(status),
  }));
}

export function useUserStore(): UserStore & UserActions;
export function useUserStore<T>(selector: (state: UserStore) => T): T;
export function useUserStore(selector?: (state: UserStore) => any) {
  const context = useContext(UserContext);

  if (!context)
    throw new Error("useUserStore must be used within UserProvider");

  return useStore(context, selector ?? ((state) => state));
}

export type AuthStoreApi = ReturnType<typeof createAuthStore>;

export const createAuthStore = (user: LoggedIn) => {
  return createStore<LoggedIn>(() => ({
    ...user,
  }));
};

// export function useAuthStore(): LoggedIn;
// export function useAuthStore<T>(selector: (state: LoggedIn) => T): T;
// export function useAuthStore(selector?: (state: LoggedIn) => any) {
//   const context = useContext(AuthContext);

//   if (!context)
//     throw new Error("useAuthStore must be used within AuthProvider");

//   return useStore(context, selector ?? ((state) => state));
// }

export function useUser() {
  const context = useContext(AuthContext);

  if (!context) throw new Error("useUser must be used within AuthProvider");

  return useStore(context, (state) => state.user);
}

export function useSession() {
  const context = useContext(AuthContext);

  if (!context) throw new Error("useSession must be used within AuthProvider");

  return useStore(context, (state) => state.sessionId);
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) throw new Error("useAuth must be used within AuthProvider");

  return useStore(context, (state) => state.authenticated);
}

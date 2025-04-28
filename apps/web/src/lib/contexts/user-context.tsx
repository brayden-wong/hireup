"use client";

import { createContext, PropsWithChildren, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  AuthStoreApi,
  createAuthStore,
  createUserStore,
  UserStore,
  useUserStore,
} from "../stores/auth-store";
import { Nullable } from "../types/nullable";

type UserStoreApi = ReturnType<typeof createUserStore>;

export const UserContext = createContext<Nullable<UserStoreApi>>(null);

export const UserContextProvider = ({
  children,
  user,
}: PropsWithChildren<{ user: UserStore }>) => {
  const store = useRef<Nullable<UserStoreApi>>(null);

  if (!store.current) store.current = createUserStore(user);

  return (
    <UserContext.Provider value={store.current}>
      {children}
    </UserContext.Provider>
  );
};

export const AuthContext = createContext<Nullable<AuthStoreApi>>(null);

export const SignedIn = ({ children }: PropsWithChildren) => {
  const store = useRef<Nullable<AuthStoreApi>>(null);
  const { user, sessionId, authenticated } = useUserStore();

  if (!authenticated) return null;

  if (!store.current)
    store.current = createAuthStore({
      user,
      sessionId,
      authenticated: true,
    });

  return (
    <AuthContext.Provider value={store.current}>
      {children}
    </AuthContext.Provider>
  );
};

export const SignedOut = ({ children }: PropsWithChildren) => {
  const { authenticated } = useUserStore();

  if (!authenticated) return children;

  return null;
};

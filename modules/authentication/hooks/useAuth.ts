"use client";

import { useState } from "react";
import { authService } from "../services/auth.service";

export function useAuth() {
  const [loading, setLoading] = useState(false);

  async function signIn(email: string, password: string) {
    setLoading(true);

    const result = await authService.signIn({
      email,
      password,
    });

    setLoading(false);

    return result;
  }

  async function signOut() {
    return await authService.signOut();
  }

  async function getSession() {
    return await authService.getSession();
  }

  async function getUser() {
    return await authService.getUser();
  }

  return {
    loading,
    signIn,
    signOut,
    getSession,
    getUser,
  };
}
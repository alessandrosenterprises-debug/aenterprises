"use client";

import { useState } from "react";
import { authService } from "../services/auth.service";

export function useAuth() {
  const [loading, setLoading] = useState(false);

  async function signIn(
    email: string,
    password: string
  ) {
    setLoading(true);

    try {
      return await authService.signIn({
        email,
        password,
      });
    } finally {
      setLoading(false);
    }
  }

  async function signInAsCustomer(
    email: string,
    password: string
  ) {
    setLoading(true);

    try {
      return await authService.signInAsCustomer({
        email,
        password,
      });
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setLoading(true);

    try {
      return await authService.signOut();
    } finally {
      setLoading(false);
    }
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
    signInAsCustomer,
    signOut,
    getSession,
    getUser,
  };
}
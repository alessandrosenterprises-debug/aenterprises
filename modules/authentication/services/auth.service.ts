import { supabase } from "@/lib/supabase/client";

export interface SignInCredentials {
  email: string;
  password: string;
}

class AuthService {
  async signIn({ email, password }: SignInCredentials) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  async signOut() {
    return await supabase.auth.signOut();
  }

  async getSession() {
    return await supabase.auth.getSession();
  }

  async getUser() {
    return await supabase.auth.getUser();
  }
}

export const authService = new AuthService();
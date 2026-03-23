import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceLimit } from "@/hooks/useDeviceLimit";

type SignUpRole = "user" | "tutor";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  deviceBlocked: boolean;
  signUp: (email: string, password: string, fullName: string, role?: SignUpRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: SignUpRole = "user") => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) return { error: error as Error };
      
      // If signup successful and user wants to be a tutor, update their role
      if (data.user && role === "tutor") {
        // Update the role from 'user' to 'tutor'
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({ role: "tutor" })
          .eq("user_id", data.user.id);
          
        if (roleError) {
          console.error("Error updating role to tutor:", roleError);
        }
        
        // Set tutor_requested_at timestamp
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ tutor_requested_at: new Date().toISOString() })
          .eq("user_id", data.user.id);
          
        if (profileError) {
          console.error("Error updating tutor request timestamp:", profileError);
        }
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

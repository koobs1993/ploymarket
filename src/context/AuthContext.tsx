import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
}

interface TradingAccount {
  id: string;
  user_id: string;
  cash_balance: number;
  starting_balance: number;
  status: "active" | "breached" | "expired" | "closed";
  started_at: string;
  expires_at: string;
  breached_at: string | null;
  breach_reason: string | null;
  equity: number;
  open_positions_value: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  tradingAccount: TradingAccount | null;
  loading: boolean;
  refreshAccount: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tradingAccount, setTradingAccount] = useState<TradingAccount | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfileAndAccount(userId: string) {
    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // 2. Fetch Active/Latest Trading Account
      const { data: accountData, error: accountError } = await supabase
        .from("trading_accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (accountError) throw accountError;

      if (accountData) {
        // Run database RPC to check and update drawdown/breach/expiry status dynamically
        const { data: refreshedStatus, error: rpcError } = await supabase
          .rpc("check_and_update_account_status", { p_account_id: accountData.id });

        if (rpcError) {
          console.error("Error refreshing account status:", rpcError);
          // Fallback to cached data if RPC fails
          setTradingAccount({
            ...accountData,
            cash_balance: Number(accountData.cash_balance),
            starting_balance: Number(accountData.starting_balance),
            equity: Number(accountData.cash_balance),
            open_positions_value: 0,
          });
        } else if (refreshedStatus) {
          // Merge raw db fields with RPC computed fields (equity, open_positions_value)
          setTradingAccount({
            ...accountData,
            cash_balance: Number(refreshedStatus.cash_balance),
            starting_balance: Number(refreshedStatus.starting_balance),
            status: refreshedStatus.status,
            breached_at: refreshedStatus.breached ? new Date().toISOString() : accountData.breached_at,
            breach_reason: refreshedStatus.breach_reason || accountData.breach_reason,
            equity: Number(refreshedStatus.equity),
            open_positions_value: Number(refreshedStatus.open_positions_value),
          });
        }
      } else {
        setTradingAccount(null);
      }
    } catch (err) {
      console.error("Error fetching auth details:", err);
    }
  }

  async function refreshAccount() {
    if (user) {
      await fetchProfileAndAccount(user.id);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setTradingAccount(null);
  }

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndAccount(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          setLoading(true);
          await fetchProfileAndAccount(currentSession.user.id);
          setLoading(false);
        } else {
          setProfile(null);
          setTradingAccount(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        tradingAccount,
        loading,
        refreshAccount,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    async function routeUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      router.replace(session ? "/dashboard" : "/login");
      setCheckingSession(false);
    }

    void routeUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      router.replace(session ? "/dashboard" : "/login");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-5 text-[#181713]">
      <p role="status" className="text-sm text-[#5f5a50]">
        {checkingSession ? "Opening LifeMode…" : "Taking you to LifeMode…"}
      </p>
    </main>
  );
}

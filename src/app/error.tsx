"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center bg-[#eef1ec] px-5 py-8 text-[#151814]">
      <section className="premium-panel mx-auto w-full max-w-md rounded-lg p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#315260]">LifeMode</p>
        <h1 className="mt-4 text-3xl font-semibold">Something did not load.</h1>
        <p className="mt-3 text-sm leading-6 text-[#5b6259]">Your saved data has not been removed. Retry the screen or return to your dashboard.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button onClick={reset} className="h-11 rounded-lg bg-[#151814] px-4 text-sm font-semibold text-white">Try again</button>
          <Link href="/dashboard" className="flex h-11 items-center justify-center rounded-lg border border-[#b8c0b5] bg-white px-4 text-sm font-semibold">Dashboard</Link>
        </div>
      </section>
    </main>
  );
}

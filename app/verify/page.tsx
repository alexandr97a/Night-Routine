import { Suspense } from "react";
import VerifyClient from "./VerifyClient";

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] flex items-center justify-center px-6 bg-[#F6F5F3]">
          <div className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white/75 p-6 text-center shadow-sm">
            <p className="text-sm text-neutral-700">불러오는 중…</p>
          </div>
        </main>
      }
    >
      <VerifyClient />
    </Suspense>
  );
}

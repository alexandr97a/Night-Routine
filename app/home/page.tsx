"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { isGuestValidToday } from "../../lib/guest";
import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";

function kstDateKey(date = new Date()) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function HomePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [canWrite, setCanWrite] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      // ✅ 게스트
      if (!user) {
        setIsGuest(true);
        setCanWrite(isGuestValidToday());
        setLoading(false);
        return;
      }

      // ✅ 회원: 오늘(KST) 기록 존재 여부로 1일 1회 제어
      setIsGuest(false);

      const today = kstDateKey();

      const { data: existing, error } = await supabase
        .from("entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("entry_date_kst", today)
        .maybeSingle();

 if (error) {
   const msg =
     (error as any)?.message ||
     (error as any)?.hint ||
     (error as any)?.details ||
     JSON.stringify(error);
   console.error("today entry check error:", msg, error);
   setCanWrite(true); // 안전하게 작성 가능으로 둠
 } else {
   setCanWrite(!existing?.id);
 }

      setLoading(false);
    })();
  }, [supabase]);

  return (
    <>
      <AppHeader title="Night Routine" transparent />

      <main className="relative min-h-[100dvh] bg-[#F6F5F3] px-6 pt-20 pb-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none
          bg-[radial-gradient(circle_at_1px_1px,#00000010_1px,transparent_0)]
          [background-size:18px_18px]"
        />

        <div className="relative h-full flex items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="rounded-3xl bg-white/70 border border-neutral-200 shadow-sm p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-xs text-neutral-500">
                  {isGuest ? "게스트 모드" : "회원 모드"}
                  {isGuest ? " · 오늘만 사용" : ""}
                </p>

                <h1 className="text-xl font-semibold text-neutral-900 leading-snug">
                  오늘 하루는
                  <br />
                  어떻게 보냈나요?
                </h1>

                <p className="text-sm text-neutral-600 leading-relaxed">
                  질문 두 개면 충분해요.
                  <br />
                  3~5분이면 오늘 하루 정리 가능해요!
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/write")}
                disabled={loading || !canWrite}
                className={[
                  "w-full rounded-2xl py-4 text-sm font-medium transition",
                  "active:scale-[0.99]",
                  loading
                    ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                    : canWrite
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-200 text-neutral-500 cursor-not-allowed",
                ].join(" ")}
              >
                {loading
                  ? "확인 중…"
                  : canWrite
                  ? "오늘 정리하기"
                  : "오늘은 이미 정리했어요"}
              </button>

              <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
                <p className="text-sm text-neutral-700 leading-relaxed">
                  “완벽하게 정리”가 아니라,
                  <br />
                  “오늘을 내려놓는” 연습이에요.
                </p>
              </div>
            </div>

            <p className="mt-6 text-xs text-neutral-500 text-center leading-relaxed">
              {isGuest
                ? "게스트로 작성한 기록은 오늘까지만 유지돼요."
                : canWrite
                ? "오늘의 기록은 하루에 한 번만 남길 수 있어요."
                : "오늘 기록은 이미 저장됐어요. 캘린더에서 확인할 수 있어요."}
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  );
}

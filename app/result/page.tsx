"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { GUEST_FEEDBACK, isGuestValidToday, clearGuest } from "../../lib/guest";
import { logEvent } from "../../lib/analytics";
import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";

type Pick = "yes" | "no" | null;

export default function ResultPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [text, setText] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [visible, setVisible] = useState(false);

  // PVE 설문 상태
  const [picked, setPicked] = useState<Pick>(null);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // 회원 여부 확인
      const { data } = await supabase.auth.getSession();
      const member = !!data.session;
      setIsMember(member);

      // 결과 텍스트: sessionStorage 우선 → 게스트 오늘만 localStorage fallback
      const stored =
        (typeof window !== "undefined" ? sessionStorage.getItem("feedback") : null) ||
        (isGuestValidToday()
          ? typeof window !== "undefined"
            ? localStorage.getItem(GUEST_FEEDBACK)
            : null
          : null);

      if (!stored) {
        router.replace("/home");
        return;
      }

      setText(stored);

      // 이벤트: 결과 화면 노출
      logEvent("result_view", { member });

      // 부드러운 페이드 인
      setTimeout(() => setVisible(true), 120);
    })();
  }, [router, supabase]);

  const closeDay = () => {
    if (typeof window !== "undefined") sessionStorage.removeItem("feedback");
    router.push("/home");
  };

  const goSignup = () => {
    router.push("/?mode=signup");
  };

  const keepGuestToday = () => {
    if (typeof window !== "undefined") sessionStorage.removeItem("feedback");
    router.push("/home");
  };

  const endGuestNow = () => {
    if (typeof window !== "undefined") sessionStorage.removeItem("feedback");
    clearGuest();
    router.push("/");
  };

  const onYes = async () => {
    if (picked) return;
    setPicked("yes");
    await logEvent("result_helpful", { helpful: true, member: isMember });
  };

  const onNo = async () => {
    if (picked) return;
    setPicked("no");
    await logEvent("result_helpful", { helpful: false, member: isMember });
  };

  const pickReason = async (r: string) => {
    if (reason) return;
    setReason(r);
    await logEvent("result_helpful_reason", { reason: r, member: isMember });
  };

  return (
    <>
      <AppHeader title="오늘의 정리" backHref="/home" transparent />

      <main className="relative min-h-[100dvh] bg-[#F6F5F3] px-4 pt-14 pb-24 overflow-hidden">
        {/* 배경 */}
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none
          bg-[radial-gradient(circle_at_1px_1px,#00000010_1px,transparent_0)]
          [background-size:18px_18px]"
        />

        <div className="relative h-full flex items-center justify-center">
          <div
            className={`w-full max-w-md transition-opacity duration-200 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* 카드 1장 구조 */}
            <div className="rounded-3xl bg-white/75 border border-neutral-200 shadow-sm p-6 space-y-6">
              {/* 헤더 */}
              <div className="space-y-2">
                <p className="text-xs text-neutral-500">
                  {isMember ? "회원 모드" : "게스트 모드"} · 오늘의 정리
                </p>
                <h1 className="text-lg font-semibold text-neutral-900 leading-snug">
                  오늘을 이렇게 돌아본 것만으로도 충분해요.
                </h1>
              </div>

              {/* 본문 */}
              <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
                <p className="text-sm leading-relaxed text-neutral-800 whitespace-pre-line">
                  {text}
                </p>
              </div>

              {/* ✅ PVE 설문 UI */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
                <p className="text-sm font-medium text-neutral-900">
                  오늘 정리가 도움이 됐나요?
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onYes}
                    disabled={picked !== null}
                    className={[
                      "rounded-xl py-3 text-sm font-medium border transition active:scale-[0.99]",
                      picked === "yes"
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-50",
                      picked !== null ? "opacity-90 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    도움 됐다
                  </button>

                  <button
                    type="button"
                    onClick={onNo}
                    disabled={picked !== null}
                    className={[
                      "rounded-xl py-3 text-sm font-medium border transition active:scale-[0.99]",
                      picked === "no"
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-50",
                      picked !== null ? "opacity-90 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    별로
                  </button>
                </div>

                {picked === "no" && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-neutral-500">어떤 점이 아쉬웠나요?</p>

                    <div className="grid gap-2">
                      {[
                        "너무 뻔하게 느껴졌어요",
                        "길거나 부담스러웠어요",
                        "내 얘기처럼 안 느껴졌어요",
                      ].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => pickReason(r)}
                          disabled={reason !== null}
                          className={[
                            "w-full text-left rounded-xl border px-4 py-3 text-sm transition active:scale-[0.99]",
                            reason === r
                              ? "bg-neutral-900 text-white border-neutral-900"
                              : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50",
                            reason !== null ? "opacity-90 cursor-not-allowed" : "",
                          ].join(" ")}
                        >
                          {r}
                        </button>
                      ))}
                    </div>

                    {reason && (
                      <p className="text-xs text-neutral-500">
                        고마워요. 다음 버전에서 더 나아지게 할게요.
                      </p>
                    )}
                  </div>
                )}

                {picked === "yes" && (
                  <p className="text-xs text-neutral-500">
                    좋아요. 내일도 2문장만 남겨봐요.
                  </p>
                )}
              </div>

              {/* ✅ 비회원이면 회원가입 유도 카드 */}
              {!isMember && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    게스트로 작성한 정리는 <b>오늘까지만</b> 보관돼요.
                    <br />
                    회원가입하면 기록이 안전하게 저장돼요.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      logEvent("cta_signup_click", { from: "result" });
                      goSignup();
                    }}
                    className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-medium text-white active:scale-[0.99]"
                  >
                    회원가입하고 저장하기
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={keepGuestToday}
                      className="w-full rounded-xl border border-neutral-300 py-3 text-sm text-neutral-700 hover:bg-neutral-50 active:scale-[0.99]"
                    >
                      오늘만 유지
                    </button>
                    <button
                      type="button"
                      onClick={endGuestNow}
                      className="w-full rounded-xl border border-neutral-300 py-3 text-sm text-neutral-700 hover:bg-neutral-50 active:scale-[0.99]"
                    >
                      완전 종료
                    </button>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed">
                    “오늘만 유지”는 자정 이후 자동으로 사라져요.
                  </p>
                </div>
              )}

              {/* ✅ 엔딩 UX */}
              <button
                type="button"
                onClick={() => {
                  logEvent("result_close_day", { member: isMember });
                  closeDay();
                }}
                className="w-full rounded-2xl py-3 text-sm text-neutral-700 border border-neutral-200 hover:bg-neutral-50 active:scale-[0.99]"
              >
                오늘은 여기까지
              </button>
            </div>

            {/* 하단 미세 카피 */}
            <p className="mt-4 text-center text-xs text-neutral-500">
              내일의 나는, 오늘의 나보다 조금 가벼울 거예요.
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  );
}

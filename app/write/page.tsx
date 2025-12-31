"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";

type ApiOk = { ok: true; entryId: number; feedback?: string };
type ApiAlready = { ok: false; code: "ALREADY_TODAY"; entryId: number | null };
type ApiErr = { ok: false; error?: string; code?: string; entryId?: number | null };

type ApiRes = ApiOk | ApiAlready | ApiErr;

const MAX_LEN = 400;

const Q1_TITLE = "오늘 하루를 한 문장으로 말해보면?";
const Q1_EXAMPLES = "예: “생각보다 잘 버텼다.” / “괜히 마음이 조급했다.” / “평범했지만 편했다.”";

const Q2_TITLE = "오늘을 다시 한다면, 딱 하나만 다르게 하고 싶은 건 뭐야?";
const Q2_EXAMPLES = "예: “10분만 더 일찍 끊고 쉬었을 거야.” / “말 한마디를 부드럽게 했을 거야.” / “그냥 그대로 두고 싶어.”";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function WritePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");

  const [loading, setLoading] = useState(true); // 세션 확인
  const [submitting, setSubmitting] = useState(false);

  const [isGuest, setIsGuest] = useState(false);
  const [err, setErr] = useState<string>("");

  // 로딩 UX
  const [showLoader, setShowLoader] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [pct, setPct] = useState(0);

  const tRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  // ✅ 회원/게스트 판별 (회원만 서버 저장 가능)
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        setIsGuest(true);
      } else {
        setIsGuest(false);
      }
      setLoading(false);
    })();
  }, [supabase]);

  const startProgress = () => {
    doneRef.current = false;
    setPct(0);

    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;

      // 0→70% 빠르게 (0.8s 안에)
      const fast = clamp((elapsed / 800) * 70, 0, 70);

      // 70→92% 천천히 (최대 8s까지)
      const slow = clamp(70 + ((elapsed - 800) / 8000) * 22, 70, 92);

      const next = elapsed <= 800 ? fast : slow;
      setPct(Math.floor(next));

      if (!doneRef.current) {
        tRef.current = window.setTimeout(tick, 80);
      }
    };

    tRef.current = window.setTimeout(tick, 60);
  };

  const stopProgress = async (finalPct = 100) => {
    doneRef.current = true;
    if (tRef.current) window.clearTimeout(tRef.current);
    setPct(finalPct);
  };

  const submit = async () => {
    setErr("");

    if (loading || submitting) return;
    if (!q1.trim() || !q2.trim()) {
      setErr("질문 2개를 모두 적어줘.");
      return;
    }
    if (q1.length > MAX_LEN || q2.length > MAX_LEN) {
      setErr(`너무 길어요. ${MAX_LEN}자 이내로 줄여줘.`);
      return;
    }

    // ✅ 게스트는 write 허용 여부 정책에 따라 처리(현재는 로그인 유도)
    if (isGuest) {
      // 게스트 UX: 오늘만 유지 구조라면 로컬로 결과 만들고 /result로 보낼 수도 있음
      // 지금은 서비스용(서버 저장) 기준이므로 로그인 유도
      router.push("/?mode=login");
      return;
    }

    setSubmitting(true);

    // ✅ write 화면 페이드 아웃 → 로딩만 중앙에
    setFadeOut(true);
    // 0.2s 후 로더 표시
    window.setTimeout(() => setShowLoader(true), 200);

    startProgress();

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q1, q2 }),
      });

      const json = (await res.json().catch(() => ({}))) as ApiRes;

      // ✅ 이미 오늘 작성: 기존 entry로 이동(일관성)
      if (res.status === 429 && (json as ApiAlready)?.code === "ALREADY_TODAY") {
        const entryId = (json as ApiAlready).entryId;
        await stopProgress(100);
        if (entryId) {
          router.replace(`/entry/${entryId}`);
          return;
        }
        // entryId가 없으면 안전하게 me로
        router.replace("/me");
        return;
      }

      if (!res.ok) {
        await stopProgress(92);
        throw new Error((json as ApiErr)?.error || "정리를 불러오지 못했어요.");
      }

      const okJson = json as ApiOk;
      if (!okJson.entryId) {
        await stopProgress(92);
        throw new Error("저장된 기록을 찾지 못했어요.");
      }

      await stopProgress(100);

      // ✅ 서비스 일관성: 결과는 entry/[id]로 간다
      router.replace(`/entry/${okJson.entryId}`);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "정리를 불러오지 못했어요.");
      setSubmitting(false);

      // 로딩 종료하고 다시 작성 화면 복귀
      doneRef.current = true;
      if (tRef.current) window.clearTimeout(tRef.current);
      setShowLoader(false);
      setFadeOut(false);
      setPct(0);
      return;
    }
  };

  return (
    <>
      <AppHeader  backHref="/home" transparent />

      <main className="relative min-h-[100dvh] bg-[#F6F5F3] px-6 pt-14 pb-24 overflow-hidden">
        {/* 배경 */}
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none
          bg-[radial-gradient(circle_at_1px_1px,#00000010_1px,transparent_0)]
          [background-size:18px_18px]"
        />

        {/* ✅ 작성 화면 */}
        <div
          className={[
            "relative h-full flex items-center justify-center transition-opacity duration-200",
            fadeOut ? "opacity-0 pointer-events-none" : "opacity-100",
          ].join(" ")}
        >
          <div className="w-full max-w-sm">
            <div className="rounded-3xl bg-white/70 border border-neutral-200 shadow-sm p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-xs text-neutral-500">
                  {isGuest ? "게스트 모드" : "회원 모드"}
                </p>
                <h1 className="text-xl font-semibold text-neutral-900 leading-snug">
                  오늘을 2문장으로
                  <br />
                  정리해볼까요?
                </h1>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  길게 쓰지 않아도 괜찮아요.
                  <br />
                  짧을수록 더 선명해져요.
                </p>
              </div>

              {/* Q1 */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-900">{Q1_TITLE}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{Q1_EXAMPLES}</p>
                <textarea
                  value={q1}
                  onChange={(e) => setQ1(e.target.value)}
                  rows={3}
                  maxLength={MAX_LEN}
                  placeholder="1~2줄이면 충분해요."
                  className="w-full rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 text-sm text-neutral-900
                  placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
                <p className="text-[11px] text-neutral-400 text-right">
                  {q1.length}/{MAX_LEN}
                </p>
              </div>

              {/* Q2 */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-900">{Q2_TITLE}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{Q2_EXAMPLES}</p>
                <textarea
                  value={q2}
                  onChange={(e) => setQ2(e.target.value)}
                  rows={3}
                  maxLength={MAX_LEN}
                  placeholder="바꾸지 않아도 괜찮아요."
                  className="w-full rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 text-sm text-neutral-900
                  placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
                <p className="text-[11px] text-neutral-400 text-right">
                  {q2.length}/{MAX_LEN}
                </p>
              </div>

              {/* 에러 */}
              {err ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {err}
                </div>
              ) : null}

              {/* CTA */}
              <button
                type="button"
                onClick={submit}
                disabled={loading || submitting}
                className={[
                  "w-full rounded-2xl py-4 text-sm font-medium transition",
                  "active:scale-[0.99]",
                  loading || submitting
                    ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                    : "bg-neutral-900 text-white",
                ].join(" ")}
              >
                {loading ? "확인 중…" : submitting ? "정리 중…" : "오늘 정리 받기"}
              </button>

              {isGuest && (
                <p className="text-xs text-neutral-500 text-center leading-relaxed">
                  게스트는 저장이 되지 않아요. 로그인하면 기록을 남길 수 있어요.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ✅ 로딩 화면: 중앙 단독 표시 */}
        {showLoader && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="rounded-3xl bg-white/80 border border-neutral-200 shadow-sm p-6 space-y-5 text-center">
                <p className="text-xs text-neutral-500">오늘의 정리</p>
                <h2 className="text-lg font-semibold text-neutral-900">
                  정리하는 중이에요
                </h2>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-neutral-900 transition-[width] duration-200"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-sm text-neutral-700 tabular-nums">
                    {pct}%
                  </p>
                </div>

                <p className="text-xs text-neutral-500 leading-relaxed">
                  길게 쓰지 않아도 괜찮아요.
                  <br />
                  지금 이 순간이 이미 정리예요.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </>
  );
}

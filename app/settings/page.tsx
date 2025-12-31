"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import AppHeader from "../components/AppHeader";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        router.replace("/?mode=login");
        return;
      }

      setEmail(user.email ?? "");
      setLoading(false);
    })();
  }, [router, supabase]);

  const logout = async () => {
    setWorking(true);
    await supabase.auth.signOut();
    router.push("/");
  };

  // ✅ MVP: 계정 삭제는 막기(준비중)
  const requestDelete = () => {
    alert(
      "계정 삭제 기능은 준비 중이에요.\n\n" +
        "현재는 로그아웃만 가능하고,\n" +
        "정식 출시 전에 삭제 기능을 제공할 예정이에요."
    );
  };

  return (
      <main className="min-h-screen pt-16 bg-neutral-50 flex  justify-center px-4">
        <div className="w-full max-w-md space-y-4">
          <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-6 space-y-5">
            {/* 헤더 */}
            <div className="space-y-1">
              <p className="text-xs text-neutral-500">설정</p>
              <h1 className="text-lg font-semibold text-neutral-900">
                계정 & 데이터
              </h1>
              {loading ? (
                <p className="text-xs text-neutral-400">확인 중…</p>
              ) : (
                <p className="text-xs text-neutral-400">{email}</p>
              )}
            </div>

            <div className="h-px bg-neutral-200" />

            {/* 안내 */}
            <div className="space-y-3">
              <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4">
                <p className="text-sm font-medium text-neutral-900">
                  데이터 정책
                </p>
                <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
                  회원은 기록이 저장되고, 캘린더에서 언제든 다시 볼 수 있어요.
                  <br />
                  게스트는 오늘까지만 유지돼요.
                </p>
                <p className="mt-2 text-xs text-neutral-400">
                  우리는 기록을 분석하지 않아요. 대신 오늘을 정리해줘요.
                </p>
              </div>

              <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4">
                <p className="text-sm font-medium text-neutral-900">
                  요약 기능
                </p>
                <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
                  ‘이번 주 한 문장’과 ‘이번 달 한 문장’은 기록 내용을 바탕으로
                  짧게 정리돼요.
                </p>
                <p className="mt-2 text-xs text-neutral-400">
                  (MVP 단계에서는 간단한 규칙 기반 요약일 수 있어요.)
                </p>
              </div>
            </div>

            {/* 액션 */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={logout}
                disabled={working}
                className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {working ? "처리 중…" : "로그아웃"}
              </button>

              {/* ✅ 준비중 버튼 */}
              <button
                type="button"
                onClick={requestDelete}
                className="w-full rounded-xl border border-neutral-300 py-3 text-sm text-neutral-500 bg-neutral-50 cursor-not-allowed"
                aria-disabled="true"
              >
                계정 삭제 (준비중)
              </button>

              <p className="text-center text-xs text-neutral-400">
                계정 삭제는 정식 출시 전에 제공할 예정이에요.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-neutral-400">
            설정은 최소로, 마음은 가볍게.
          </p>
        </div>
      </main>
  );
}

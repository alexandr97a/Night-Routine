"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

// ✅ 경로 주의: 너 프로젝트 구조에 맞게 하나만 사용
import AppHeader from "../../components/AppHeader"; 
// 만약 components가 app 아래라면: "../../components/AppHeader"로 되돌려

type Entry = {
  id: number;
  user_id: string;
  created_at: string;
  q1: string;
  q2: string;
  feedback: string;
};

function formatKST(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function EntryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<Entry | null>(null);
  const [err, setErr] = useState<string>("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      setItem(null);

      const entryId = Number(id);
      if (!entryId || Number.isNaN(entryId)) {
        setErr("잘못된 접근이에요.");
        setLoading(false);
        return;
      }

      // ✅ 회원만 접근
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.replace("/?mode=login");
        return;
      }

      // ✅ 내 글만 조회
      const { data, error } = await supabase
        .from("entries")
        .select("id, user_id, created_at, q1, q2, feedback")
        .eq("id", entryId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) setErr(error.message);
      else if (!data) setErr("해당 기록을 찾을 수 없어요.");
      else setItem(data as Entry);

      setLoading(false);
    })();
  }, [id, router, supabase]);

  const remove = async () => {
    if (!item) return;
    const ok = confirm("이 기록을 삭제할까요? (되돌릴 수 없어요)");
    if (!ok) return;

    setDeleting(true);
    setErr("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.replace("/?mode=login");
        return;
      }

      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("id", item.id)
        .eq("user_id", user.id);

      if (error) {
        setErr(error.message);
        setDeleting(false);
        return;
      }

      router.push("/me");
    } catch {
      setErr("삭제 중 오류가 발생했어요.");
      setDeleting(false);
    }
  };

  return (
    <>
      <AppHeader backHref="/me" transparent />

      {/* ✅ 핵심: 스크롤은 main에서 담당 + 짧으면 중앙정렬, 길면 자연스러운 스크롤 */}
      <main className="min-h-[100dvh] bg-neutral-50 px-4 pt-14 pb-24">
        <div className="mx-auto w-full max-w-md">
          {/* ✅ 스크롤/중앙 정렬을 동시에 만족시키는 구조 */}
          <div className="min-h-[calc(100dvh-56px-96px)] flex items-start justify-center">
            <div className="w-full py-6">
              <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-6 space-y-5">
                {/* 상단 헤더 */}
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500">기록 상세</p>
                  <h1 className="text-lg font-semibold text-neutral-900">
                    {loading ? "불러오는 중…" : item ? "그날의 정리" : "알림"}
                  </h1>
                  {item?.created_at && (
                    <p className="text-xs text-neutral-400">
                      {formatKST(item.created_at)}
                    </p>
                  )}
                </div>

                {/* 상태 */}
                {loading ? (
                  <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4 text-sm text-neutral-600">
                    내용을 정리해서 가져오는 중이에요…
                  </div>
                ) : err ? (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
                    {err}
                  </div>
                ) : item ? (
                  <div className="space-y-4">
                    {/* Q1 */}
                    <section className="rounded-xl border border-neutral-200 p-4">
                      <p className="text-xs text-neutral-500">Q1</p>
                      <p className="mt-2 text-sm font-medium text-neutral-900">
                        오늘 하루를 한 문장으로 말해보면?
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-800 whitespace-pre-line">
                        {item.q1}
                      </p>
                    </section>

                    {/* Q2 */}
                    <section className="rounded-xl border border-neutral-200 p-4">
                      <p className="text-xs text-neutral-500">Q2</p>
                      <p className="mt-2 text-sm font-medium text-neutral-900">
                        오늘을 다시 한다면, 딱 하나만 다르게 하고 싶은 건 뭐야?
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-800 whitespace-pre-line">
                        {item.q2}
                      </p>
                    </section>

                    {/* AI 피드백 */}
                    <section className="rounded-xl bg-neutral-50 border border-neutral-100 p-4">
                      <p className="text-xs text-neutral-500">오늘의 정리</p>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-800 whitespace-pre-line">
                        {item.feedback}
                      </p>
                    </section>
                  </div>
                ) : null}

                {/* 삭제(선택) */}
                {!loading && item && (
                  <button
                    type="button"
                    onClick={remove}
                    disabled={deleting}
                    className="w-full rounded-xl border border-neutral-300 py-3 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {deleting ? "삭제 중…" : "이 기록 삭제"}
                  </button>
                )}

                {/* 엔딩 카피 */}
                {!loading && item && (
                  <p className="text-center text-xs text-neutral-400">
                    기록은 분석하지 않고, 필요할 때 꺼내볼 수 있게만 남겨요.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import AppHeader from "../components/AppHeader";

type Entry = {
  id: number;
  created_at: string;
  q1: string;
  feedback: string;
};

type SummaryRes = {
  period: { start: string; end: string };
  summary: string;
  cached?: boolean;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function makeKey(y: number, m: number, d: number) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}
function toKSTDateKey(iso: string) {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}
function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}
function kstNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

export default function MeCalendarPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [byDay, setByDay] = useState<Record<string, Entry[]>>({});

  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // ✅ 요약 카드 상태
  const [weekLoading, setWeekLoading] = useState(false);
  const [monthLoading, setMonthLoading] = useState(false);
  const [weekSummary, setWeekSummary] = useState<SummaryRes | null>(null);
  const [monthSummary, setMonthSummary] = useState<SummaryRes | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.replace("/?mode=login");
        return;
      }

      // entries 로드
      const { data, error } = await supabase
        .from("entries")
        .select("id, created_at, q1, feedback")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(240);

      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }

      const list = (data as Entry[]) ?? [];

      // byDay 구성 (최신순 유지)
      const map: Record<string, Entry[]> = {};
      for (const e of list) {
        const key = toKSTDateKey(e.created_at);
        if (!map[key]) map[key] = [];
        map[key].push(e);
      }
      setByDay(map);

      // ✅ 첫 진입 월: 오늘이 있으면 오늘, 없으면 가장 최신 기록의 월
      const todayKey = toKSTDateKey(new Date().toISOString());
      const defaultKey = map[todayKey]
        ? todayKey
        : list[0]
        ? toKSTDateKey(list[0].created_at)
        : null;

      if (defaultKey) {
        const [yy, mm] = defaultKey.split("-").map(Number);
        setMonthCursor(new Date(yy, mm - 1, 1));
      }

      setLoading(false);

      // ✅ 요약 로드 (entries 로드 후 조용히)
      setWeekLoading(true);
      fetch("/api/summary/weekly", { method: "POST" })
        .then((r) => r.json())
        .then((json: SummaryRes) => setWeekSummary(json))
        .catch(() => setWeekSummary(null))
        .finally(() => setWeekLoading(false));

      const now = kstNow();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth() + 1;

      setMonthLoading(true);
      fetch("/api/summary/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      })
        .then((r) => r.json())
        .then((json: SummaryRes) => setMonthSummary(json))
        .catch(() => setMonthSummary(null))
        .finally(() => setMonthLoading(false));
    })();
  }, [router, supabase]);

  // ✅ 캘린더 날짜 클릭: 기록 있으면 항상 상세로 이동 (여러 개면 최신 1개)
  const onPickDay = (key: string) => {
    const items = byDay[key] || [];
    if (items.length > 0) {
      router.push(`/entry/${items[0].id}`);
    }
  };

  // 캘린더 그리드 계산
  const y = monthCursor.getFullYear();
  const m0 = monthCursor.getMonth();
  const m = m0 + 1;

  const first = startOfMonth(monthCursor);
  const startWeekday = first.getDay();
  const gridStart = new Date(y, m0, 1 - startWeekday);

  const cells: { key: string; day: number; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({
      key: makeKey(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      day: d.getDate(),
      inMonth: d.getMonth() === m0,
    });
  }

  const todayKey = toKSTDateKey(new Date().toISOString());

  return (
    <main className="min-h-screen pt-16 bg-neutral-50 flex justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-6 space-y-5">
          {/* ✅ 요약 카드 2장 */}
          <div className="space-y-2 pt-1">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-500">이번 주 한 문장</p>
                {weekSummary?.period && (
                  <p className="text-xs text-neutral-400">
                    {weekSummary.period.start} ~ {weekSummary.period.end}
                  </p>
                )}
              </div>
              <p className="mt-2 text-sm text-neutral-900 leading-relaxed">
                {weekLoading
                  ? "불러오는 중…"
                  : weekSummary?.summary ?? "이번 주 요약을 준비 중이에요."}
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-500">이번 달 한 문장</p>
                {monthSummary?.period && (
                  <p className="text-xs text-neutral-400">
                    {monthSummary.period.start} ~ {monthSummary.period.end}
                  </p>
                )}
              </div>
              <p className="mt-2 text-sm text-neutral-900 leading-relaxed">
                {monthLoading
                  ? "불러오는 중…"
                  : monthSummary?.summary ?? "이번 달 요약을 준비 중이에요."}
              </p>
            </div>
          </div>

          <div className="h-px bg-neutral-200" />

          {loading ? (
            <p className="text-sm text-neutral-500">불러오는 중…</p>
          ) : err ? (
            <p className="text-sm text-red-600">에러: {err}</p>
          ) : (
            <>
              {/* 월 헤더 */}
              <div className="flex items-center justify-center gap-6 py-2">
                <button
                  type="button"
                  onClick={() => setMonthCursor(addMonths(monthCursor, -1))}
                  aria-label="이전 달"
                  className="
                                    text-neutral-400 text-xl
                                    transition
                                    hover:text-neutral-800
                                    active:scale-95
                                    w-0
                                    "
                >
                  ‹
                </button>

                <div className="text-base font-medium text-neutral-900">
                  {y} · {m}
                </div>

                <button
                  type="button"
                  onClick={() => setMonthCursor(addMonths(monthCursor, 1))}
                  aria-label="다음 달"
                  className="
      text-neutral-400 text-xl
      transition
      hover:text-neutral-800
      active:scale-95
      w-0
    "
                >
                  ›
                </button>
              </div>

              {/* 요일 */}
              <div className="grid grid-cols-7 text-center text-xs font-medium">
                {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
                  <div
                    key={w + i}
                    className={[
                      "py-2",
                      i === 0 ? "text-red-400" : "",
                      i === 6 ? "text-blue-500" : "text-neutral-400",
                    ].join(" ")}
                  >
                    {w}
                  </div>
                ))}
              </div>

              {/* 달력 */}
              <div className="grid grid-cols-7 gap-y-2">
                {cells.map((c) => {
                  const d = new Date(c.key);
                  const weekday = d.getDay();
                  const has = !!byDay[c.key];
                  const isToday = c.key === todayKey;

                  const weekendColor =
                    weekday === 0
                      ? "text-red-400"
                      : weekday === 6
                      ? "text-blue-500"
                      : "text-neutral-800";

                  const faded = c.inMonth ? "" : "opacity-30";

                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => onPickDay(c.key)}
                      disabled={!has}
                      className={[
                        "relative flex items-center justify-center rounded-full",
                        "h-10 w-10 mx-auto transition",
                        has ? "bg-white hover:bg-neutral-50" : "bg-transparent",
                        !has ? "cursor-default" : "cursor-pointer",
                      ].join(" ")}
                      aria-label={c.key}
                    >
                      {/* 오늘 테두리 */}
                      {isToday && (
                        <span className="absolute h-10 w-10 rounded-full border border-neutral-300" />
                      )}

                      {/* 날짜 숫자 */}
                      <span
                        className={[
                          "relative text-sm",
                          weekendColor,
                          faded,
                          !has ? "text-neutral-300" : "",
                        ].join(" ")}
                      >
                        {c.day}
                      </span>

                      {/* 기록 dot */}
                      {has && (
                        <span className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-neutral-900" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

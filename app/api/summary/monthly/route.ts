import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase/server";
import { getKSTMonthRange, makeMonthlyOneLiner } from "../../../../lib/summary";

function kstNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase();

  // 로그인 확인
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = userData.user;

  // 요청으로 year/month 받을 수 있게(없으면 이번달)
  let year: number | null = null;
  let month: number | null = null;

  try {
    const body = await req.json();
    year = body?.year ?? null;
    month = body?.month ?? null;
  } catch {
    // body 없으면 이번달 사용
  }

  const now = kstNow();
  const y = year ?? now.getUTCFullYear();
  const m = month ?? now.getUTCMonth() + 1;

  const { start, end, startKey, endKey } = getKSTMonthRange(y, m);

  // 캐시
  const { data: cached } = await supabase
    .from("summaries")
    .select("summary")
    .eq("user_id", user.id)
    .eq("type", "monthly")
    .eq("period_start", startKey)
    .eq("period_end", endKey)
    .maybeSingle();

  if (cached?.summary) {
    return NextResponse.json({
      period: { start: startKey, end: endKey },
      summary: cached.summary,
      cached: true,
    });
  }

  // entries 가져오기
  const { data: entries, error } = await supabase
    .from("entries")
    .select("q1, q2, feedback, created_at")
    .eq("user_id", user.id)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: true })
    .limit(400);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const summary = makeMonthlyOneLiner(entries ?? []);

  // 저장
  await supabase.from("summaries").insert({
    user_id: user.id,
    type: "monthly",
    period_start: startKey,
    period_end: endKey,
    summary,
  });

  return NextResponse.json({
    period: { start: startKey, end: endKey },
    summary,
    cached: false,
  });
}

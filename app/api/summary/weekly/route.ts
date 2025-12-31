import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase/server";
import { getKSTWeekRange, makeWeeklyOneLiner } from "../../../../lib/summary";

export async function POST() {
  const supabase = await createServerSupabase();

  // 로그인 확인
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = userData.user;

  const { start, end, startKey, endKey } = getKSTWeekRange();

  // 캐시
  const { data: cached } = await supabase
    .from("summaries")
    .select("summary")
    .eq("user_id", user.id)
    .eq("type", "weekly")
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
    .limit(80);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const summary = makeWeeklyOneLiner(entries ?? []);

  // 저장
  await supabase.from("summaries").insert({
    user_id: user.id,
    type: "weekly",
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

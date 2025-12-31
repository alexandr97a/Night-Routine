import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/* ================== Config ================== */
const MAX_LENGTH = 400;
const MODEL = "gpt-4.1-mini";

/* ================== Helpers ================== */
function kstDateKey(date = new Date()) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function jsonError(message: string, status = 400, extra?: Record<string, any>) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra || {}) },
    { status }
  );
}

function buildPrompt(q1: string, q2: string) {
  return `
역할:
너는 위로하는 AI가 아니다.
하루를 조용히 정리해주는 기록 편집자다.

목표:
사용자가 오늘을 ‘마무리했다’고 느끼게 하되,
감정을 과장하거나 조언하지 않는다.

입력:
- 오늘 하루를 한 문장으로 정리한 글: ${q1}
- 오늘을 다시 한다면 바꾸고 싶은 한 가지: ${q2}

출력 규칙 (중요):
- 전체 4~5문장
- “괜찮다”, “잘했다”, “충분하다” 같은 일반적 위로 금지
- 조언, 해결책, 긍정 강요 금지
- 감정 단어 남용 금지
- 마치 사람이 쓴 정리 문장처럼 자연스럽게

출력 구조:
1) 첫 문장: 오늘을 하나의 장면으로 요약 (시간/분위기/리듬 중 하나 포함)
2) 두 번째 문장: Q1에서 드러난 선택/태도 해석 (사실+해석)
3) 세 번째 문장: Q2로 드러난 말하지 않은 마음을 판단 없이 짚기
4) 마지막 문장: 내일을 지시하지 말고 ‘열려 있게’ 남기기 (질문 형태 가능)

추가 제한:
- 이모지 사용 금지
- 존댓말 유지
- 문장 사이 과도한 줄바꿈 금지
`.trim();
}

/* ================== Route ================== */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const q1 = String(body?.q1 ?? "").trim();
    const q2 = String(body?.q2 ?? "").trim();

    if (!q1 || !q2) return jsonError("질문 2개를 모두 입력해줘.", 400);
    if (q1.length > MAX_LENGTH || q2.length > MAX_LENGTH) {
      return jsonError(`너무 길어요. ${MAX_LENGTH}자 이내로 줄여줘.`, 400);
    }

    // ✅ Supabase server client (cookies 기반)
    const cookieStore = await cookies()// Next 15/16에서 cookies()는 await 불필요
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // ✅ 로그인 필수
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (userErr || !user) return jsonError("로그인이 필요해요.", 401);

    // ✅ KST 기준 오늘
    const todayKST = kstDateKey();

    // ✅ 오늘 이미 작성했는지
    const { data: existing, error: existErr } = await supabase
      .from("entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("entry_date_kst", todayKST)
      .maybeSingle();

    if (existErr) return jsonError(existErr.message, 500);

    if (existing?.id) {
      return NextResponse.json(
        { ok: false, code: "ALREADY_TODAY", entryId: existing.id },
        { status: 429 }
      );
    }

    // ✅ OpenAI 호출(빌드 안전: POST 내부에서만 import/생성)
    let feedback =
      "오늘을 정리하는 데 필요한 정보가 잠깐 비었습니다. 내일 다시 이어가도 괜찮습니다.";

    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const OpenAI = (await import("openai")).default;
        const openai = new OpenAI({ apiKey });

        const prompt = buildPrompt(q1, q2);

        const resp = await openai.responses.create({
          model: MODEL,
          input: prompt,
        });

        const text = (resp.output_text ?? "").trim();
        if (text) feedback = text;
      } catch (e) {
        console.error("OpenAI error:", e);
      }
    } else {
      // 키가 없으면 빌드/런타임 모두 안전하게 fallback
      console.warn("OPENAI_API_KEY missing: using fallback feedback");
    }

    // ✅ 저장 (DB 유니크가 최종 방어선)
    const { data: inserted, error: insErr } = await supabase
      .from("entries")
      .insert({
        user_id: user.id,
        q1,
        q2,
        feedback,
        entry_date_kst: todayKST,
      })
      .select("id")
      .single();

    if (insErr) {
      const msg = String(insErr.message || "");
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
        const { data: ex2 } = await supabase
          .from("entries")
          .select("id")
          .eq("user_id", user.id)
          .eq("entry_date_kst", todayKST)
          .maybeSingle();

        return NextResponse.json(
          { ok: false, code: "ALREADY_TODAY", entryId: ex2?.id ?? null },
          { status: 429 }
        );
      }
      return jsonError(msg || "저장에 실패했어요.", 500);
    }

    return NextResponse.json({
      ok: true,
      entryId: inserted.id,
      feedback,
    });
  } catch (e) {
    console.error("feedback route error:", e);
    return NextResponse.json(
      { ok: false, error: "서버 오류가 발생했어요." },
      { status: 500 }
    );
  }
}

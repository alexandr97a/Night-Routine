type EntryLite = { q1?: string | null; q2?: string | null; feedback?: string | null };

function kstNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

export function getKSTWeekRange() {
  const now = kstNow();
  const day = now.getUTCDay(); // KST 기준 요일
  const diffToMonday = (day + 6) % 7;

  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - diffToMonday);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);

  const startKey = start.toISOString().slice(0, 10);
  const endKey = end.toISOString().slice(0, 10);
  return { start, end, startKey, endKey };
}

export function getKSTMonthRange(year: number, month1to12: number) {
  const start = new Date(Date.UTC(year, month1to12 - 1, 1, 0, 0, 0, 0));
  // end: 다음달 0일 = 이번달 마지막날
  const end = new Date(Date.UTC(year, month1to12, 0, 23, 59, 59, 999));

  const startKey = start.toISOString().slice(0, 10);
  const endKey = end.toISOString().slice(0, 10);
  return { start, end, startKey, endKey };
}

function pickMood(entries: EntryLite[]) {
  const text = entries
    .map((e) => `${e.q1 ?? ""} ${e.q2 ?? ""} ${e.feedback ?? ""}`.toLowerCase())
    .join(" ");

  const heavy = ["힘", "불안", "우울", "짜증", "지쳤", "스트레스", "번아웃", "피곤"];
  const light = ["좋", "기쁘", "편안", "평온", "설렘", "감사", "여유", "행복"];
  const change = ["바꾸", "다르게", "다음", "내일", "시작", "습관", "정리"];

  const score = (arr: string[]) => arr.reduce((acc, k) => acc + (text.includes(k) ? 1 : 0), 0);

  const h = score(heavy);
  const l = score(light);
  const c = score(change);

  if (l > h && l >= 2) return { mood: "밝았고", focus: c ? "정리와 전환" : "흐름 유지" };
  if (h > l && h >= 2) return { mood: "버거웠지만", focus: c ? "다시 잡기" : "버티기" };
  return { mood: "담담했고", focus: c ? "작은 선택" : "흐름" };
}

export function makeWeeklyOneLiner(entries: EntryLite[]) {
  if (!entries.length) return "이번 주는 기록이 많지 않았지만, 쉬어가는 시간도 필요한 한 주였어요.";

  const { mood, focus } = pickMood(entries);
  const n = entries.length;

  // 너무 뻔하지 않게 3가지 템플릿 로테이션
  const variants = [
    `이번 주는 ${mood} 하루를 정리하려는 마음을 놓지 않은 한 주였어요.`,
    `이번 주는 ${mood} 그 와중에도 ${focus}을(를) 시도해본 한 주였어요.`,
    `이번 주는 ${mood} ${n}번의 기록만큼, 나를 돌아보는 시간이 쌓인 한 주였어요.`,
  ];

  return variants[n % variants.length];
}

export function makeMonthlyOneLiner(entries: EntryLite[]) {
  if (!entries.length) return "이달은 기록이 많지 않았지만, 조용히 지나간 시간도 의미가 있어요.";

  const { mood, focus } = pickMood(entries);
  const n = entries.length;

  const variants = [
    `이달은 ${mood} 그래도 ${focus}을(를) 이어가려 했던 달이었어요.`,
    `이달은 ${mood} 완벽하진 않아도 나를 챙기려 한 달이었어요.`,
    `이달은 ${mood} ${n}번의 기록만큼, 마음을 다독이는 시간이 있었던 달이었어요.`,
  ];

  return variants[n % variants.length];
}

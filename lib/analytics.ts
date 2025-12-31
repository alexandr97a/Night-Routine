import { createClient } from "./supabase/client";

function getSessionId() {
  if (typeof window === "undefined") return null;
  const key = "nr_session_id";
  let v = localStorage.getItem(key);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(key, v);
  }
  return v;
}

export async function logEvent(
  name: string,
  props?: Record<string, any>
) {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id ?? null;

    const sessionId = getSessionId();

    await supabase.from("events").insert({
      user_id: userId,
      session_id: sessionId,
      name,
      props: props ?? null,
    });
  } catch (e) {
    // 실험용이라 실패해도 UX 깨지지 않게 조용히 무시
    console.debug("logEvent failed", e);
  }
}

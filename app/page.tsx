"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

type Provider = "google" | "kakao" | "apple";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState<Provider | "login" | "guest" | null>(null);
  const [err, setErr] = useState("");

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

  // ✅ 이메일/비번 로그인 (진짜 로그인)
  const login = async () => {
    try {
      setErr("");
      setLoading("login");

      if (!email.trim() || !password.trim()) {
        setErr("이메일과 비밀번호를 입력해 주세요.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErr(error.message);
        return;
      }

      // 로그인 성공
      router.push("/home");
    } finally {
      setLoading(null);
    }
  };

  // ✅ 회원가입(이메일 인증 ON 상태라면 이메일로 확인 링크가 갈 수 있어)
  const signup = async () => {
    try {
      setErr("");
      setLoading("login");

      if (!email.trim() || !password.trim()) {
        setErr("이메일과 비밀번호를 입력해 주세요.");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        setErr(error.message);
        return;
      }

      setErr("가입 요청을 보냈어요. 이메일을 확인해 주세요.");
    } finally {
      setLoading(null);
    }
  };

  // ✅ 소셜 로그인
  const signInOAuth = async (provider: Provider) => {
    try {
      setErr("");
      setLoading(provider);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (error) setErr(error.message);
    } finally {
      setLoading(null);
    }
  };

  // ✅ 게스트(오늘만)
  const guestLogin = () => {
    setLoading("guest");
    try {
      localStorage.setItem("GUEST_DATE", new Date().toISOString().slice(0, 10));
      router.push("/write");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen pt-16 bg-[#F6F5F3] flex items-center justify-center px-6">
      {/* 은은한 종이 질감 */}
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none
        bg-[radial-gradient(circle_at_1px_1px,#00000010_1px,transparent_0)]
        [background-size:18px_18px]"
      />

      <div className="relative w-full max-w-sm">
        {/* 로고/카피 */}
        <div className="mt-12 mb-10 text-center">
          <h1 className="text-[44px] leading-none tracking-tight text-neutral-800 font-[600]">
            Night Routine
          </h1>
          <p className="mt-5 text-sm text-neutral-600">
            하루를 정리하는 가장 조용한 방법
          </p>
        </div>

        {/* 이메일 로그인 폼 */}
        <div className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            type="email"
            autoComplete="email"
            className="w-full rounded-2xl border border-neutral-300 bg-white/80 px-4 py-4 text-sm text-neutral-900 outline-none
            focus:ring-2 focus:ring-neutral-900/10"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-2xl border border-neutral-300 bg-white/80 px-4 py-4 text-sm text-neutral-900 outline-none
            focus:ring-2 focus:ring-neutral-900/10"
            onKeyDown={(e) => {
              if (e.key === "Enter") login();
            }}
          />

          {/* ✅ 로그인 버튼 (기존 임시 로그인 → 진짜 로그인으로 변경) */}
          <button
            type="button"
            onClick={login}
            disabled={!!loading}
            className="w-full rounded-2xl bg-neutral-900 py-4 text-sm font-medium text-white
            disabled:opacity-60 active:scale-[0.99] transition"
          >
            {loading === "login" ? "로그인 중…" : "로그인"}
          </button>

          {/* 회원가입 */}
          <button
            type="button"
            onClick={signup}
            disabled={!!loading}
            className="w-full rounded-2xl border border-neutral-300 bg-white py-4 text-sm font-medium text-neutral-800
            disabled:opacity-60 active:scale-[0.99] transition"
          >
            회원가입
          </button>

          {/* ✅ 게스트 로그인 추가 */}
          <button
            type="button"
            onClick={guestLogin}
            disabled={!!loading}
            className="w-full rounded-2xl bg-neutral-900/10 border border-neutral-300 py-4 text-sm font-medium text-neutral-800
            disabled:opacity-60 active:scale-[0.99] transition"
          >
            {loading === "guest" ? "준비 중…" : "게스트로 시작하기 (오늘만)"}
          </button>
        </div>

        {/* 구분선
        <div className="flex items-center gap-4 my-8">
          <div className="h-px flex-1 bg-neutral-300" />
          <span className="text-xs text-neutral-400">or</span>
          <div className="h-px flex-1 bg-neutral-300" />
        </div>

        {/* 소셜 로그인 *
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => signInOAuth("apple")}
            disabled={!!loading}
            className="w-full rounded-2xl bg-black text-white py-4 text-sm font-medium
              flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <AppleIcon />
            {loading === "apple" ? "연결 중…" : "Apple로 계속하기"}
          </button>

          <button
            type="button"
            onClick={() => signInOAuth("google")}
            disabled={!!loading}
            className="w-full rounded-2xl bg-white border border-neutral-300 py-4 text-sm font-medium
              text-neutral-800 flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <GoogleIcon />
            {loading === "google" ? "연결 중…" : "Google로 계속하기"}
          </button>

          <button
            type="button"
            onClick={() => signInOAuth("kakao")}
            disabled={!!loading}
            className="w-full rounded-2xl bg-[#FEE500] py-4 text-sm font-medium
              text-neutral-900 flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <KakaoIcon />
            {loading === "kakao" ? "연결 중…" : "카카오톡으로 계속하기"}
          </button>
        </div> */}

        {/* 안내/에러 */}
        <p className="mt-8 text-xs text-neutral-500 text-center leading-relaxed">
          게스트 기록은 <b>오늘까지만</b> 유지돼요.
        </p>

        {err && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}
      </div>
    </main>
  );
}

/* ===== Icons (SVG) ===== */
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.42 2.26-1.23 3.09-.84.86-2.21 1.53-3.34 1.44-.14-1.12.35-2.3 1.15-3.13.83-.88 2.3-1.52 3.42-1.4ZM20.4 17.52c-.53 1.22-.78 1.77-1.46 2.86-.96 1.53-2.31 3.43-3.98 3.45-1.49.02-1.88-.97-3.9-.96-2.02.01-2.45.98-3.94.96-1.67-.02-2.95-1.73-3.91-3.26-2.2-3.5-2.43-7.6-1.07-9.68 1.0-1.52 2.58-2.42 4.07-2.42 1.56 0 2.55 1.01 3.85 1.01 1.26 0 2.03-1.01 3.84-1.01 1.33 0 2.74.72 3.74 1.98-3.28 1.8-2.75 6.5.76 7.07Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.1 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.8l5.7-5.7C33.6 7.1 29 5 24 5 12.4 5 3 14.4 3 26s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.2 19 13 24 13c2.8 0 5.3 1 7.2 2.8l5.7-5.7C33.6 7.1 29 5 24 5 16 5 9.1 9.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 47c4.2 0 8.1-1.6 11.1-4.3l-5.1-4.2c-1.6 1.2-3.6 2-6 2-5.3 0-9.8-3.6-11.4-8.5l-6.7 5.1C8.6 43 15.7 47 24 47z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-0.8 2.2-2.3 4-4.3 5.3l.1-.1 5.1 4.2c-.4.4 6.8-5 6.8-15.4 0-1.4-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.86 5.37 4.65 6.78L5.9 21.5a.5.5 0 0 0 .75.53l4.1-2.3c.41.04.83.07 1.25.07 5.52 0 10-3.58 10-8s-4.48-8-10-8Z" />
    </svg>
  );
}

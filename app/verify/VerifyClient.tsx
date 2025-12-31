"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function VerifyClient() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const supabase = useMemo(() => createClient(), []);
  const [msg, setMsg] = useState<string>("");
  const [sending, setSending] = useState(false);

  const resend = async () => {
    if (!email) {
      setMsg("이메일 정보가 없어요. 회원가입을 다시 진행해 주세요.");
      return;
    }

    setMsg("");
    setSending(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) setMsg(error.message);
    else setMsg("인증 메일을 다시 보냈어요.");

    setSending(false);
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-6 bg-[#F6F5F3]">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl bg-white/75 border border-neutral-200 shadow-sm p-6 space-y-5">
          <div className="space-y-2">
            <p className="text-xs text-neutral-500">이메일 인증</p>
            <h1 className="text-xl font-semibold text-neutral-900">
              이메일을 확인해주세요
            </h1>
            <p className="text-sm text-neutral-600 leading-relaxed">
              {email ? (
                <>
                  <span className="font-medium text-neutral-900">{email}</span>
                  <span className="text-neutral-600"> 로 인증 메일을 보냈어요.</span>
                  <br />
                  인증을 완료하면 로그인할 수 있어요.
                </>
              ) : (
                <>
                  이메일 정보를 찾지 못했어요.
                  <br />
                  회원가입을 다시 진행해 주세요.
                </>
              )}
            </p>
          </div>

          {msg && (
            <div className="text-sm text-neutral-700 bg-neutral-50 border border-neutral-100 rounded-2xl p-4">
              {msg}
            </div>
          )}

          <button
            type="button"
            onClick={resend}
            disabled={sending || !email}
            className={[
              "w-full rounded-2xl py-3 text-sm font-medium transition active:scale-[0.99]",
              sending || !email
                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                : "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50",
            ].join(" ")}
          >
            {sending ? "보내는 중…" : "인증 메일 다시 보내기"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/?mode=login")}
            className="w-full rounded-2xl bg-neutral-900 py-3 text-sm font-medium text-white active:scale-[0.99]"
          >
            인증했어요 → 로그인하기
          </button>

          <button
            type="button"
            onClick={() => router.push("/?mode=signup")}
            className="w-full rounded-2xl border border-neutral-300 py-3 text-sm text-neutral-700 hover:bg-neutral-50 active:scale-[0.99]"
          >
            이메일을 다시 입력할게요
          </button>

          <p className="text-xs text-neutral-500 leading-relaxed">
            메일이 안 오면 스팸함을 확인해 주세요. 인증 링크는 몇 분 후에 도착할 수 있어요.
          </p>
        </div>
      </div>
    </main>
  );
}

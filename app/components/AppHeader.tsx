"use client";

import { useRouter } from "next/navigation";

type Props = {
  title?: string;
  backHref?: string; // 있으면 뒤로가기 버튼
  right?: React.ReactNode; // 우측 아이콘(설정 등)
  transparent?: boolean; // 배경 완전 투명
};

export default function AppHeader({
  title = "Night Routine",
  backHref,
  right,
  transparent = true,
}: Props) {
  const router = useRouter();

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-50",
        "h-14",
        transparent ? "bg-transparent" : "bg-[#F6F5F3]/70 backdrop-blur-md",
      ].join(" ")}
    >
      {/* 가운데 정렬 컨테이너 */}
      <div className="mx-auto max-w-md h-full px-4 flex items-center justify-between">
        {/* Left */}
        <div className="w-10 flex items-center justify-start">
          {backHref ? (
            <button
              type="button"
              onClick={() => router.push(backHref)}
              aria-label="Back"
              className="h-10 w-10 flex items-center justify-center text-neutral-700 active:scale-95 transition"
            >
              <span className="text-xl leading-none">‹</span>
            </button>
          ) : (
            <span className="w-10" />
          )}
        </div>

        {/* Center Title */}
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="text-[15px] font-semibold tracking-tight text-neutral-900"
          aria-label="Go Home"
        >
          {title}
        </button>

        {/* Right */}
        <div className="w-10 flex items-center justify-end">
          {right ? right : <span className="w-10" />}
        </div>
      </div>
    </header>
  );
}

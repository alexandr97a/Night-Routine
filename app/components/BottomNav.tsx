"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  // 로그인 페이지에서는 숨김
  if (pathname === "/") return null;

  const items = [
    {
      href: "/me",
      label: "기록",
      icon: (active: boolean) => <CalendarIcon active={active} />,
    },
    {
      href: "/home",
      label: "홈",
      icon: (active: boolean) => <HomeIcon active={active} />,
      center: true,
    },
    {
      href: "/settings",
      label: "마이",
      icon: (active: boolean) => <UserIcon active={active} />,
    },
  ];

  return (
    <>
      {/* 콘텐츠 가림 방지 */}
      <div />

      <nav className="fixed left-0 right-0 bottom-0 z-50">
        <div className="w-full pb-[env(safe-area-inset-bottom)]">
          <div
            className="
              rounded-t-[18px]
              bg-neutral-900/95
              border border-white/10
              backdrop-blur
              shadow-2xl
              px-6 py-3
            "
          >
            <div className="grid grid-cols-3 items-center">
              {items.map((it) => {
                const active =
                  pathname === it.href ||
                  pathname.startsWith(it.href + "/");

                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`relative flex flex-col items-center justify-center gap-1 py-2
                      ${it.center ? "scale-110" : ""}`}
                  >
                    <div className="relative">
                      {it.icon(active)}

                      {/* 활성 표시 점 */}
                      {active && (
                        <span className="absolute -top-2 -right-2 h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>

                    <span
                      className={`text-[11px] ${
                        active ? "text-white" : "text-white/55"
                      }`}
                    >
                      {it.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

/* ===== Icons ===== */

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path
        d="M12 3 3 10v10a1 1 0 0 0 1 1h6v-7h4v7h6a1 1 0 0 0 1-1V10l-9-7z"
        fill={active ? "white" : "rgba(255,255,255,0.55)"}
      />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path
        d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm14 8H3v10h18V10z"
        fill={active ? "white" : "rgba(255,255,255,0.55)"}
      />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"
        fill={active ? "white" : "rgba(255,255,255,0.55)"}
      />
    </svg>
  );
}

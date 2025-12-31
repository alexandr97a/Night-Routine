"use client";

export default function LoadingOverlay({
  progress,
  message,
}: {
  progress: number;
  message: string;
}) {
  return (
    <div className="w-full max-w-md rounded-2xl bg-white border border-neutral-200 shadow-sm p-6 space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-neutral-500">오늘의 정리 준비 중</p>
        <h2 className="text-lg font-semibold text-neutral-900">{message}</h2>
      </div>

      <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
        <div
          className="h-full bg-neutral-900 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>{progress}%</span>
        <span>잠시만요</span>
      </div>

      <p className="text-xs text-neutral-400 leading-relaxed">
        길게 기다리게 하지 않을게요. 오늘을 가볍게 정리하는 중이에요.
      </p>
    </div>
  );
}

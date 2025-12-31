export const GUEST_FLAG = "nr_guest";
export const GUEST_DATE = "nr_guest_date";
export const GUEST_FEEDBACK = "nr_guest_feedback";

function todayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function startGuestToday() {
  localStorage.setItem(GUEST_FLAG, "1");
  localStorage.setItem(GUEST_DATE, todayKST());
}

export function isGuestValidToday(): boolean {
  const flag = localStorage.getItem(GUEST_FLAG) === "1";
  const date = localStorage.getItem(GUEST_DATE);
  return flag && date === todayKST();
}

export function clearGuest() {
  localStorage.removeItem(GUEST_FLAG);
  localStorage.removeItem(GUEST_DATE);
  localStorage.removeItem(GUEST_FEEDBACK);
}

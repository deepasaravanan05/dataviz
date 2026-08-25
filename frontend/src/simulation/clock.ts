/** Park opens at 09:00 AM, represented as minutes-of-day. */
export const PARK_START_MINUTES = 9 * 60;

export function formatSimTime(minutesOfDay: number): string {
  const total = Math.floor(minutesOfDay);
  const hours24 = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function formatDelay(minutes: number): string {
  return `+${Math.round(minutes)} min`;
}

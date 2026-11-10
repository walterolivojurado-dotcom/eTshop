/**
 * Converts a 24h time string ("14:30") to a 12h display string ("2:30 PM").
 */
export function formatTime12h(time24: string): string {
  if (!time24) return "";
  const [hourStr, minuteStr] = time24.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr || "00";
  const period = hour < 12 ? "AM" : "PM";
  let displayHour = hour % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${minute} ${period}`;
}

/**
 * Formats a Date object to 12h time display.
 */
export function formatDateTo12h(date: Date): string {
  return date.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toUpperCase();
}

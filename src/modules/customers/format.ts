export function customerDate(instant: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(instant));
}

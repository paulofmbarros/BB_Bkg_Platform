export type Hours = {
  weekday: number;
  enabled: boolean;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
};
export const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const weekOrder = [1, 2, 3, 4, 5, 6, 0];
export function minutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
export function weeklyHours(rows: Hours[]): number {
  return (
    rows.reduce(
      (sum, row) =>
        sum +
        (row.enabled
          ? minutes(row.end_time) -
            minutes(row.start_time) -
            (row.break_start && row.break_end
              ? minutes(row.break_end) - minutes(row.break_start)
              : 0)
          : 0),
      0,
    ) / 60
  );
}
export function defaultHours(): Hours[] {
  return weekOrder.map((weekday) => ({
    weekday,
    enabled: weekday !== 0 && weekday !== 1,
    start_time: "09:00",
    end_time: "19:00",
    break_start: "13:00",
    break_end: "14:00",
  }));
}
export function trimHours(rows: Hours[]): Hours[] {
  return weekOrder.map((weekday) => {
    const row =
      rows.find((r) => r.weekday === weekday) ??
      defaultHours().find((r) => r.weekday === weekday)!;
    return {
      ...row,
      start_time: row.start_time.slice(0, 5),
      end_time: row.end_time.slice(0, 5),
      break_start: row.break_start?.slice(0, 5) ?? null,
      break_end: row.break_end?.slice(0, 5) ?? null,
    };
  });
}

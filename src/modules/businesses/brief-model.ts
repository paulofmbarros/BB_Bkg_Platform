import { shopDate } from "../bookings/types";

export type BriefAppointment = {
  id: string;
  customer_id: string;
  starts_at: string;
  ends_at: string;
  service_name: string;
  price_minor: number;
  status: string;
  customers?: { display_name: string } | null;
  staff_members: { display_name: string } | null;
};

export function summarizeBusinessDay(
  appointments: BriefAppointment[],
  outstandingOutcomes: number,
  now = new Date(),
) {
  const today = shopDate(now);
  const todayAppointments = appointments.filter(
    (appointment) => shopDate(new Date(appointment.starts_at)) === today,
  );
  const completed = todayAppointments.filter(
    (appointment) => appointment.status === "completed",
  );
  const upcoming = todayAppointments
    .filter(
      (appointment) =>
        appointment.status === "confirmed" &&
        new Date(appointment.starts_at).getTime() > now.getTime(),
    )
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );

  return {
    day: today,
    upcoming,
    outstandingOutcomes,
    completedVisits: completed.length,
    completedValueMinor: completed.reduce(
      (total, appointment) => total + appointment.price_minor,
      0,
    ),
  };
}

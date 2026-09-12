import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240),
  category: z.enum(["Hair", "Beard", "Rituals"]),
  duration_minutes: z.coerce.number().int().min(5).max(480),
  buffer_minutes: z.coerce.number().int().min(0).max(120),
  price: z
    .string()
    .regex(
      /^\d{1,5}(\.\d{1,2})?$/,
      "Enter a price with up to two decimal places.",
    ),
  active: z.boolean(),
});

export const staffSchema = z.object({
  display_name: z.string().trim().min(2).max(80),
  title: z.string().trim().min(2).max(100),
  bio: z.string().trim().max(240),
  active: z.boolean(),
  service_ids: z.array(z.string().uuid()).max(50),
});

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const hoursSchema = z
  .array(
    z
      .object({
        weekday: z.number().int().min(0).max(6),
        enabled: z.boolean(),
        start_time: time,
        end_time: time,
        break_start: time.nullable(),
        break_end: time.nullable(),
      })
      .superRefine((row, ctx) => {
        if (row.start_time >= row.end_time)
          ctx.addIssue({
            code: "custom",
            message: "Closing time must be after opening time.",
          });
        if ((row.break_start === null) !== (row.break_end === null))
          ctx.addIssue({ code: "custom", message: "Enter both break times." });
        if (
          row.break_start &&
          row.break_end &&
          !(
            row.start_time <= row.break_start &&
            row.break_start < row.break_end &&
            row.break_end <= row.end_time
          )
        )
          ctx.addIssue({
            code: "custom",
            message: "The break must fall inside working hours.",
          });
      }),
  )
  .length(7)
  .refine(
    (rows) => new Set(rows.map((r) => r.weekday)).size === 7,
    "Each weekday must appear exactly once.",
  );

export const brandingSchema = z.object({
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  address: z.string().trim().min(5).max(200),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+\d\s()-]*$/),
});

export const exceptionSchema = z
  .object({
    start_date: z.iso.date(),
    end_date: z.iso.date(),
    reason: z.string().trim().min(2).max(120),
  })
  .refine(
    (x) => x.end_date >= x.start_date,
    "End date must be on or after start date.",
  );

export function priceToMinorUnits(price: string): number {
  const [whole, fraction = ""] = price.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

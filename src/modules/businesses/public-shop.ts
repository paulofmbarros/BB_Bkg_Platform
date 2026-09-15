import { z } from "zod";
const hours = z.object({
  weekday: z.number(),
  enabled: z.boolean(),
  start_time: z.string(),
  end_time: z.string(),
  break_start: z.string().nullable(),
  break_end: z.string().nullable(),
});
export const publicShopSchema = z.object({
  booking_enabled: z.boolean(),
  name: z.string(),
  slug: z.string(),
  is_demo: z.boolean(),
  currency: z.string(),
  tagline: z.string(),
  description: z.string(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logo_path: z.string().nullable(),
  address: z.string(),
  phone: z.string(),
  timezone: z.string(),
  services: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      duration_minutes: z.number(),
      price_minor: z.number(),
      category: z.string(),
    }),
  ),
  staff: z.array(
    z.object({
      id: z.string(),
      display_name: z.string(),
      title: z.string(),
      bio: z.string(),
      service_ids: z.array(z.string()),
    }),
  ),
  hours: z.array(hours),
});
export type PublicShop = z.infer<typeof publicShopSchema>;

import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be 128 characters or fewer");

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
  password,
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const settingsSchema = z.object({
  name: z.string().trim().min(2).max(80).optional().or(z.literal("")),
  timezone: z.string().trim().min(1).max(80),
  theme: z.enum(["dark", "light"]),
});

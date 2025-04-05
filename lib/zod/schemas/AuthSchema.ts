import z from "zod";

export const AuthSchema = z.object({
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
});
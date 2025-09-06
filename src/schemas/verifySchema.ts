import { codec, z } from "zod";

export const verifySchema = z.object({
  code: z
    .string()
    .length(6, { message: "Verification code has to be of 6 characters" })
    
});

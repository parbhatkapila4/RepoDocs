import { email, z } from "zod";

export const usernameValidation = z
  .string()
  .min(3, "Username should contain atleast 3 characters")
  .max(15, "Username should not exceed 15 characters")
  .regex(/^[a-zA-Z0-9_@]+$/, "Username Should no contain special character");

export const signUpSchema = z.object({
  username: usernameValidation,
  email: z.string().email({ message: "Invalid Email! Please Check again" }),
  password: z
    .string()
    .min(6, { message: "Password has to be atleast 6 characters" }),
});

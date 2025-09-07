import { resend } from "@/lib/resend";
import VerificationEmail from "../../emails/VerificationEmail";
import { ApiResponse } from "@/types/apiResponse";

export async function sendVerificationEmail(
  email: string,
  username: string,
  verifyCode: string
): Promise<ApiResponse> {
  try {
    await resend.emails.send({
      from: "invero@resend.dev>",
      to: email,
      subject: "Invero | Verification Code",
      react: VerificationEmail({ username, otp: verifyCode }),
    });
    return {
      success: true,
      message: "Done! A verification email is on its way.",
    };
  } catch (emailError) {
    console.error(
      "Error has came while sending verification email",
      emailError
    );
    return {
      success: false,
      message: "Hmm… something went wrong while sending your email. Try again?",
    };
  }
}

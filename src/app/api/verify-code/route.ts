import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, code } = await request.json();

    const decodedUsername = decodeURIComponent(username);
    const user = await UserModel.findOne({ username: decodedUsername });

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "Hmm… no sign of you in our system. New around here?",
        },
        { status: 500 }
      );
    }
    const isCodeValid = user.verifyCode === code;
    const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();

    if (isCodeValid && isCodeNotExpired) {
      user.isVerified = true;
      await user.save();

      return Response.json(
        {
          success: true,
          message: "All green lights - you are good to go.",
        },
        {
          status: 200,
        }
      );
    } else if (!isCodeNotExpired) {
      return Response.json(
        {
          success: false,
          message: "Oops, that code's gone stale. Grab a fresh one",
        },
        { status: 400 }
      );
    } else {
      return Response.json(
        {
          success: false,
          message: "Wrong code. Wanna give it another shot?",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(
      "Our system is scratching its head - identity not confirmed.",
      error
    );
    return Response.json(
      {
        success: false,
        message: "Our system is scratching its head—identity not confirmed.",
      },
      {
        status: 500,
      }
    );
  }
}

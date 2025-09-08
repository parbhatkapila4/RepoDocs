import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { User } from "next-auth";

export async function POST(request: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const user: User = session?.user as User;

  if (!session || session.user) {
    return Response.json(
      {
        success: false,
        message: "No pass, no entry. Please sign in",
      },
      { status: 400 }
    );
  }

  const userId = user._id;
  const { acceptMessages } = await request.json();

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { isAcceptingMessage: acceptMessages },
      { new: true }
    );
    if (!updatedUser) {
      return Response.json(
        {
          success: false,
          message: "Uh-oh, status update failed. Try again?",
        },
        { status: 401 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Status refreshed, message is good to go",
        updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Uh-oh, status update failed. Try again?");
    return Response.json(
      {
        success: false,
        message: "Uh-oh, status update failed. Try again?",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const user: User = session?.user as User;

  if (!session || session.user) {
    return Response.json(
      {
        success: false,
        message: "No pass, no entry. Please sign in",
      },
      { status: 400 }
    );
  }

  const userId = user._id;

  try {
    const foundUser = await UserModel.findById(userId);

    if (!foundUser) {
      return Response.json(
        {
          success: false,
          message: "Uh-oh, status update failed. Try again?",
        },
        { status: 401 }
      );
    }

    return Response.json(
      {
        success: true,
        isAcceptingMessages: foundUser.isAcceptingMessage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Our wires got crossed - message status missing");
    return Response.json(
      {
        success: false,
        message: "Our wires got crossed - message status missing",
      },
      { status: 500 }
    );
  }
}

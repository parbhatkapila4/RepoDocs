import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import { User } from "next-auth";
import UserModel from "@/model/User";

export async function DELETE(
  request: Request,
  { params }: { params: { messageid: string } }
) {
  const messageId = params.messageid;
  await dbConnect();

  const session = await getServerSession(authOptions);
  const user: User = session?.user as User;

  if (!session || session.user) {
    return Response.json(
      {
        success: false,
        message: "Authentication required ",
      },
      { status: 400 }
    );
  }
  try {
    const updatedResult = await UserModel.updateOne(
      { _id: user._id },
      { $pull: { messages: { _id: messageId } } }
    );

    if (updatedResult.modifiedCount === 0) {
      return Response.json(
        {
          success: false,
          message: "Nothing to see here, the message disappeared",
        },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Message has been deleted",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while deleting message", error);
    return Response.json(
      {
        success: false,
        message: "Glitch! Message still stands",
      },
      { status: 500 }
    );
  }
}

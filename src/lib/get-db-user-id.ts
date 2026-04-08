import prisma from "./prisma";
import { withPrismaRetry } from "./prisma-retry";

export async function getDbUserId(
  clerkUserId: string
): Promise<string | null> {
  return withPrismaRetry(async () => {
    let dbUser = await prisma.user.findUnique({
      where: { id: clerkUserId },
      select: { id: true },
    });

    if (!dbUser) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(clerkUserId);

        if (clerkUser.emailAddresses[0]?.emailAddress) {
          dbUser = await prisma.user.findUnique({
            where: { emailAddress: clerkUser.emailAddresses[0].emailAddress },
            select: { id: true },
          });
        }
      } catch {
        return null;
      }
    }

    return dbUser?.id ?? null;
  });
}

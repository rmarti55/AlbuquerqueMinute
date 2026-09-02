import { clerkClient } from '@clerk/nextjs/server';

export async function getClerkUserEmail(userId: string): Promise<string | null> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return user.primaryEmailAddress?.emailAddress ?? null;
}

import { getSession } from "./session";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  return {
    id: session.sub,
    email: session.email,
    tier: session.tier,
  };
}

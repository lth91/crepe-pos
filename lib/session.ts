import { cookies } from "next/headers";
import type { UserSession } from "./types";

/** The logged-in user from the session cookie, or null. */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("pos_session")?.value;
  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    if (typeof user?.id === "string" && (user.role === "staff" || user.role === "admin")) {
      return { id: user.id, role: user.role };
    }
  } catch {}
  return null;
}

import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { pin } = await req.json();
  const ownerPin = process.env.OWNER_PIN || "1234";

  if (typeof pin !== "string" || pin !== ownerPin) {
    return Response.json({ error: "Mã PIN không đúng" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("owner_auth", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return Response.json({ ok: true });
}

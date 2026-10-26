// Edge-safe JWT helpers (used by middleware and route handlers).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "bl_session";
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-bloodline");

export type SessionPayload = { sub: string; name: string };

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySession(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

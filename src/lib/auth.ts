import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { connectDB } from "./db";
import { SESSION_COOKIE, signSession, verifySession } from "./session";
import { User, type UserDoc } from "@/models/User";

export async function setSessionCookie(res: NextResponse, user: { _id: unknown; name: string }) {
  const token = await signSession({ sub: String(user._id), name: user.name });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function getSessionUserId() {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  return session?.sub ?? null;
}

export async function getCurrentUser(): Promise<UserDoc | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  await connectDB();
  return User.findById(id);
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUser(): Promise<UserDoc> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Please sign in to continue");
  return user;
}

/** Wraps a route handler with uniform JSON error handling. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err && typeof err === "object" && "issues" in err) {
        const issues = (err as { issues: { message: string; path: (string | number)[] }[] }).issues;
        const first = issues[0];
        return NextResponse.json(
          { error: first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input" },
          { status: 400 },
        );
      }
      console.error(err);
      const msg = err instanceof Error && /ECONNREFUSED|Server selection/i.test(err.message)
        ? "Database unavailable — is MongoDB running? (npm run db)"
        : "Something went wrong";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  };
}

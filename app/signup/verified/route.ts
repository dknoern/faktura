import { NextRequest } from "next/server";
import { signIn } from "@/auth";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  await signIn(
    "auth0",
    { redirectTo: "/home" },
    email ? { login_hint: email } : undefined
  );
}

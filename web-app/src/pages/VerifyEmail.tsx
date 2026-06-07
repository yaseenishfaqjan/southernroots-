import { useEffect, useState } from "react";
import { Leaf, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { api } from "../lib/api";

export default function VerifyEmail() {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    api
      .post("/auth/verify-email", { token })
      .then(() => setState("ok"))
      .catch(() => setState("error"));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-600">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Email verification</h1>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          {state === "loading" && <Loader2 className="mx-auto h-6 w-6 animate-spin text-green-600" />}
          {state === "ok" && (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <p className="text-sm text-gray-700">Your email is verified.</p>
              <a href="/" className="font-medium text-green-700 hover:underline">
                Go to dashboard
              </a>
            </div>
          )}
          {state === "error" && (
            <div className="flex flex-col items-center gap-2">
              <XCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm text-gray-700">This verification link is invalid or expired.</p>
              <a href="/" className="font-medium text-green-700 hover:underline">
                Go to sign in
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { forgotPasswordAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InfoIcon } from "lucide-react";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error")
    ? decodeURIComponent(searchParams.get("error")!)
    : null;
  const success = searchParams?.get("success")
    ? decodeURIComponent(searchParams.get("success")!)
    : null;

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 space-y-4">
      {/* Notification Banner */}
      {(error || success) && (
        <div
          className={`text-sm p-2 px-5 rounded-md flex gap-2 items-center justify-center w-auto ${
            error ? "bg-red-500 text-white" : "bg-green-500 text-white"
          }`}
        >
          <InfoIcon size="16" strokeWidth={2} />
          <span>{error || success}</span>
        </div>
      )}

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Återställ lösenord</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={forgotPasswordAction}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <SubmitButton className="w-full" pendingText="Resetting...">
              Återställ lösenord
            </SubmitButton>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-center text-muted-foreground w-full">
            Kommer du ihåg ditt lösenord?{" "}
            <Link className="font-medium text-primary hover:underline" href="/sign-in">
              Logga in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ForgotPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

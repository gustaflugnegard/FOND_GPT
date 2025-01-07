"use client";

import { resetPasswordAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InfoIcon } from "lucide-react";


function ResetPasswordContent() {
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
          <CardTitle className="text-2xl font-semibold text-center">Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={resetPasswordAction}>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="New password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                required
              />
            </div>
            <SubmitButton className="w-full" pendingText="Resetting...">
              Reset Password
            </SubmitButton>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-center text-muted-foreground w-full">
            Remembered your password?{" "}
            <Link className="font-medium text-primary hover:underline" href="/sign-in">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

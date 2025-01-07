'use client';

import { forgotPasswordAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const message = searchParams?.get('message') ? JSON.parse(searchParams.get('message')!) : null;

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Reset Password</CardTitle>
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
              Reset Password
            </SubmitButton>
          </form>

          {message && <FormMessage message={message} />}
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

export default function ForgotPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

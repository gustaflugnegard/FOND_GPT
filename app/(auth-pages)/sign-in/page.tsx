'use client';

import { signInAction } from "@/app/actions";
import { signInWithGoogle } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const [lastSignedInMethod, setLastSignedInMethod] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const message = searchParams?.get("message") ? JSON.parse(searchParams.get("message")!) : null;

  // Read cookies on client-side
  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("lastSignedInMethod="));
    if (cookie) {
      setLastSignedInMethod(cookie.split("=")[1]);
    }
  }, []);

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Sign in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" action={signInAction}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  href="/forgot-password"
                >
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Your password"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="relative">
              <SubmitButton className="w-full">
                Sign in
                {lastSignedInMethod === "email" && (
                  <div className="absolute top-1/2 -translate-y-1/2 left-full whitespace-nowrap ml-8 bg-accent px-4 py-1 rounded-md text-xs text-foreground/80">
                    <div className="absolute -left-5 top-0 border-background border-[12px] border-r-accent" />
                    Last used
                  </div>
                )}
              </SubmitButton>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form action={signInWithGoogle} className="relative">
            <SubmitButton variant="outline" className="w-full relative">
              <Image
                src="/google-logo.svg"
                alt="Google logo"
                width={20}
                height={20}
                className="mr-2"
              />
              Sign in with Google
              {lastSignedInMethod === "google" && (
                <div className="absolute top-1/2 -translate-y-1/2 left-full whitespace-nowrap ml-8 bg-accent px-4 py-1 rounded-md text-xs text-foreground/80">
                  <div className="absolute -left-5 top-0 border-background border-[12px] border-r-accent" />
                  Last used
                </div>
              )}
            </SubmitButton>
          </form>

          {message && <FormMessage message={message} />}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-center text-muted-foreground w-full">
            Don't have an account?{" "}
            <Link className="font-medium text-primary hover:underline" href="/sign-up">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

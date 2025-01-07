'use client'

import { signUpAction } from "@/app/actions";
import { signInWithGoogle } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from 'next/navigation';
import { Suspense } from "react";


function SignupContent() {
  const searchParams = useSearchParams();
  const message = searchParams?.get('message') ? JSON.parse(searchParams.get('message')!) : null;

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Sign up</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={signUpAction}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Your password"
                minLength={6}
                required
              />
            </div>
            <SubmitButton className="w-full" pendingText="Signing up...">
              Sign up
            </SubmitButton>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google OAuth Form */}
            <div className="mt-6">
              <form action={signInWithGoogle}>
                <Button type="submit" variant="outline" className="w-full">
                  <Image
                    src="/google-logo.svg"
                    alt="Google logo"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  Sign up with Google
                </Button>
              </form>
            </div>
          </div>

          {message && <FormMessage message={message} />}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-center text-muted-foreground w-full">
            Already have an account?{" "}
            <Link className="font-medium text-primary hover:underline" href="/sign-in">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}

'use client'

import { signUpAction } from "@/app/actions";
import { signInWithGoogle } from "@/app/actions";
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
import { InfoIcon } from "lucide-react";


function SignupContent() {
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

      < Card style={{  }} className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Skapa ett konto</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={signUpAction}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Ditt lösenord"
                minLength={6}
                required
              />
            </div>
            <SubmitButton className="w-full bg-green-500" pendingText="Signing up...">
              Skapa ett konto
            </SubmitButton>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Eller fortsätt med
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
                  Logga in med Google
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-center text-muted-foreground w-full">
            Har du redan ett konto?{" "}
            <Link className="font-medium text-primary hover:underline" href="/sign-in">
              Logga in
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

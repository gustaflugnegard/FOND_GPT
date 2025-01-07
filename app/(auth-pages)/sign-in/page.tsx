"use client";

import { signInAction, signInWithGoogle } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { InfoIcon } from "lucide-react";

function LoginContent() {
  const [lastSignedInMethod, setLastSignedInMethod] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") 
  ? decodeURIComponent(searchParams.get("error")!) 
  : null;

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
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 space-y-4">
    {error && (
      <div className="bg-accent text-sm p-2 px-5 rounded-md text-foreground flex gap-2 items-center justify-center w-auto">
        <InfoIcon size="16" strokeWidth={2} />
        <span>{error}</span>
      </div>
    )}

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Logga in</CardTitle>
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
                <Label htmlFor="password">Lösenord</Label>
                <Link
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  href="/forgot-password"
                >
                  Glömt Lösenord?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Ditt lösenord"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="relative">
              <SubmitButton className="w-full">
                Logga in
                {lastSignedInMethod === "email" && (
                  <div className="absolute top-1/2 -translate-y-1/2 left-full whitespace-nowrap ml-8 bg-accent px-4 py-1 rounded-md text-xs text-foreground/80">
                    <div className="absolute -left-5 top-0 border-background border-[12px] border-r-accent" />
                    Senast använd
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
              <span className="bg-background px-2 text-muted-foreground">Eller fortsätt med</span>
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
              Logga in med Google
              {lastSignedInMethod === "google" && (
                <div className="absolute top-1/2 -translate-y-1/2 left-full whitespace-nowrap ml-8 bg-accent px-4 py-1 rounded-md text-xs text-foreground/80">
                  <div className="absolute -left-5 top-0 border-background border-[12px] border-r-accent" />
                  Senast använd
                </div>
              )}
            </SubmitButton>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-center text-muted-foreground w-full">
            Saknar du ett konto?{" "}
            <Link className="font-medium text-primary hover:underline" href="/sign-up">
              Skapa ett konto
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

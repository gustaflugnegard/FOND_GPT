import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Button } from "@/components/ui/index";
import { createClient } from "@/utils/supabase/server";
import { UserIcon } from "lucide-react";
import { ThemeSwitcher } from "../theme-switcher";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="w-full flex justify-between items-center p-4 border-b">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-4">
        
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold mr-4">
            Svenska Fonder
          </Link>
          
          <ThemeSwitcher />
        </div>
        
        <div className="flex items-center gap-4">
          
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/protected/profile">
                <UserIcon size={20} className="cursor-pointer hover:opacity-80 transition-opacity" />
              </Link>
              <span>Hey, {user.email?.[0].toLocaleUpperCase() ?? ''}!</span>
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm" className="ml-2">
                  Sign out
                </Button>
              </form>


            </div>
          ) : (
            <>
              <Button asChild size="sm" variant="outline">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm" variant="default">
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
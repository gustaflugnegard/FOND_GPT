import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import AskAI from "@/components/AskAI";


export default async function ProtectedPage() {
  const supabase = await createClient();

  // Fetch the user from the 'auth.users' table
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch tokens from the 'profiles' table based on the user ID
  const { data: profileData, error } = await supabase
    .from('profiles')
    .select('tokens')
    .eq('id', user.id)
    .single(); // Use .single() since we expect only one row

  if (error) {
    console.error("Error fetching profile data:", error);
  }

  return (
    <div className="flex-1 w-full flex flex-col ">
      <div className="w-full flex justify-center">
        <div className="bg-accent text-sm p-2 px-5 rounded-md text-foreground flex gap-2 items-center justify-center w-auto mt-2">
          <InfoIcon size="16" strokeWidth={2} />
          <span>Du har</span>
          <span className="font-bold">{profileData?.tokens}</span> 
          <span>tokens kvar att använda</span>        
        </div>
      </div>
      <main className="p-2">
        < AskAI />       
      </main>
    </div>
  );
}

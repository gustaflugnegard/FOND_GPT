import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import AskAI from "@/components/AskAI";
import AssetChartContainer from "@/components/charts/containers/scattercontainer";
import AssetCountContainer from "@/components/charts/containers/forandringcontainer";
import SectorChartContainer from "@/components/charts/containers/branchcontainer";
import MapChartContainer from "@/components/charts/containers/mapchartcontainer";
import LineChartContainer from "@/components/charts/containers/assetchartcontainer";
import AvgiftChartContainer from "@/components/charts/containers/avgiftcontainer";


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
          <span>Testa våran Fondbot! Du har</span>
          <span className="font-bold">{profileData?.tokens}</span> 
          <span>tokens kvar att använda</span>        
        </div>
      </div>
      <main className="mt-2">
        <AskAI />
        
        <div className="flex flex-col lg:flex-row lg:flex-wrap justify-between max-w-5xl mx-auto w-full">
          <div className="w-full lg:w-[calc(50%-1rem)]">
            <AssetChartContainer />
          </div>
          <div className="w-full lg:w-[calc(50%-1rem)]">
            <AssetCountContainer />
          </div>
        </div>

        < MapChartContainer />

        <div className="flex flex-col lg:flex-row lg:flex-wrap justify-between max-w-5xl mx-auto w-full">
          <div className="w-full lg:w-[calc(50%-1rem)]">
            <SectorChartContainer />
          </div>
          <div className="w-full lg:w-[calc(50%-1rem)]">
            <AvgiftChartContainer />
          </div>
        </div>

        < LineChartContainer />

      </main>
    </div>
  );
}

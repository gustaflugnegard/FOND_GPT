import AskAInonfunc from "@/components/landing_wo_auth/non_func_askAi";

import AssetChartContainer from "@/components/charts/containers/scattercontainer";

import AssetCountContainer from "@/components/charts/containers/forandringcontainer";

import SectorChartContainer from "@/components/charts/containers/branchcontainer";

import MapChartContainer from "@/components/charts/containers/mapchartcontainer";

import LineChartContainer from "@/components/charts/containers/assetchartcontainer";

import AvgiftChartContainer from "@/components/charts/containers/avgiftcontainer";


export default async function Index() {
  return (
    <>
      <main className="mt-2">
        <AskAInonfunc />
        
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
    </>
  );
}


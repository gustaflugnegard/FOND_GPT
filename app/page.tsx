import AskAInonfunc from "@/components/landing_wo_auth/non_func_askAi";

import AssetChartContainer from "@/components/charts/containers/scattercontainer";

import AssetCountContainer from "@/components/charts/containers/forandringcontainer";

import SectorChartContainer from "@/components/charts/containers/branchcontainer";

import MapChartContainer from "@/components/charts/containers/mapchartcontainer";

import LineChartContainer from "@/components/charts/containers/assetchartcontainer";

import AvgiftChartContainer from "@/components/charts/containers/avgiftcontainer";

import FeeImpactChart from "@/components/charts/LineChart_avgift";

export default async function Index() {
  return (
    <>
      <main className="mt-2">
        <AskAInonfunc />
        <div className="flex justify-between space-x-4 sm:max-w-4xl mx-auto w-full">
          <AssetChartContainer />
          <AssetCountContainer />
        </div>

        < MapChartContainer />

        <div className="flex justify-between space-x-4 sm:max-w-4xl mx-auto w-full">
          <SectorChartContainer />
          <AvgiftChartContainer />
        </div>

        < LineChartContainer />

      </main>
    </>
  );
}


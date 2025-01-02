"use client"

import { useState } from "react"

import BranschCountChart from "@/components/charts/BranschBarchart";
import BranschCountTreemap from "@/components/charts/BranschTreemap";

export default function SectorChartContainer() {
    const [showChart, setChart] = useState(true);

    return (
        <div className="max-w-full sm:max-w-5xl mx-auto w-full p-2 border rounded-md mt-2 shadow-md sm:p-4 sm:rounded-lg"> 
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold ">Vilka sektorer investerar Fonderna i?</h1>
                    <p className="mt-1 text-sm">Byt mellan trädkarta och stapeldiagram</p>
                </div>
                <label className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={showChart}
                            onChange={() => setChart(!showChart)}
                        />
                        <div className="toggle-bg w-14 h-8 rounded-full shadow-inner" style={{ backgroundColor: '#374151' }} />
                        <div
                            className={`toggle-dot absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300 ease-in-out ${showChart ? "translate-x-6" : ""
                                }`}
                        />
                    </div>
                </label>
            </div>
            <div className="border-t mt-4 pt-4 min-h-[470px] flex items-center justify-center">
                {showChart ? <BranschCountTreemap /> : <BranschCountChart />}
            </div>
        </div>
    );
}
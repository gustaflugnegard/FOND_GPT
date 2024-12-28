"use client"

import { useState } from "react"

import AvgiftBarChart from "../AvgiftBarchart";
import FeeImpactChart from "../LineChart_avgift";

export default function AvgiftChartContainer() {
    const [showChart, setChart] = useState(true);

    return (
        <div className="sm:max-w-4xl mx-auto w-full p-2 border rounded-md mt-2">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold ">Hur påverkar fondavgiften avkastningen?</h1>
                    <p className="mt-1 text-sm ">Byt mellan linje och stapeldiagram</p>
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
            <div className="border-t border-gray-700 mt-4 pt-4 min-h-[400px] flex items-center justify-center">
                {showChart ? <FeeImpactChart /> : <AvgiftBarChart />}
            </div>
        </div>
    );
}
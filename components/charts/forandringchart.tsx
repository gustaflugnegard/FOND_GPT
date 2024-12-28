"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import { getForandring } from "@/lib/tempdata";

const quarters = [
    "Q4 2019", "Q1 2020", "Q2 2020", "Q3 2020", "Q4 2020",
    "Q1 2021", "Q2 2021", "Q3 2021", "Q4 2021",
    "Q1 2022", "Q2 2022", "Q3 2022", "Q4 2022",
    "Q1 2023", "Q2 2023", "Q3 2023", "Q4 2023", "Q1 2024"
];

export default function Forandringchart() {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [originalSeries, setOriginalSeries] = useState([]);
    const [currentQuarter, setCurrentQuarter] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const fetchData = async () => {
        const data = await getForandring();

        // Create an object to group data by Quarter
        const groupedData = data.reduce((acc, item) => {
            const quarter = item.quarter;

            if (!acc[quarter]) {
                acc[quarter] = [];
            }

            // Store both ISIN and instrument_name
            acc[quarter].push({
                isin: item["ISIN kod"],
                name: item.instrument_name, // Use instrument_name for display
                value: item.count || 0,
                change: item.count_change || 0,
            });

            return acc;
        }, {});

        // Format the data and take top 10
        const formattedData = Object.entries(groupedData).map(([quarter, data]) => ({
            name: quarter,
            data: data
                .sort((a, b) => d3.descending(a.value, b.value))
                .slice(0, 10), // Take only top 10
        }));

        setOriginalSeries(formattedData);
        setCurrentQuarter(formattedData.length - 1);
        updateChart(formattedData[formattedData.length - 1]);
    };

    const updateChart = (data) => {
        const svg = d3.select(svgRef.current);

        const width = 400;
        const height = 250;

        svg.attr("width", width).attr("height", height);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data.data, d => d.value)])
            .range([0, width]);

        const y = d3.scaleBand()
            .domain(data.data.map(d => d.name))
            .range([0, height])
            .padding(0.1);

        // Replace the existing bar fill logic with this:
        const getBarColor = (change) => {
            // Handle null, undefined, or string cases by converting to number
            const numChange = Number(change);

            if (Math.abs(numChange) < 0.0001) return "#008080";  // Yellow for effectively zero
            if (numChange < 0) return "#dd6262";  // Red for negative
            return "#3ab371";  // Green for positive
        };

        // Then in the bars selection, update the fill attribute:
        const bars = svg.selectAll("rect")
            .data(data.data, d => d.isin)
            .join(
                enter => enter.append("rect")
                    .attr("x", 0)
                    .attr("y", d => y(d.name))
                    .attr("width", 0)
                    .attr("height", y.bandwidth())
                    .attr("rx", 4)
                    .attr("ry", 4)
                    .attr("fill", d => getBarColor(d.change)) // Use change-based color
                    .transition()
                    .attr("width", d => x(d.value)),

                update => update.transition()
                    .attr("y", d => y(d.name))
                    .attr("width", d => x(d.value))
                    .attr("fill", d => getBarColor(d.change)), // Update color on transition

                exit => exit.transition()
                    .attr("width", 0)
                    .remove()
            );

        svg.selectAll("text")
            .data(data.data, d => d.isin)
            .join(
                enter => enter.append("text")
                    .attr("x", 5)
                    .attr("y", d => y(d.name) + y.bandwidth() / 2)
                    .attr("dy", ".35em")
                    .text(d => `${d.name} | ${d.value} | ${d.change}`)
                    .attr("fill", "#ffffff")
                    .style("font-size", "12px"),

                update => update.transition()
                    .attr("y", d => y(d.name) + y.bandwidth() / 2)
                    .text(d => `${d.name} | ${d.value} | ${d.change}`), // Now matches enter selection

                exit => exit.remove()
            );

        const tooltip = d3.select("#tooltip");
        bars.on("mouseover", function (event, d) {
            tooltip.transition().style("opacity", 1);
            tooltip.html(`${d.name} | ${d.value} | ${d.change}`)  // Shows "Instrument Name | Count | ISIN"
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");

            d3.select(this)
                .attr("stroke", "#1f2937")
                .attr("stroke-width", 3);
        })
            .on("mouseout", function () {
                tooltip.transition().style("opacity", 0);
                d3.select(this).attr("stroke", null);
            });
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (originalSeries.length > 0) {
            updateChart(originalSeries[currentQuarter]);
        }
    }, [currentQuarter, originalSeries]);

    useEffect(() => {
        let intervalId;
        if (isPlaying) {
            intervalId = setInterval(() => {
                setCurrentQuarter((prev) => (prev + 1) % quarters.length);
            }, 1000);
        }
        return () => clearInterval(intervalId);
    }, [isPlaying]);

    return (
        <div>
            <div className="p-3 w-full max-w-3xl">
                <svg ref={svgRef} />

                <input
                    type="range"
                    min="0"
                    max={quarters.length - 1}
                    value={currentQuarter}
                    onChange={(e) => {
                        const newQuarter = parseInt(e.target.value, 10);
                        updateChart(originalSeries[newQuarter]);
                        setCurrentQuarter(newQuarter);
                    }}
                    className="w-full mb-4 rounded-md"
                />

                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        style={{
                            backgroundColor: isPlaying ? '#374151' : '#4B5563',
                        }}
                        className="px-4 py-2 text-white rounded-md"
                    >
                        {isPlaying ? "Pause" : "Play"}
                    </button>
                    <p className="text-white">{quarters[currentQuarter]}</p>
                </div>

                <div
                    id="tooltip"
                    style={{
                        position: "absolute",
                        backgroundColor: "#1f2937",
                        color: "#f8f8f2",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        pointerEvents: "none",
                        opacity: 0,
                        transition: "opacity 0.3s ease"
                    }}
                ></div>
            </div>
        </div>
    );
}

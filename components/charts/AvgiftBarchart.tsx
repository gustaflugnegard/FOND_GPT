"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getavgifterCount } from "@/lib/tempdata";

interface CountData {
    isin: string;
    fond: string;
    avgift: number;
}

export default function AvgiftBarChart() {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [dataSeries, setDataSeries] = useState<CountData[]>([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const resizeTimeout = useRef<NodeJS.Timeout | null>(null);

    const updateDimensions = () => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.getBoundingClientRect().width;
            const containerHeight = Math.max(300, dataSeries.length * 35);
            setDimensions({ width: containerWidth, height: containerHeight });
        }
    };

    useEffect(() => {
        updateDimensions();
        const handleResize = () => {
            if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
            resizeTimeout.current = setTimeout(updateDimensions, 100);
        };
        window.addEventListener("resize", handleResize);
        return () => {
            if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
            window.removeEventListener("resize", handleResize);
        };
    }, [dataSeries]);

    const fetchData = async () => {
        const data = await getavgifterCount();
        const slicedData = data.slice(0, 10); 
        setDataSeries(slicedData);
        console.log("Fetched data:", data);
    };

    const drawChart = () => {
        if (!dataSeries.length || !svgRef.current || !containerRef.current) return;
    
        // Log the data to see the full structure
        dataSeries.forEach(d => {
            console.log("Checking Data:", d);
        });
    
        d3.select(svgRef.current).selectAll("*").remove();
    
        const margin = { top: 0, right: 20, bottom: 0, left: 20 };
        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;
    
        const svg = d3.select(svgRef.current)
            .attr("width", dimensions.width)
            .attr("height", dimensions.height);
    
        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        // Ensure the x scale is correctly proportional to the data
        const x = d3.scaleLinear()
            .domain([0, d3.max(dataSeries, d => d.avgift) || 0]) // Max count value to scale
            .range([0, width]); // Range is the chart's width
    
        // Y scale based on the first fund name
        const y = d3.scaleBand()
            .domain(dataSeries.map(d => d.isin))
            .range([0, height])
            .padding(0.1); // Space between bars
    
        //const neonColors = [
        //    '#1b7895',
        //    '#eeb5eb',
        //    '#ffd864',
        //    '#61c2a2',
        //    '#fff'
        //];
    
        //const colorScale = d3.scaleOrdinal()
            //.domain(dataSeries.map(d => d.sektorer || 'No ISIN')) // Handle missing ISIN_kod
            //.range(neonColors);

        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain(dataSeries.map(d => d.isin))
            .range(d3.range(0, 1, 1 / dataSeries.length).map(d => d3.rgb(0, 255, 255).darker(1 + d * 2)));
    
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "rgba(0, 0, 0, 0.9)")
            .style("color", "white")
            .style("padding", "8px")
            .style("border-radius", "8px")
            .style("border", "1px solid rgba(255, 255, 255, 0.2)")
            .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1), 0 0 8px rgba(0, 255, 255, 0.2)")
            .style("font-size", "12px")
            .style("backdrop-filter", "blur(4px)")
            .style("z-index", "1000")
            .style("pointer-events", "none")
            .style("transition", "opacity 0.2s ease-in-out");
    
            chart.selectAll(".bar")
            .data(dataSeries)
            .join("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => y(d.isin) || 0)
            .attr("height", y.bandwidth()) // Ensure bars have height according to the y scale
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("fill", d => colorScale(d.isin || 'No ISIN'))
            .style("opacity", 0.9)
            // Do not set width here, allow the transition to handle it
            .on("mouseover", (event, d) => {
                tooltip
                    .html(`
                        <div class="font-bold mb-1">${d.fond}</div>
                        <div class="text-cyan-300">Avgift: ${d.avgift.toFixed(1)}%</div>
                        <div class="text-xs mt-1 text-gray-300">${d.isin}</div>
                      `)

                    .style("visibility", "visible");
        
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`);
        
                d3.select(event.target)
                    .transition()
                    .duration(200)
                    .style("opacity", 1)
                    .attr("stroke", "#1f2937")
                    .attr("stroke-width", 3);
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`);
            })
            .on("mouseout", (event) => {
                tooltip.style("visibility", "hidden");
                d3.select(event.target)
                    .transition()
                    .duration(200)
                    .style("opacity", 0.9)
                    .attr("stroke", "none");
            })
            // Apply transition only here
            .transition()
            .duration(800)
            .attr("width", d => x(d.avgift));  // Transition from 0 to final width
        
    
        chart.selectAll(".label")
            .data(dataSeries)
            .join("text")
            .attr("class", "label")
            .attr("x", 5)
            .attr("y", d => {
                const fondName = d.isin || 'No Name'; // Safely access the first name or fallback
                return (y(fondName) || 0) + y.bandwidth() / 2;  // Use fallback if y(fondName) is undefined
            })
            .attr("dy", ".35em")
            .attr("fill", "#ffffff")
            .style("font-size", "12px")
            .style("opacity", 0)
            .text(d => `${d.fond || 'No ISIN'}: ${d.avgift.toFixed(2)}%`)
            .transition()
            .duration(800)
            .style("opacity", 1);
    };
    
    
    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (dataSeries.length > 0) {
            drawChart();
        }
    }, [dataSeries, dimensions]);

    return (
        <div ref={containerRef} className="sm:max-w-4xl mx-auto w-full">
          <svg
            ref={svgRef}
            className="w-full"
            style={{ minWidth: "400px" }}
          />

        </div>
      );
}

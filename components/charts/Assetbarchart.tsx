"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getAssetCount } from "@/lib/tempdata";

interface CountData {
    isin_kod: string;
    count: number;
    fondnames: string[];
}

export default function AssetCountChart() {
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
        const data = await getAssetCount();
        const slicedData = data.slice(0, 10); 
        setDataSeries(slicedData);
    };

    const drawChart = () => {
        if (!dataSeries.length || !svgRef.current || !containerRef.current) return;

    
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
            .domain([0, d3.max(dataSeries, d => d.count) || 0]) // Max count value to scale
            .range([0, width]); // Range is the chart's width
    
        // Y scale based on the first fund name
        const y = d3.scaleBand()
        .domain(
            dataSeries.map(d => {
                if (d.fondnames && d.fondnames.length > 0) {
                    return d.fondnames[0]; // Use the first fund name
                }
                return 'No Name'; // Fallback if fondnames is undefined or empty
            }).filter(d => d !== undefined) // Remove any undefined values if present
        )
        .range([0, height])
        .padding(0.1); // Space between bars
    
    
    
        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain(dataSeries.map(d => d.isin_kod))
            .range(d3.range(0, 1, 1 / dataSeries.length).map(d => d3.rgb(0, 255, 255).darker(1 + d * 2)));
    
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "hsl(var(--inverse_foreground))")
            .style("color", "hsl(var(--foreground))")
            .style("padding", "8px")
            .style("border-radius", "8px")
            .style("border", `1px solid hsl(var(--foreground) / 0.2)`)
            .style("box-shadow", "0 4px 6px hsl(var(--foreground) / 0.1), 0 0 8px hsl(var(--custom_cyan) / 0.3)")
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
            .attr("y", (d: CountData): number => {
                return y(d.fondnames?.[0] || 'No Name') as number;
            })            
            .attr("height", y.bandwidth()) // Ensure bars have height according to the y scale
            .attr("rx", 4)
            .attr("ry", 4)
            // Ensure that colorScale returns a valid color string
            .attr("fill", (d: CountData): string => {
                const color = colorScale(d.isin_kod || 'No ISIN');
                return (color ?? 'gray') as string;
            })
            .style("opacity", 0.9)
            // Do not set width here, allow the transition to handle it
            .on("mouseover", (event, d) => {
                tooltip
                    .html(`
                        <div class="font-bold mb-1">${d.fondnames[0]}</div>
                        <div style="color: hsl(var(--custom_cyan))">Antal: ${d.count.toLocaleString()}</div>
                        <div style="color: hsl(var(--custom_cyan))">Namn: <br/>
                        ${d.fondnames && d.fondnames.length > 0 ? d.fondnames.slice(0, 3).map(name => `- ${name}`).join("<br/>") : 'No Name'}</div>
                        <div style="color:hsl(var(--muted-foreground))" class="text-xs mt-1">${d.isin_kod}</div>
                      `)
                    .style("visibility", "visible");
        
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`);
        
                d3.select(event.target)
                    .transition()
                    .duration(200)
                    .style("opacity", 1)
                    .attr("stroke", "hsl(var(--background)")
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
            .duration(700)
            .attr("width", d => x(d.count));  // Transition from 0 to final width
        
    
        chart.selectAll(".label")
            .data(dataSeries)
            .join("text")
            .attr("class", "label")
            .attr("x", 5)
            .attr("y", d => {
                const fondName = d.fondnames?.[0] || 'No Name'; // Safely access the first name or fallback
                return (y(fondName) || 0) + y.bandwidth() / 2;  // Use fallback if y(fondName) is undefined
            })
            .attr("dy", ".35em")
            .attr("fill", "hsl(var(--text)")
            .style("font-size", "12px")
            .style("opacity", 0)
            .text(d => `${d.fondnames[0] || 'No ISIN'} i ${d.count.toLocaleString()} fonder`)
            .transition()
            .duration(700)
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

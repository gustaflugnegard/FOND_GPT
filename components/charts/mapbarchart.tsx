"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getlanderCount } from "@/lib/tempdata";

interface CountData {
    land_namn: string;
    count: number;
    percentage: number;
}

export default function MapBarChart() {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [dataSeries, setDataSeries] = useState<CountData[]>([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isInitialLoad, setIsInitialLoad] = useState(true);


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
        const data = await getlanderCount();
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
        const x = d3.scaleLog()
            .domain([1, d3.max(dataSeries, d => d.percentage) || 1])
            .range([0, width]); // Use width instead of dimensions.width to account for margins
    
        // Y scale based on the first fund name
        const y = d3.scaleBand()
            .domain(dataSeries.map(d => d.land_namn))
            .range([0, height])
            .padding(0.1); // Space between bars
    
        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain(dataSeries.map(d => d.land_namn))
            .range(d3.range(0, 1, 1 / dataSeries.length).map(d => d3.rgb(0, 255, 255).darker(1 + d * 2)));

                // Improved text truncation function with more precise calculations
        const truncateText = (text: string, barWidth: number, fontSize: number = 12) => {
            // If bar is too small to show any text (e.g., less than 30px), return empty string
            if (barWidth < 30) return '';
            
            const textElement = chart.append("text")
                .attr("visibility", "hidden")
                .style("font-size", `${fontSize}px`)
                .text(text);
            
            const textWidth = textElement.node()?.getComputedTextLength() || 0;
            textElement.remove();
            
            if (textWidth > barWidth - 20) {
                const charactersPerPixel = text.length / textWidth;
                const maxChars = Math.floor((barWidth - 20) * charactersPerPixel);
                // If we can't fit at least 3 characters plus ellipsis, return empty string
                if (maxChars < 4) return '';
                return text.slice(0, maxChars - 3) + "...";
            }
            return text;
        };

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

                    // Create group for each bar and its label
        const barGroups = chart.selectAll(".bar-group")
        .data(dataSeries)
        .join("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(0,${y(d.land_namn) || 0})`);

        // Add bars
        const bars = barGroups.append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", y.bandwidth())
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("fill", (d: CountData): string => {
                const color = colorScale(d.land_namn || 'No ISIN');
                return (color ?? 'gray') as string;
            })                
            .style("opacity", 0.9)
            .attr("width", 0)
            .on("mouseover", (event, d) => {
                tooltip
                    .html(`
                        <div class="font-bold mb-1">${d.land_namn}</div>
                        <div style="color: hsl(var(--custom_cyan))">Andel: ${d.percentage.toFixed(2)}%</div>
                        <div style="color: hsl(var(--custom_cyan))">Antal: ${d.count.toLocaleString()}</div>

                    `)
                    .style("visibility", "visible");

                tooltip
                    .style("left", `${event.clientX + window.scrollX + 10}px`)
                    .style("top", `${event.clientY + window.scrollY - 10}px`);

                d3.select(event.target)
                    .transition()
                    .duration(200)
                    .style("opacity", 1)
                    .attr("stroke", "hsl(var(--background)")
                    .attr("stroke-width", 4);
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("left", `${event.clientX + window.scrollX + 10}px`)
                    .style("top", `${event.clientY + window.scrollY - 10}px`);
            })
            .on("mouseout", (event) => {
                tooltip.style("visibility", "hidden");
                d3.select(event.target)
                    .transition()
                    .duration(200)
                    .style("opacity", 0.9)
                    .attr("stroke", "none");
            });
    
        // Add labels with truncation
        const labels = barGroups.append("text")
            .attr("class", "label")
            .attr("x", 10)
            .attr("y", y.bandwidth() / 2)
            .attr("dy", ".35em")
            .attr("fill", "hsl(var(--text))")
            .style("font-size", "12px")

            .style("opacity", 0);

        // Animate bars and update labels simultaneously
        bars.transition()
            .duration(700)
            .attr("width", d => x(d.percentage)) // `x` should be your log scale
            .on("start", function(d) {
                const barWidth = x(d.percentage); // `x` is the log scale here
                const labelText = `${d.land_namn === "No Country" ? "" : d.land_namn}: ${d.percentage.toFixed(2)}%`;
                const truncatedText = truncateText(labelText, barWidth);
        
                d3.select(this.parentNode as Element)                    
                    .select("text")
                    .text(truncatedText)
                    .transition()
                    .duration(700)
                    .style("opacity", 1);
        });
    }
    
    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (dataSeries.length > 0) {
            if (isInitialLoad) {
                const timeoutId = setTimeout(() => {
                    drawChart();
                    setIsInitialLoad(false); // Ensure the pause happens only once
                }, 300); // 500ms pause for the first load

                return () => clearTimeout(timeoutId);
            } else {
                drawChart(); // No pause on subsequent updates
            }
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

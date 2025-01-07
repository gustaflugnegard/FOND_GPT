"use client"
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getScatter } from "@/lib/tempdata";

interface ScatterData {
    stdavvikelse: number;
    oneyear: number;
    bolag: string;
    fond: string;
}

export default function Fondbarchart() {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [dataSeries, setDataSeries] = useState<ScatterData[]>([]);
    const [dimensions, setDimensions] = useState({
        width: 0,
        height: 0,
    });
    const [isInitialLoad, setIsInitialLoad] = useState(true);


    const resizeTimeout = useRef<NodeJS.Timeout | null>(null);

    const updateDimensions = () => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.getBoundingClientRect().width;
            // Set a fixed height or calculate based on data length
            const containerHeight = Math.max(300, (dataSeries.length * 35));
            setDimensions({
                width: containerWidth,
                height: containerHeight,
            });
        }
    };

    useEffect(() => {
        updateDimensions();

        const handleResize = () => {
            if (resizeTimeout.current) {
                clearTimeout(resizeTimeout.current);
            }
            resizeTimeout.current = setTimeout(() => {
                updateDimensions();
            }, 100);
        };

        window.addEventListener("resize", handleResize);
        return () => {
            if (resizeTimeout.current) {
                clearTimeout(resizeTimeout.current);
            }
            window.removeEventListener("resize", handleResize);
        };
    }, [dataSeries.length]); // Add dataSeries.length as dependency

    const fetchData = async () => {
        const data = await getScatter();

        const transformedData = data
            .map((d: any) => ({
                stdavvikelse: Number(d.stdavvikelse),
                oneyear: Number(d.oneyear),
                bolag: d.ISIN,
                fond: d.Fondnamn
            }))
            .filter(d => !isNaN(d.stdavvikelse) && !isNaN(d.oneyear) && d.oneyear < 200)
            .sort((a, b) => b.oneyear - a.oneyear)
            .slice(0, 10);

        setDataSeries(transformedData);
        setIsInitialLoad(true); // Mark as initial load
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

        const x = d3.scaleLinear()
            .domain([0, d3.max(dataSeries, d => d.oneyear) || 0])
            .range([0, width]);

        const y = d3.scaleBand()
            .domain(dataSeries.map(d => d.fond))
            .range([0, height])
            .padding(0.1);

        const colorScale = d3.scaleOrdinal()
            .domain(dataSeries.map(d => d.fond))
            .range(d3.range(0, 1, 1 / dataSeries.length).map(d => d3.rgb(0, 255, 255).darker(1 + d * 2)));

        // Improved text truncation function with more precise calculations
        const truncateText = (text: string, barWidth: number, fontSize: number = 12) => {
            const textElement = chart.append("text")
                .attr("visibility", "hidden")
                .style("font-size", `${fontSize}px`)
                .text(text);
            
            const textWidth = textElement.node()?.getComputedTextLength() || 0;
            textElement.remove();
            
            if (textWidth > barWidth - 20) { // 20px total padding (10px on each side)
                const charactersPerPixel = text.length / textWidth;
                const maxChars = Math.floor((barWidth - 20) * charactersPerPixel);
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
            .attr("transform", d => `translate(0,${y(d.fond) || 0})`);

        // Add bars
        const bars = barGroups.append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", y.bandwidth())
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("fill", (d: ScatterData): string => {
                const color = colorScale(d.fond || 'No ISIN');
                return (color ?? 'gray') as string;
            })             
            .style("opacity", 0.9)
            .attr("width", 0)
            .on("mouseover", (event, d) => {
                tooltip
                    .html(`
                        <div class="font-bold mb-1">${d.fond}</div>
                        <div style="color: hsl(var(--custom_cyan))">Avkastning: ${d.oneyear.toFixed(1)}%</div>
                        <div style="color:hsl(var(--muted-foreground))" class="text-xs mt-1">${d.bolag}</div>
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
            .attr("width", d => x(d.oneyear))
            .on("start", function(d) {
                const barWidth = x(d.oneyear);
                const labelText = `${d.fond === "Unknown Asset" ? d.bolag : d.fond}: ${d.oneyear.toLocaleString()}%`;
                const truncatedText = truncateText(labelText, barWidth);
                
                d3.select(this.parentNode as Element)                    
                    .select("text")
                    .text(truncatedText)
                    .transition()
                    .duration(700)
                    .style("opacity", 1);
            });


    };
    
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
            <div className="w-full h-full">
                <svg ref={svgRef} 
                className="w-full h-full" 
                style={{ minWidth: "400px" }}

                />
            </div>
        </div>
    );
}
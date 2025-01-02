import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getBranschCount } from "@/lib/tempdata";


interface CountData {
    sektorer: string;
    count: number;
    percentage: number;
}

export default function BranschCountChart() {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [dataSeries, setDataSeries] = useState<CountData[]>([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    
    const resizeTimeout = useRef<NodeJS.Timeout | null>(null);

    const updateDimensions = () => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.getBoundingClientRect().width;
            const containerHeight = Math.min(Math.max(containerWidth * 0.9, 450), 350);
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
        const data = await getBranschCount();
        const slicedData = data.slice(0, 15);
        setDataSeries(slicedData);
    };

    // Function to truncate text if needed
    const truncateText = (text: string, width: number, fontSize: number) => {
        // Approximate character width (varies by font)
        const charWidth = fontSize * 0.6;
        const maxChars = Math.floor(width / charWidth);
        
        if (text.length * charWidth > width) {
            // Leave room for ellipsis
            return text.slice(0, maxChars - 2) + "...";
        }
        return text;
    };

    const drawChart = () => {
        if (!dataSeries.length || !svgRef.current || !containerRef.current) return;

        const root = d3.hierarchy({
            name: "root",
            children: dataSeries.map(d => ({
                name: d.sektorer,
                value: d.percentage
            }))
        }).sum(d => d.value);

        d3.treemap()
            .size([dimensions.width, dimensions.height])
            .padding(2)
            .round(true)(root);

        const color = d3.scaleOrdinal()
            .domain(dataSeries.map(d => d.sektorer))
            .range(d3.range(0, 1, 1 / dataSeries.length)
                .map(d => d3.rgb(0, 255, 255).darker(1 + d * 2)));

        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("width", dimensions.width)
            .attr("height", dimensions.height);

        // Create cells
        const cells = svg.selectAll("g")
            .data(root.leaves())
            .join("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        // Add rectangles with animation
        cells.append("rect")
            .attr("width", 0)
            .attr("height", 0)
            .attr("fill", d => color(d.data.name))
            .attr("rx", 4)
            .attr("ry", 4)
            .style("opacity", 0.9)
            .transition()
            .duration(700)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0);

        // Add text with improved sizing and truncation
        cells.each(function(d: any) {
            const cell = d3.select(this);
            const rectWidth = d.x1 - d.x0;
            const rectHeight = d.y1 - d.y0;
            
            // Calculate base font size based on rectangle dimensions
            const baseFontSize = Math.min(
                rectWidth / 8,
                rectHeight / 4,
                Math.sqrt(rectWidth * rectHeight) / 8
            );
            
            // Clamp font sizes
            const nameFontSize = Math.min(Math.max(baseFontSize, 10), 16);
            const valueFontSize = Math.min(Math.max(baseFontSize * 0.9, 9), 14);

            // Only show text if the rectangle is big enough
            if (rectWidth > 40 && rectHeight > 40) {
                // Name text
                const truncatedName = truncateText(d.data.name, rectWidth - 8, nameFontSize);
                cell.append("text")
                    .attr("class", "name")
                    .attr("x", 4)
                    .attr("y", rectHeight / 2 - nameFontSize)
                    .attr("font-size", `${nameFontSize}px`)
                    .attr("fill", "hsl(var(--text))")
                    .style("font-weight", "500")
                    .style("opacity", 0)
                    .text(truncatedName)
                    .transition()
                    .duration(700)
                    .style("opacity", 1);

                // Percentage text
                cell.append("text")
                    .attr("class", "value")
                    .attr("x", 4)
                    .attr("y", rectHeight / 2 + valueFontSize/2)
                    .attr("font-size", `${valueFontSize}px`)
                    .attr("fill", "hsl(var(--text))")
                    .style("opacity", 0)
                    .text(`${d.data.value.toFixed(1)}%`)
                    .transition()
                    .duration(700)
                    .style("opacity", 1);
            }
        });

        // Tooltip
        const tooltip = d3.select(containerRef.current)
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

        // Hover interactions
        cells.on("mouseover", function(event, d: any) {
                d3.select(this).select("rect")
                    .transition()
                    .duration(200)
                    .style("opacity", 1)
                    .attr("stroke", "hsl(var(--background)")
                    .attr("stroke-width", 3);

                tooltip.style("visibility", "visible")
                    .html(`
                        <div class="font-bold mb-1">${d.data.name}</div>
                        <div style="color: hsl(var(--custom_cyan))">Andel: ${d.data.value.toFixed(2)}%</div>
                      `)
            })
            .on("mousemove", (event) => {
                tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 10}px`);
            })
            .on("mouseout", function() {
                d3.select(this).select("rect")
                    .transition()
                    .duration(200)
                    .style("opacity", 0.9)
                    .attr("stroke", "none");

                tooltip.style("visibility", "hidden");
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
            <svg
                ref={svgRef}
                className="w-full"
                style={{ minWidth: "400px" }}
            />
        </div>
    );
}
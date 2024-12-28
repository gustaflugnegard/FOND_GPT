"use client"

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import mapContent from "@/public/custom.geo.json";
import { getlanderCount } from "@/lib/tempdata";

export default function Map() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const gRef = useRef<SVGGElement | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [dataSeries, setDataSeries] = useState<any[]>([]);
    const [tooltipData, setTooltipData] = useState<{ show: boolean; content: string; x: number; y: number }>({
        show: false,
        content: "",
        x: 0,
        y: 0
    });

    const resizeTimeout = useRef<NodeJS.Timeout | null>(null);

    const updateDimensions = () => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.getBoundingClientRect().width;
            const aspectRatio = 0.57;
            const minWidth = 400;
            const widthScale = containerWidth < 768 ? 0.95 : 0.95;
            const width = Math.max(minWidth, containerWidth * widthScale);
            const height = width * aspectRatio;
            setDimensions({ width, height });
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

        window.addEventListener('resize', handleResize);
        return () => {
            if (resizeTimeout.current) {
                clearTimeout(resizeTimeout.current);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const fetchData = async () => {
        try {
            const data = await getlanderCount();
            const slicedData = data.slice(0, 200);
            setDataSeries(slicedData);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const drawMap = () => {
        if (!dimensions.width || !dimensions.height || !svgRef.current || !dataSeries.length) return;

        const svgElement = d3.select(svgRef.current as SVGSVGElement);
        svgElement.selectAll("*").remove();
        svgElement.attr("width", dimensions.width).attr("height", dimensions.height * 0.9);

        const g = svgElement.append("g");
        gRef.current = g.node();

        const projection = d3.geoEqualEarth().fitSize([dimensions.width, dimensions.height], mapContent);
        const path = d3.geoPath().projection(projection);

        const maxCount = d3.max(dataSeries.map(d => d.count)) || 1;
        const colorScale = d3.scaleSequential().domain([0, Math.log(maxCount)]).interpolator(d3.interpolateHcl("#008080", "cyan"));

        const baseWidth = 1400;
        const minScale = 1;
        const maxScale = 3;

        const calculateScale = (width: number) => {
            const normalizedWidth = Math.min(Math.max(width, 300), baseWidth);
            const scaleRange = maxScale - minScale;
            const widthRatio = (baseWidth - normalizedWidth) / (baseWidth - 300);
            return minScale + (scaleRange * widthRatio);
        };

        const initialScale = calculateScale(dimensions.width);
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 4;
        const initialTransform = d3.zoomIdentity
            .translate(centerX, centerY)
            .scale(initialScale)
            .translate(-centerX, -centerY);

        const zoom = d3.zoom()
            .scaleExtent([minScale, maxScale * 2])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
                g.selectAll("path").attr("stroke-width", 1 / event.transform.k);
            });

        svgElement.call(zoom).call(zoom.transform, initialTransform);

        g.selectAll("path")
            .data(mapContent.features)
            .join("path")
            .attr("d", path)
            .attr("fill", (d) => {
                const landkod = d.properties.iso_a2.toLowerCase();
                const countryData = dataSeries.find(item => item.lander === landkod);
                const count = countryData ? countryData.count : 0;
                return count === 0 ? "grey" : colorScale(Math.log(count));
            })
            .attr("stroke", "#1f2937")
            .attr("stroke-width", 1 / initialScale)
            .on("mousemove", (event, d) => {
                const landkod = d.properties.iso_a2.toLowerCase();
                const countryData = dataSeries.find(item => item.lander === landkod);
                
                if (!countryData) return;
                
                const { count, land_namn, percentage } = countryData;
                const tooltipContent = `${land_namn}: ${count.toLocaleString()} (${percentage.toFixed(2)}%)`;
                
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;

                // Calculate position considering scroll
                const x = event.pageX - rect.left - window.scrollX;
                const y = event.pageY - rect.top - window.scrollY;
                
                setTooltipData({
                    show: true,
                    content: tooltipContent,
                    x: x + 10,
                    y: y - 30  // Increased offset to prevent tooltip from covering cursor
                });
                
                d3.select(event.currentTarget).attr("fill", "#f8f8f2");
            })
            .on("mouseout", (event, d) => {
                const landkod = d.properties.iso_a2.toLowerCase();
                const countryData = dataSeries.find(item => item.lander === landkod);
                const count = countryData ? countryData.count : 0;
                
                d3.select(event.currentTarget).attr("fill", 
                    count === 0 ? "grey" : colorScale(Math.log(count))
                );
                
                setTooltipData(prev => ({ ...prev, show: false }));
            });

        const zoomControls = svgElement.append("g")
            .attr("class", "zoom-controls")
            .attr("transform", `translate(${dimensions.width - 60}, 20)`);

        zoomControls.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 24)
            .attr("height", 24)
            .attr("fill", "#1f2937")
            .attr("rx", 4)
            .style("cursor", "pointer")
            .on("click", () => svgElement.transition().call(zoom.scaleBy, 1.5));

        zoomControls.append("text")
            .attr("x", 12)
            .attr("y", 16)
            .attr("text-anchor", "middle")
            .attr("fill", "#f8f8f2")
            .style("font-size", "16px")
            .style("pointer-events", "none")
            .text("+");

        zoomControls.append("rect")
            .attr("x", 0)
            .attr("y", 30)
            .attr("width", 24)
            .attr("height", 24)
            .attr("fill", "#1f2937")
            .attr("rx", 4)
            .style("cursor", "pointer")
            .on("click", () => svgElement.transition().call(zoom.scaleBy, 0.75));

        zoomControls.append("text")
            .attr("x", 12)
            .attr("y", 46)
            .attr("text-anchor", "middle")
            .attr("fill", "#f8f8f2")
            .style("font-size", "16px")
            .style("pointer-events", "none")
            .text("−");
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (dimensions.width > 0 && dimensions.height > 0) {
            drawMap();
        }
    }, [dimensions, dataSeries]);

    return (
        <div ref={containerRef} className="w-full flex justify-center items-center relative">
            <div className="w-full h-full relative">
                {tooltipData.show && (
                    <div 
                        className="absolute z-50 bg-gray-800 text-gray-100 px-3 py-2 rounded-md text-sm shadow-lg pointer-events-none"
                        style={{
                            left: `${tooltipData.x}px`,
                            top: `${tooltipData.y}px`,
                            transform: 'translate(0, -100%)',
                            transition: 'all 0.1s ease-out',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tooltipData.content}
                    </div>
                )}
                <svg ref={svgRef}></svg>
            </div>
        </div>
    );
}
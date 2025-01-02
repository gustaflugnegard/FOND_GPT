"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { gettop5 } from "@/lib/tempdata";

interface CountData {
  Month: string; // e.g., "2024-01"
  ISIN: string;  // ISIN of the fund
  Cumulative_Return: number; // Monthly cumulative return
}

export default function LineChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dataSeries, setDataSeries] = useState<Record<string, CountData[]>>({});
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const resizeTimeout = useRef<NodeJS.Timeout | null>(null);

  const updateDimensions = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const containerHeight = Math.max(300, Object.keys(dataSeries).length * 35);
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
    try {
      const data = await gettop5();

      // Group and sort data by ISIN and Month
      const groupedData = data.reduce((acc: Record<string, CountData[]>, item: CountData) => {
        acc[item.ISIN] = acc[item.ISIN] || [];
        acc[item.ISIN].push(item);
        return acc;
      }, {});

      Object.keys(groupedData).forEach((key) => {
        groupedData[key] = groupedData[key].sort((a, b) => new Date(a.Month).getTime() - new Date(b.Month).getTime());
      });

      setDataSeries(groupedData);
    } catch (error) {
      console.error("Error fetching or preparing data:", error);
    }
  };

  const createLineChart = () => {
    if (!Object.keys(dataSeries).length || !svgRef.current || !containerRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 32, left: 25 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    const chart = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const allData = Object.values(dataSeries).flat();

    // Scales
    const x = d3.scaleTime()
      .domain(d3.extent(allData, (d) => new Date(d.Month)) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([d3.min(allData, (d) => d.Cumulative_Return) || 0, d3.max(allData, (d) => d.Cumulative_Return) || 0])
      .nice()
      .range([height, 0]);

    //const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(Object.keys(dataSeries));
    
    // Define your neon colors
    const neonColors = [
      '#1b7895', // Neon Yellow
      '#eeb5eb', // Neon Green
      '#ffd864', // Neon Blue
      '#61c2a2', // Neon Pink
      '#fff'     // Neon Red
    ];

    // Create a color scale
    const colorScale = d3.scaleOrdinal()
      .domain(Object.keys(dataSeries)) // Ensure the domain matches your data keys
      .range(neonColors);



    // Axes
    chart.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y")))
      .call(g => {
        g.select(".domain").remove();
        g.selectAll(".tick line")
          .attr("stroke", "hsl(var(--foreground))");
        g.selectAll(".tick text")
          .attr("fill", "hsl(var(--foreground))")
          .style("font-size", "10px")
          .attr("transform", "rotate(-45)")
          .attr("text-anchor", "end");
      });

    chart.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .call(g => {
        g.select(".domain").remove();
        g.selectAll(".tick line").remove();
        g.selectAll(".tick text")
          .attr("fill", "hsl(var(--foreground))")
          .style("font-size", "10px");
      })

        // Grid
    chart.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,0)`)
      .call(d3.axisLeft(y)
        .tickSize(-(dimensions.width - margin.right - margin.left))
        .tickFormat("")
        .ticks(5)
      )
      .call(g => {
        g.select(".domain").remove();
        g.selectAll(".tick line")
          .attr("stroke", "hsl(var(--muted-foreground))")
          .attr("stroke-opacity", 0.2)
          .attr("stroke-array", "6,2");
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

    Object.entries(dataSeries).forEach(([isin, data]) => {
      const line = d3.line<CountData>()
        .x((d) => x(new Date(d.Month)))
        .y((d) => y(d.Cumulative_Return))
        .curve(d3.curveMonotoneX);
    
      // Lines

      const formatTime = d3.timeFormat("%B %Y"); // Example: "December 2024"

      const linePath = chart.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", colorScale(isin) as string)
        .attr("opacity", 0.9)
        .attr("stroke-width", 2.5)
        .attr("class", `line-${isin}`)
        .attr("d", line);
    
      // Line hover effect with tooltip
      linePath
        .on("mouseover", function (event) {
          d3.select(this)
            .attr("stroke-width", 5);
    
          tooltip.style("visibility", "visible");
        })
        .on("mousemove", function (event) {
          const [mouseX] = d3.pointer(event, this);
    
          // Find closest data point to the mouse X position
          const closestData = data.reduce((prev, curr) =>
            Math.abs(x(new Date(curr.Month)) - mouseX) <
            Math.abs(x(new Date(prev.Month)) - mouseX)
              ? curr
              : prev
          );
    
          tooltip
          .html(`
            <div class="font-bold mb-1">${isin}</div>
            <div style="color: hsl(var(--custom_cyan))">Månad: ${formatTime(new Date(closestData.Month))}</div>
            <div style="color: hsl(var(--custom_cyan))">Kumulativ avkastning: ${closestData.Cumulative_Return.toFixed(2)}</div>
          `)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function () {
          d3.select(this)
            .transition()
            .duration(100)
            .attr("stroke-width", 3);
    
          tooltip.style("visibility", "hidden");
        });
    });

    // Assume dataSeries is an object where keys are ISINs or categories, and values are datasets
    const uniqueAssets = Object.keys(dataSeries);  // Use keys from your dataSeries

    // Legend settings
    const legendItemWidth = 80; // Desired width for each legend item
    const legendItemHeight = 20; // Height for each legend item
    const legendPadding = 5; // Space between items
    const maxLegendItemsPerRow = Math.floor(dimensions.width / (legendItemWidth + legendPadding));

    // Create a legend group
    const legend = svg.append("g")
      .attr("font-size", "10px")
      .attr("text-anchor", "start")
      .attr("transform", `translate(${margin.left}, ${dimensions.height + 20})`); // Position below the graph

    // Append legend items
    const legendItems = legend.selectAll(".legend-item")
      .data(uniqueAssets)
      .join("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => {
        const x = (i % maxLegendItemsPerRow) * (legendItemWidth + legendPadding);
        const y = Math.floor(i / maxLegendItemsPerRow) * (legendItemHeight + legendPadding);
        return `translate(${x}, ${y})`; // Calculate x and y positions
      });

    // Append circles to legend items
    legendItems.append("circle")
      .attr("r", 5)
      .attr("fill", d => colorScale(d)) // Use colorScale based on ISIN or category
      .attr("stroke", "hsl(var(--foreground))")
      .attr("stroke-width", 1);

    // Append text labels to legend items
    legendItems.append("text")
      .attr("x", 10)
      .attr("y", 3)
      .attr("fill", "hsl(var(--foreground))")
      .text(d => d); // Display ISIN or category name as label

    // Adjust SVG height to accommodate the legend
    const totalRows = Math.ceil(uniqueAssets.length / maxLegendItemsPerRow);
    d3.select(svgRef.current)
      .attr("height", dimensions.height + (totalRows * (legendItemHeight + legendPadding)) + margin.bottom);

      
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (Object.keys(dataSeries).length && dimensions.width > 0) {
      createLineChart();
    }
  }, [dataSeries, dimensions]);

  return (
    <div ref={containerRef} className="w-full flex justify-center items-center">
      <svg ref={svgRef} />
    </div>
  );
}

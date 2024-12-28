'use client'

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Slider } from "@/components/ui/slider";

export default function FeeImpactChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });
  const [expectedReturn, setExpectedReturn] = useState(8); // 8% default return
  const [managementFee, setManagementFee] = useState(1.5); // 1.5% default fee
  
  const resizeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Calculate cumulative returns over 20 years
  const calculateReturns = () => {
    const years = 20;
    const monthlyData = [];
    let cumulativeReturn = 100; // Start with 100 as base

    for (let month = 0; month <= years * 12; month++) {
      const yearFraction = 1/12;
      const monthlyReturn = (1 + (expectedReturn - managementFee)/100) ** yearFraction;
      cumulativeReturn *= monthlyReturn;
      
      monthlyData.push({
        Month: new Date(2024, month, 1),
        Cumulative_Return: cumulativeReturn
      });
    }
    return monthlyData;
  };

  const updateDimensions = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      setDimensions({ width: containerWidth, height: 300 });
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
  }, []);

  const createChart = () => {
    if (!svgRef.current || !containerRef.current) return;

    const data = calculateReturns();
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    const chart = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.Month) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.Cumulative_Return) || 0])
      .nice()
      .range([height, 0]);

    // Line generator
    const line = d3.line<any>()
      .x(d => x(d.Month))
      .y(d => y(d.Cumulative_Return))
      .curve(d3.curveMonotoneX);

    // Add grid
    chart.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,0)`)
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
      )
      .call(g => {
        g.select(".domain").remove();
        g.selectAll(".tick line")
          .attr("stroke", "cyan")
          .attr("stroke-opacity", 0.2)
          .attr("stroke-array", "6,2");
      });

    // Add axes
    chart.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y")))
      .call(g => {
        g.select(".domain").remove();
        g.selectAll(".tick line")
          .attr("stroke", "white");
        g.selectAll(".tick text")
          .attr("fill", "white")
          .style("font-size", "10px")
          .attr("transform", "rotate(-45)")
          .attr("text-anchor", "end");
      });

    chart.append("g")
      .call(d3.axisLeft(y))
      .call(g => {
        g.select(".domain").remove();
        g.selectAll(".tick line").remove();
        g.selectAll(".tick text")
          .attr("fill", "white")
          .style("font-size", "10px");
      })

    // Add line
    chart.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#eeb5eb")
      .attr("stroke-width", 2.5)
      .attr("opacity", 0.9)
      .attr("d", line);
  };

  useEffect(() => {
    if (dimensions.width > 0) {
      createChart();
    }
  }, [dimensions, expectedReturn, managementFee]);

  return (
    <div className="w-full space-y-8 p-4 bg-black/40 rounded-lg">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-white">Förväntad avkastning</label>
            <span className="text-sm text-cyan-400">{expectedReturn}%</span>
          </div>
          <Slider 
            value={[expectedReturn]}
            onValueChange={(value) => setExpectedReturn(value[0])}
            max={15}
            step={0.1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-white">Fond avgift</label>
            <span className="text-sm text-cyan-400">{managementFee}%</span>
          </div>
          <Slider 
            value={[managementFee]}
            onValueChange={(value) => setManagementFee(value[0])}
            max={5}
            step={0.1}
            className="w-full"
          />
        </div>

        <div className="text-sm text-cyan-400 font-medium">
          Net Annual Return: {(expectedReturn - managementFee).toFixed(1)}%
        </div>
      </div>

      <div ref={containerRef} className="w-full flex justify-center items-center">
        <svg ref={svgRef} />
      </div>
    </div>
  );
}
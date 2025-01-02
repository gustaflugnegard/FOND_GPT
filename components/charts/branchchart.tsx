"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import { getBranch } from "@/lib/tempdata";

const quarters = [
  "Q4 2019", "Q1 2020", "Q2 2020", "Q3 2020", "Q4 2020",
  "Q1 2021", "Q2 2021", "Q3 2021", "Q4 2021",
  "Q1 2022", "Q2 2022", "Q3 2022", "Q4 2022",
  "Q1 2023", "Q2 2023", "Q3 2023", "Q4 2023", "Q1 2024"
];

export default function Branchchart() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [originalSeries, setOriginalSeries] = useState([]);
  const [currentQuarter, setCurrentQuarter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // State to track play/pause

  const fetchData = async () => {
    const data = await getBranch();

    const groupedData = data.reduce((acc, item) => {
      const quarter = item.Quarter; // Assuming 'Quarter' contains values like 'Q1 2020'

      // If the quarter doesn't exist in the accumulator, initialize it
      if (!acc[quarter]) {
        acc[quarter] = [];
      }

      // Push the relevant data
      acc[quarter].push({
        name: item["Bransch Name"], // Accessing the branch name
        value: item.relative_count || 0, // Accessing the relative count
      });

      return acc;
    }, {});

    // Format the data to the expected structure
    const formattedData = Object.entries(groupedData).map(([quarter, data]) => ({
      name: quarter,
      data: data.sort((a, b) => d3.descending(a.value, b.value)), // Sort by value
    }));

    setOriginalSeries(formattedData);
    setCurrentQuarter(formattedData.length - 1); // Set to the first (most recent) quarter
    updateChart(formattedData[formattedData.length - 1]); // Initialize with latest data
  };


  const updateChart = (data) => {
    const svg = d3.select(svgRef.current);

    const width = 400;
    const height = 250;

    svg.attr("width", width).attr("height", height);

    // Create a hierarchy from the data
    const root = d3.hierarchy({ name: "root", children: data.data })
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    // Create a treemap layout
    d3.treemap()
      .size([width, height])
      .padding(2)(root);

    // Create color scale
    const color = d3.scaleOrdinal()
      .domain(data.data.map(d => d.name))
      .range(d3.range(0, 1, 1 / data.data.length).map(d => d3.rgb(0, 255, 255).darker(1 + d * 2))); // Neon blue with darker starting shades


    // Apply the join pattern here
    const nodes = svg.selectAll("rect")
      .data(root.leaves(), d => d.data.name) // Bind using unique name
      .join(
        enter => enter.append("rect")
          .attr("x", d => d.x0)
          .attr("y", d => d.y0)
          .attr("width", 0) // Start from 0 for animation
          .attr("height", 0)
          .attr("fill", d => color(d.data.name))
          .attr("rx", 4)
          .attr("ry", 4) // round corners
          .transition()  // Smoothly transition to target size
          .attr("width", d => d.x1 - d.x0)
          .attr("height", d => d.y1 - d.y0),

        update => update.transition() // Update existing elements with smooth transition
          .attr("x", d => d.x0)
          .attr("y", d => d.y0)
          .attr("width", d => d.x1 - d.x0)
          .attr("height", d => d.y1 - d.y0),

        exit => exit.transition() // Smoothly transition exiting elements
          .attr("width", 0)
          .attr("height", 0)
          .remove()
      );

    // Add text labels with sizing based on rectangle size
    svg.selectAll("text")
      .data(root.leaves(), d => d.data.name)  // Bind text to unique data
      .join(
        enter => enter.append("text")
          .attr("class", "node")
          .attr("x", d => (d.x0 + d.x1) / 2)
          .attr("y", d => (d.y0 + d.y1) / 2)
          .attr("dy", ".35em")
          .attr("font-size", (d: any) => Math.max(Math.min((d.x1 - d.x0) / 12, 18), 10)) // Adjusted formula
          .text(d => d.data.name)
          .attr("fill", "#ffffff")
          .style("text-anchor", "middle"),
        update => update // Update existing text positions smoothly
          .transition()
          .attr("x", d => (d.x0 + d.x1) / 2)
          .attr("y", d => (d.y0 + d.y1) / 2)
          .attr("font-size", (d: any) => Math.max(Math.min((d.x1 - d.x0) / 12, 18), 3)) // Adjusted formula
          .text(d => d.data.name),
        exit => exit.remove() // Remove text for elements that no longer exist
      );

    // Tooltip interaction
    const tooltip = d3.select("#tooltip");
    nodes.on("mouseover", function (event, d) {
      tooltip.transition().style("opacity", 1);
      tooltip.html(d.data.name + ": " + d.data.value)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");

      d3.select(this).attr("stroke", "#1f2937").attr("stroke-width", 3); // Black border on hover
    })
    nodes.on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

  };

  const handleMouseOver = (event, d) => {
    const tooltip = d3.select("#tooltip");
    tooltip.transition().style("opacity", 1);
    tooltip.html(d.data.name + ": " + d.data.value)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 20) + "px");

    d3.select(event.target).attr("stroke", "#1f2937").attr("stroke-width", 3); // Black border on hover
  };

  const handleMouseOut = () => {
    const tooltip = d3.select("#tooltip");
    tooltip.transition().style("opacity", 0);
    d3.select(event.target).attr("stroke", null);
  };

  useEffect(() => {
    fetchData();

    if (originalSeries.length > 0) {
      updateChart(originalSeries[currentQuarter]);
    }
  }, [currentQuarter, originalSeries]);

  // Animation logic
  useEffect(() => {
    let intervalId;
    if (isPlaying) {
      intervalId = setInterval(() => {
        setCurrentQuarter((prev) => (prev + 1) % quarters.length);
      }, 1000); // Change every second
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
          className="w-full mb-4 rounded-md " // Rounded borders
        />

        {/* Flexbox container for quarter display and button */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)} // Toggle play/pause
            style={{
              backgroundColor: isPlaying ? '#374151' : '#4B5563', // Change color based on state
            }}
            className="px-4 py-2 text-white rounded-md "
          >
            {isPlaying ? "Pause" : "Play"} {/* Button text changes */}
          </button>
          <p className=" text-white ">{quarters[currentQuarter]}</p> {/* Display current quarter */}

        </div>

        <div
          id="tooltip"
          style={{
            position: "absolute",
            backgroundColor: "#1f2937", // Monokai tooltip background
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

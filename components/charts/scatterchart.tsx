'use client'


import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getScatter } from "@/lib/tempdata";

interface ScatterData {
  stdavvikelse: number;
  oneyear: number;
  bolag: string;
  fond: string;
}

export default function ScatterChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dataSeries, setDataSeries] = useState<ScatterData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({
    width: 400,
    height: 250
  });

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      }
    };

    fetchData();
  }, []);

      // Function to truncate text if needed
  const truncateText = (text: string, width: number, fontSize: number) => {
    // Approximate character width (varies by font)
    const charWidth = fontSize * 0.5;
    const maxChars = Math.floor(width / charWidth);
    
    if (text.length * charWidth > width) {
        // Leave room for ellipsis
        return text.slice(0, maxChars - 2) + "...";
    }
    return text;
  };

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(width, 400),
          height: 305
        });
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Chart drawing
  useEffect(() => {
    if (!svgRef.current || dataSeries.length === 0) return;

    const margin = { top: 20, right: 20, bottom: 20, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleLinear()
      .domain([
        d3.min(dataSeries, d => d.stdavvikelse - 2 ) ?? 0, 
        d3.max(dataSeries, d => d.stdavvikelse + 2) ?? 20
      ])
      .range([0, width])
      .nice();
    

    const y = d3.scaleLinear()
      .domain([0, d3.max(dataSeries, d => d.oneyear) ?? 20])
      .range([height, 0])
      .nice();

    // Color palette
    const neonColors = [
      '#00ffff', // Cyan
      '#ff00ff', // Magenta
      '#ffff00', // Yellow
      '#00ff00', // Green
      '#ff0066'  // Pink
    ];

    const colorScale = d3.scaleOrdinal()
      .domain(dataSeries.map(d => d.bolag))
      .range(neonColors);

    // Enhanced tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "scatter-tooltip")
      .style("position", "fixed")
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

    // Grid
    const addGrid = (axis: d3.Axis<d3.NumberValue>, isVertical: boolean) => {
      return svg.append("g")
        .attr("class", "grid")
        .attr("transform", isVertical ? "" : `translate(0,${height})`)
        .call(
          axis
            .tickSize(isVertical ? -width : -height)
            .tickFormat(() => "")
            .ticks(5)
        )
        .call(g => {
          g.selectAll(".tick line")
            .attr("stroke", "hsl(var(--muted-foreground))")
            .style("stroke-dasharray", "4,4");
          g.select(".domain").remove();
        });
    };

    addGrid(d3.axisLeft(y), true);
    addGrid(d3.axisBottom(x), false);

    // Axes
    const addAxis = (axis: d3.Axis<d3.NumberValue>, label: string, isVertical: boolean) => {
      const g = svg.append("g")
        .attr("transform", isVertical ? "" : `translate(0,${height})`)
        .call(axis.ticks(5))
        .call(g => {
          g.selectAll("text")
            .attr("fill", "hsl(var(--foreground))")
            .attr("font-size", "12px");
          g.selectAll(".tick line")
            .attr("stroke", "hsl(var(--foreground))");
          g.select(".domain").remove();
        });

      g.append("text")
        .attr("fill", "hsl(var(--foreground))")
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .attr("transform", isVertical 
          ? `rotate(-90) translate(${-height/2},${-35})`
          : `translate(${width/2},35)`)
        .text(label);
    };

    addAxis(d3.axisLeft(y), "1 års avkastning (%)", true);
    addAxis(d3.axisBottom(x), "Risk (%)", false);

    // Points
    svg.selectAll("circle")
      .data(dataSeries)
      .join("circle")
      .attr("cx", d => x(d.stdavvikelse))
      .attr("cy", d => y(d.oneyear))
      .attr("r", 6)
      .attr("fill", (d: ScatterData): string => {
        const color = colorScale(d.bolag || 'No ISIN');
        return (color ?? 'gray') as string;
       })        
      .attr("opacity", 0.8)
      .attr("stroke", "hsl(var(--foreground))")
      .attr("stroke-width", 1.5)
      .style("transition", "all 0.2s ease-out")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)

          .attr("r", 8)
          .attr("opacity", 1)
          .attr("stroke-width", 2);

        tooltip
          .style("visibility", "visible")
          .style("opacity", 1)
          .html(`
            <div class="font-bold mb-1">${d.fond}</div>
            <div style="color: hsl(var(--custom_cyan))">Avkastning: ${d.oneyear.toFixed(1)}%</div>
            <div style="color: hsl(var(--custom_cyan))">Risk: ${d.stdavvikelse.toFixed(1)}%</div>
            <div style="color:hsl(var(--muted-foreground))" class="text-xs mt-1">${d.bolag}</div>
          `);
      })
      .on("mousemove", (event) => {
        const padding = 10;
        let tooltipX = event.clientX + padding;
        let tooltipY = event.clientY + padding;

        // Adjust position if tooltip would go off screen
        const tooltipNode = document.querySelector('.scatter-tooltip') as HTMLElement;
        if (tooltipNode) {
          const tooltipWidth = tooltipNode.offsetWidth;
          const tooltipHeight = tooltipNode.offsetHeight;
          
          if (tooltipX + tooltipWidth > window.innerWidth) {
            tooltipX = event.clientX - tooltipWidth - padding;
          }
          if (tooltipY + tooltipHeight > window.innerHeight) {
            tooltipY = event.clientY - tooltipHeight - padding;
          }
        }

        tooltip
          .style("left", `${tooltipX}px`)
          .style("top", `${tooltipY}px`);
      })
      .on("mouseleave", (event) => {
        const d = d3.select(event.currentTarget).datum() as ScatterData;
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("r", 6)
          .attr("opacity", 0.8)
          .attr("stroke-width", 1.5);

        tooltip
          .style("visibility", "hidden")
          .style("opacity", 0);
      });

    // Legend
    // Legend dimensions
    const legendItemHeight = 24;
    const legendItemWidth = 155;
    const legendPadding = 10;
    const fontSize = 12; // Font size for the legend
    const maxLegendItemsPerRow = Math.floor(width / (legendItemWidth + legendPadding));

    // Unique companies for the legend
    const uniqueCompanies = Array.from(new Set(dataSeries.map(d => d.fond)));

    const legend = svg.append("g").attr("transform", `translate(0, ${height + 50})`);

    legend
      .selectAll(".legend-item")
      .data(uniqueCompanies)
      .join("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => {
        const x = (i % maxLegendItemsPerRow) * (legendItemWidth + legendPadding);
        const y = Math.floor(i / maxLegendItemsPerRow) * (legendItemHeight + legendPadding);
        return `translate(${x}, ${y})`;
      })
      .call((g) => {
        g.append("circle")
          .attr("r", 5)
          .attr("fill", d => colorScale(d) as string) 
          .attr("stroke", "hsl(var(--foreground))")
          .attr("stroke-width", 1.5);

        g.append("text")
          .attr("x", 12)
          .attr("y", 4)
          .attr("fill", "hsl(var(--foreground))")
          .attr("font-size", `${fontSize}px`)
          .text((d) => truncateText(d, legendItemWidth, fontSize)); // Apply truncation here
      });

    const totalRows = Math.ceil(uniqueCompanies.length / maxLegendItemsPerRow);
    d3.select(svgRef.current).attr(
      "height",
      dimensions.height + totalRows * (legendItemHeight + legendPadding) + 20
    );
  }, [dataSeries, dimensions]);

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded bg-red-50 border border-red-200">
        Error loading data: {error}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="sm:max-w-4xl mx-auto w-full">
      <svg
        ref={svgRef}
        className="w-full"
        style={{ 
          minWidth: "400px",
        }}
      />
    </div>
  );
}
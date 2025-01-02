import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import mapContent from "@/public/custom.geo.json";
import { getlanderCount } from "@/lib/tempdata";
import { Card } from "@/components/ui/card";

interface CountryData {
  lander: string;
  land_namn: string;
  count: number;
  percentage: number;
}

interface MapFeature {
  properties: {
    iso_a2: string;
  };
}


export default function Map() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any>>();
  const resizeTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [dataSeries, setDataSeries] = useState<CountryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Replace the ResizeObserver with your new resize logic
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

  // Memoized calculations
  const { colorScale, projection, path } = useMemo(() => {
    if (!dataSeries.length) return {};

    const maxCount = d3.max(dataSeries, d => d.count) || 1;
    const colorScale = d3.scaleSequential()
      .domain([0, Math.log(maxCount)])
      .interpolator(d3.interpolateHcl("#008080", "cyan"));

    const projection = d3.geoEqualEarth()
      .fitSize([dimensions.width, dimensions.height], mapContent);

    const path = d3.geoPath().projection(projection);

    return { colorScale, projection, path };
  }, [dataSeries, dimensions]);

  // Initialize tooltip
  useEffect(() => {
    d3.select("body").select(".map-tooltip").remove();
    
    tooltipRef.current = d3.select("body")
      .append("div")
      .attr("class", "map-tooltip")
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

    return () => {
      tooltipRef.current?.remove();
    };
  }, []);

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getlanderCount();
        setDataSeries(data.slice(0, 200));
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load map data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Initialize map and handle interactions
  useEffect(() => {
    if (!svgRef.current || !gRef.current || !colorScale || !path || !tooltipRef.current) return;
  
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const tooltip = tooltipRef.current;
  
    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 6])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        // Update stroke width for all paths during zoom
        g.selectAll("path").style("stroke-width", `${1 / event.transform.k}px`);
      });
  
    svg.call(zoom);
    
    // Initial zoom for small screens
    if (dimensions.width < 600) {
      const transform = d3.zoomIdentity
        .translate(dimensions.width / 2, dimensions.height / 1.4)
        .scale(3)
        .translate(-dimensions.width / 2, -dimensions.height / 2);
      
      svg.call(zoom.transform, transform);
      // Set initial stroke width based on zoom level
      g.selectAll("path").style("stroke-width", `${1 / 4}px`);
    } else {
      // Default zoom scale of 2 for larger screens
      const transform = d3.zoomIdentity
        .translate(dimensions.width / 2, dimensions.height / 1.1)
        .scale(2)
        .translate(-dimensions.width / 2, -dimensions.height / 2);
      
      svg.call(zoom.transform, transform);
      g.selectAll("path").style("stroke-width", `${1 / 2}px`);
    }

    // Draw map features
    const paths = g.selectAll("path")
      .data(mapContent.features)
      .join("path")
      .attr("d", path)
      .attr("fill", (d: any) => {
        const landkod = d.properties.iso_a2.toLowerCase();
        const countryData = dataSeries.find(item => item.lander === landkod);
        const count = countryData?.count || 0;
        return count === 0 ? "grey" : colorScale(Math.log(count));
      })
      .attr("stroke", "hsl(var(--border_map))")
      .attr("stroke-width", 0.5);

    // Handle interactions
    paths
      .on("mouseover", function(event, d: any) {
        const landkod = d.properties.iso_a2.toLowerCase();
        const countryData = dataSeries.find(item => item.lander === landkod);
        
        if (countryData) {
          d3.select(this).attr("fill", "hsl(var(--text))");
          
          tooltip
            .style("visibility", "visible")
            .html(`
              <div class="font-bold mb-1">${countryData.land_namn}</div>
              <div style="color: hsl(var(--custom_cyan))"">Antal: ${countryData.count.toLocaleString()}</div>
              <div style="color: hsl(var(--custom_cyan))">Andel: ${countryData.percentage.toFixed(2)}%</div>
            `);
        }
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function(event, d: any) {
        const landkod = d.properties.iso_a2.toLowerCase();
        const countryData = dataSeries.find(item => item.lander === landkod);
        const count = countryData?.count || 0;
        
        d3.select(this).attr("fill", count === 0 ? "grey" : colorScale(Math.log(count)));
        tooltip.style("visibility", "hidden");
      });

    // Add zoom controls
    const controls = svg.selectAll(".zoom-controls")
      .data([null])
      .join("g")
      .attr("class", "zoom-controls")
      .attr("transform", `translate(${dimensions.width - 60}, 20)`);

    // Zoom in button
    controls.selectAll(".zoom-in")
      .data([null])
      .join("g")
      .attr("class", "zoom-in")
      .call(g => {
        g.selectAll("rect")
          .data([null])
          .join("rect")
          .attr("width", 24)
          .attr("height", 24)
          .attr("fill", "#1f2937")
          .attr("rx", 4)
          .style("cursor", "pointer");
        
        g.selectAll("text")
          .data([null])
          .join("text")
          .attr("x", 12)
          .attr("y", 16)
          .attr("text-anchor", "middle")
          .attr("fill", "#f8f8f2")
          .text("+");
      })
      .on("click", () => svg.transition().call(zoom.scaleBy, 1.5));

    // Zoom out button
    controls.selectAll(".zoom-out")
      .data([null])
      .join("g")
      .attr("class", "zoom-out")
      .attr("transform", "translate(0, 30)")
      .call(g => {
        g.selectAll("rect")
          .data([null])
          .join("rect")
          .attr("width", 24)
          .attr("height", 24)
          .attr("fill", "#1f2937")
          .attr("rx", 4)
          .style("cursor", "pointer");
        
        g.selectAll("text")
          .data([null])
          .join("text")
          .attr("x", 12)
          .attr("y", 16)
          .attr("text-anchor", "middle")
          .attr("fill", "#f8f8f2")
          .text("−");
      })
      .on("click", () => svg.transition().call(zoom.scaleBy, 0.75));

      return () => {
        svg.on(".zoom", null);
      };
    }, [dataSeries, dimensions, colorScale, path]);

  if (error) return <div className="text-red-500">{error}</div>;
  if (isLoading) return <div className="animate-pulse">Loading map...</div>;

  return (
    <Card className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full">
        <svg
          ref={svgRef}
          style={{
            width: '100%',
            height: '100%',
            maxWidth: `${dimensions.width}px`,
            maxHeight: `${dimensions.height}px`
          }}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
          <g ref={gRef} />
        </svg>
      </div>
    </Card>
  );
}
"use client";

import React, { useEffect, useRef, useState } from "react";

export default function Infoscatter() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 250 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(width, 400),
          height: 250,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        borderRadius: "8px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#374151",
        marginTop: "20px", // Add this line for top margin
      }}
    >
      <p style={{ fontSize: "16px", color: "#fff", textAlign: "center" }}>
        Denna Markowitz-graf illustrerar sambandet mellan avkastning och risk för olika portföljer.
        Y-axeln representerar den förväntade avkastningen,
        medan X-axeln visar risknivån, mätt som standardavvikelse.
        Tolkningen är enkel: för att uppnå högre avkastning krävs en högre risk.
        Grafen hjälper investerare att fatta beslut baserat på sin riskaptit och avkastningsmål.
      </p>
    </div>
  );
}

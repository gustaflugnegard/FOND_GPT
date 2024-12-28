"use client";

import React, { useEffect, useRef, useState } from "react";

export default function TextcardCountAssets() {
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
                Denna figur illustruerar de mest ägda aktierna under ett specifikt kvartal.
                Det vill säga det aktier som förekommer flest gånger i alla rapporterande fonder.
            </p>
        </div>
    );
}

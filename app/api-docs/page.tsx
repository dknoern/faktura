"use client";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { useEffect } from "react";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  useEffect(() => {
    const original = console.error;
    // swagger-ui-react uses legacy lifecycle methods internally (known upstream issue)
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("UNSAFE_componentWillReceiveProps")) return;
      original(...args);
    };
    return () => { console.error = original; };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI url="/api/v1/openapi.json" />
    </div>
  );
}

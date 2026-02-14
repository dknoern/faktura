"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { type InventoryBreakdown } from "@/lib/dashboard-actions";
import { Pie, PieChart, Cell, Label } from "recharts";
import { Package2, Tag } from "lucide-react";

interface InventoryPieChartsProps {
  productTypeData: InventoryBreakdown[];
  statusData: InventoryBreakdown[];
}

export function InventoryPieCharts({ productTypeData, statusData }: InventoryPieChartsProps) {
  const productTypeConfig = {
    watch: {
      label: "Watch",
      color: "hsl(var(--chart-1))",
    },
    pocketWatch: {
      label: "Pocket Watch",
      color: "hsl(var(--chart-2))",
    },
    jewelry: {
      label: "Jewelry",
      color: "hsl(var(--chart-3))",
    },
    accessories: {
      label: "Accessories",
      color: "hsl(var(--chart-4))",
    },
  };

  const statusConfig = {
    inStock: {
      label: "In Stock",
      color: "hsl(var(--chart-1))",
    },
    memo: {
      label: "Memo",
      color: "hsl(var(--chart-2))",
    },
    repair: {
      label: "Repair",
      color: "hsl(var(--chart-3))",
    },
  };

  const totalProductTypeItems = productTypeData.reduce((sum, item) => sum + item.value, 0);
  const totalStatusItems = statusData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Inventory by Product Type
          </CardTitle>
          <CardDescription>
            Breakdown of inventory items by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={productTypeConfig} className="mx-auto aspect-square max-h-[300px]">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-muted-foreground">
                              {payload[0].name}
                            </span>
                            <span className="text-lg font-bold">
                              {payload[0].value?.toLocaleString()} items
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {((Number(payload[0].value) / totalProductTypeItems) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={productTypeData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
              >
                {productTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 10}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalProductTypeItems.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 20}
                            className="fill-muted-foreground text-sm"
                          >
                            Total Items
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {productTypeData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Inventory by Status
          </CardTitle>
          <CardDescription>
            Breakdown of inventory items by current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={statusConfig} className="mx-auto aspect-square max-h-[300px]">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-muted-foreground">
                              {payload[0].name}
                            </span>
                            <span className="text-lg font-bold">
                              {payload[0].value?.toLocaleString()} items
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {((Number(payload[0].value) / totalStatusItems) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 10}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalStatusItems.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 20}
                            className="fill-muted-foreground text-sm"
                          >
                            Total Items
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip} from "@/components/ui/chart";
import {  type DashboardStats, type MonthlySalesData, type RecentTransaction } from "@/lib/dashboard-actions";
import { Package, Wrench, MapPin, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

interface DashboardProps {
  stats: DashboardStats;
  salesData: MonthlySalesData[];
  transactions: RecentTransaction[];
}

export function Dashboard({ stats, salesData, transactions }: DashboardProps) {
  // Chart configuration
  const chartConfig = {
    sales: {
      label: "Sales",
      color: "#B8860B",
    },
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'log_in':
        return <ArrowDownRight className="h-4 w-4 text-blue-600" />;
      case 'log_out':
        return <ArrowUpRight className="h-4 w-4 text-orange-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'sale':
        return 'Sale';
      case 'log_in':
        return 'Log In';
      case 'log_out':
        return 'Log Out';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Items in Inventory
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInventory.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Items currently in stock
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Repairs Out
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRepairsOut.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Items currently being repaired
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Items Out at Show
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItemsAtShow.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Items currently at shows
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Sales - Past 12 Months
          </CardTitle>
          <CardDescription>
            Sales performance over the last year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={salesData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                cursor={false}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-muted-foreground">
                              {label}
                            </span>
                            <span className="text-lg font-bold">
                              ${payload[0].value?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="sales"
                fill="var(--color-sales)"
                radius={8}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest sales, log ins, and log outs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatTransactionType(transaction.type)} • {new Date(transaction.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {transaction.amount && (
                    <div className="font-medium text-green-600">
                      ${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                  {transaction.itemNumber && (
                    <div className="text-sm text-muted-foreground">
                      #{transaction.itemNumber}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {new Date(transaction.date).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No recent transactions found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
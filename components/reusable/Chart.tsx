"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
const chartData = [
  { date: "2024-04-01", assignments: 222, quizes: 150 },
  { date: "2024-04-02", assignments: 97, quizes: 180 },
  { date: "2024-04-03", assignments: 167, quizes: 120 },
  { date: "2024-04-04", assignments: 242, quizes: 260 },
  { date: "2024-04-05", assignments: 373, quizes: 290 },
  { date: "2024-04-06", assignments: 301, quizes: 340 },
  { date: "2024-04-07", assignments: 245, quizes: 180 },
  { date: "2024-04-08", assignments: 409, quizes: 320 },
  { date: "2024-04-09", assignments: 59, quizes: 110 },
  { date: "2024-04-10", assignments: 261, quizes: 190 },
  { date: "2024-04-11", assignments: 327, quizes: 350 },
  { date: "2024-04-12", assignments: 292, quizes: 210 },
  { date: "2024-04-13", assignments: 342, quizes: 380 },
  { date: "2024-04-14", assignments: 137, quizes: 220 },
  { date: "2024-04-15", assignments: 120, quizes: 170 },
  { date: "2024-04-16", assignments: 138, quizes: 190 },
  { date: "2024-04-17", assignments: 446, quizes: 360 },
  { date: "2024-04-18", assignments: 364, quizes: 410 },
  { date: "2024-04-19", assignments: 243, quizes: 180 },
  { date: "2024-04-20", assignments: 89, quizes: 150 },
  { date: "2024-04-21", assignments: 137, quizes: 200 },
  { date: "2024-04-22", assignments: 224, quizes: 170 },
  { date: "2024-04-23", assignments: 138, quizes: 230 },
  { date: "2024-04-24", assignments: 387, quizes: 290 },
  { date: "2024-04-25", assignments: 215, quizes: 250 },
  { date: "2024-04-26", assignments: 75, quizes: 130 },
  { date: "2024-04-27", assignments: 383, quizes: 420 },
  { date: "2024-04-28", assignments: 122, quizes: 180 },
  { date: "2024-04-29", assignments: 315, quizes: 240 },
  { date: "2024-04-30", assignments: 454, quizes: 380 },
  { date: "2024-05-01", assignments: 165, quizes: 220 },
  { date: "2024-05-02", assignments: 293, quizes: 310 },
  { date: "2024-05-03", assignments: 247, quizes: 190 },
  { date: "2024-05-04", assignments: 385, quizes: 420 },
  { date: "2024-05-05", assignments: 481, quizes: 390 },
  { date: "2024-05-06", assignments: 498, quizes: 520 },
  { date: "2024-05-07", assignments: 388, quizes: 300 },
  { date: "2024-05-08", assignments: 149, quizes: 210 },
  { date: "2024-05-09", assignments: 227, quizes: 180 },
  { date: "2024-05-10", assignments: 293, quizes: 330 },
  { date: "2024-05-11", assignments: 335, quizes: 270 },
  { date: "2024-05-12", assignments: 197, quizes: 240 },
  { date: "2024-05-13", assignments: 197, quizes: 160 },
  { date: "2024-05-14", assignments: 448, quizes: 490 },
  { date: "2024-05-15", assignments: 473, quizes: 380 },
  { date: "2024-05-16", assignments: 338, quizes: 400 },
  { date: "2024-05-17", assignments: 499, quizes: 420 },
  { date: "2024-05-18", assignments: 315, quizes: 350 },
  { date: "2024-05-19", assignments: 235, quizes: 180 },
  { date: "2024-05-20", assignments: 177, quizes: 230 },
  { date: "2024-05-21", assignments: 82, quizes: 140 },
  { date: "2024-05-22", assignments: 81, quizes: 120 },
  { date: "2024-05-23", assignments: 252, quizes: 290 },
  { date: "2024-05-24", assignments: 294, quizes: 220 },
  { date: "2024-05-25", assignments: 201, quizes: 250 },
  { date: "2024-05-26", assignments: 213, quizes: 170 },
  { date: "2024-05-27", assignments: 420, quizes: 460 },
  { date: "2024-05-28", assignments: 233, quizes: 190 },
  { date: "2024-05-29", assignments: 78, quizes: 130 },
  { date: "2024-05-30", assignments: 340, quizes: 280 },
  { date: "2024-05-31", assignments: 178, quizes: 230 },
  { date: "2024-06-01", assignments: 178, quizes: 200 },
  { date: "2024-06-02", assignments: 470, quizes: 410 },
  { date: "2024-06-03", assignments: 103, quizes: 160 },
  { date: "2024-06-04", assignments: 439, quizes: 380 },
  { date: "2024-06-05", assignments: 88, quizes: 140 },
  { date: "2024-06-06", assignments: 294, quizes: 250 },
  { date: "2024-06-07", assignments: 323, quizes: 370 },
  { date: "2024-06-08", assignments: 385, quizes: 320 },
  { date: "2024-06-09", assignments: 438, quizes: 480 },
  { date: "2024-06-10", assignments: 155, quizes: 200 },
  { date: "2024-06-11", assignments: 92, quizes: 150 },
  { date: "2024-06-12", assignments: 492, quizes: 420 },
  { date: "2024-06-13", assignments: 81, quizes: 130 },
  { date: "2024-06-14", assignments: 426, quizes: 380 },
  { date: "2024-06-15", assignments: 307, quizes: 350 },
  { date: "2024-06-16", assignments: 371, quizes: 310 },
  { date: "2024-06-17", assignments: 475, quizes: 520 },
  { date: "2024-06-18", assignments: 107, quizes: 170 },
  { date: "2024-06-19", assignments: 341, quizes: 290 },
  { date: "2024-06-20", assignments: 408, quizes: 450 },
  { date: "2024-06-21", assignments: 169, quizes: 210 },
  { date: "2024-06-22", assignments: 317, quizes: 270 },
  { date: "2024-06-23", assignments: 480, quizes: 530 },
  { date: "2024-06-24", assignments: 132, quizes: 180 },
  { date: "2024-06-25", assignments: 141, quizes: 190 },
  { date: "2024-06-26", assignments: 434, quizes: 380 },
  { date: "2024-06-27", assignments: 448, quizes: 490 },
  { date: "2024-06-28", assignments: 149, quizes: 200 },
  { date: "2024-06-29", assignments: 103, quizes: 160 },
  { date: "2024-06-30", assignments: 446, quizes: 400 },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  assignments: {
    label: "Assignments",
    color: "hsl(var(--chart-1))",
  },
  quizes: {
    label: "Quizes",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function Chart() {
  const [timeRange, setTimeRange] = React.useState("90d")

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Area Chart - Interactive</CardTitle>
          <CardDescription>
            Showing total visitors for the last 3 months
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-assignments)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-assignments)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-quizes)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-quizes)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="quizes"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-quizes)"
              stackId="a"
            />
            <Area
              dataKey="assignments"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-assignments)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

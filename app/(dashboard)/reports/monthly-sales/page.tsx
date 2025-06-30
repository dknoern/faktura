"use client";

import { MonthlySalesTable } from "@/components/reports/monthlySalesTable";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

export default function Page() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1); // getMonth() returns 0-11

  // Generate year options (current year back to 2020)
  const yearOptions = [];
  for (let year = currentDate.getFullYear(); year >= 2020; year--) {
    yearOptions.push(year);
  }

  // Generate month options
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // Filter month options to prevent future months in current year
  const availableMonths = selectedYear === currentDate.getFullYear() 
    ? monthOptions.filter(month => month.value <= currentDate.getMonth() + 1)
    : monthOptions;

  const handleYearChange = (year: string) => {
    const newYear = parseInt(year);
    setSelectedYear(newYear);
    
    // If switching to current year and selected month is in the future, reset to current month
    if (newYear === currentDate.getFullYear() && selectedMonth > currentDate.getMonth() + 1) {
      setSelectedMonth(currentDate.getMonth() + 1);
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(parseInt(month));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Monthly Sales</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Report Period:</span>
          </div>
          <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <MonthlySalesTable selectedYear={selectedYear} selectedMonth={selectedMonth} />
      </div>
    </div>
  );
}
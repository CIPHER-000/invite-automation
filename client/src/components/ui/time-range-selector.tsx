import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock } from "lucide-react";

interface TimeRangeSelectorProps {
  value: number | null;
  onChange: (days: number | null) => void;
  className?: string;
}

const timeRangeOptions = [
  { value: 1, label: "1 Day", icon: Clock },
  { value: 7, label: "7 Days", icon: Calendar },
  { value: 30, label: "30 Days", icon: Calendar },
  { value: 90, label: "90 Days", icon: Calendar },
  { value: null, label: "All Time", icon: Calendar },
];

export function TimeRangeSelector({ value, onChange, className = "" }: TimeRangeSelectorProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className="h-4 w-4 text-muted-foreground" />
      <Select
        value={value?.toString() || "all"}
        onValueChange={(val) => onChange(val === "all" ? null : parseInt(val))}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Time range" />
        </SelectTrigger>
        <SelectContent>
          {timeRangeOptions.map((option) => (
            <SelectItem 
              key={option.value?.toString() || "all"} 
              value={option.value?.toString() || "all"}
            >
              <div className="flex items-center space-x-2">
                <option.icon className="h-4 w-4" />
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
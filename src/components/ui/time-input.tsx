import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimeInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TimeInput({ value, onChange, placeholder = "اختر الوقت", className }: TimeInputProps) {
  const [hour, setHour] = React.useState<string>("12");
  const [minute, setMinute] = React.useState<string>("00");

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      if (h) setHour(h.padStart(2, "0"));
      if (m) setMinute(m.padStart(2, "0"));
    }
  }, [value]);

  const handleHourChange = (newHour: string) => {
    setHour(newHour);
    onChange(`${newHour}:${minute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute);
    onChange(`${hour}:${newMinute}`);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-2 flex-1">
        <Select value={hour} onValueChange={handleHourChange}>
          <SelectTrigger className="w-20 h-11">
            <SelectValue placeholder="00" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]" align="start" dir="rtl">
            {hours.map((h) => (
              <SelectItem key={h} value={h} className="text-right">
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-2xl font-bold text-muted-foreground">:</span>
        <Select value={minute} onValueChange={handleMinuteChange}>
          <SelectTrigger className="w-20 h-11">
            <SelectValue placeholder="00" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]" align="start" dir="rtl">
            {minutes.map((m) => (
              <SelectItem key={m} value={m} className="text-right">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

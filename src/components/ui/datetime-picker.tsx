import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimeInput } from "@/components/ui/time-input";
import { formatDateNumeric, formatTimeOnly } from "@/utils/dateFormatting";

interface DateTimePickerProps {
  value?: string; // ISO string
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: Date;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "اختر التاريخ والوقت",
  className,
  minDate
}: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [time, setTime] = React.useState<string>(
    value ? formatTimeOnly(new Date(value)) : "12:00"
  );

  React.useEffect(() => {
    if (value) {
      const dateObj = new Date(value);
      setDate(dateObj);
      setTime(formatTimeOnly(dateObj));
    }
  }, [value]);

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      const [hours, minutes] = time.split(":");
      newDate.setHours(parseInt(hours), parseInt(minutes));
      onChange(newDate.toISOString());
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (date) {
      const [hours, minutes] = newTime.split(":");
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      onChange(newDate.toISOString());
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-right font-normal h-11",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="ml-2 h-4 w-4" />
            {date ? (
              <span className="font-mono">{formatDateNumeric(date)}</span>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateChange}
            disabled={(date) => minDate ? date < minDate : false}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Time Picker */}
      {date && (
        <TimeInput
          value={time}
          onChange={handleTimeChange}
          placeholder="اختر الوقت"
        />
      )}
      
      {/* معاينة بالأرقام الإنجليزية */}
      {date && time && (
        <div className="text-xs text-muted-foreground text-center font-mono" dir="ltr">
          {formatDateNumeric(date)} - {time}
        </div>
      )}
    </div>
  );
}

/**
 * DateRangeFilter Component - فلتر التاريخ للتقارير
 * 
 * مكون لفلترة التقارير حسب النطاق الزمني
 */

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DateRangeFilterProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  onDateRangeChange
}) => {
  
  // فلاتر سريعة محددة مسبقاً
  const quickFilters = [
    {
      label: 'آخر 7 أيام',
      getDates: () => ({
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date()
      })
    },
    {
      label: 'آخر شهر',
      getDates: () => ({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date()
      })
    },
    {
      label: 'آخر 3 شهور',
      getDates: () => ({
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        to: new Date()
      })
    }
  ];

  return (
    <div className="flex items-center gap-2">
      {/* فلاتر سريعة */}
      <div className="flex gap-1">
        {quickFilters.map((filter, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onDateRangeChange(filter.getDates())}
            className="text-xs"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* انتقاء التاريخ المخصص */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "gap-2 text-left font-normal",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {dateRange.from ? (
              dateRange.to ? (
                <span>
                  {format(dateRange.from, "PPP", { locale: ar })} -{" "}
                  {format(dateRange.to, "PPP", { locale: ar })}
                </span>
              ) : (
                format(dateRange.from, "PPP", { locale: ar })
              )
            ) : (
              "اختر النطاق الزمني"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onDateRangeChange({ from: range.from, to: range.to });
              }
            }}
            numberOfMonths={2}
            locale={ar}
          />
        </PopoverContent>
      </Popover>

      {/* عرض النطاق المحدد */}
      {dateRange.from && dateRange.to && (
        <Badge variant="secondary" className="text-xs">
          {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} يوم
        </Badge>
      )}
    </div>
  );
};
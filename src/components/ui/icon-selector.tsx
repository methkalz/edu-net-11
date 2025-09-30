import React from 'react';
import { 
  Calendar,
  BookOpen,
  Briefcase,
  Coffee,
  Award,
  Star,
  Bell,
  Flag,
  Heart,
  Gift,
  Cake,
  Music,
  Camera,
  Trophy,
  Target,
  Rocket,
  Sparkles,
  Users,
  GraduationCap,
  Lightbulb,
  Zap,
  Crown,
  Shield,
  Bookmark
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface IconOption {
  value: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const iconOptions: IconOption[] = [
  { value: 'calendar', label: 'تقويم', Icon: Calendar },
  { value: 'book-open', label: 'كتاب', Icon: BookOpen },
  { value: 'briefcase', label: 'حقيبة', Icon: Briefcase },
  { value: 'coffee', label: 'قهوة', Icon: Coffee },
  { value: 'award', label: 'جائزة', Icon: Award },
  { value: 'star', label: 'نجمة', Icon: Star },
  { value: 'bell', label: 'جرس', Icon: Bell },
  { value: 'flag', label: 'علم', Icon: Flag },
  { value: 'heart', label: 'قلب', Icon: Heart },
  { value: 'gift', label: 'هدية', Icon: Gift },
  { value: 'cake', label: 'كعكة', Icon: Cake },
  { value: 'music', label: 'موسيقى', Icon: Music },
  { value: 'camera', label: 'كاميرا', Icon: Camera },
  { value: 'trophy', label: 'كأس', Icon: Trophy },
  { value: 'target', label: 'هدف', Icon: Target },
  { value: 'rocket', label: 'صاروخ', Icon: Rocket },
  { value: 'sparkles', label: 'تألق', Icon: Sparkles },
  { value: 'users', label: 'مجموعة', Icon: Users },
  { value: 'graduation-cap', label: 'تخرج', Icon: GraduationCap },
  { value: 'lightbulb', label: 'فكرة', Icon: Lightbulb },
  { value: 'zap', label: 'برق', Icon: Zap },
  { value: 'crown', label: 'تاج', Icon: Crown },
  { value: 'shield', label: 'درع', Icon: Shield },
  { value: 'bookmark', label: 'علامة', Icon: Bookmark },
];

interface IconSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const IconSelector: React.FC<IconSelectorProps> = ({
  value,
  onValueChange,
  placeholder = 'اختر أيقونة',
  className,
}) => {
  const selectedIcon = iconOptions.find(icon => icon.value === value);
  const SelectedIconComponent = selectedIcon?.Icon;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("h-11", className)}>
        <SelectValue placeholder={placeholder}>
          {selectedIcon && (
            <div className="flex items-center gap-2">
              {SelectedIconComponent && <SelectedIconComponent className="h-4 w-4" />}
              <span>{selectedIcon.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="z-50 max-h-[300px] bg-background" align="start" dir="rtl">
        <div className="grid grid-cols-2 gap-1 p-2">
          {iconOptions.map((icon) => {
            const IconComponent = icon.Icon;
            return (
              <SelectItem 
                key={icon.value} 
                value={icon.value}
                className="text-right cursor-pointer hover:bg-accent rounded-lg"
              >
                <div className="flex items-center gap-2 py-1">
                  <IconComponent className="h-5 w-5 text-primary" />
                  <span className="text-sm">{icon.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </div>
      </SelectContent>
    </Select>
  );
};

// Export the icon getter function
export const getIconComponent = (iconName?: string) => {
  const icon = iconOptions.find(opt => opt.value === iconName);
  return icon?.Icon || Calendar;
};

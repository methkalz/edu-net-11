import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

interface Props {
  totalQuestions: number;
  value: DifficultyDistribution;
  onChange: (distribution: DifficultyDistribution) => void;
}

type PresetType = 'balanced' | 'easy' | 'hard' | 'progressive' | 'custom';

const PRESETS: Record<PresetType, DifficultyDistribution> = {
  balanced: { easy: 33, medium: 34, hard: 33 },
  easy: { easy: 60, medium: 30, hard: 10 },
  hard: { easy: 10, medium: 30, hard: 60 },
  progressive: { easy: 50, medium: 30, hard: 20 },
  custom: { easy: 33, medium: 34, hard: 33 }
};

const PRESET_LABELS: Record<PresetType, string> = {
  balanced: 'متوازن',
  easy: 'سهل',
  hard: 'صعب',
  progressive: 'متدرج',
  custom: 'مخصص'
};

export function DifficultyDistributionSelector({ totalQuestions, value, onChange }: Props) {
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('balanced');
  
  // حساب عدد الأسئلة الفعلي لكل مستوى
  const actualCounts = {
    easy: Math.round((value.easy / 100) * totalQuestions),
    medium: Math.round((value.medium / 100) * totalQuestions),
    hard: Math.round((value.hard / 100) * totalQuestions)
  };
  
  const total = value.easy + value.medium + value.hard;
  const isValid = Math.abs(total - 100) < 0.1;
  
  const handlePresetClick = (preset: PresetType) => {
    setSelectedPreset(preset);
    onChange(PRESETS[preset]);
  };
  
  const handleSliderChange = (key: keyof DifficultyDistribution, newValue: number) => {
    setSelectedPreset('custom');
    
    // توزيع الباقي على المستويات الأخرى
    const remaining = 100 - newValue;
    const others = Object.keys(value).filter(k => k !== key) as (keyof DifficultyDistribution)[];
    const otherTotal = others.reduce((sum, k) => sum + value[k], 0);
    
    const newDistribution: DifficultyDistribution = { ...value, [key]: newValue };
    
    if (otherTotal > 0) {
      others.forEach(k => {
        newDistribution[k] = Math.round((value[k] / otherTotal) * remaining);
      });
    } else {
      const perOther = remaining / others.length;
      others.forEach(k => {
        newDistribution[k] = Math.round(perOther);
      });
    }
    
    // تصحيح للتأكد من المجموع = 100
    const currentTotal = newDistribution.easy + newDistribution.medium + newDistribution.hard;
    if (currentTotal !== 100) {
      newDistribution[others[0]] += (100 - currentTotal);
    }
    
    onChange(newDistribution);
  };
  
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold mb-3 block">توزيع مستويات الصعوبة</Label>
        
        {/* القوالب الجاهزة */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(PRESETS) as PresetType[]).filter(p => p !== 'custom').map(preset => (
            <Button
              key={preset}
              type="button"
              variant={selectedPreset === preset ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick(preset)}
            >
              {PRESET_LABELS[preset]}
            </Button>
          ))}
        </div>
        
        {/* Sliders */}
        <div className="space-y-4">
          {/* سهل */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm">🟢 سهل</Label>
              <span className="text-sm font-medium">
                {value.easy}% ({actualCounts.easy} {actualCounts.easy === 1 ? 'سؤال' : 'أسئلة'})
              </span>
            </div>
            <Slider
              value={[value.easy]}
              onValueChange={(v) => handleSliderChange('easy', v[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          
          {/* متوسط */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm">🟡 متوسط</Label>
              <span className="text-sm font-medium">
                {value.medium}% ({actualCounts.medium} {actualCounts.medium === 1 ? 'سؤال' : 'أسئلة'})
              </span>
            </div>
            <Slider
              value={[value.medium]}
              onValueChange={(v) => handleSliderChange('medium', v[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          
          {/* صعب */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm">🔴 صعب</Label>
              <span className="text-sm font-medium">
                {value.hard}% ({actualCounts.hard} {actualCounts.hard === 1 ? 'سؤال' : 'أسئلة'})
              </span>
            </div>
            <Slider
              value={[value.hard]}
              onValueChange={(v) => handleSliderChange('hard', v[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
        
        {/* تحذير إذا المجموع ≠ 100 */}
        {!isValid && (
          <div className="flex items-center gap-2 mt-3 text-sm text-orange-600 bg-orange-50 p-2 rounded">
            <AlertCircle className="w-4 h-4" />
            <span>المجموع يجب أن يكون 100% (حالياً: {total.toFixed(1)}%)</span>
          </div>
        )}
        
        {/* معاينة بصرية */}
        <div className="mt-4 h-8 flex rounded-lg overflow-hidden border border-border">
          <div 
            className="bg-green-500 flex items-center justify-center text-xs text-white font-medium transition-all"
            style={{ width: `${value.easy}%` }}
          >
            {value.easy > 10 && `${actualCounts.easy}`}
          </div>
          <div 
            className="bg-yellow-500 flex items-center justify-center text-xs text-white font-medium transition-all"
            style={{ width: `${value.medium}%` }}
          >
            {value.medium > 10 && `${actualCounts.medium}`}
          </div>
          <div 
            className="bg-red-500 flex items-center justify-center text-xs text-white font-medium transition-all"
            style={{ width: `${value.hard}%` }}
          >
            {value.hard > 10 && `${actualCounts.hard}`}
          </div>
        </div>
      </div>
    </div>
  );
}

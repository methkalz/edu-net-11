/**
 * ReportCard Component - كارد التقارير المتقدم
 * 
 * مكون لعرض تقرير واحد بتصميم متقدم وتأثيرات بصرية جذابة
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, Eye, TrendingUp } from 'lucide-react';

interface ReportCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  data: number;
  onClick?: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  title,
  description,
  icon: Icon,
  color,
  data,
  onClick
}) => {
  return (
    <Card className={`glass-card hover:scale-105 transition-all duration-300 cursor-pointer ${color}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">{title}</CardTitle>
              <CardDescription className="text-white/80 text-sm">
                {description}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {typeof data === 'number' ? data.toLocaleString() : data}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/80">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">متاح للعرض</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 border-white/30"
            onClick={onClick}
          >
            <Eye className="h-4 w-4 ml-2" />
            عرض التفاصيل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
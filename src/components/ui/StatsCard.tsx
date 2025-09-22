import { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  icon: React.ElementType;
  gradient?: string;
  shadow?: string;
  color?: string;
  animation?: string;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
}

export const StatsCard: FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  gradient = 'gradient-primary',
  shadow = 'shadow-lg',
  color = 'text-white',
  animation = '',
  loading = false,
  error,
  onRefresh
}) => {
  if (loading) {
    return (
      <Card className={`${shadow} border-0`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${shadow} border-red-200`}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  className="mr-2 h-6 px-2"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${shadow} border-0 ${animation} hover:scale-105 transition-all duration-300`}>
      <CardContent className="p-0">
        <div className={`${gradient} p-6 rounded-lg`}>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className={`${color} text-sm font-medium opacity-90`}>
                {title}
              </p>
              <h3 className={`${color} text-3xl font-bold`}>
                {value}
              </h3>
              {change && (
                <p className={`${color} text-xs opacity-75`}>
                  {change}
                </p>
              )}
            </div>
            <div className={`${color} opacity-80`}>
              <Icon className="h-12 w-12" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
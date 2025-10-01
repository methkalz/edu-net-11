// نظام الأوسمة للطلاب
export interface Badge {
  id: string;
  name: string;
  title: string;
  image: string;
  minPoints: number;
  maxPoints: number;
  description?: string;
}

export interface BadgeInfo {
  badge: Badge | null;
  hasBadge: boolean;
}

import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Calendar, Users, RefreshCw, Eye, BookOpen, Loader2, Trash2, Pause, Play, Plus, Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  useTeacherEligibleClasses,
  useExamPublications,
  useBagrutPublicationMutations,
  BagrutPublicationRow,
} from '@/hooks/useBagrutPublications';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: {
    id: string;
    title: string;
    subject: string;
    exam_year: number;
    duration_minutes: number;
    available_for_grades?: string[] | null;
  } | null;
}

interface PerClassDraft {
  enabled: boolean;
  available_from: string;
  available_until: string;
  max_attempts: number;
  show_answers_to_students: boolean;
  allow_review_after_submit: boolean;
  notes: string;
}

const defaultDraft = (): PerClassDraft => {
  const now = new Date();
  const start = new Date(now.getTime() + 5 * 60 * 1000);
  const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => {
    const z = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
  };
  return {
    enabled: false,
    available_from: fmt(start),
    available_until: fmt(end),
    max_attempts: 1,
    show_answers_to_students: false,
    allow_review_after_submit: true,
    notes: '',
  };
};

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const z = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
};

export default function BagrutTeacherPublishDialog({ open, onOpenChange, exam }: Props) {
  const { user } = useAuth();
  const { data: eligibleClasses, isLoading: classesLoading } =
    useTeacherEligibleClasses(exam?.id, exam?.available_for_grades || undefined);
  const { data: publications, isLoading: pubsLoading } = useExamPublications(exam?.id);
  const { create, update, remove } = useBagrutPublicationMutations(exam?.id);

  const [drafts, setDrafts] = useState<Record<string, PerClassDraft>>({});
  const [pendingDelete, setPendingDelete] = useState<BagrutPublicationRow | null>(null);

  const publishedClassIds = useMemo(
    () => new Set((publications || []).map(p => p.class_id)),
    [publications]
  );

  useEffect(() => {
    if (!open || !eligibleClasses) return;
    const next: Record<string, PerClassDraft> = {};
    for (const c of eligibleClasses) {
      if (publishedClassIds.has(c.class_id)) continue;
      next[c.class_id] = drafts[c.class_id] || defaultDraft();
    }
    setDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, eligibleClasses, publishedClassIds]);

  const updateDraft = (classId: string, patch: Partial<PerClassDraft>) => {
    setDrafts(prev => ({ ...prev, [classId]: { ...prev[classId], ...patch } }));
  };

  const applyFirstToAll = () => {
    const enabledIds = Object.keys(drafts).filter(id => drafts[id].enabled);
    if (enabledIds.length < 2) {
      toast.info('فعّل صفّين أو أكثر لاستخدام النسخ.');
      return;
    }
    const source = drafts[enabledIds[0]];
    const next = { ...drafts };
    for (const id of enabledIds.slice(1)) {
      next[id] = { ...source, enabled: true };
    }
    setDrafts(next);
    toast.success('تم نسخ إعدادات الصف الأول إلى الباقي');
  };

  const handlePublishAll = async () => {
    if (!exam || !user?.id) return;
    const targets = Object.entries(drafts).filter(([_, d]) => d.enabled);
    if (targets.length === 0) {
      toast.error('اختر صفّاً واحداً على الأقل ثم فعّل خانة "نشر".');
      return;
    }
    for (const [classId, d] of targets) {
      const from = new Date(d.available_from);
      const to = new Date(d.available_until);
      if (!(from < to)) { toast.error('تاريخ النهاية يجب أن يكون بعد البداية'); return; }
    }
    let ok = 0, fail = 0;
    for (const [classId, d] of targets) {
      try {
        await create.mutateAsync({
          exam_id: exam.id,
          teacher_id: user.id,
          class_id: classId,
          available_from: new Date(d.available_from).toISOString(),
          available_until: new Date(d.available_until).toISOString(),
          max_attempts: d.max_attempts,
          show_answers_to_students: d.show_answers_to_students,
          allow_review_after_submit: d.allow_review_after_submit,
          notes: d.notes || null,
        });
        ok++;
      } catch { fail++; }
    }
    if (ok > 0) toast.success(`تم نشر الامتحان لـ ${ok} صف`);
    if (fail > 0) toast.error(`فشل النشر لـ ${fail} صف`);
  };

  const unpublishedEligible = (eligibleClasses || []).filter(c => !publishedClassIds.has(c.class_id));

  if (!exam) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent dir="rtl" className="max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-500" />
              نشر الامتحان لصفوفك
            </DialogTitle>
            <DialogDescription>
              {exam.title} — {exam.subject} ({exam.exam_year})
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6 space-y-6">
              {/* النشرات الحالية */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" /> النشرات الحالية
                    <Badge variant="secondary">{publications?.length || 0}</Badge>
                  </h3>
                </div>
                {pubsLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (publications?.length || 0) === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                    لا توجد نشرات حالية. أضف نشراً للصفوف أدناه.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {publications!.map(p => (
                      <PublicationRow
                        key={p.id}
                        pub={p}
                        eligibleClasses={eligibleClasses || []}
                        onToggle={(active) => update.mutate({ id: p.id, patch: { is_active: active } })}
                        onSave={(patch) => update.mutate({ id: p.id, patch })}
                        onDelete={() => setPendingDelete(p)}
                        saving={update.isPending}
                      />
                    ))}
                  </div>
                )}
              </section>

              <Separator />

              {/* نشر جديد */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-600" /> نشر جديد لصفوف غير منشورة
                  </h3>
                  {Object.values(drafts).filter(d => d.enabled).length >= 2 && (
                    <Button variant="ghost" size="sm" onClick={applyFirstToAll}>
                      <Copy className="h-4 w-4 ml-1" /> تطبيق إعدادات الصف الأول
                    </Button>
                  )}
                </div>

                {classesLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : unpublishedEligible.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                    {(eligibleClasses?.length || 0) === 0
                      ? 'لا توجد صفوف مؤهلة لديك لهذا الامتحان.'
                      : 'كل صفوفك المؤهلة منشورة بالفعل.'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {unpublishedEligible.map(c => {
                      const d = drafts[c.class_id] || defaultDraft();
                      return (
                        <div
                          key={c.class_id}
                          className={`rounded-lg border p-4 transition-colors ${d.enabled ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-900/10' : 'bg-card'}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={d.enabled}
                                onCheckedChange={(v) => updateDraft(c.class_id, { enabled: v })}
                              />
                              <div>
                                <p className="font-medium">{c.class_label}</p>
                                <p className="text-xs text-muted-foreground">
                                  {c.grade_label} • {c.students_count} طالب
                                </p>
                              </div>
                            </div>
                          </div>

                          {d.enabled && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Field label="من تاريخ" icon={Calendar}>
                                <Input
                                  type="datetime-local"
                                  value={d.available_from}
                                  onChange={(e) => updateDraft(c.class_id, { available_from: e.target.value })}
                                />
                              </Field>
                              <Field label="إلى تاريخ" icon={Calendar}>
                                <Input
                                  type="datetime-local"
                                  value={d.available_until}
                                  onChange={(e) => updateDraft(c.class_id, { available_until: e.target.value })}
                                />
                              </Field>
                              <Field label="عدد المحاولات" icon={RefreshCw}>
                                <Input
                                  type="number" min={1} max={20}
                                  value={d.max_attempts}
                                  onChange={(e) => updateDraft(c.class_id, { max_attempts: Math.max(1, parseInt(e.target.value) || 1) })}
                                />
                              </Field>
                              <div className="space-y-2">
                                <ToggleRow
                                  label="إظهار الإجابات بعد التسليم"
                                  checked={d.show_answers_to_students}
                                  onChange={(v) => updateDraft(c.class_id, { show_answers_to_students: v })}
                                />
                                <ToggleRow
                                  label="السماح بمراجعة الإجابات بعد التسليم"
                                  checked={d.allow_review_after_submit}
                                  onChange={(v) => updateDraft(c.class_id, { allow_review_after_submit: v })}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>

          <DialogFooter className="p-4 border-t shrink-0 flex-row-reverse gap-2">
            <Button onClick={handlePublishAll} disabled={create.isPending}>
              {create.isPending ? (<><Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري النشر...</>) : 'نشر للصفوف المختارة'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف النشر؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف نشر هذا الامتحان للصف نهائياً. إذا كانت هناك محاولات لطلاب، استخدم "إيقاف" بدلاً من الحذف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (pendingDelete) {
                  await remove.mutateAsync(pendingDelete.id).catch(() => {});
                  setPendingDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </Label>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function PublicationRow({
  pub, eligibleClasses, onToggle, onSave, onDelete, saving,
}: {
  pub: BagrutPublicationRow;
  eligibleClasses: Array<{ class_id: string; class_label: string; grade_label: string; students_count: number }>;
  onToggle: (active: boolean) => void;
  onSave: (patch: any) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const cls = eligibleClasses.find(c => c.class_id === pub.class_id);
  const [editing, setEditing] = useState(false);
  const [from, setFrom] = useState(toLocalInput(pub.available_from));
  const [until, setUntil] = useState(toLocalInput(pub.available_until));
  const [max, setMax] = useState(pub.max_attempts);
  const [showAns, setShowAns] = useState(pub.show_answers_to_students);
  const [review, setReview] = useState(pub.allow_review_after_submit);

  const now = new Date();
  const start = new Date(pub.available_from);
  const end = new Date(pub.available_until);
  const status = !pub.is_active ? 'متوقف' : end < now ? 'منتهي' : start > now ? 'مجدول' : 'نشط';
  const statusColor =
    status === 'نشط' ? 'bg-green-100 text-green-700' :
    status === 'مجدول' ? 'bg-blue-100 text-blue-700' :
    status === 'منتهي' ? 'bg-gray-100 text-gray-700' :
    'bg-amber-100 text-amber-700';

  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="font-medium">{cls?.class_label || 'صف'}</p>
          <p className="text-xs text-muted-foreground">
            {cls?.grade_label} • {cls?.students_count ?? 0} طالب
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={statusColor}>{status}</Badge>
          <Button size="sm" variant="ghost" onClick={() => onToggle(!pub.is_active)} disabled={saving}>
            {pub.is_active ? (<><Pause className="h-4 w-4 ml-1" /> إيقاف</>) : (<><Play className="h-4 w-4 ml-1" /> تفعيل</>)}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(v => !v)}>
            {editing ? 'إلغاء' : 'تعديل'}
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!editing ? (
        <div className="text-xs text-muted-foreground mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
          <span>من: {start.toLocaleString('ar')}</span>
          <span>إلى: {end.toLocaleString('ar')}</span>
          <span>محاولات: {pub.max_attempts}</span>
          <span>{pub.show_answers_to_students ? 'الإجابات ظاهرة' : 'الإجابات مخفية'}</span>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          <Field label="من تاريخ" icon={Calendar}>
            <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="إلى تاريخ" icon={Calendar}>
            <Input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
          </Field>
          <Field label="عدد المحاولات" icon={RefreshCw}>
            <Input type="number" min={1} max={20} value={max}
              onChange={(e) => setMax(Math.max(1, parseInt(e.target.value) || 1))} />
          </Field>
          <div className="space-y-2">
            <ToggleRow label="إظهار الإجابات" checked={showAns} onChange={setShowAns} />
            <ToggleRow label="السماح بالمراجعة" checked={review} onChange={setReview} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                const f = new Date(from), u = new Date(until);
                if (!(f < u)) { toast.error('تاريخ النهاية يجب أن يكون بعد البداية'); return; }
                onSave({
                  available_from: f.toISOString(),
                  available_until: u.toISOString(),
                  max_attempts: max,
                  show_answers_to_students: showAns,
                  allow_review_after_submit: review,
                });
                setEditing(false);
              }}
            >
              حفظ التغييرات
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

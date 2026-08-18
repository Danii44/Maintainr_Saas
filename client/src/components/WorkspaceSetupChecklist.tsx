import { CheckCircle2, Circle, Settings2, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "../contexts/LanguageContext";

export function WorkspaceSetupChecklist() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const onboarding = trpc.workspace.onboarding.useQuery(undefined, { retry: false });
  const complete = trpc.workspace.completeOnboarding.useMutation({
    onSuccess: async () => {
      await utils.workspace.onboarding.invalidate();
      toast.success(t("Workspace setup marked complete", "تم تحديد إعداد مساحة العمل كمكتمل"));
    },
  });

  if (onboarding.isLoading || onboarding.data?.completed) return null;

  const steps = [
    { icon: Settings2, title: t("Set your workspace identity", "اضبط هوية مساحة العمل"), description: t("Review your English and Arabic names, logo, and colors.", "راجع الاسم بالإنجليزية والعربية والشعار والألوان."), href: "/settings", action: t("Open settings", "فتح الإعدادات") },
    { icon: UsersRound, title: t("Prepare your people access", "جهّز وصول المستخدمين"), description: t("Review applications, add tenants, and invite field technicians.", "راجع الطلبات، وأضف المستأجرين، وادعُ الفنيين الميدانيين."), href: "/manager?view=people", action: t("Manage people", "إدارة المستخدمين") },
    { icon: Circle, title: t("Start your operating record", "ابدأ سجلك التشغيلي"), description: t("Review your first property, then create unit access and maintenance workflows.", "راجع عقارك الأول، ثم أنشئ وصول الوحدات ومسارات أعمال الصيانة."), href: "/manager", action: t("View overview", "عرض النظرة العامة") },
  ];

  return <Card className="mb-6 overflow-hidden border-violet-200 bg-gradient-to-br from-violet-50 via-white to-cyan-50 shadow-sm dark:border-violet-400/20 dark:from-violet-500/[.10] dark:via-[#101521] dark:to-cyan-400/[.06]"><CardHeader className="border-b border-slate-200/80 dark:border-white/[.07]"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-teal-700 dark:text-cyan-300">{t("Workspace setup", "إعداد مساحة العمل")}</p><CardTitle className="mt-2 text-xl text-slate-900 dark:text-white">{t("Complete your Manager checklist", "أكمل قائمة المدير الخاصة بك")}</CardTitle><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">{t("These guided links keep organization setup clear without exposing infrastructure or provider secrets in the product.", "تحافظ هذه الروابط الإرشادية على وضوح إعداد المؤسسة دون عرض أسرار البنية التحتية أو مزودي الخدمة داخل المنتج.")}</p></div><Button variant="outline" className="shrink-0 border-violet-200 bg-white/85 text-violet-700 hover:bg-violet-100 dark:border-violet-300/30 dark:bg-transparent dark:text-violet-100 dark:hover:bg-violet-400/10" disabled={complete.isPending} onClick={() => complete.mutate()}>{complete.isPending ? t("Saving...", "جارٍ الحفظ...") : t("Mark complete", "تحديد كمكتمل")}</Button></div></CardHeader><CardContent className="grid gap-3 p-4 lg:grid-cols-3">{steps.map(({ icon: Icon, title, description, href, action }) => <div key={title} className="rounded-2xl border border-slate-200/90 bg-white/85 p-4 shadow-sm dark:border-white/[.08] dark:bg-black/10"><div className="flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200"><Icon size={18}/></div><div><h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{description}</p><Link href={href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 dark:text-cyan-300 dark:hover:text-cyan-200">{action}<CheckCircle2 size={14}/></Link></div></div></div>)}</CardContent></Card>;
}

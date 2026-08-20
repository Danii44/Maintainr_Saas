import { CheckCircle2, Circle, Settings2, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "../contexts/LanguageContext";

export function WorkspaceSetupChecklist() {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("maintainr-setup-checklist-dismissed") === "true");
  const utils = trpc.useUtils();
  const onboarding = trpc.workspace.onboarding.useQuery(undefined, { retry: false });
  const complete = trpc.workspace.completeOnboarding.useMutation({
    onSuccess: async () => {
      await utils.workspace.onboarding.invalidate();
      toast.success(t("Workspace setup marked complete", "تم تحديد إعداد مساحة العمل كمكتمل"));
    },
  });

  if (onboarding.isLoading || onboarding.data?.completed || dismissed) return null;

  const steps = [
    { icon: Settings2, title: t("Set your workspace identity", "اضبط هوية مساحة العمل"), description: t("Review your English and Arabic names, logo, and colors.", "راجع الاسم بالإنجليزية والعربية والشعار والألوان."), href: "/settings", action: t("Open settings", "فتح الإعدادات") },
    { icon: UsersRound, title: t("Prepare your people access", "جهّز وصول المستخدمين"), description: t("Review applications, add tenants, and invite field technicians.", "راجع الطلبات، وأضف المستأجرين، وادعُ الفنيين الميدانيين."), href: "/manager?view=people", action: t("Manage people", "إدارة المستخدمين") },
    { icon: Circle, title: t("Start your operating record", "ابدأ سجلك التشغيلي"), description: t("Review your first property, then create unit access and maintenance workflows.", "راجع عقارك الأول، ثم أنشئ وصول الوحدات ومسارات أعمال الصيانة."), href: "/manager", action: t("View overview", "عرض النظرة العامة") },
  ];

  return <Card className="mb-6 overflow-hidden border-teal-200 bg-white shadow-sm dark:border-teal-400/20 dark:bg-[#101521]"><CardHeader className="border-b border-slate-200/80 py-4 dark:border-white/[.07]"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-teal-700 dark:text-teal-200">{t("Workspace setup", "إعداد مساحة العمل")}</p><CardTitle className="mt-1 text-base text-slate-900 dark:text-white">{t("Finish the essentials, then keep this out of your daily view.", "أكمل الأساسيات ثم أخفِ هذه القائمة عن العرض اليومي.")}</CardTitle></div><div className="flex gap-2"><Button variant="outline" size="sm" className="border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-transparent dark:text-slate-200" onClick={() => { window.localStorage.setItem("maintainr-setup-checklist-dismissed", "true"); setDismissed(true); }}><X size={15}/>{t("Dismiss", "إخفاء")}</Button><Button size="sm" className="bg-teal-700 hover:bg-teal-800" disabled={complete.isPending} onClick={() => complete.mutate()}>{complete.isPending ? t("Saving...", "جارٍ الحفظ...") : t("Mark complete", "تحديد كمكتمل")}</Button></div></div></CardHeader><CardContent className="grid gap-3 p-4 lg:grid-cols-3">{steps.map(({ icon: Icon, title, description, href, action }) => <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/[.08] dark:bg-white/[.025]"><div className="flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-200"><Icon size={18}/></div><div><h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{description}</p><Link href={href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100">{action}<CheckCircle2 size={14}/></Link></div></div></div>)}</CardContent></Card>;
}

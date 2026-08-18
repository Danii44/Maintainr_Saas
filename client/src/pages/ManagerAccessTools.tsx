import { useState } from "react";
import { Building2, KeyRound, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "../contexts/LanguageContext";

export function ManagerAccessTools() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [floorNumber, setFloorNumber] = useState("1");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerUnitId, setOwnerUnitId] = useState("");
  const reset = trpc.manager.sendPasswordReset.useMutation();
  const properties = trpc.manager.listProperties.useQuery();
  const createUnit = trpc.manager.createUnit.useMutation();
  const createOwner = trpc.manager.createOwner.useMutation();

  const submitUnit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await createUnit.mutateAsync({ propertyId: Number(propertyId), unitNumber, floorNumber: Number(floorNumber) });
      setUnitNumber("");
      toast.success(t(`Unit created. Access code: ${result.accessCode}`, `تم إنشاء الوحدة. رمز الدخول: ${result.accessCode}`));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Unable to create unit", "تعذر إنشاء الوحدة"));
    }
  };

  const submitOwner = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createOwner.mutateAsync({ name: ownerName, email: ownerEmail, unitId: Number(ownerUnitId) });
      setOwnerName("");
      setOwnerEmail("");
      toast.success(t("Owner account is ready for secure password activation.", "حساب المالك جاهز لتفعيل كلمة المرور بأمان."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Unable to create owner account", "تعذر إنشاء حساب المالك"));
    }
  };

  return <div className="mb-8 grid gap-5 xl:grid-cols-3">
    <Card className="border-cyan-400/15 bg-cyan-400/[.03] xl:col-span-3">
      <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><KeyRound size={18} className="text-cyan-300"/>{t("Account access", "وصول الحسابات")}</CardTitle><p className="text-sm text-slate-400">{t("Send a secure reset link to a separate user account. Never share Manager passwords.", "أرسل رابط إعادة تعيين آمناً لحساب مستخدم منفصل. لا تشارك كلمة مرور المدير أبداً.")}</p></CardHeader>
      <CardContent><form className="flex flex-col gap-3 sm:flex-row" onSubmit={async event => { event.preventDefault(); try { await reset.mutateAsync({ email }); setEmail(""); toast.success(t("If the account exists, a reset email was sent.", "إذا كان الحساب موجوداً، تم إرسال رسالة إعادة التعيين.")); } catch (error) { toast.error(error instanceof Error ? error.message : t("Unable to send reset link", "تعذر إرسال رابط إعادة التعيين")); } }}><Input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder={t("User email address", "البريد الإلكتروني للمستخدم")} className="border-white/10 bg-white/[.03]"/><Button type="submit" disabled={reset.isPending} className="bg-cyan-400 text-black hover:bg-cyan-300">{reset.isPending ? t("Sending...", "جارٍ الإرسال...") : t("Send reset link", "إرسال رابط إعادة التعيين")}</Button></form></CardContent>
    </Card>

    <Card className="border-violet-400/15 bg-violet-400/[.03]">
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 size={18} className="text-violet-300"/>{t("Add a unit", "إضافة وحدة")}</CardTitle><p className="text-sm text-slate-400">{t("Create a unit in one of your workspace properties.", "أنشئ وحدة في أحد عقارات مساحة عملك.")}</p></CardHeader>
      <CardContent><form className="space-y-3" onSubmit={submitUnit}><select aria-label={t("Property", "العقار")} value={propertyId} onChange={event => setPropertyId(event.target.value)} required className="flex h-10 w-full rounded-md border border-white/10 bg-white/[.03] px-3 text-sm"><option value="">{properties.isLoading ? t("Loading properties...", "جارٍ تحميل العقارات...") : t("Choose a property", "اختر عقاراً")}</option>{(properties.data ?? []).map(property => <option key={property.id} value={property.id}>{property.name}</option>)}</select><div className="grid grid-cols-[1fr_5.5rem] gap-3"><Input required value={unitNumber} onChange={event => setUnitNumber(event.target.value)} placeholder={t("Unit number", "رقم الوحدة")}/><Input required inputMode="numeric" type="number" min="0" value={floorNumber} onChange={event => setFloorNumber(event.target.value)} placeholder={t("Floor", "الطابق")}/></div><Button type="submit" disabled={createUnit.isPending || !propertyId || !unitNumber.trim()} className="w-full bg-violet-500 hover:bg-violet-400">{createUnit.isPending ? t("Creating...", "جارٍ الإنشاء...") : t("Create unit", "إنشاء الوحدة")}</Button></form></CardContent>
    </Card>

    <Card className="border-emerald-400/15 bg-emerald-400/[.03]">
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRoundPlus size={18} className="text-emerald-300"/>{t("Add a flat owner", "إضافة مالك شقة")}</CardTitle><p className="text-sm text-slate-400">{t("Create a separate owner account and link it to a unit.", "أنشئ حساب مالك منفصلاً واربطه بوحدة.")}</p></CardHeader>
      <CardContent><form className="space-y-3" onSubmit={submitOwner}><Input required value={ownerName} onChange={event => setOwnerName(event.target.value)} placeholder={t("Owner name", "اسم المالك")}/><Input required type="email" value={ownerEmail} onChange={event => setOwnerEmail(event.target.value)} placeholder={t("Owner email", "بريد المالك الإلكتروني")}/><Input required inputMode="numeric" value={ownerUnitId} onChange={event => setOwnerUnitId(event.target.value)} placeholder={t("Unit ID", "معرف الوحدة")}/><Button type="submit" disabled={createOwner.isPending || !ownerName.trim() || !ownerEmail.trim() || !Number(ownerUnitId)} className="w-full bg-emerald-500 text-black hover:bg-emerald-400">{createOwner.isPending ? t("Creating...", "جارٍ الإنشاء...") : t("Create owner account", "إنشاء حساب المالك")}</Button></form></CardContent>
    </Card>
  </div>;
}

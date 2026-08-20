import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, BarChart3, CalendarDays, CheckCircle2, CircleHelp, ClipboardList, Clock3, MessageSquare, Pencil, Plus, SendHorizontal, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "./contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

type PortalRole = "PROPERTY_MANAGER" | "TENANT" | "TECHNICIAN" | "FLAT_OWNER";
type WorkspaceView = "analytics" | "tickets" | "messages" | "calendar" | "inquiries" | "reminders";

const supportedViews = new Set<WorkspaceView>(["analytics", "tickets", "messages", "calendar", "inquiries", "reminders"]);

function PanelHeading({ icon: Icon, eyebrow, title, description, action }: { icon: typeof BarChart3; eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-teal-700"><Icon size={15}/>{eyebrow}</div><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-slate-900 sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p></div>{action}</div>;
}

function AnalyticsPanel({ role }: { role: PortalRole }) {
  const { t } = useLanguage();
  const summary = trpc.operations.dashboard.summary.useQuery(undefined, { retry: false });
  const oversight = trpc.operations.manager.oversight.useQuery(undefined, { enabled: role === "PROPERTY_MANAGER", retry: false });
  const metrics = summary.data?.metrics;
  const total = (metrics?.openTickets ?? 0) + (metrics?.resolvedTickets ?? 0);
  const completion = total ? Math.round(((metrics?.resolvedTickets ?? 0) / total) * 100) : 0;
  const cards = [
    { label: t("Open work", "الأعمال المفتوحة"), value: metrics?.openTickets ?? 0, tone: "from-teal-500 to-emerald-400" },
    { label: t("Scheduled visits", "الزيارات المجدولة"), value: metrics?.scheduledVisits ?? 0, tone: "from-sky-500 to-cyan-400" },
    { label: t("Urgent attention", "حالات عاجلة"), value: metrics?.urgentTickets ?? 0, tone: "from-amber-500 to-orange-400" },
    { label: t("Open inquiries", "استفسارات مفتوحة"), value: metrics?.openInquiries ?? 0, tone: "from-violet-500 to-fuchsia-400" },
  ];
  return <>
    <PanelHeading icon={BarChart3} eyebrow={t("Live operations", "العمليات المباشرة")} title={role === "PROPERTY_MANAGER" ? t("Portfolio health, at a glance.", "صحة المحفظة في لمحة.") : t("Your maintenance pulse.", "ملخص الصيانة الخاص بك.")} description={t("A single operational view of requests, scheduled visits, and service questions in the workspace.", "عرض تشغيلي موحد للطلبات والزيارات المجدولة وأسئلة الخدمة في مساحة العمل.")} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <Card key={card.label} className="overflow-hidden border-[#dce9e6] bg-white shadow-[0_16px_36px_-30px_rgba(15,118,110,.55)]"><CardContent className="relative p-5"><div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.tone}`}/><div className="text-xs font-medium text-slate-500">{card.label}</div><div className="mt-3 text-4xl font-semibold tracking-[-.05em] text-slate-900">{summary.isLoading ? "—" : card.value}</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full bg-gradient-to-r ${card.tone}`} style={{ width: `${Math.min(100, Math.max(14, Number(card.value) * 22))}%` }}/></div></CardContent></Card>)}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[.85fr_1.5fr_.85fr]">
      <Card className="border-[#dce9e6] bg-white"><CardHeader><CardTitle className="text-base text-slate-900">{t("Resolution progress", "تقدم الحلول")}</CardTitle></CardHeader><CardContent className="flex flex-col items-center pb-7"><div className="grid size-40 place-items-center rounded-full" style={{ background: `conic-gradient(#0f766e ${completion * 3.6}deg, #e7f0ee 0deg)` }}><div className="grid size-28 place-items-center rounded-full bg-white text-center"><span className="text-3xl font-semibold text-slate-900">{completion}%</span><span className="text-[10px] uppercase tracking-[.18em] text-slate-400">{t("resolved", "محلول")}</span></div></div><p className="mt-5 text-center text-xs leading-5 text-slate-500">{t("Based on requests visible to this role.", "بناءً على الطلبات الظاهرة لهذا الدور.")}</p></CardContent></Card>
      <Card className="border-[#dce9e6] bg-white"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-base text-slate-900">{t("Workload trend", "اتجاه عبء العمل")}</CardTitle><p className="mt-1 text-xs text-slate-500">{t("Request movement across the current workspace.", "حركة الطلبات في مساحة العمل الحالية.")}</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">{t("Live", "مباشر")}</span></CardHeader><CardContent className="pb-7"><div className="flex h-44 items-end gap-3 border-b border-dashed border-slate-200 pb-4">{[metrics?.openTickets ?? 0, metrics?.scheduledVisits ?? 0, metrics?.urgentTickets ?? 0, metrics?.openInquiries ?? 0, metrics?.resolvedTickets ?? 0].map((value, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-xl bg-gradient-to-t from-teal-700 to-teal-300" style={{ height: `${Math.max(16, Math.min(150, Number(value) * 28 + 28))}px` }}/><span className="text-[10px] text-slate-400">{[t("Open", "مفتوح"), t("Visits", "زيارات"), t("Urgent", "عاجل"), t("Questions", "أسئلة"), t("Resolved", "محلول")][index]}</span></div>)}</div></CardContent></Card>
      <Card className="maintainr-next-focus border-[#dce9e6] bg-[linear-gradient(145deg,#0f766e,#087b92)] text-white"><CardContent className="p-6"><div className="text-xs font-semibold uppercase tracking-[.18em] text-teal-100">{t("Next focus", "التركيز التالي")}</div><div className="mt-4 text-2xl font-semibold leading-tight">{metrics?.urgentTickets ? t("Review urgent maintenance first.", "راجع الصيانة العاجلة أولاً.") : t("Your active work is under control.", "أعمالك النشطة تحت السيطرة.")}</div><p className="mt-3 text-sm leading-6 text-teal-50">{t("Use the calendar to confirm visits and messages to keep everyone informed.", "استخدم التقويم لتأكيد الزيارات والرسائل لإبقاء الجميع على اطلاع.")}</p></CardContent></Card>
    </div>
    {role === "PROPERTY_MANAGER" && <div className="mt-6 grid gap-6 xl:grid-cols-3"><Card className="border-[#dce9e6] bg-white"><CardHeader><CardTitle className="text-base text-slate-900">{t("Evidence review", "مراجعة الأدلة")}</CardTitle></CardHeader><CardContent className="space-y-3">{(oversight.data?.evidence ?? []).slice(0, 3).map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-teal-800 hover:border-teal-300">{item.fileName}<span className="mt-1 block text-xs text-slate-500">{item.purpose.replace("_", " ")} · {new Date(item.createdAt).toLocaleDateString()}</span></a>)}{!oversight.isLoading && !(oversight.data?.evidence ?? []).length && <p className="text-sm text-slate-500">{t("No proof files are waiting for review.", "لا توجد ملفات إثبات بانتظار المراجعة.")}</p>}</CardContent></Card><Card className="border-[#dce9e6] bg-white"><CardHeader><CardTitle className="text-base text-slate-900">{t("Recent operating history", "سجل العمليات الحديث")}</CardTitle></CardHeader><CardContent className="space-y-3">{(oversight.data?.history ?? []).slice(0, 4).map((item) => <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="text-sm font-medium text-slate-800">{item.action.replace("_", " ")}</div><div className="mt-1 text-xs text-slate-500">{item.message || t("Recorded maintenance activity", "نشاط صيانة مسجل")}</div></div>)}</CardContent></Card><Card className="border-[#dce9e6] bg-white"><CardHeader><CardTitle className="text-base text-slate-900">{t("People and contact records", "سجلات الأشخاص والاتصال")}</CardTitle></CardHeader><CardContent className="space-y-3">{(oversight.data?.contacts ?? []).slice(0, 4).map((person) => <div key={person.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="text-sm font-medium text-slate-800">{person.name || person.email}</div><div className="mt-1 text-xs text-slate-500">{person.role} · {person.phone || t("No phone recorded", "لا يوجد رقم هاتف مسجل")}</div></div>)}</CardContent></Card></div>}
  </>;
}

function TicketsPanel({ role }: { role: PortalRole }) {
  const { t } = useLanguage();
  const tickets = trpc.tickets.list.useQuery(undefined, { retry: false });
  const technicians = trpc.manager.listTechnicians.useQuery(undefined, { enabled: role === "PROPERTY_MANAGER", retry: false });
  const assign = trpc.tickets.assign.useMutation();
  const setPriority = trpc.tickets.setPriority.useMutation();
  const utils = trpc.useUtils();
  const [selection, setSelection] = useState<Record<number, string>>({});
  const items = tickets.data ?? [];

  const cyclePriority = async (ticketId: number, current: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY") => {
    const values = ["LOW", "MEDIUM", "HIGH", "EMERGENCY"] as const;
    await setPriority.mutateAsync({ ticketId, priority: values[(values.indexOf(current) + 1) % values.length] });
    await utils.tickets.list.invalidate();
  };

  return <>
    <PanelHeading icon={ClipboardList} eyebrow={t("Ticket operations", "عمليات البلاغات")} title={role === "PROPERTY_MANAGER" ? t("Review, assign, and prioritize work.", "راجع الأعمال وعيّنها وحدد أولوياتها.") : t("Your maintenance requests.", "طلبات الصيانة الخاصة بك.")} description={t("Daily overview stays clear. Use this dedicated workspace when a request needs operational action.", "يبقى العرض اليومي واضحاً. استخدم مساحة العمل المخصصة هذه عندما يحتاج البلاغ إلى إجراء تشغيلي.")} />
    <Card className="border-[#dce9e6] bg-white"><CardHeader><CardTitle className="text-base text-slate-900">{t("Active ticket queue", "قائمة البلاغات النشطة")}</CardTitle></CardHeader><CardContent className="space-y-3">{tickets.isLoading ? <p className="text-sm text-slate-400">{t("Loading tickets…", "جارٍ تحميل البلاغات…")}</p> : items.length ? items.map((ticket) => <div key={ticket.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold tracking-[.1em] text-slate-500">#{ticket.id}</span><span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-700">{ticket.status.replace("_", " ")}</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">{ticket.priority}</span></div><p className="mt-3 font-semibold text-slate-900">{ticket.title}</p><p className="mt-1 text-sm text-slate-500">{ticket.category} · {new Date(ticket.createdAt).toLocaleDateString()}</p></div>{role === "PROPERTY_MANAGER" && <div className="flex flex-wrap items-center gap-2"><Select value={selection[ticket.id] ?? "none"} onValueChange={(value) => setSelection((current) => ({ ...current, [ticket.id]: value }))}><SelectTrigger className="w-48 border-slate-200 bg-white text-slate-900"><SelectValue placeholder={t("Choose technician", "اختر الفني")}/></SelectTrigger><SelectContent><SelectItem value="none">{t("Choose technician", "اختر الفني")}</SelectItem>{(technicians.data ?? []).map((technician) => <SelectItem key={technician.id} value={String(technician.id)}>{technician.name || technician.email || `#${technician.id}`}</SelectItem>)}</SelectContent></Select><Button size="sm" disabled={!selection[ticket.id] || selection[ticket.id] === "none" || assign.isPending} className="bg-teal-700 hover:bg-teal-800" onClick={async () => { await assign.mutateAsync({ ticketId: ticket.id, technicianId: Number(selection[ticket.id]) }); await utils.tickets.list.invalidate(); }}>{t("Assign", "تعيين")}</Button><Button size="sm" variant="outline" disabled={setPriority.isPending} className="border-slate-200 bg-white text-slate-700" onClick={() => cyclePriority(ticket.id, ticket.priority)}>{t("Cycle priority", "تغيير الأولوية")}</Button></div>}</div></div>) : <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">{t("No tickets are visible for this role.", "لا توجد بلاغات ظاهرة لهذا الدور.")}</div>}</CardContent></Card>
  </>;
}

function MessagesPanel() {
  const { t } = useLanguage();
  const contacts = trpc.operations.messages.contacts.useQuery(undefined, { retry: false });
  const conversations = trpc.operations.messages.list.useQuery(undefined, { retry: false });
  const [selectedId, setSelectedId] = useState<number>();
  const thread = trpc.operations.messages.thread.useQuery({ conversationId: selectedId ?? 0 }, { enabled: Boolean(selectedId), retry: false });
  const create = trpc.operations.messages.create.useMutation();
  const send = trpc.operations.messages.send.useMutation();
  const utils = trpc.useUtils();
  const [subject, setSubject] = useState("");
  const [contactId, setContactId] = useState("none");
  const [body, setBody] = useState("");
  const items = conversations.data ?? [];
  useEffect(() => { if (!selectedId && items[0]) setSelectedId(items[0].id); }, [items, selectedId]);
  const selected = items.find((item) => item.id === selectedId);
  return <>
    <PanelHeading icon={MessageSquare} eyebrow={t("Conversation centre", "مركز المحادثات")} title={t("Keep the right people in the loop.", "أبقِ الأشخاص المناسبين على اطلاع.")} description={t("Messages stay inside the workspace and are visible only to conversation members and authorized Managers.", "تبقى الرسائل داخل مساحة العمل ولا تظهر إلا لأعضاء المحادثة والمديرين المخولين.")} />
    <div className="grid gap-6 xl:grid-cols-[.75fr_1.45fr]">
      <Card className="border-[#dce9e6] bg-white"><CardHeader><CardTitle className="text-base text-slate-900">{t("Start a message", "ابدأ رسالة")}</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={t("Subject", "الموضوع")} className="border-slate-200 bg-slate-50 text-slate-900"/><Select value={contactId} onValueChange={setContactId}><SelectTrigger className="border-slate-200 bg-slate-50 text-slate-900"><SelectValue placeholder={t("Choose a contact", "اختر جهة اتصال")}/></SelectTrigger><SelectContent><SelectItem value="none">{t("Choose a contact", "اختر جهة اتصال")}</SelectItem>{(contacts.data ?? []).map((contact) => <SelectItem key={contact.id} value={String(contact.id)}>{contact.name || contact.email || `#${contact.id}`}</SelectItem>)}</SelectContent></Select><Button className="w-full bg-teal-700 hover:bg-teal-800" disabled={create.isPending || subject.trim().length < 3 || contactId === "none"} onClick={async () => { try { const result = await create.mutateAsync({ subject, participantIds: [Number(contactId)] }); await utils.operations.messages.list.invalidate(); setSelectedId(result.conversationId); setSubject(""); setContactId("none"); toast.success(t("Conversation created", "تم إنشاء المحادثة")); } catch (error) { toast.error(error instanceof Error ? error.message : t("Unable to create conversation", "تعذر إنشاء المحادثة")); } }}>{t("Create conversation", "إنشاء محادثة")} <Plus size={16}/></Button><div className="border-t border-slate-100 pt-4"><div className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">{t("Recent conversations", "المحادثات الأخيرة")}</div><div className="mt-3 space-y-2">{items.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-xl border p-3 text-left transition ${item.id === selectedId ? "border-teal-300 bg-teal-50" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"}`}><div className="truncate text-sm font-medium text-slate-900">{item.subject}</div><div className="mt-1 text-xs text-slate-500">{item.kind.replace("_", " ")} · {new Date(item.updatedAt).toLocaleDateString()}</div></button>)}</div></div></CardContent></Card>
      <Card className="flex min-h-[32rem] flex-col overflow-hidden border-[#dce9e6] bg-white xl:h-[clamp(32rem,calc(100dvh-18rem),44rem)]"><CardHeader className="shrink-0 border-b border-slate-100"><CardTitle className="text-base text-slate-900">{selected?.subject ?? t("Select a conversation", "اختر محادثة")}</CardTitle><p className="text-xs text-slate-500">{selected ? selected.kind.replace("_", " ") : t("Messages are recorded in the workspace history.", "تسجل الرسائل في سجل مساحة العمل.")}</p></CardHeader><CardContent className="flex min-h-0 flex-1 flex-col p-5"><div className="flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">{thread.isLoading ? <p className="text-sm text-slate-400">{t("Loading messages…", "جارٍ تحميل الرسائل…")}</p> : (thread.data?.messages ?? []).length ? thread.data?.messages.map((message) => <div key={message.id} className="max-w-[82%] rounded-2xl bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700"><div>{message.body}</div><div className="mt-1 text-[10px] text-slate-400">{new Date(message.createdAt).toLocaleString()}</div></div>) : <div className="grid h-full place-items-center text-center text-sm text-slate-400">{t("Choose a conversation or start one with a relevant workspace contact.", "اختر محادثة أو ابدأ واحدة مع جهة اتصال مناسبة في مساحة العمل.")}</div>}</div><div className="mt-5 flex shrink-0 gap-2 border-t border-slate-100 pt-4"><Textarea value={body} onChange={(event) => setBody(event.target.value)} disabled={!selectedId} placeholder={t("Write a message…", "اكتب رسالة…")} className="min-h-12 border-slate-200 bg-slate-50 text-slate-900"/><Button disabled={!selectedId || send.isPending || !body.trim()} className="bg-teal-700 hover:bg-teal-800" onClick={async () => { if (!selectedId) return; try { await send.mutateAsync({ conversationId: selectedId, body }); setBody(""); await thread.refetch(); await utils.operations.messages.list.invalidate(); } catch (error) { toast.error(error instanceof Error ? error.message : t("Unable to send message", "تعذر إرسال الرسالة")); } }}><SendHorizontal size={17}/></Button></div></CardContent></Card>
    </div>
  </>;
}

function CalendarPanel({ role }: { role: PortalRole }) {
  const { t } = useLanguage();
  const appointments = trpc.operations.calendar.list.useQuery(undefined, { retry: false });
  const technicians = trpc.manager.listTechnicians.useQuery(undefined, { retry: false, enabled: role === "PROPERTY_MANAGER" });
  const create = trpc.operations.calendar.create.useMutation();
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [technicianId, setTechnicianId] = useState("none");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const upcoming = appointments.data ?? [];
  const byDay = useMemo(() => upcoming.reduce<Record<string, typeof upcoming>>((result, item) => { const day = new Date(item.scheduledStart).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); (result[day] ??= []).push(item); return result; }, {}), [upcoming]);
  return <>
    <PanelHeading icon={CalendarDays} eyebrow={t("Maintenance calendar", "تقويم الصيانة")} title={t("Plan every visit with context.", "خطط كل زيارة بسياق واضح.")} description={t("Scheduled visits show the right people their relevant appointments, while Managers keep the complete operating calendar.", "تظهر الزيارات المجدولة للأشخاص المناسبين مواعيدهم ذات الصلة، بينما يحتفظ المديرون بالتقويم التشغيلي الكامل.")} />
    <div className="grid gap-6 xl:grid-cols-[.8fr_1.4fr]">{role === "PROPERTY_MANAGER" && <Card className="border-[#dce9e6] bg-white"><CardHeader><CardTitle className="text-base text-slate-900">{t("Schedule a visit", "جدولة زيارة")}</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("Visit title", "عنوان الزيارة")} className="border-slate-200 bg-slate-50 text-slate-900"/><Select value={technicianId} onValueChange={setTechnicianId}><SelectTrigger className="border-slate-200 bg-slate-50 text-slate-900"><SelectValue placeholder={t("Assign technician", "تعيين فني")}/></SelectTrigger><SelectContent><SelectItem value="none">{t("No technician selected", "لم يتم اختيار فني")}</SelectItem>{(technicians.data ?? []).map((technician) => <SelectItem key={technician.id} value={String(technician.id)}>{technician.name || technician.email || `#${technician.id}`}</SelectItem>)}</SelectContent></Select><Input type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} className="border-slate-200 bg-slate-50 text-slate-900"/><Input type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} className="border-slate-200 bg-slate-50 text-slate-900"/><Button disabled={!title.trim() || !start || !end || create.isPending} className="w-full bg-teal-700 hover:bg-teal-800" onClick={async () => { try { await create.mutateAsync({ title, scheduledStart: new Date(start).toISOString(), scheduledEnd: new Date(end).toISOString(), technicianId: technicianId === "none" ? undefined : Number(technicianId) }); setTitle(""); setStart(""); setEnd(""); setTechnicianId("none"); await utils.operations.calendar.list.invalidate(); toast.success(t("Visit scheduled", "تمت جدولة الزيارة")); } catch (error) { toast.error(error instanceof Error ? error.message : t("Unable to schedule visit", "تعذر جدولة الزيارة")); } }}>{t("Schedule visit", "جدولة الزيارة")}</Button></CardContent></Card>}
      <Card className="border-[#dce9e6] bg-white"><CardHeader><CardTitle className="text-base text-slate-900">{t("Upcoming agenda", "الأجندة القادمة")}</CardTitle></CardHeader><CardContent className="space-y-6">{Object.entries(byDay).length ? Object.entries(byDay).map(([day, items]) => <div key={day}><div className="mb-3 text-xs font-semibold uppercase tracking-[.17em] text-slate-400">{day}</div><div className="space-y-2">{items.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-medium text-slate-900">{item.title}</div><div className="mt-1 text-xs text-slate-500">{new Date(item.scheduledStart).toLocaleString()} — {new Date(item.scheduledEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div></div><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">{item.status.replace("_", " ")}</span></div>)}</div></div>) : <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">{t("No maintenance visits are scheduled yet.", "لا توجد زيارات صيانة مجدولة بعد.")}</div>}</CardContent></Card>
    </div>
  </>;
}

function InquiriesPanel({ role }: { role: PortalRole }) {
  const { t } = useLanguage();
  const inquiries = trpc.operations.inquiries.list.useQuery(undefined, { retry: false });
  const create = trpc.operations.inquiries.create.useMutation();
  const update = trpc.operations.inquiries.update.useMutation();
  const utils = trpc.useUtils();
  const [kind, setKind] = useState<"INQUIRY" | "COMPLAINT">("INQUIRY");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  return <>
    <PanelHeading icon={CircleHelp} eyebrow={t("Service care", "رعاية الخدمة")} title={t("Questions and complaints, handled visibly.", "الأسئلة والشكاوى تتم معالجتها بوضوح.")} description={t("Use a separate service-care channel when the issue is not a maintenance ticket. Managers can oversee status and resolution across the workspace.", "استخدم قناة رعاية خدمة منفصلة عندما لا تكون المشكلة بلاغ صيانة. يمكن للمديرين متابعة الحالة والحل عبر مساحة العمل.")} />
    <div className="grid gap-6 xl:grid-cols-[.78fr_1.42fr]">{role !== "TECHNICIAN" && <Card className="border-[#dce9e6] bg-white"><CardHeader><CardTitle className="text-base text-slate-900">{t("Create service request", "إنشاء طلب خدمة")}</CardTitle></CardHeader><CardContent className="space-y-3"><Select value={kind} onValueChange={(value) => setKind(value as typeof kind)}><SelectTrigger className="border-slate-200 bg-slate-50 text-slate-900"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="INQUIRY">{t("Inquiry", "استفسار")}</SelectItem><SelectItem value="COMPLAINT">{t("Complaint", "شكوى")}</SelectItem></SelectContent></Select><Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={t("Subject", "الموضوع")} className="border-slate-200 bg-slate-50 text-slate-900"/><Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={t("Explain what you need help with…", "اشرح ما الذي تحتاج المساعدة بشأنه…")} className="min-h-32 border-slate-200 bg-slate-50 text-slate-900"/><Button disabled={create.isPending || subject.trim().length < 3 || body.trim().length < 10} className="w-full bg-teal-700 hover:bg-teal-800" onClick={async () => { try { await create.mutateAsync({ kind, subject, body }); setSubject(""); setBody(""); await utils.operations.inquiries.list.invalidate(); await utils.operations.dashboard.summary.invalidate(); toast.success(t("Service request submitted", "تم إرسال طلب الخدمة")); } catch (error) { toast.error(error instanceof Error ? error.message : t("Unable to submit request", "تعذر إرسال الطلب")); } }}>{t("Submit request", "إرسال الطلب")}</Button></CardContent></Card>}
      <Card className="border-[#dce9e6] bg-white"><CardHeader><CardTitle className="text-base text-slate-900">{role === "PROPERTY_MANAGER" ? t("Workspace service queue", "قائمة خدمة مساحة العمل") : t("Your service requests", "طلبات الخدمة الخاصة بك")}</CardTitle></CardHeader><CardContent className="space-y-3">{(inquiries.data ?? []).length ? inquiries.data?.map((item) => <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.kind === "COMPLAINT" ? "bg-rose-50 text-rose-700" : "bg-sky-50 text-sky-700"}`}>{item.kind}</span><span className="text-xs text-slate-400">#{item.id}</span></div><div className="mt-2 font-medium text-slate-900">{item.subject}</div><p className="mt-1 text-sm leading-6 text-slate-500">{item.body}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-teal-700 shadow-sm">{item.status.replace("_", " ")}</span></div>{role === "PROPERTY_MANAGER" && item.status !== "RESOLVED" && item.status !== "CLOSED" && <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" className="border-slate-200 bg-white text-slate-700" onClick={async () => { await update.mutateAsync({ inquiryId: item.id, status: "IN_REVIEW" }); await utils.operations.inquiries.list.invalidate(); }}>{t("Review", "مراجعة")}</Button><Button size="sm" className="bg-teal-700 hover:bg-teal-800" onClick={async () => { await update.mutateAsync({ inquiryId: item.id, status: "RESOLVED", resolution: t("Resolved by the property team.", "تم الحل بواسطة فريق العقار.") }); await utils.operations.inquiries.list.invalidate(); }}>{t("Resolve", "حل")}</Button></div>}</div>) : <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">{t("No service requests yet.", "لا توجد طلبات خدمة بعد.")}</div>}</CardContent></Card>
    </div>
  </>;
}

function localDateTime(value: Date | string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function RemindersPanel() {
  const { t } = useLanguage();
  const reminders = trpc.reminders.list.useQuery(undefined, { retry: false });
  const createReminder = trpc.reminders.create.useMutation();
  const updateReminder = trpc.reminders.update.useMutation();
  const removeReminder = trpc.reminders.remove.useMutation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState({ title: "", description: "", cadence: "MONTHLY" as "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY", dueAt: "", isActive: true });
  const [newReminder, setNewReminder] = useState({ title: "", description: "", cadence: "MONTHLY" as "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY", dueAt: "" });
  const items = reminders.data ?? [];

  const beginEdit = (reminder: typeof items[number]) => {
    setEditingId(reminder.id);
    setDraft({ title: reminder.title, description: reminder.description, cadence: reminder.cadence, dueAt: localDateTime(reminder.nextRunAt), isActive: reminder.isActive });
  };

  const save = async () => {
    if (!editingId || draft.title.trim().length < 3 || draft.description.trim().length < 3 || !draft.dueAt) return;
    try {
      await updateReminder.mutateAsync({ id: editingId, title: draft.title.trim(), description: draft.description.trim(), cadence: draft.cadence, dueAt: new Date(draft.dueAt).toISOString(), isActive: draft.isActive });
      await reminders.refetch();
      setEditingId(null);
      toast.success(t("Reminder updated", "تم تحديث التذكير"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Unable to update reminder", "تعذر تحديث التذكير"));
    }
  };

  const create = async () => {
    if (newReminder.title.trim().length < 3 || newReminder.description.trim().length < 3 || !newReminder.dueAt) return;
    try {
      await createReminder.mutateAsync({ title: newReminder.title.trim(), description: newReminder.description.trim(), cadence: newReminder.cadence, dueAt: new Date(newReminder.dueAt).toISOString() });
      await reminders.refetch();
      setNewReminder({ title: "", description: "", cadence: "MONTHLY", dueAt: "" });
      toast.success(t("Reminder scheduled", "تمت جدولة التذكير"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Unable to schedule reminder", "تعذر جدولة التذكير"));
    }
  };

  return <>
    <PanelHeading icon={Clock3} eyebrow={t("Maintenance reminders", "تذكيرات الصيانة")} title={t("Keep planned work accurate.", "حافظ على دقة الأعمال المخططة.")} description={t("Review, edit, pause, or remove reminders while preserving the role-aware workspace record.", "راجع التذكيرات أو عدلها أو أوقفها أو أزلها مع الحفاظ على سجل مساحة العمل حسب الدور.")} />
    <Card className="mb-6 border-[#dce9e6] bg-white"><CardHeader><CardTitle className="text-base text-slate-900">{t("Create reminder", "إنشاء تذكير")}</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><Input value={newReminder.title} onChange={(event) => setNewReminder({ ...newReminder, title: event.target.value })} placeholder={t("Reminder title", "عنوان التذكير")} className="border-slate-200 bg-slate-50 text-slate-900"/><Select value={newReminder.cadence} onValueChange={(value) => setNewReminder({ ...newReminder, cadence: value as typeof newReminder.cadence })}><SelectTrigger className="border-slate-200 bg-slate-50 text-slate-900"><SelectValue/></SelectTrigger><SelectContent>{(["ONCE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const).map((cadence) => <SelectItem key={cadence} value={cadence}>{cadence}</SelectItem>)}</SelectContent></Select><Textarea value={newReminder.description} onChange={(event) => setNewReminder({ ...newReminder, description: event.target.value })} placeholder={t("What needs to happen?", "ما الذي يجب تنفيذه؟")} className="min-h-24 border-slate-200 bg-slate-50 text-slate-900 md:col-span-2"/><Input type="datetime-local" value={newReminder.dueAt} onChange={(event) => setNewReminder({ ...newReminder, dueAt: event.target.value })} className="border-slate-200 bg-slate-50 text-slate-900"/><Button className="bg-teal-700 hover:bg-teal-800" disabled={createReminder.isPending || newReminder.title.trim().length < 3 || newReminder.description.trim().length < 3 || !newReminder.dueAt} onClick={create}>{t("Schedule reminder", "جدولة التذكير")}</Button></CardContent></Card>
    <Card className="border-[#dce9e6] bg-white"><CardHeader><CardTitle className="text-base text-slate-900">{t("Scheduled reminders", "التذكيرات المجدولة")}</CardTitle></CardHeader><CardContent className="space-y-3">{reminders.isLoading ? <p className="text-sm text-slate-400">{t("Loading reminders…", "جارٍ تحميل التذكيرات…")}</p> : items.length ? items.map((reminder) => <div key={reminder.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">{editingId === reminder.id ? <div className="space-y-3"><Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="border-slate-200 bg-white text-slate-900" aria-label={t("Reminder title", "عنوان التذكير")}/><Textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="min-h-24 border-slate-200 bg-white text-slate-900" aria-label={t("Reminder description", "وصف التذكير")}/><div className="grid gap-3 sm:grid-cols-2"><Select value={draft.cadence} onValueChange={(value) => setDraft({ ...draft, cadence: value as typeof draft.cadence })}><SelectTrigger className="border-slate-200 bg-white text-slate-900"><SelectValue/></SelectTrigger><SelectContent>{(["ONCE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const).map((cadence) => <SelectItem key={cadence} value={cadence}>{cadence}</SelectItem>)}</SelectContent></Select><Input type="datetime-local" value={draft.dueAt} onChange={(event) => setDraft({ ...draft, dueAt: event.target.value })} className="border-slate-200 bg-white text-slate-900"/></div><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}/>{t("Reminder is active", "التذكير نشط")}</label><div className="flex flex-wrap gap-2"><Button size="sm" className="bg-teal-700 hover:bg-teal-800" disabled={updateReminder.isPending || draft.title.trim().length < 3 || draft.description.trim().length < 3 || !draft.dueAt} onClick={save}>{t("Save changes", "حفظ التغييرات")}</Button><Button size="sm" variant="outline" className="border-slate-200 bg-white text-slate-700" onClick={() => setEditingId(null)}><X size={15}/>{t("Cancel", "إلغاء")}</Button></div></div> : <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="text-sm font-semibold text-slate-900">{reminder.title}</div><p className="mt-1 text-sm leading-6 text-slate-500">{reminder.description}</p><div className="mt-3 text-xs font-medium text-teal-700">{reminder.cadence} · {new Date(reminder.nextRunAt).toLocaleString()} · {reminder.isActive ? t("Active", "نشط") : t("Paused", "متوقف")}</div></div><div className="flex gap-2"><Button size="sm" variant="outline" className="border-slate-200 bg-white text-slate-700" onClick={() => beginEdit(reminder)}><Pencil size={15}/>{t("Edit", "تعديل")}</Button><Button size="sm" variant="outline" className="border-rose-200 bg-white text-rose-700" disabled={removeReminder.isPending} onClick={async () => { try { await removeReminder.mutateAsync({ id: reminder.id }); await reminders.refetch(); toast.success(t("Reminder removed", "تمت إزالة التذكير")); } catch (error) { toast.error(error instanceof Error ? error.message : t("Unable to remove reminder", "تعذر إزالة التذكير")); } }}>{t("Remove", "إزالة")}</Button></div></div>}</div>) : <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">{t("No reminders scheduled yet.", "لا توجد تذكيرات مجدولة بعد.")}</div>}</CardContent></Card>
  </>;
}

export function OperationsOverlay() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [pathname, navigate] = useLocation();
  const [query, setQuery] = useState(typeof window === "undefined" ? "" : window.location.search);
  useEffect(() => {
    const syncQuery = () => setQuery((current) => current === window.location.search ? current : window.location.search);
    const interval = window.setInterval(syncQuery, 150);
    window.addEventListener("popstate", syncQuery);
    return () => { window.clearInterval(interval); window.removeEventListener("popstate", syncQuery); };
  }, []);
  const view = new URLSearchParams(query).get("view") as WorkspaceView | null;
  void pathname;
  if (!user || !view || !supportedViews.has(view)) return null;
  const role = user.role as PortalRole;
  if (view === "analytics" && role !== "PROPERTY_MANAGER") return null;
  if (view === "reminders" && role !== "PROPERTY_MANAGER") return null;
  if (view === "inquiries" && role === "TECHNICIAN") return null;
  return <section className="maintainr-operations-overlay fixed inset-x-0 bottom-0 top-20 z-20 overflow-y-auto overscroll-contain bg-[#f4f8f7] px-5 py-7 pb-28 text-slate-900 [scrollbar-gutter:stable] lg:left-72 lg:px-10 lg:py-10 lg:pb-16" aria-label={t("Workspace operations", "عمليات مساحة العمل")}><div className="mx-auto max-w-7xl"><div className="mb-6 flex justify-end"><Button size="sm" variant="outline" className="border-slate-200 bg-white text-slate-700" onClick={() => navigate(pathname)}><ArrowLeft size={15}/>{t("Back to overview", "العودة إلى النظرة العامة")}</Button></div>{view === "analytics" ? <AnalyticsPanel role={role}/> : view === "tickets" ? <TicketsPanel role={role}/> : view === "messages" ? <MessagesPanel/> : view === "calendar" ? <CalendarPanel role={role}/> : view === "reminders" ? <RemindersPanel/> : <InquiriesPanel role={role}/>}</div></section>;
}

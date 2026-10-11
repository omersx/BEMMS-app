"use client";

import { createTicket, getDeviceActiveTickets, getTicketCreationDefaults } from "@/lib/actions/tickets";
import { getDeviceById, getDevices } from "@/lib/actions/devices";
import { getEngineersTeam } from "@/lib/actions/engineers";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DeviceStatusBadge } from "@/components/devices/device-badges";
import { TicketStatusBadge } from "@/components/tickets/ticket-badges";
import {
  AlertTriangle,
  Monitor,
  Search,
  CheckCircle,
  Phone,
  Clock,
  Zap,
  ShieldAlert,
  ArrowLeft,
  Building2,
  UsersRound,
  ExternalLink,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { cn } from "@/lib/utils";

export default function CreateTicketPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading helpdesk form...</div>}>
      <CreateTicketContent />
    </Suspense>
  );
}

const QUICK_PROBLEM_CHIPS = [
  { label: "Won't turn on / Power issue", category: "power_issue" },
  { label: "Alarm constantly sounding", category: "alarm_problem" },
  { label: "Error code displayed", category: "display_interface" },
  { label: "Screen blank or flickering", category: "display_interface" },
  { label: "Battery won't charge", category: "power_issue" },
  { label: "Damaged cable / sensor / probe", category: "sensor_accessory" },
  { label: "Calibration or inaccurate readings", category: "performance_concern" },
  { label: "Physical drop / mechanical damage", category: "mechanical_damage" },
];

function CreateTicketContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledDeviceId = searchParams.get("deviceId");
  const prefilledSource = searchParams.get("source") || (prefilledDeviceId ? "device_profile" : "manual_entry");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [device, setDevice] = useState<any>(null);
  const [activeTickets, setActiveTickets] = useState<any[]>([]);

  // Organization and location defaults
  const [orgDefaults, setOrgDefaults] = useState<{
    organizationId: string;
    defaultHospitalId: string;
    defaultDepartmentId: string;
    defaultHospitalName?: string;
    defaultDepartmentName?: string;
    isElevatedUser?: boolean;
    hospitals: { id: string; name: string }[];
    departments: { id: string; name: string; hospitalId: string }[];
    userFullName: string;
  } | null>(null);

  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState(prefilledDeviceId || "");
  const [showLocationOverride, setShowLocationOverride] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState<"device_usable" | "device_not_usable" | "patient_care_affected">("device_not_usable");
  const [category, setCategory] = useState<string>("");
  const [locationCorrection, setLocationCorrection] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Search state
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceResults, setDeviceResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Engineers on duty
  const [onDutyEngineers, setOnDutyEngineers] = useState<any[]>([]);

  // Load defaults and prefilled device
  useEffect(() => {
    async function loadInitialData() {
      // 1. Load user creation defaults
      const defRes = await getTicketCreationDefaults();
      if (defRes.success && defRes.data) {
        setOrgDefaults(defRes.data);
        setSelectedHospitalId(defRes.data.defaultHospitalId);
        setSelectedDepartmentId(defRes.data.defaultDepartmentId);
        if (defRes.data.userPhone || defRes.data.userExtension) {
          setContactPhone(defRes.data.userPhone || defRes.data.userExtension || "");
        }
      }

      // 2. Load on-duty engineers
      const engRes = await getEngineersTeam();
      if (engRes.success && engRes.data) {
        const available = engRes.data.filter((e: any) => e.dutyStatus === "on_duty" || e.dutyStatus === "on_call");
        setOnDutyEngineers(available);
      }

      // 3. Load prefilled device if present
      if (prefilledDeviceId) {
        const devRes = await getDeviceById(prefilledDeviceId);
        if (devRes?.success && devRes.data) {
          setDevice(devRes.data);
          setSelectedDeviceId(prefilledDeviceId);
          if (devRes.data.hospitalId) setSelectedHospitalId(devRes.data.hospitalId);
          if (devRes.data.departmentId) setSelectedDepartmentId(devRes.data.departmentId);

          // Check active tickets for duplicate warning
          const actRes = await getDeviceActiveTickets(prefilledDeviceId);
          if (actRes?.success && actRes.data) setActiveTickets(actRes.data as any[]);
        }
      }
    }
    loadInitialData();
  }, [prefilledDeviceId]);

  const handleDeviceSearch = async (val: string) => {
    setDeviceSearch(val);
    if (val.trim().length < 2) {
      setDeviceResults([]);
      return;
    }
    setSearching(true);
    const res = await getDevices({ search: val, pageSize: 6 });
    if (res?.success && res.data) {
      setDeviceResults(res.data as any[]);
    }
    setSearching(false);
  };

  const handleSelectDevice = async (dev: any) => {
    setDevice(dev);
    setSelectedDeviceId(dev.id);
    setDeviceResults([]);
    setDeviceSearch("");
    if (dev.hospitalId) setSelectedHospitalId(dev.hospitalId);
    if (dev.departmentId) setSelectedDepartmentId(dev.departmentId);

    const actRes = await getDeviceActiveTickets(dev.id);
    if (actRes?.success && actRes.data) {
      setActiveTickets(actRes.data as any[]);
    }
  };

  const handleChipClick = (chip: { label: string; category: string }) => {
    if (!title) {
      setTitle(chip.label);
    } else {
      setTitle(`${title} — ${chip.label}`);
    }
    if (chip.category) {
      setCategory(chip.category);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const orgId = device?.organizationId || orgDefaults?.organizationId;
    const hospId = device?.hospitalId || selectedHospitalId || orgDefaults?.defaultHospitalId;
    const deptId = device?.departmentId || selectedDepartmentId || orgDefaults?.defaultDepartmentId;

    if (!orgId || !hospId || !deptId) {
      setError("Please ensure hospital and department are selected.");
      setLoading(false);
      return;
    }

    if (!title.trim() || title.trim().length < 5) {
      setError("Please provide a descriptive problem title (at least 5 characters).");
      setLoading(false);
      return;
    }

    const payload: any = {
      organizationId: orgId,
      hospitalId: hospId,
      departmentId: deptId,
      deviceId: selectedDeviceId || undefined,
      source: prefilledSource,
      ticketType: impact === "patient_care_affected" ? "urgent_equipment_concern" : "device_problem",
      title: title.trim(),
      description: description.trim() || title.trim(),
      reportedImpact: impact,
      reportedProblemCategory: category || undefined,
      reportedLocationCorrection: locationCorrection.trim() || undefined,
      requesterContactPhone: contactPhone.trim() || undefined,
      requesterContactName: orgDefaults?.userFullName || undefined,
    };

    const result = await createTicket(payload);
    if (result?.success && (result as any).data?.id) {
      router.push(`/tickets/${(result as any).data.id}`);
    } else {
      setError((result as any)?.error || "Failed to create ticket. Please check the fields and try again.");
      setLoading(false);
    }
  };

  const availableDepts = orgDefaults?.departments.filter(
    (d) => !selectedHospitalId || d.hospitalId === selectedHospitalId
  ) || [];

  const currentHospitalName =
    device?.hospital?.name ||
    orgDefaults?.hospitals.find((h) => h.id === selectedHospitalId)?.name ||
    orgDefaults?.defaultHospitalName ||
    "General Hospital";

  const currentDepartmentName =
    device?.department?.name ||
    orgDefaults?.departments.find((d) => d.id === selectedDepartmentId)?.name ||
    orgDefaults?.defaultDepartmentName ||
    "Clinical Department";

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="h-9 px-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      <PageHeader
        title="Report Equipment Problem"
        description="Notify the Biomedical Engineering team for immediate inspection or repair"
      />

      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to submit report</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── 1. Device Selection Card ────────────────────────────────────── */}
      {device ? (
        <Card className="border-2 border-primary/20 shadow-sm overflow-hidden">
          <CardHeader className="bg-primary/5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                Equipment Selected
              </CardTitle>
              <DeviceStatusBadge status={device.currentStatusCode} />
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-foreground">{device.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Asset Tag: <span className="font-semibold text-foreground">{device.assetNumber}</span>
                  {device.serialNumber && ` · Serial: ${device.serialNumber}`}
                </p>
              </div>
              {!prefilledDeviceId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDevice(null);
                    setSelectedDeviceId("");
                    setActiveTickets([]);
                  }}
                  className="self-start sm:self-auto text-xs"
                >
                  Change Device
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border">
              <div>
                <span className="block text-[11px] font-semibold text-foreground">Hospital</span>
                <span>{(device as any).hospital?.name || "General Hospital"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-foreground">Department</span>
                <span>{(device as any).department?.name || "Clinical Department"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-foreground">Registered Room</span>
                <span>{(device as any).location?.name || device.exactLocationDescription || "Room not set"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Which device is having problems?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search by asset tag (e.g. ICU-003), device name, or model..."
                value={deviceSearch}
                onChange={(e) => handleDeviceSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm"
              />
            </div>

            {searching && <p className="text-xs text-muted-foreground">Searching equipment catalog...</p>}

            {deviceResults.length > 0 && (
              <div className="border rounded-xl divide-y max-h-56 overflow-auto bg-card shadow-inner">
                {deviceResults.map((dev: any) => (
                  <button
                    key={dev.id}
                    type="button"
                    onClick={() => handleSelectDevice(dev)}
                    className="w-full text-left p-3 hover:bg-muted/70 transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{dev.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Asset #{dev.assetNumber} · {dev.department?.name || "Dept"} · {dev.location?.name || "Room"}
                      </p>
                    </div>
                    <DeviceStatusBadge status={dev.currentStatusCode} />
                  </button>
                ))}
              </div>
            )}

            {/* Automatic Scope Confirmation & Optional Admin Switcher */}
            <div className="pt-3 border-t space-y-3">
              <div className="p-3.5 rounded-xl border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Assigned Location: {currentDepartmentName} · {currentHospitalName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Pre-assigned from your user profile — no manual entry required.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button asChild variant="outline" size="sm" className="h-7 text-xs px-2.5">
                    <Link href="/my-department">
                      Browse Department Equipment →
                    </Link>
                  </Button>
                  {orgDefaults?.isElevatedUser && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLocationOverride(!showLocationOverride)}
                      className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                    >
                      {showLocationOverride ? "Lock Location" : "Change (Admin)"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Only shown if elevated admin explicitly opens the switcher */}
              {orgDefaults?.isElevatedUser && showLocationOverride && (
                <div className="p-3.5 rounded-xl border bg-background space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground">Administrative Location Override:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="hosp-select" className="text-xs">Hospital</Label>
                      <select
                        id="hosp-select"
                        value={selectedHospitalId}
                        onChange={(e) => setSelectedHospitalId(e.target.value)}
                        className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select hospital...</option>
                        {orgDefaults?.hospitals.map((h) => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="dept-select" className="text-xs">Department</Label>
                      <select
                        id="dept-select"
                        value={selectedDepartmentId}
                        onChange={(e) => setSelectedDepartmentId(e.target.value)}
                        className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select department...</option>
                        {availableDepts.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── 2. Duplicate Ticket Warning ─────────────────────────────────── */}
      {activeTickets.length > 0 && (
        <Card className="border-amber-300 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1 min-w-0">
                <div>
                  <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                    Active Ticket Open on this Device ({activeTickets.length})
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    Engineering is already tracking an issue for this equipment. You can comment on the active ticket instead of creating a duplicate.
                  </p>
                </div>
                <div className="space-y-1.5">
                  {activeTickets.map((t: any) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-card/80 border border-amber-200 dark:border-amber-900 text-xs gap-2"
                    >
                      <div className="truncate">
                        <span className="font-mono font-bold">{t.ticketNumber}</span>: {t.title}
                      </div>
                      <Link
                        href={`/tickets/${t.id}`}
                        className="font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
                      >
                        View Ticket
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── 3. Problem Details Form ─────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Clinical Impact Selector */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Clinical Urgency & Impact *</span>
              <span className="text-xs font-normal text-muted-foreground">Select current state</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2.5 sm:grid-cols-3">
              {/* Option 1: Usable */}
              <button
                type="button"
                onClick={() => setImpact("device_usable")}
                className={cn(
                  "flex flex-col text-left p-3.5 rounded-xl border-2 transition-all",
                  impact === "device_usable"
                    ? "border-green-600 bg-green-50/70 dark:bg-green-950/30 text-green-900 dark:text-green-200 shadow-sm"
                    : "border-border bg-card hover:bg-muted/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-foreground">Still Usable</span>
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <p className="text-xs leading-relaxed">
                  Working with minor issue (alarm, accessory, display artifact). Safe for care.
                </p>
              </button>

              {/* Option 2: Not Usable */}
              <button
                type="button"
                onClick={() => setImpact("device_not_usable")}
                className={cn(
                  "flex flex-col text-left p-3.5 rounded-xl border-2 transition-all",
                  impact === "device_not_usable"
                    ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow-sm"
                    : "border-border bg-card hover:bg-muted/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-foreground">NOT Usable</span>
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                </div>
                <p className="text-xs leading-relaxed">
                  Device is inoperable or unsafe. Removed from patient use and waiting repair.
                </p>
              </button>

              {/* Option 3: Patient Care Affected */}
              <button
                type="button"
                onClick={() => setImpact("patient_care_affected")}
                className={cn(
                  "flex flex-col text-left p-3.5 rounded-xl border-2 transition-all",
                  impact === "patient_care_affected"
                    ? "border-red-600 bg-red-50/80 dark:bg-red-950/40 text-red-950 dark:text-red-100 shadow-md ring-2 ring-red-500/20"
                    : "border-border bg-card hover:bg-muted/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-red-700 dark:text-red-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    Patient Affected
                  </span>
                  <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                </div>
                <p className="text-xs leading-relaxed text-red-800 dark:text-red-300">
                  CRITICAL: Procedure or patient monitoring interrupted. Immediate P1 dispatch.
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Problem Information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">What happened?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Chips */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Tap a common symptom to quickly prefill:</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROBLEM_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleChipClick(chip)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 transition text-muted-foreground hover:text-foreground font-medium"
                  >
                    + {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="title" className="text-sm font-semibold">
                Problem Summary *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Infusion pump beeping error code E-42"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-semibold">
                Detailed Observation (optional but helpful)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what occurred: Started during morning rounds? Any alarms heard? Did restart resolve it?"
                className="mt-1.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <Label htmlFor="category" className="text-xs font-medium">
                  Technical Category
                </Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Auto-detected / Other</option>
                  <option value="power_issue">Power / Battery</option>
                  <option value="alarm_problem">Alarm Malfunction</option>
                  <option value="display_interface">Display / Screen</option>
                  <option value="sensor_accessory">Sensor / Cable / Probe</option>
                  <option value="mechanical_damage">Mechanical / Physical Damage</option>
                  <option value="performance_concern">Calibration / Accuracy</option>
                  <option value="software_configuration">Software / Settings</option>
                  <option value="other">General Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="locationCorrection" className="text-xs font-medium">
                  Current Room / Bed (if moved)
                </Label>
                <Input
                  id="locationCorrection"
                  value={locationCorrection}
                  onChange={(e) => setLocationCorrection(e.target.value)}
                  placeholder="e.g. Moved to Bed 4, ICU"
                  className="mt-1.5 text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contactPhone" className="text-xs font-medium">
                Your Contact Extension / Phone (for engineer callback)
              </Label>
              <div className="relative mt-1.5">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="contactPhone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. Ext. 3120 (Nurse Station) or mobile"
                  className="pl-9 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 4. Engineering Team Availability Info ───────────────────── */}
        {onDutyEngineers.length > 0 && (
          <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 shadow-sm">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                  <UsersRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                    Biomedical Engineers Available Now
                  </h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                    {onDutyEngineers.map((e) => `${e.fullName} (${e.extension ? `Ext. ${e.extension}` : e.jobTitle})`).join(" · ")}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="self-start sm:self-auto text-xs bg-card">
                <Link href="/engineering-team">View Duty Roster</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Submit Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className={cn(
              "w-full sm:w-auto min-w-[200px] font-semibold text-base",
              impact === "patient_care_affected" && "bg-red-600 hover:bg-red-700 text-white"
            )}
          >
            {loading ? "Transmitting Report..." : impact === "patient_care_affected" ? "Submit URGENT Report" : "Submit Problem Report"}
          </Button>
        </div>
      </form>
    </div>
  );
}

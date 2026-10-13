'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addUser } from '@/lib/actions/users';
import { getOrganizations } from '@/lib/actions/organizations';
import { getHospitals } from '@/lib/actions/hospitals';
import { getDepartments } from '@/lib/actions/departments';
import { getRoles } from '@/lib/actions/roles';
import { toast } from 'sonner';
import {
  Wrench,
  Lock,
  Building2,
  Cpu,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export interface AddEngineerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface OrganizationOption {
  id: string;
  name: string;
}

interface HospitalOption {
  id: string;
  name: string;
}

interface DepartmentOption {
  id: string;
  name: string;
  code?: string;
}

interface RoleOption {
  id: string;
  code: string;
  name: string;
}

type DutyStatus = 'on_duty' | 'on_call' | 'in_maintenance' | 'off_duty';

const COMMON_SPECIALIZATIONS = [
  'General Biomedical',
  'ICU & Ventilators',
  'Radiology & Imaging',
  'Surgical & OR',
  'Dialysis & Renal',
  'Laboratory & Diagnostic',
];

export function AddEngineerDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddEngineerDialogProps) {
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('Biomedical Engineer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [organizationId, setOrganizationId] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [dutyStatus, setDutyStatus] = useState<DutyStatus>('on_duty');
  const [phone, setPhone] = useState('');
  const [extension, setExtension] = useState('');

  // Dropdown data options
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  // Loading states
  const [loadingInitialData, setLoadingInitialData] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setFullName('');
    setEmail('');
    setJobTitle('Biomedical Engineer');
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setHospitalId('');
    setDepartmentId('');
    setSpecialization('');
    setDutyStatus('on_duty');
    setPhone('');
    setExtension('');
    if (organizations.length !== 1) {
      setOrganizationId('');
    }
  }, [organizations.length]);

  // Load organizations and roles on dialog open
  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    async function fetchInitialData() {
      setLoadingInitialData(true);
      try {
        const [orgRes, rolesRes] = await Promise.all([
          getOrganizations(),
          getRoles(),
        ]);

        if (!isMounted) return;

        if (orgRes.success && orgRes.data) {
          setOrganizations(orgRes.data);
          // Auto-select if only one organization exists
          if (orgRes.data.length === 1) {
            setOrganizationId(orgRes.data[0].id);
          }
        } else if (orgRes.error) {
          toast.error(`Failed to load organizations: ${orgRes.error}`);
        }

        if (rolesRes.success && rolesRes.data) {
          setRoles(rolesRes.data);
        } else if (rolesRes.error) {
          toast.error(`Failed to load roles: ${rolesRes.error}`);
        }
      } catch (err: any) {
        if (isMounted) {
          toast.error(err.message || 'Error loading dialog options');
        }
      } finally {
        if (isMounted) {
          setLoadingInitialData(false);
        }
      }
    }

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [open]);

  // Load hospitals when organization selection changes
  useEffect(() => {
    if (!open || !organizationId) {
      setHospitals([]);
      setHospitalId('');
      setDepartments([]);
      setDepartmentId('');
      return;
    }

    let isMounted = true;
    async function fetchHospitals() {
      setLoadingHospitals(true);
      try {
        const hospRes = await getHospitals({ organizationId });
        if (!isMounted) return;

        if (hospRes.success && hospRes.data) {
          setHospitals(hospRes.data);
        } else if (hospRes.error) {
          toast.error(`Failed to load hospitals: ${hospRes.error}`);
        }
      } catch (err: any) {
        if (isMounted) {
          toast.error(err.message || 'Error loading hospitals');
        }
      } finally {
        if (isMounted) {
          setLoadingHospitals(false);
        }
      }
    }

    fetchHospitals();

    return () => {
      isMounted = false;
    };
  }, [open, organizationId]);

  // Load departments when hospital selection changes
  useEffect(() => {
    if (!open || !hospitalId || hospitalId === 'none') {
      setDepartments([]);
      setDepartmentId('');
      return;
    }

    let isMounted = true;
    async function fetchDepartments() {
      setLoadingDepartments(true);
      try {
        const deptRes = await getDepartments({ hospitalId });
        if (!isMounted) return;

        if (deptRes.success && deptRes.data) {
          setDepartments(deptRes.data);
        } else if (deptRes.error) {
          toast.error(`Failed to load departments: ${deptRes.error}`);
        }
      } catch (err: any) {
        if (isMounted) {
          toast.error(err.message || 'Error loading departments');
        }
      } finally {
        if (isMounted) {
          setLoadingDepartments(false);
        }
      }
    }

    fetchDepartments();

    return () => {
      isMounted = false;
    };
  }, [open, hospitalId]);

  // Password generator matching existing system pattern
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pwd = 'Bemms@';
    for (let i = 0; i < 4; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
    setShowPassword(true);
    toast.info(`Generated temporary password: ${pwd}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error('Full name is required (minimum 2 characters)');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('A valid official email is required');
      return;
    }

    if (!organizationId) {
      toast.error('Please select an organization');
      return;
    }

    if (password.trim() && password.trim().length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      // Find the BIOMED_ENG role
      let currentRoles = roles;
      if (currentRoles.length === 0) {
        const rolesRes = await getRoles();
        if (rolesRes.success && rolesRes.data) {
          currentRoles = rolesRes.data;
          setRoles(rolesRes.data);
        }
      }

      const biomedRole = currentRoles.find((r) => r.code === 'BIOMED_ENG');
      if (!biomedRole) {
        toast.error('Biomedical Engineer role (BIOMED_ENG) was not found in the system');
        setIsSubmitting(false);
        return;
      }

      const trimmedUsername = username.trim() || undefined;
      const trimmedExtension = extension.trim() || undefined;
      const finalIdentifier = trimmedExtension || trimmedUsername || undefined;

      const res = await addUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        jobTitle: jobTitle.trim() || 'Biomedical Engineer',
        username: trimmedUsername,
        employeeIdentifier: finalIdentifier,
        phone: phone.trim() || undefined,
        password: password.trim() ? password.trim() : null,
        organizationId,
        roleIds: [biomedRole.id],
        hospitalId: hospitalId && hospitalId !== 'none' ? hospitalId : undefined,
        departmentId: departmentId && departmentId !== 'all' ? departmentId : undefined,
        specialization: specialization.trim() || undefined,
        dutyStatus,
      });

      if (res.success) {
        toast.success(`Biomedical Engineer "${fullName.trim()}" created successfully!`);
        resetForm();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error((res as any)?.error || 'Failed to create engineer');
      }
    } catch (err: any) {
      toast.error(err?.message || 'An unexpected error occurred while creating engineer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Add Biomedical Engineer
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set up an engineer profile with facility allocation, shift readiness, and system credentials.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* SECTION 1: Engineer Identity */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-1.5">
              <Wrench className="w-3.5 h-3.5 text-primary" />
              1. Engineer Identity
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="eng-fullName" className="text-xs font-medium">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="eng-fullName"
                  placeholder="e.g. Eng. Tariq Mansour"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="eng-email" className="text-xs font-medium">
                  Official Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="eng-email"
                  type="email"
                  placeholder="engineer@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="eng-jobTitle" className="text-xs font-medium">
                Job Title
              </Label>
              <Input
                id="eng-jobTitle"
                placeholder="Biomedical Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* SECTION 2: Login Credentials */}
          <div className="space-y-3 p-3.5 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between border-b border-primary/20 pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-primary" />
                2. Login Credentials
              </h3>
              <span className="text-[11px] text-muted-foreground font-medium">
                Instant System Access
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="eng-username" className="text-xs font-medium">
                  Login Username <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="eng-username"
                  placeholder="e.g. eng.tariq, EMP-4011"
                  className="bg-background"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-[11px] text-muted-foreground">
                  Can be used alongside email to log in.
                </p>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="eng-password" className="text-xs font-medium flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-primary" />
                    Initial Password
                  </Label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    disabled={isSubmitting}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generate
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="eng-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    className="bg-background pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">Toggle password visibility</span>
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Leave empty to send an invite or activate immediately.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: Hospital Assignment */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              3. Hospital Assignment & Scope
            </h3>

            <div className="space-y-3">
              {/* Organization */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Organization <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={organizationId}
                  onValueChange={(val) => {
                    setOrganizationId(val);
                    setHospitalId('');
                    setDepartmentId('');
                  }}
                  disabled={loadingInitialData || isSubmitting || organizations.length === 0}
                >
                  <SelectTrigger id="eng-organization">
                    <SelectValue
                      placeholder={
                        loadingInitialData
                          ? 'Loading organizations...'
                          : 'Select Organization *'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Hospital Facility */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Hospital Facility</Label>
                  <Select
                    value={hospitalId || 'none'}
                    onValueChange={(val) => {
                      const nextHosp = val === 'none' ? '' : val;
                      setHospitalId(nextHosp);
                      setDepartmentId('');
                    }}
                    disabled={
                      !organizationId ||
                      loadingHospitals ||
                      isSubmitting ||
                      hospitals.length === 0
                    }
                  >
                    <SelectTrigger id="eng-hospital">
                      <SelectValue
                        placeholder={
                          loadingHospitals
                            ? 'Loading hospitals...'
                            : !organizationId
                            ? 'Select organization first'
                            : hospitals.length === 0
                            ? 'No hospitals available'
                            : 'Select Hospital Facility'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Specific Facility (Unassigned)</SelectItem>
                      {hospitals.map((hosp) => (
                        <SelectItem key={hosp.id} value={hosp.id}>
                          {hosp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Covered Departments */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Covered Department Scope</Label>
                  <Select
                    value={departmentId || 'all'}
                    onValueChange={(val) => {
                      setDepartmentId(val === 'all' ? '' : val);
                    }}
                    disabled={
                      !hospitalId ||
                      hospitalId === 'none' ||
                      loadingDepartments ||
                      isSubmitting ||
                      departments.length === 0
                    }
                  >
                    <SelectTrigger id="eng-department">
                      <SelectValue
                        placeholder={
                          loadingDepartments
                            ? 'Loading departments...'
                            : !hospitalId || hospitalId === 'none'
                            ? 'Select hospital first'
                            : departments.length === 0
                            ? 'No departments found'
                            : 'All Departments (Facility-wide)'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All Departments (Facility-wide Coverage)
                      </SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name} {dept.code ? `(${dept.code})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Engineering Configuration */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-1.5">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              4. Engineering Configuration
            </h3>

            <div className="space-y-3">
              {/* Specialization */}
              <div className="space-y-1.5">
                <Label htmlFor="eng-specialization" className="text-xs font-medium">
                  Technical Specialization
                </Label>
                <Input
                  id="eng-specialization"
                  placeholder="e.g. ICU & Ventilators, Radiology & CT, Dialysis, General Biomedical"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COMMON_SPECIALIZATIONS.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => setSpecialization(spec)}
                      disabled={isSubmitting}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        specialization === spec
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/50 hover:bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duty Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Initial Duty Status</Label>
                <Select
                  value={dutyStatus}
                  onValueChange={(val: DutyStatus) => setDutyStatus(val)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="eng-dutyStatus">
                    <SelectValue placeholder="Select Duty Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_duty">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>🟢 On Duty (Available for Dispatch)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="on_call">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>🟡 On Call (Emergency Standby)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="in_maintenance">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>🔵 In Maintenance (Busy on Task)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="off_duty">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>⚪ Off Duty</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Phone & Extension */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="eng-phone" className="text-xs font-medium">
                    Phone / Mobile
                  </Label>
                  <Input
                    id="eng-phone"
                    placeholder="+966 50 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="eng-extension" className="text-xs font-medium">
                    Extension / Bleep
                  </Label>
                  <Input
                    id="eng-extension"
                    placeholder="Ext. 204 or Bleep 18"
                    value={extension}
                    onChange={(e) => setExtension(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Engineer...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Create Engineer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddEngineerDialog;

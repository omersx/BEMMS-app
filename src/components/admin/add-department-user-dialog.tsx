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
import { cn } from '@/lib/utils';
import {
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  User,
  KeyRound,
  Building2,
  ShieldCheck,
  Phone,
  Check,
  Stethoscope,
} from 'lucide-react';

export interface AddDepartmentUserDialogProps {
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
  code?: string | null;
}

interface RoleOption {
  id: string;
  code: string;
  name: string;
}

export function AddDepartmentUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddDepartmentUserDialogProps) {
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');

  // Department Assignment State
  const [organizationId, setOrganizationId] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  // Role Access Level State ('STAFF' or 'DEPT_MGR')
  const [selectedRoleCode, setSelectedRoleCode] = useState<'STAFF' | 'DEPT_MGR'>('STAFF');

  // Loaded Options
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [hospitalsList, setHospitalsList] = useState<HospitalOption[]>([]);
  const [departmentsList, setDepartmentsList] = useState<DepartmentOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  // Loading States
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form inputs
  const resetForm = useCallback(() => {
    setFullName('');
    setEmail('');
    setJobTitle('');
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setPhone('');
    setSelectedRoleCode('STAFF');
    setHospitalId('');
    setDepartmentId('');
  }, []);

  // Fetch initial organizations and roles when dialog opens
  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }

    let isMounted = true;
    const loadInitialData = async () => {
      setIsLoadingInitial(true);
      try {
        const [orgRes, rolesRes] = await Promise.all([
          getOrganizations(),
          getRoles(),
        ]);

        if (!isMounted) return;

        if (orgRes.success && Array.isArray(orgRes.data)) {
          setOrganizations(orgRes.data);
          if (orgRes.data.length === 1) {
            setOrganizationId(orgRes.data[0].id);
          }
        }

        if (rolesRes.success && Array.isArray(rolesRes.data)) {
          setRoles(rolesRes.data);
        }
      } catch (err: any) {
        if (isMounted) {
          toast.error(err?.message || 'Failed to load initial data');
        }
      } finally {
        if (isMounted) {
          setIsLoadingInitial(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [open, resetForm]);

  // Load hospitals when organization is selected
  useEffect(() => {
    if (!organizationId) {
      setHospitalsList([]);
      setHospitalId('');
      setDepartmentsList([]);
      setDepartmentId('');
      return;
    }

    let isMounted = true;
    const loadHospitalsData = async () => {
      setIsLoadingHospitals(true);
      try {
        const hospRes = await getHospitals({ organizationId });
        if (!isMounted) return;

        if (hospRes.success && Array.isArray(hospRes.data)) {
          setHospitalsList(hospRes.data);
          if (hospRes.data.length === 1) {
            setHospitalId(hospRes.data[0].id);
          }
        } else {
          setHospitalsList([]);
        }
      } catch (err: any) {
        if (isMounted) {
          toast.error(err?.message || 'Failed to load hospitals');
        }
      } finally {
        if (isMounted) {
          setIsLoadingHospitals(false);
        }
      }
    };

    loadHospitalsData();

    return () => {
      isMounted = false;
    };
  }, [organizationId]);

  // Load departments when hospital is selected
  useEffect(() => {
    if (!hospitalId) {
      setDepartmentsList([]);
      setDepartmentId('');
      return;
    }

    let isMounted = true;
    const loadDepartmentsData = async () => {
      setIsLoadingDepartments(true);
      try {
        const deptRes = await getDepartments({ hospitalId });
        if (!isMounted) return;

        if (deptRes.success && Array.isArray(deptRes.data)) {
          setDepartmentsList(deptRes.data);
          if (deptRes.data.length === 1) {
            setDepartmentId(deptRes.data[0].id);
          }
        } else {
          setDepartmentsList([]);
        }
      } catch (err: any) {
        if (isMounted) {
          toast.error(err?.message || 'Failed to load departments');
        }
      } finally {
        if (isMounted) {
          setIsLoadingDepartments(false);
        }
      }
    };

    loadDepartmentsData();

    return () => {
      isMounted = false;
    };
  }, [hospitalId]);

  // Random Password Generator
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'Bemms@';
    for (let i = 0; i < 4; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
    setShowPassword(true);
    toast.info(`Generated temporary password: ${pwd}`);
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      toast.error('Full name is required (at least 2 characters)');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      toast.error('A valid official email address is required');
      return;
    }

    if (!organizationId) {
      toast.error('Please select an organization');
      return;
    }

    if (!hospitalId) {
      toast.error('Please select a hospital');
      return;
    }

    if (!departmentId) {
      toast.error('Please select a hospital department');
      return;
    }

    if (password && password.trim().length > 0 && password.trim().length < 6) {
      toast.error('Initial password must be at least 6 characters long');
      return;
    }

    const roleObj = roles.find((r) => r.code === selectedRoleCode);
    if (!roleObj) {
      toast.error(`The "${selectedRoleCode}" role was not found in the system. Please reload or contact an administrator.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const finalUsername = username.trim() || undefined;

      const res = await addUser({
        fullName: trimmedName,
        email: trimmedEmail,
        username: finalUsername,
        employeeIdentifier: finalUsername,
        phone: phone.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        password: password.trim() ? password.trim() : null,
        organizationId,
        roleIds: [roleObj.id],
        hospitalId,
        departmentId,
      });

      if (res.success) {
        toast.success(`Department user "${trimmedName}" created successfully!`);
        resetForm();
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error((res as any)?.error || 'Failed to create department user');
      }
    } catch (err: any) {
      toast.error(err?.message || 'An unexpected error occurred while adding user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Dialog Header */}
        <DialogHeader className="p-6 pb-4 border-b shrink-0 pr-12 text-left">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            Add Department User
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Create a clinical or administrative staff account assigned to a hospital department.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. Staff Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <User className="w-3.5 h-3.5 text-primary" />
                Staff Identity
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dept-user-name" className="text-xs font-medium">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dept-user-name"
                    placeholder="e.g. Dr. Sara Ahmed or Nurse John"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dept-user-email" className="text-xs font-medium">
                    Official Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dept-user-email"
                    type="email"
                    placeholder="sara.ahmed@hospital.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dept-user-job-title" className="text-xs font-medium">
                  Job / Clinical Title
                </Label>
                <Input
                  id="dept-user-job-title"
                  list="clinical-title-options"
                  placeholder="e.g. Head Nurse, Ward Physician, Lab Technician"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  disabled={isSubmitting}
                />
                <datalist id="clinical-title-options">
                  <option value="Head Nurse" />
                  <option value="Ward Physician" />
                  <option value="Lab Technician" />
                  <option value="Charge Nurse" />
                  <option value="Clinical Supervisor" />
                  <option value="Radiology Technician" />
                  <option value="ICU Specialist" />
                  <option value="Department Administrator" />
                </datalist>
              </div>
            </div>

            {/* 2. Login Credentials */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <KeyRound className="w-3.5 h-3.5 text-primary" />
                Login Credentials
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dept-user-username" className="text-xs font-medium">
                    Username / Employee ID
                  </Label>
                  <Input
                    id="dept-user-username"
                    placeholder="e.g. sahmed or EMP-1042"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Optional. Used for direct identifier login.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dept-user-password" className="text-xs font-medium">
                      Password
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={generateRandomPassword}
                      disabled={isSubmitting}
                      className="h-6 px-1.5 text-xs text-primary hover:text-primary/80 gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Generate
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="dept-user-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters (or blank to invite)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      disabled={isSubmitting}
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Leave blank to send an invite, or enter password to activate now.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Department Assignment */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Department Assignment
              </div>

              <div className="space-y-3">
                {/* Organization */}
                <div className="space-y-1.5">
                  <Label htmlFor="dept-user-org" className="text-xs font-medium">
                    Organization <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={organizationId}
                    onValueChange={(val) => {
                      setOrganizationId(val);
                      setHospitalId('');
                      setDepartmentId('');
                    }}
                    disabled={isSubmitting || isLoadingInitial || organizations.length === 0}
                  >
                    <SelectTrigger id="dept-user-org">
                      <SelectValue placeholder={isLoadingInitial ? 'Loading organizations...' : 'Select organization'} />
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

                {/* Hospital and Department side-by-side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Hospital */}
                  <div className="space-y-1.5">
                    <Label htmlFor="dept-user-hospital" className="text-xs font-medium">
                      Hospital <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={hospitalId}
                      onValueChange={(val) => {
                        setHospitalId(val);
                        setDepartmentId('');
                      }}
                      disabled={isSubmitting || !organizationId || isLoadingHospitals || hospitalsList.length === 0}
                    >
                      <SelectTrigger id="dept-user-hospital">
                        <SelectValue
                          placeholder={
                            !organizationId
                              ? 'Select organization first'
                              : isLoadingHospitals
                              ? 'Loading hospitals...'
                              : hospitalsList.length === 0
                              ? 'No hospitals available'
                              : 'Select hospital'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {hospitalsList.map((hosp) => (
                          <SelectItem key={hosp.id} value={hosp.id}>
                            {hosp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5">
                    <Label htmlFor="dept-user-department" className="text-xs font-medium">
                      Department <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={departmentId}
                      onValueChange={setDepartmentId}
                      disabled={isSubmitting || !hospitalId || isLoadingDepartments || departmentsList.length === 0}
                    >
                      <SelectTrigger id="dept-user-department">
                        <SelectValue
                          placeholder={
                            !hospitalId
                              ? 'Select hospital first'
                              : isLoadingDepartments
                              ? 'Loading departments...'
                              : departmentsList.length === 0
                              ? 'No departments found'
                              : 'Select department'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentsList.map((dept) => (
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

            {/* 4. Access Level (Radio Button Style Selector) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Access Level &amp; Role <span className="text-destructive">*</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Access Level">
                {/* STAFF Role Option */}
                <div
                  role="radio"
                  aria-checked={selectedRoleCode === 'STAFF'}
                  tabIndex={0}
                  onClick={() => setSelectedRoleCode('STAFF')}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setSelectedRoleCode('STAFF');
                    }
                  }}
                  className={cn(
                    'cursor-pointer rounded-lg border p-3.5 transition-all text-left flex flex-col justify-between relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    selectedRoleCode === 'STAFF'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs'
                      : 'border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/20'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                            selectedRoleCode === 'STAFF'
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/50'
                          )}
                        >
                          {selectedRoleCode === 'STAFF' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-background" />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-foreground">Clinical Staff</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        STAFF
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-6.5">
                      Can report equipment problems, scan QR codes, and view their own tickets.
                    </p>
                  </div>
                  <div className="mt-2.5 pl-6.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Standard reporting &amp; equipment access</span>
                  </div>
                </div>

                {/* DEPT_MGR Role Option */}
                <div
                  role="radio"
                  aria-checked={selectedRoleCode === 'DEPT_MGR'}
                  tabIndex={0}
                  onClick={() => setSelectedRoleCode('DEPT_MGR')}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setSelectedRoleCode('DEPT_MGR');
                    }
                  }}
                  className={cn(
                    'cursor-pointer rounded-lg border p-3.5 transition-all text-left flex flex-col justify-between relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    selectedRoleCode === 'DEPT_MGR'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs'
                      : 'border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/20'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                            selectedRoleCode === 'DEPT_MGR'
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/50'
                          )}
                        >
                          {selectedRoleCode === 'DEPT_MGR' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-background" />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-foreground">Department Manager</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        DEPT_MGR
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-6.5">
                      All staff permissions plus department oversight, ticket approval, and asset review.
                    </p>
                  </div>
                  <div className="mt-2.5 pl-6.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Managerial approval &amp; department oversight</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Contact */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Phone className="w-3.5 h-3.5 text-primary" />
                Contact Information
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dept-user-phone" className="text-xs font-medium">
                  Direct Phone / Mobile
                </Label>
                <Input
                  id="dept-user-phone"
                  type="tel"
                  placeholder="e.g. +249 91 234 5678 or Ext. 402"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-[11px] text-muted-foreground">
                  Optional contact number for clinical coordination and work order updates.
                </p>
              </div>
            </div>
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="p-4 px-6 border-t bg-muted/20 shrink-0 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingInitial}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Department User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

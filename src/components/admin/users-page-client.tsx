'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Eye,
  Edit,
  Search,
  Users,
  Wrench,
  Stethoscope,
  ShieldCheck,
  Building2,
  CheckCircle2,
  FilterX,
} from 'lucide-react';
import { AddUserTypeDialog, UserTypeSelection } from '@/components/admin/add-user-type-dialog';
import { AddEngineerDialog } from '@/components/admin/add-engineer-dialog';
import { AddDepartmentUserDialog } from '@/components/admin/add-department-user-dialog';

export interface UserItem {
  id: string;
  fullName: string;
  email: string;
  employeeIdentifier?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  accountStatus?: string | null;
  status?: string | null;
  lastLoginAt?: Date | string | null;
  roles?: { id: string; code: string; name: string }[];
  scopes?: any[];
  departmentName?: string | null;
  hospitalName?: string | null;
  userType?: 'engineer' | 'department' | 'admin' | 'other';
  createdAt?: Date | string | null;
}

interface UsersPageClientProps {
  users: UserItem[];
}

export function UsersPageClient({ users }: UsersPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dialog states
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [isEngineerDialogOpen, setIsEngineerDialogOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);

  // Check URL query param for auto-opening add dialog (e.g., /admin/users?action=new)
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsTypeDialogOpen(true);
    }
  }, [searchParams]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'engineer' | 'department' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleSelectType = (type: UserTypeSelection) => {
    setIsTypeDialogOpen(false);
    if (type === 'engineer') {
      setIsEngineerDialogOpen(true);
    } else {
      setIsDepartmentDialogOpen(true);
    }
  };

  const handleSuccess = () => {
    router.refresh();
  };

  // Metrics counts
  const stats = useMemo(() => {
    const total = users.length;
    const engineers = users.filter((u) => u.userType === 'engineer').length;
    const departmentStaff = users.filter((u) => u.userType === 'department').length;
    const activeAccounts = users.filter((u) => (u.accountStatus || u.status) === 'active').length;
    const admins = users.filter((u) => u.userType === 'admin').length;

    return { total, engineers, departmentStaff, activeAccounts, admins };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Category tab filter
      if (categoryFilter !== 'all' && u.userType !== categoryFilter) {
        return false;
      }

      // 2. Status filter
      const userStatus = u.accountStatus || u.status || '';
      if (statusFilter !== 'all' && userStatus !== statusFilter) {
        return false;
      }

      // 3. Search query (name, email, identifier, title, department, hospital)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = u.fullName?.toLowerCase().includes(query);
        const matchesEmail = u.email?.toLowerCase().includes(query);
        const matchesIdentifier = u.employeeIdentifier?.toLowerCase().includes(query);
        const matchesTitle = u.jobTitle?.toLowerCase().includes(query);
        const matchesDept = u.departmentName?.toLowerCase().includes(query);
        const matchesHosp = u.hospitalName?.toLowerCase().includes(query);
        const matchesRole = u.roles?.some((r) =>
          r.name?.toLowerCase().includes(query) || r.code?.toLowerCase().includes(query)
        );

        if (!matchesName && !matchesEmail && !matchesIdentifier && !matchesTitle && !matchesDept && !matchesHosp && !matchesRole) {
          return false;
        }
      }

      return true;
    });
  }, [users, categoryFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="User Governance"
        description="Provision, configure, and monitor biomedical engineers, department clinicians, and system administrators"
      >
        <Button onClick={() => setIsTypeDialogOpen(true)} className="gap-2 shadow-xs">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </PageHeader>

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-muted-foreground">Total Users</span>
              <p className="text-2xl font-bold tracking-tight text-foreground">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-muted-foreground">Biomedical Engineers</span>
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{stats.engineers}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-muted-foreground">Clinical & Dept Staff</span>
              <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">{stats.departmentStaff}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-muted-foreground">Active Accounts</span>
              <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{stats.activeAccounts}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Category Tabs */}
          <Tabs
            value={categoryFilter}
            onValueChange={(val) => setCategoryFilter(val as any)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-4 w-full md:w-auto">
              <TabsTrigger value="all" className="text-xs font-medium gap-1 px-3">
                All <span className="text-[10px] text-muted-foreground">({stats.total})</span>
              </TabsTrigger>
              <TabsTrigger value="engineer" className="text-xs font-medium gap-1 px-3">
                <Wrench className="w-3.5 h-3.5 text-blue-500" />
                Engineers <span className="text-[10px] text-muted-foreground">({stats.engineers})</span>
              </TabsTrigger>
              <TabsTrigger value="department" className="text-xs font-medium gap-1 px-3">
                <Stethoscope className="w-3.5 h-3.5 text-purple-500" />
                Staff <span className="text-[10px] text-muted-foreground">({stats.departmentStaff})</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="text-xs font-medium gap-1 px-3">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                Admins <span className="text-[10px] text-muted-foreground">({stats.admins})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search and Status Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users, email, dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9 bg-background"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="invited">Invited</SelectItem>
                <SelectItem value="deactivated">Deactivated</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                title="Clear filters"
              >
                <FilterX className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* ── Users Table ── */}
        <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Roles</th>
                  <th className="py-3 px-3">Facility / Department</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((item) => {
                    const initials = item.fullName
                      ? item.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'U';

                    const isEngineer = item.userType === 'engineer';
                    const isStaff = item.userType === 'department';
                    const isAdmin = item.userType === 'admin';

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        {/* User Identity */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isEngineer
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  : isStaff
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-foreground text-xs leading-snug truncate">
                                {item.fullName}
                              </span>
                              <span className="text-[11px] text-muted-foreground truncate">
                                {item.email}
                              </span>
                              {item.employeeIdentifier && (
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  ID: {item.employeeIdentifier}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Account Type Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isEngineer ? (
                            <Badge
                              variant="outline"
                              className="text-[11px] gap-1 border-blue-200 bg-blue-50/70 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 font-medium"
                            >
                              <Wrench className="w-3 h-3 text-blue-500" />
                              Biomed Engineer
                            </Badge>
                          ) : isStaff ? (
                            <Badge
                              variant="outline"
                              className="text-[11px] gap-1 border-purple-200 bg-purple-50/70 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300 font-medium"
                            >
                              <Stethoscope className="w-3 h-3 text-purple-500" />
                              Clinical Staff
                            </Badge>
                          ) : isAdmin ? (
                            <Badge
                              variant="outline"
                              className="text-[11px] gap-1 border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 font-medium"
                            >
                              <ShieldCheck className="w-3 h-3 text-amber-500" />
                              Administrator
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] text-muted-foreground font-medium">
                              User
                            </Badge>
                          )}
                        </td>

                        {/* Roles */}
                        <td className="py-3 px-3">
                          <div className="flex gap-1 flex-wrap max-w-xs">
                            {item.roles && item.roles.length > 0 ? (
                              item.roles.map((role) => (
                                <Badge
                                  key={role.id || role.code}
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 font-normal"
                                >
                                  {role.name || role.code}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-xs italic">No roles</span>
                            )}
                          </div>
                        </td>

                        {/* Facility / Department */}
                        <td className="py-3 px-3">
                          <div className="flex flex-col text-xs">
                            {item.departmentName ? (
                              <span className="font-medium text-foreground flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-muted-foreground" />
                                {item.departmentName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">
                                Facility-wide
                              </span>
                            )}
                            {item.hospitalName && (
                              <span className="text-[11px] text-muted-foreground">
                                {item.hospitalName}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <StatusBadge status={item.accountStatus || item.status} />
                        </td>

                        {/* Last Login */}
                        <td className="py-3 px-3 whitespace-nowrap text-xs text-muted-foreground">
                          {item.lastLoginAt ? (
                            new Date(item.lastLoginAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          ) : (
                            <span className="italic text-muted-foreground/70">Never</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              asChild
                              title="View user details"
                            >
                              <Link href={`/admin/users/${item.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              asChild
                              title="Edit user profile"
                            >
                              <Link href={`/admin/users/${item.id}/edit`}>
                                <Edit className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-8 h-8 text-muted-foreground/50" />
                        <p className="text-sm font-medium">No users found</p>
                        <p className="text-xs text-muted-foreground/80 max-w-xs">
                          {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                            ? 'Try adjusting your search terms or active filters.'
                            : 'Get started by adding your first biomedical engineer or department staff member.'}
                        </p>
                        {!searchQuery && statusFilter === 'all' && categoryFilter === 'all' && (
                          <Button
                            size="sm"
                            onClick={() => setIsTypeDialogOpen(true)}
                            className="mt-2 gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add User
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Dialog 1: Add User Type Selector ── */}
      <AddUserTypeDialog
        open={isTypeDialogOpen}
        onOpenChange={setIsTypeDialogOpen}
        onSelect={handleSelectType}
      />

      {/* ── Dialog 2a: Add Biomedical Engineer ── */}
      <AddEngineerDialog
        open={isEngineerDialogOpen}
        onOpenChange={setIsEngineerDialogOpen}
        onSuccess={handleSuccess}
      />

      {/* ── Dialog 2b: Add Department Staff ── */}
      <AddDepartmentUserDialog
        open={isDepartmentDialogOpen}
        onOpenChange={setIsDepartmentDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

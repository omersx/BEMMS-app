'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Phone, PhoneCall, Wrench, Shield, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { EngineerDutyStatus } from '@/lib/db/schema/engineer-profiles';

interface DepartmentCoverageProps {
  coverage: {
    id: string;
    name: string;
    code: string;
    deviceCount: number;
    primaryEngineer: {
      id: string;
      fullName: string;
      jobTitle: string;
      extension: string | null;
      mobileNumber: string | null;
      dutyStatus: EngineerDutyStatus;
    } | null;
  }[];
}

export function DepartmentCoverage({ coverage }: DepartmentCoverageProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">Hospital Department Engineering Assignments</h3>
          <p className="text-xs text-muted-foreground">
            Each hospital department is assigned a designated biomedical engineer for routine inspections, PM compliance, and rapid fault resolution.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coverage.map((dept) => {
          const eng = dept.primaryEngineer;

          return (
            <Card key={dept.id} className="border-border/70 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="text-[10px] font-mono mb-1">
                      {dept.code}
                    </Badge>
                    <CardTitle className="text-base font-semibold leading-tight">{dept.name}</CardTitle>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Wrench className="w-3 h-3 text-primary" />
                      {dept.deviceCount} Medical Equipment Assets
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs flex-1">
                <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-2">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Designated BME Lead
                  </span>

                  {eng ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{eng.fullName}</p>
                        {eng.dutyStatus === 'on_duty' ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-1.5 font-normal">
                            🟢 On Duty
                          </Badge>
                        ) : eng.dutyStatus === 'on_call' ? (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] py-0 px-1.5 font-normal">
                            📞 On Call
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px] py-0 px-1.5">
                            ⚪ Off Duty
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{eng.jobTitle}</p>

                      <div className="flex items-center gap-3 mt-2 text-xs pt-2 border-t border-border/40">
                        {eng.extension && (
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <PhoneCall className="w-3 h-3 text-primary" />
                            Ext: {eng.extension}
                          </span>
                        )}
                        {eng.mobileNumber && (
                          <a
                            href={`tel:${eng.mobileNumber}`}
                            className="flex items-center gap-1 text-primary hover:underline font-medium"
                          >
                            <Phone className="w-3 h-3" />
                            {eng.mobileNumber}
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic text-xs">General biomedical team pool</p>
                  )}
                </div>
              </CardContent>

              <div className="p-3 pt-0 flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1 text-xs h-8">
                  <Link href={`/departments/${dept.id}`}>
                    <Building2 className="w-3 h-3 mr-1" />
                    View Dept
                  </Link>
                </Button>

                {eng?.mobileNumber ? (
                  <Button asChild size="sm" className="flex-1 text-xs h-8 gap-1.5">
                    <a href={`tel:${eng.mobileNumber}`}>
                      <PhoneCall className="w-3 h-3" />
                      Contact Lead
                    </a>
                  </Button>
                ) : (
                  <Button asChild size="sm" className="flex-1 text-xs h-8 gap-1.5">
                    <Link href={`/tickets/new?departmentId=${dept.id}`}>
                      <Wrench className="w-3 h-3" />
                      Report Fault
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

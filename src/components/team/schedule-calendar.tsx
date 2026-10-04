'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, PhoneCall, Radio, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { EngineerTeamMember } from '@/lib/actions/engineers';

interface ScheduleCalendarProps {
  engineers: EngineerTeamMember[];
}

const DAYS_OF_WEEK = [
  { key: 'Sun', label: 'Sunday', arabic: 'الأحد' },
  { key: 'Mon', label: 'Monday', arabic: 'الاثنين' },
  { key: 'Tue', label: 'Tuesday', arabic: 'الثلاثاء' },
  { key: 'Wed', label: 'Wednesday', arabic: 'الأربعاء' },
  { key: 'Thu', label: 'Thursday', arabic: 'الخميس' },
  { key: 'Fri', label: 'Friday', arabic: 'الجمعة' },
  { key: 'Sat', label: 'Saturday', arabic: 'السبت' },
];

export function ScheduleCalendar({ engineers }: ScheduleCalendarProps) {
  // Current day of the week
  const todayIndex = new Date().getDay(); // 0 is Sunday
  const todayKey = DAYS_OF_WEEK[todayIndex].key;

  const [selectedDay, setSelectedDay] = useState<string>(todayKey);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Hospital Biomedical Duty Roster & On-Call Schedule
              </CardTitle>
              <CardDescription>
                Regular clinical engineering coverage hours: Sunday to Thursday (08:00 AM – 04:00 PM). Emergency on-call is active 24/7.
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-background/80 text-xs gap-1.5 py-1 px-2.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Standard Shift: 8 hrs
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Day Selector Pills */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS_OF_WEEK.map((day) => {
          const isToday = day.key === todayKey;
          const isSelected = day.key === selectedDay;
          const onDutyCount = engineers.filter((e) => e.workingDays.includes(day.key)).length;
          const onCallCount = engineers.filter((e) => e.onCallDays.includes(day.key)).length;

          return (
            <button
              key={day.key}
              onClick={() => setSelectedDay(day.key)}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between min-h-[90px] relative ${
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground shadow-md'
                  : isToday
                  ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-foreground'
                  : 'border-border/60 bg-card hover:border-primary/40 text-foreground'
              }`}
            >
              {isToday && (
                <span
                  className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                    isSelected ? 'bg-background text-primary' : 'bg-emerald-600 text-white'
                  }`}
                >
                  Today
                </span>
              )}
              <span className={`text-xs font-semibold ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                {day.key}
              </span>
              <span className="text-sm font-bold my-1">{day.label.slice(0, 3)}</span>

              <div className="flex items-center gap-1.5 text-[10px] mt-1">
                {onDutyCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded font-medium ${
                      isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    🟢 {onDutyCount}
                  </span>
                )}
                {onCallCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded font-medium ${
                      isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    📞 {onCallCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Roster Details */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <span>{DAYS_OF_WEEK.find((d) => d.key === selectedDay)?.label} Roster</span>
                <span className="text-xs text-muted-foreground font-normal">
                  ({DAYS_OF_WEEK.find((d) => d.key === selectedDay)?.arabic})
                </span>
                {selectedDay === todayKey && (
                  <Badge className="bg-emerald-500 text-white text-[10px] ml-2">Active Today</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Engineers scheduled for hospital on-site duty and emergency on-call rotation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-border/60">
          {engineers.map((eng) => {
            const isWorking = eng.workingDays.includes(selectedDay);
            const isOnCall = eng.onCallDays.includes(selectedDay);

            return (
              <div key={eng.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20">
                    {eng.fullName.replace('Eng. ', '').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{eng.fullName}</h4>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                        {eng.jobTitle}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{eng.specialization}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {eng.extension && (
                        <span>Ext: <strong className="text-foreground">{eng.extension}</strong></span>
                      )}
                      {eng.mobileNumber && (
                        <span>Mobile: <strong className="text-foreground">{eng.mobileNumber}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {isWorking ? (
                    <div className="text-right">
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1.5 font-medium">
                        <Radio className="w-3 h-3 text-emerald-500" />
                        On-Site Duty ({eng.shiftHours || '08:00 - 16:00'})
                      </Badge>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Hospital Workshop & Wards</p>
                    </div>
                  ) : isOnCall ? (
                    <div className="text-right">
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1.5 font-medium">
                        <PhoneCall className="w-3 h-3 text-amber-500 animate-pulse" />
                        Emergency On-Call (24h)
                      </Badge>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Urgent response within 30 min</p>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground gap-1.5">
                      Off Duty / Rest
                    </Badge>
                  )}

                  {eng.mobileNumber && (
                    <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                      <a href={`tel:${eng.mobileNumber}`}>
                        <PhoneCall className="w-3.5 h-3.5 text-primary" />
                        Call
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

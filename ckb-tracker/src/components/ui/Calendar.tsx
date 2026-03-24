'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users } from 'lucide-react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  parseISO,
  addWeeks,
  subWeeks,
  isToday,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { ClassInstance, ClassSchedule } from '@/types';

interface CalendarProps {
  classInstances: ClassInstance[];
  classSchedules: ClassSchedule[];
  selectedInstance: ClassInstance | null;
  onSelectInstance: (instance: ClassInstance | null) => void;
  attendanceCounts: Record<number, { total: number; pending: number }>;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const isInstanceInPast = (instance: ClassInstance): boolean => {
  const schedule = instance.class_schedule;
  if (!schedule?.time) return false;
  
  const now = new Date();
  const classDate = parseISO(instance.class_date);
  const [classHour, classMinute] = schedule.time.split(':').map(Number);
  
  const classDateTime = new Date(classDate);
  classDateTime.setHours(classHour, classMinute, 0, 0);
  
  return classDateTime < now;
};

export function Calendar({
  classInstances,
  classSchedules,
  selectedInstance,
  onSelectInstance,
  attendanceCounts,
}: CalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekDays = useMemo(
    () => eachDayOfInterval({
      start: currentWeekStart,
      end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
    }),
    [currentWeekStart]
  );

  const instancesByDayHour = useMemo(() => {
    const map: Record<string, ClassInstance[]> = {};
    
    classInstances.forEach((instance) => {
      const date = parseISO(instance.class_date);
      const dayKey = format(date, 'yyyy-MM-dd');
      
      classSchedules.forEach((schedule) => {
        if (schedule.id === instance.class_id && schedule.time) {
          const hourKey = `${dayKey}-${schedule.time.split(':')[0]}`;
          if (!map[hourKey]) map[hourKey] = [];
          map[hourKey].push(instance);
        }
      });
    });

    classSchedules.forEach((schedule) => {
      if (!schedule.day || !schedule.time) return;
      
      weekDays.forEach((day) => {
        if (format(day, 'EEEE').startsWith(schedule.day!)) {
          const dayKey = format(day, 'yyyy-MM-dd');
          const hour = parseInt(schedule.time!.split(':')[0]);
          const hourKey = `${dayKey}-${hour}`;
          if (!map[hourKey]) map[hourKey] = [];
          
          const existing = map[hourKey].find(
            (i) => i.class_id === schedule.id && i.class_date === dayKey
          );
          if (!existing) {
            map[hourKey].push({
              id: -schedule.id,
              class_id: schedule.id,
              class_date: dayKey,
              created_at: '',
              updated_at: '',
              class_schedule: schedule,
            });
          }
        }
      });
    });
    
    return map;
  }, [classInstances, classSchedules, weekDays]);

  const goToPrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800/50">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <span className="font-semibold text-slate-900 dark:text-white">
            {format(currentWeekStart, 'MMM d')} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToPrevWeek}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <button
            onClick={goToNextWeek}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-700">
        <div className="p-2 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              'p-2 text-center font-medium text-sm border-r border-slate-200 dark:border-slate-700 last:border-r-0',
              isToday(day)
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            )}
          >
            <div>{format(day, 'EEE')}</div>
            <div className={cn(
              'text-lg',
              isToday(day) && 'font-bold'
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-slate-100 dark:border-slate-700/50 last:border-b-0">
            <div className="p-2 text-xs text-slate-400 dark:text-slate-500 text-right pr-3 bg-slate-50/50 dark:bg-slate-800/50 border-r border-slate-100 dark:border-slate-700/50">
              {hour > 12 ? `${hour - 12}:00` : `${hour}:00`} {hour >= 12 ? 'PM' : 'AM'}
            </div>
            {weekDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const hourKey = `${dayKey}-${hour}`;
              const instances = instancesByDayHour[hourKey] || [];

              return (
                <div
                  key={`${dayKey}-${hour}`}
                  className="min-h-[60px] p-1 border-r border-slate-100 dark:border-slate-700/50 last:border-r-0"
                >
                  {instances.map((instance) => {
                    const schedule = instance.class_schedule;
                    const isSelected = selectedInstance?.id === instance.id;
                    const isPast = isInstanceInPast(instance);
                    const counts = attendanceCounts[instance.class_id] || { total: 0, pending: 0 };

                    return (
                      <button
                        key={instance.id}
                        onClick={() => {
                          if (isPast) return;
                          if (instance.id < 0) {
                            onSelectInstance(null);
                          } else {
                            onSelectInstance(isSelected ? null : instance);
                          }
                        }}
                        disabled={isPast}
                        className={cn(
                          'w-full text-left p-1.5 rounded-md text-xs mb-1 transition-all',
                          isPast
                            ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-50'
                            : schedule?.class_type_id === 1
                            ? 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                            : schedule?.class_type_id === 2
                            ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300',
                          isSelected && 'ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-1'
                        )}
                      >
                        <div className="font-medium truncate">{schedule?.class_name || 'Class'}</div>
                        {schedule?.time && (
                          <div className="text-[10px] opacity-75">
                            {schedule.time}
                          </div>
                        )}
                        {isPast && (
                          <div className="text-[10px] text-slate-400 mt-0.5">Past</div>
                        )}
                        {!isPast && instance.id > 0 && counts.total > 0 && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <Users className="w-3 h-3" />
                            <span className={cn(
                              counts.pending > 0 && 'text-yellow-600 dark:text-yellow-400'
                            )}>
                              {counts.pending}/{counts.total}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

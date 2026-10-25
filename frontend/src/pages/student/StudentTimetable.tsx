import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { TimetableEntry } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { CalendarDays, Clock, MapPin, User } from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const StudentTimetable: React.FC = () => {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

  useEffect(() => {
    api.getMyTimetable().then((data) => {
      setEntries(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredEntries = entries.filter((e) => e.weekday === selectedDay);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Timetable</h2>
        <p className="text-xs text-slate-500 mt-1">
          Weekly schedule assigned for your course, branch, and current semester.
        </p>
      </div>

      {/* Weekday Tabs */}
      <div className="flex overflow-x-auto space-x-2 pb-2 border-b border-slate-200">
        {WEEKDAYS.slice(0, 6).map((day, idx) => (
          <button
            key={day}
            onClick={() => setSelectedDay(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDay === idx
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Timetable Cards */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEntries.map((e) => (
            <div key={e.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    Semester {e.semester}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">{e.subject_name}</h3>
                </div>
                <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  {e.start_time.slice(0, 5)} - {e.end_time.slice(0, 5)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{e.teacher_name || 'Assigned Faculty'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>Classroom {e.classroom_number}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title={`No classes scheduled for ${WEEKDAYS[selectedDay]}`}
          description="Enjoy your study break or consult your faculty advisor for special sessions."
        />
      )}
    </div>
  );
};

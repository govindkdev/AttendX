import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { TimetableEntry } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { CalendarDays, Clock, MapPin, User, BookOpen } from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const StudentTimetable: React.FC = () => {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

  useEffect(() => {
    api.getMyTimetable()
      .then((data) => {
        setEntries(data || []);
        setLoading(false);
      })
      .catch(() => {
        setEntries([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-3 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredEntries = entries.filter((e) => e.weekday === selectedDay);

  return (
    <div className="space-y-8 text-[#F8FAFC]">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">Academic Timetable</h2>
        <p className="text-xs text-[#A1AEC2] mt-1">
          Weekly schedule assigned for your course, branch, and current academic semester.
        </p>
      </div>

      {/* Weekday Tabs */}
      <div className="flex overflow-x-auto space-x-2 pb-2 border-b border-[#23334A]">
        {WEEKDAYS.slice(0, 6).map((day, idx) => (
          <button
            key={day}
            onClick={() => setSelectedDay(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDay === idx
                ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                : 'bg-[#111D30] text-[#A1AEC2] hover:bg-[#16243A] hover:text-[#F8FAFC] border border-[#23334A]'
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
            <div
              key={e.id}
              className="bg-[#111D30] p-6 rounded-3xl border border-[#23334A] shadow-xl space-y-4 hover:border-[#3B82F6]/40 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B82F6] bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                    Semester {e.semester}
                  </span>
                  <h3 className="text-lg font-bold text-[#F8FAFC] mt-2">{e.subject_name}</h3>
                </div>
                <span className="px-3 py-1 rounded-xl bg-[#0D1525] border border-[#23334A] text-[#22D3EE] text-xs font-mono font-bold flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-[#3B82F6]" />
                  {e.start_time?.slice(0, 5)} - {e.end_time?.slice(0, 5)}
                </span>
              </div>

              <div className="pt-3 border-t border-[#23334A] grid grid-cols-2 gap-3 text-xs text-[#A1AEC2]">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-[#64748B]" />
                  <span>{e.teacher_name || 'Assigned Faculty'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-[#64748B]" />
                  <span>Room {e.classroom_number || 'TBA'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No classes scheduled for ${WEEKDAYS[selectedDay]}`}
          description="Enjoy your study preparation period or check another weekday schedule."
          icon={CalendarDays}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { TimetableEntry, Subject, TeacherListItem, Classroom, Course, Branch } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { CalendarDays, Plus, Clock, MapPin, User, AlertCircle, X, Search, Trash2 } from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const AdminClasses: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<number | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<number | null>(null);

  // Form State
  const [weekday, setWeekday] = useState(0);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [teacherId, setTeacherId] = useState<number | ''>('');
  const [classroomId, setClassroomId] = useState<number | ''>('');
  const [courseId, setCourseId] = useState<number | ''>('');
  const [branchId, setBranchId] = useState<number | ''>('');
  const [semester, setSemester] = useState(1);

  // Room Form
  const [roomNumber, setRoomNumber] = useState('');
  const [building, setBuilding] = useState('Academic Block');
  const [capacity, setCapacity] = useState(60);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [tt, subs, tchs, rooms, crs] = await Promise.all([
        api.getTimetable(),
        api.getSubjects(),
        api.getTeachers(),
        api.getClassrooms(),
        api.getCourses(),
      ]);
      setTimetable(tt);
      setSubjects(subs);
      setTeachers(tchs);
      setClassrooms(rooms);
      setCourses(crs);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (courseId) {
      api.getBranches(Number(courseId)).then(setBranches).catch(() => setBranches([]));
    } else {
      setBranches([]);
    }
  }, [courseId]);

  const handleCreateTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !teacherId || !classroomId || !courseId || !branchId) {
      setErrorMsg('All fields are mandatory to assign a class schedule.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.createTimetableEntry({
        weekday: Number(weekday),
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
        subject_id: Number(subjectId),
        teacher_id: Number(teacherId),
        classroom_id: Number(classroomId),
        course_id: Number(courseId),
        branch_id: Number(branchId),
        semester: Number(semester),
      });
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Timetable conflict rejected.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) return;

    try {
      await api.createClassroom({
        room_number: roomNumber.trim().toUpperCase(),
        building: building.trim(),
        capacity: Number(capacity),
      });
      setRoomModalOpen(false);
      setRoomNumber('');
      api.getClassrooms().then(setClassrooms);
    } catch (err: any) {
      alert(err.message || 'Failed to create classroom');
    }
  };

  const handleDeleteTimetable = async () => {
    if (!deleteEntryId) return;
    try {
      await api.deleteTimetableEntry(deleteEntryId);
      setDeleteEntryId(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete timetable entry');
    }
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoomId) return;
    try {
      await api.deleteClassroom(deleteRoomId);
      setDeleteRoomId(null);
      api.getClassrooms().then(setClassrooms);
    } catch (err: any) {
      alert(err.message || 'Cannot delete classroom: Slots are currently scheduled in this room.');
    }
  };

  const filteredTimetable = timetable.filter((t) => {
    const q = search.toLowerCase();
    return (
      WEEKDAYS[t.weekday]?.toLowerCase().includes(q) ||
      t.subject_name?.toLowerCase().includes(q) ||
      t.teacher_name?.toLowerCase().includes(q) ||
      t.classroom_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Classes & Timetable Scheduling</h2>
          <p className="text-xs text-slate-500 mt-1">
            Assign teachers, classrooms, and courses to slots with automatic clash detection.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schedule..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <button
            onClick={() => setRoomModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Room
          </button>
          <button
            onClick={() => {
              setErrorMsg(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Schedule Slot
          </button>
        </div>
      </div>

      {timetable.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Weekday</th>
                  <th className="py-3.5 px-6">Time Slot</th>
                  <th className="py-3.5 px-6">Subject</th>
                  <th className="py-3.5 px-6">Faculty Instructor</th>
                  <th className="py-3.5 px-6">Classroom</th>
                  <th className="py-3.5 px-6">Semester</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTimetable.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {WEEKDAYS[t.weekday]}
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold text-blue-700">
                      {t.start_time.slice(0, 5)} - {t.end_time.slice(0, 5)}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {t.subject_name}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {t.teacher_name}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      Room {t.classroom_number}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-semibold">
                      Sem {t.semester}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setDeleteEntryId(t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Schedule Slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No timetable entries scheduled"
          description="Schedule lecture sessions for your faculty and classrooms. Timetable conflicts are automatically validated."
          actionText="Schedule First Slot"
          onAction={() => {
            setErrorMsg(null);
            setModalOpen(true);
          }}
        />
      )}

      {/* Classrooms List Section */}
      {classrooms.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Configured Classrooms & Lecture Halls ({classrooms.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {classrooms.map((r) => (
              <div
                key={r.id}
                className="group relative p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all text-center"
              >
                <p className="font-mono font-bold text-sm text-slate-900">{r.room_number}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{r.building}</p>
                <p className="text-[10px] text-slate-400 font-medium">Cap: {r.capacity}</p>
                <button
                  type="button"
                  onClick={() => setDeleteRoomId(r.id)}
                  className="absolute top-2 right-2 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Room"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Class Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Schedule Class Slot</h3>
            <p className="text-xs text-slate-500 mb-6">Assign faculty, room, and batch time with anti-collision validation.</p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateTimetable} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Day of Week *
                  </label>
                  <select
                    value={weekday}
                    onChange={(e) => setWeekday(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    {WEEKDAYS.slice(0, 6).map((d, i) => (
                      <option key={d} value={i}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Course Program *
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="">Select Course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Branch *
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(Number(e.target.value))}
                    disabled={!courseId}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white disabled:bg-slate-100"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Subject *
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code}) - Sem {s.semester}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Faculty Instructor *
                  </label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="">Select Faculty</option>
                    {teachers.map((t) => (
                      <option key={t.profile_id} value={t.profile_id}>{t.full_name} ({t.employee_code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Classroom *
                  </label>
                  <select
                    value={classroomId}
                    onChange={(e) => setClassroomId(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="">Select Classroom</option>
                    {classrooms.map((r) => (
                      <option key={r.id} value={r.id}>Room {r.room_number} ({r.building})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Validating Conflicts...' : 'Save Schedule Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Classroom Modal */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setRoomModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Add Classroom</h3>
            <form onSubmit={handleCreateRoom} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number *</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. LT-101"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Building</label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="e.g. Ramanujan Block"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seating Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Timetable Entry Confirmation */}
      {deleteEntryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Remove Class Schedule Slot?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to remove this timetable slot from the schedule?
            </p>
            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => setDeleteEntryId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTimetable}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                Delete Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation */}
      {deleteRoomId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Classroom?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete this room? It will be blocked if active timetable slots are scheduled in it.
            </p>
            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => setDeleteRoomId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRoom}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                Delete Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

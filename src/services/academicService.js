/*
=========================================================
ATTENDX - ACADEMIC DATA SERVICE
=========================================================
Client service for Course, Branch, Academic Year, Subject,
Section/Class configuration, and Faculty assignments.
=========================================================
*/

import { api } from "./api";

export const academicService = {
  // 1. Courses
  async getCourses() {
    const res = await api.get("/api/academic/courses");
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    // Fallback default courses
    return [
      { code: "B.Tech", name: "Bachelor of Technology", duration_years: 4 },
      { code: "BCA", name: "Bachelor of Computer Applications", duration_years: 3 },
      { code: "MCA", name: "Master of Computer Applications", duration_years: 2 },
      { code: "B.Sc", name: "Bachelor of Science", duration_years: 3 },
      { code: "M.Tech", name: "Master of Technology", duration_years: 2 },
      { code: "MBA", name: "Master of Business Administration", duration_years: 2 }
    ];
  },

  async createCourse(courseData) {
    return await api.post("/api/academic/courses", courseData);
  },

  // 2. Branches
  async getBranches(courseCode = "") {
    const query = courseCode ? `?courseCode=${encodeURIComponent(courseCode)}` : "";
    const res = await api.get(`/api/academic/branches${query}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    // Fallback default branches
    if (courseCode === "BCA") {
      return [
        { code: "CA", name: "Computer Applications" },
        { code: "CIS", name: "Cloud & Information Security" },
        { code: "DA", name: "Data Analytics" }
      ];
    }
    if (courseCode === "MBA") {
      return [
        { code: "FBA", name: "Finance & Business Analytics" },
        { code: "MSM", name: "Marketing & Strategic Management" },
        { code: "HRM", name: "Human Resource Management" }
      ];
    }
    return [
      { code: "CSE", name: "Computer Science & Engineering" },
      { code: "IT", name: "Information Technology" },
      { code: "ECE", name: "Electronics & Communication" },
      { code: "ME", name: "Mechanical Engineering" }
    ];
  },

  async createBranch(branchData) {
    return await api.post("/api/academic/branches", branchData);
  },

  // 3. Academic Years
  async getAcademicYears() {
    const res = await api.get("/api/academic/years");
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [
      { code: "1st Year", name: "First Year", year_number: 1 },
      { code: "2nd Year", name: "Second Year", year_number: 2 },
      { code: "3rd Year", name: "Third Year", year_number: 3 },
      { code: "4th Year", name: "Fourth Year", year_number: 4 }
    ];
  },

  // 4. Subjects (Strict Course + Branch + Year retrieval)
  async getSubjects({ course = "", branch = "", year = "" } = {}) {
    const params = new URLSearchParams();
    if (course) params.append("course", course);
    if (branch) params.append("branch", branch);
    if (year) params.append("year", year);

    const res = await api.get(`/api/academic/subjects?${params.toString()}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  async createSubject(subjectData) {
    return await api.post("/api/academic/subjects", subjectData);
  },

  async deleteSubject(id) {
    return await api.delete(`/api/academic/subjects/${id}`);
  },

  // 5. Classes / Sections
  async getAcademicClasses({ course = "", branch = "", year = "" } = {}) {
    const params = new URLSearchParams();
    if (course) params.append("course", course);
    if (branch) params.append("branch", branch);
    if (year) params.append("year", year);

    const res = await api.get(`/api/academic/classes?${params.toString()}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [
      { class_code: "CS-4A", section_name: "Sec A" },
      { class_code: "CS-4B", section_name: "Sec B" },
      { class_code: "IT-1A", section_name: "Sec A" },
      { class_code: "IT-4A", section_name: "Sec A" }
    ];
  },

  async createAcademicClass(classData) {
    return await api.post("/api/academic/classes", classData);
  },

  // 6. Teacher Assignments
  async getTeacherAssignments({ teacherId = "", subjectCode = "", classCode = "" } = {}) {
    const params = new URLSearchParams();
    if (teacherId) params.append("teacherId", teacherId);
    if (subjectCode) params.append("subjectCode", subjectCode);
    if (classCode) params.append("classCode", classCode);

    const res = await api.get(`/api/academic/teacher-assignments?${params.toString()}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  async createTeacherAssignment(data) {
    return await api.post("/api/academic/teacher-assignments", data);
  },

  async deleteTeacherAssignment(id) {
    return await api.delete(`/api/academic/teacher-assignments/${id}`);
  },

  // 7. Scheduled Lectures
  async getScheduledLectures({ courseCode = "", branchCode = "", yearCode = "", subjectCode = "", teacherId = "" } = {}) {
    const params = new URLSearchParams();
    if (courseCode) params.append("courseCode", courseCode);
    if (branchCode) params.append("branchCode", branchCode);
    if (yearCode) params.append("yearCode", yearCode);
    if (subjectCode) params.append("subjectCode", subjectCode);
    if (teacherId) params.append("teacherId", teacherId);

    const res = await api.get(`/api/academic/lectures?${params.toString()}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  async createScheduledLecture(lectureData) {
    return await api.post("/api/academic/lectures", lectureData);
  },

  async deleteScheduledLecture(id) {
    return await api.delete(`/api/academic/lectures/${id}`);
  }
};

export default academicService;

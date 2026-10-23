/*
=========================================================
ATTENDX - DEMO DATA STORE & SEED RECORDS
=========================================================
Centralized repository of mock institutional data with
localStorage persistence.

Pre-authorized Identifiers:
- Student: STU-2026-001 (Govind Kushwaha)
- Teacher: TCH-2026-001 (Dr. Rajesh Sharma)
- Admin:   ADM-2026-001 (Prof. Amitabh Verma)

Admin Authority Allowlist:
- ADM-2026-001, ADM-2026-002, ADM-2026-003

Simulated OTP:
- 123456
=========================================================
*/

const STORAGE_KEY = "attendx_prototype_state_v1";

export const DEFAULT_CAMPUS_GEOFENCE = {
  campusName: "AttendX Main Institute of Technology",
  latitude: 28.5355,
  longitude: 77.3910,
  radiusMeters: 600,
  strictMode: true,
  // Current demo simulation state: 'inside' | 'outside' | 'gps'
  simulationMode: "inside"
};

export const INITIAL_STUDENTS = [
  {
    studentId: "STU-2026-001",
    fullName: "Govind Kushwaha",
    course: "B.Tech",
    branch: "Computer Science & Engineering",
    year: "4th Year",
    rollNumber: "2100970100045",
    email: "student@attendx.com",
    phone: "9876543210",
    parentName: "Suresh Kushwaha",
    parentPhone: "9876543211",
    parentEmail: "suresh.k@gmail.com",
    address: "B-42, Tech Enclave, New Delhi, India",
    status: "Active",
    faceEnrolled: true,
    issuedDate: "2026-08-01",
    overallAttendance: 87.5
  },
  {
    studentId: "STU-2026-002",
    fullName: "Ananya Sharma",
    course: "B.Tech",
    branch: "Computer Science & Engineering",
    year: "4th Year",
    rollNumber: "2100970100012",
    email: "ananya.sharma@attendx.com",
    phone: "9876543212",
    parentName: "Mohan Sharma",
    parentPhone: "9876543213",
    parentEmail: "mohan.s@gmail.com",
    address: "Flat 302, Green Avenue, Noida, UP",
    status: "Active",
    faceEnrolled: true,
    issuedDate: "2026-08-01",
    overallAttendance: 92.0
  },
  {
    studentId: "STU-2026-003",
    fullName: "Rohan Patel",
    course: "B.Tech",
    branch: "Computer Science & Engineering",
    year: "4th Year",
    rollNumber: "2100970100078",
    email: "rohan.patel@attendx.com",
    phone: "9876543214",
    parentName: "Vikram Patel",
    parentPhone: "9876543215",
    parentEmail: "vikram.p@gmail.com",
    address: "C-11 Sector 62, Noida, UP",
    status: "Active",
    faceEnrolled: true,
    issuedDate: "2026-08-01",
    overallAttendance: 74.2
  },
  {
    studentId: "STU-2026-004",
    fullName: "Priya Verma",
    course: "B.Tech",
    branch: "Information Technology",
    year: "3rd Year",
    rollNumber: "2200970130022",
    email: "priya.verma@attendx.com",
    phone: "9876543216",
    parentName: "Rajeev Verma",
    parentPhone: "9876543217",
    parentEmail: "rajeev.v@gmail.com",
    address: "Pocket 4, Mayur Vihar, New Delhi",
    status: "Active",
    faceEnrolled: true,
    issuedDate: "2026-08-05",
    overallAttendance: 89.1
  },
  {
    studentId: "STU-2026-005",
    fullName: "Aditya Pratap Singh",
    course: "B.Tech",
    branch: "Electronics & Communication",
    year: "4th Year",
    rollNumber: "2100970310005",
    email: "aditya.singh@attendx.com",
    phone: "9876543218",
    parentName: "Dharmendra Singh",
    parentPhone: "9876543219",
    parentEmail: "dsingh@gmail.com",
    address: "Sector 15, Vasundhara, Ghaziabad",
    status: "Suspended",
    faceEnrolled: false,
    issuedDate: "2026-08-05",
    overallAttendance: 62.0
  }
];

export const INITIAL_TEACHERS = [
  {
    teacherId: "TCH-2026-001",
    fullName: "Dr. Rajesh Sharma",
    department: "Computer Science & Engineering",
    designation: "Professor & HOD",
    email: "teacher@attendx.com",
    phone: "9876543220",
    subjects: [
      { code: "CS401", name: "Data Structures & Algorithms", room: "LT-102" },
      { code: "CS402", name: "Machine Learning & AI", room: "Lab 304" },
      { code: "CS403", name: "Cloud Computing & DevOps", room: "LT-201" }
    ],
    status: "Active",
    issuedDate: "2026-07-15"
  },
  {
    teacherId: "TCH-2026-002",
    fullName: "Prof. Sunita Rao",
    department: "Information Technology",
    designation: "Associate Professor",
    email: "sunita.rao@attendx.com",
    phone: "9876543222",
    subjects: [
      { code: "IT301", name: "Database Management Systems", room: "Lab 201" },
      { code: "IT302", name: "Cybersecurity & Cryptography", room: "LT-105" }
    ],
    status: "Active",
    issuedDate: "2026-07-20"
  },
  {
    teacherId: "TCH-2026-003",
    fullName: "Dr. Vikram Malhotra",
    department: "Electronics & Communication",
    designation: "Assistant Professor",
    email: "vikram.m@attendx.com",
    phone: "9876543224",
    subjects: [
      { code: "EC201", name: "Embedded Systems & IoT", room: "Lab 105" }
    ],
    status: "Active",
    issuedDate: "2026-07-22"
  }
];

export const INITIAL_ADMINS = [
  {
    adminId: "ADM-2026-001",
    fullName: "Prof. Amitabh Verma",
    title: "Chief Attendance Administrator",
    authority: "AttendX Institutional Controller",
    email: "admin@attendx.com",
    phone: "9876543200",
    status: "Active",
    permissions: ["ALL"]
  }
];

export const AUTHORITY_ADMIN_ALLOWLIST = [
  "ADM-2026-001",
  "ADM-2026-002",
  "ADM-2026-003"
];

export const INITIAL_PENDING_REGISTRATIONS = [
  {
    id: "REG-2026-901",
    role: "teacher",
    teacherId: "TCH-2026-004",
    fullName: "Dr. Meenakshi Sundaram",
    department: "Computer Science & Engineering",
    phone: "9811223344",
    email: "meenakshi.s@attendx.com",
    requestDate: "2026-10-18",
    status: "Pending",
    notes: "New faculty onboarding for Deep Learning Lab"
  }
];

export const INITIAL_ACTIVE_SESSIONS = [
  {
    sessionId: "SES-2026-402",
    sessionCode: "AX-8492",
    subjectCode: "CS402",
    subjectName: "Machine Learning & AI",
    teacherId: "TCH-2026-001",
    teacherName: "Dr. Rajesh Sharma",
    room: "Lab 304",
    startTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 25).toISOString(), // 25 mins remaining
    status: "Active",
    totalEnrolled: 45,
    markedCount: 38
  }
];

export const INITIAL_ATTENDANCE_HISTORY = [
  {
    id: "ATT-1001",
    studentId: "STU-2026-001",
    studentName: "Govind Kushwaha",
    date: "2026-10-20",
    time: "09:05 AM",
    subject: "Machine Learning & AI",
    subjectCode: "CS402",
    method: "Face AI",
    status: "Present",
    geofenceVerified: true,
    confidence: "99.4%",
    room: "Lab 304"
  },
  {
    id: "ATT-1002",
    studentId: "STU-2026-001",
    studentName: "Govind Kushwaha",
    date: "2026-10-19",
    time: "11:15 AM",
    subject: "Data Structures & Algorithms",
    subjectCode: "CS401",
    method: "Face AI",
    status: "Present",
    geofenceVerified: true,
    confidence: "98.9%",
    room: "LT-102"
  },
  {
    id: "ATT-1003",
    studentId: "STU-2026-001",
    studentName: "Govind Kushwaha",
    date: "2026-10-18",
    time: "02:10 PM",
    subject: "Cloud Computing & DevOps",
    subjectCode: "CS403",
    method: "QR Backup",
    status: "Present",
    geofenceVerified: true,
    confidence: "QR Validated",
    room: "LT-201"
  },
  {
    id: "ATT-1004",
    studentId: "STU-2026-001",
    studentName: "Govind Kushwaha",
    date: "2026-10-17",
    time: "09:22 AM",
    subject: "Machine Learning & AI",
    subjectCode: "CS402",
    method: "Face AI",
    status: "Late",
    geofenceVerified: true,
    confidence: "97.8%",
    room: "Lab 304"
  },
  {
    id: "ATT-1005",
    studentId: "STU-2026-001",
    studentName: "Govind Kushwaha",
    date: "2026-10-16",
    time: "10:00 AM",
    subject: "Database Management Systems",
    subjectCode: "IT301",
    method: "Manual Record",
    status: "Absent",
    geofenceVerified: false,
    confidence: "None",
    room: "Lab 201"
  },
  {
    id: "ATT-1006",
    studentId: "STU-2026-001",
    studentName: "Govind Kushwaha",
    date: "2026-10-15",
    time: "09:02 AM",
    subject: "Data Structures & Algorithms",
    subjectCode: "CS401",
    method: "Face AI",
    status: "Present",
    geofenceVerified: true,
    confidence: "99.1%",
    room: "LT-102"
  },
  {
    id: "ATT-1007",
    studentId: "STU-2026-001",
    studentName: "Govind Kushwaha",
    date: "2026-10-14",
    time: "01:45 PM",
    subject: "Cybersecurity & Cryptography",
    subjectCode: "IT302",
    method: "QR Backup",
    status: "Present",
    geofenceVerified: true,
    confidence: "QR Validated",
    room: "LT-105"
  }
];

export const INITIAL_TIMETABLE = [
  {
    id: "TT-1",
    day: "Monday",
    time: "09:00 AM - 10:30 AM",
    subject: "Machine Learning & AI (CS402)",
    room: "Lab 304",
    teacher: "Dr. Rajesh Sharma",
    type: "Lab"
  },
  {
    id: "TT-2",
    day: "Monday",
    time: "11:00 AM - 12:30 PM",
    subject: "Data Structures & Algorithms (CS401)",
    room: "LT-102",
    teacher: "Dr. Rajesh Sharma",
    type: "Lecture"
  },
  {
    id: "TT-3",
    day: "Tuesday",
    time: "09:30 AM - 11:00 AM",
    subject: "Database Management Systems (IT301)",
    room: "Lab 201",
    teacher: "Prof. Sunita Rao",
    type: "Lab"
  },
  {
    id: "TT-4",
    day: "Tuesday",
    time: "01:30 PM - 03:00 PM",
    subject: "Cloud Computing & DevOps (CS403)",
    room: "LT-201",
    teacher: "Dr. Rajesh Sharma",
    type: "Lecture"
  },
  {
    id: "TT-5",
    day: "Wednesday",
    time: "09:00 AM - 10:30 AM",
    subject: "Machine Learning & AI (CS402)",
    room: "Lab 304",
    teacher: "Dr. Rajesh Sharma",
    type: "Lab"
  },
  {
    id: "TT-6",
    day: "Wednesday",
    time: "11:30 AM - 01:00 PM",
    subject: "Cybersecurity & Cryptography (IT302)",
    room: "LT-105",
    teacher: "Prof. Sunita Rao",
    type: "Lecture"
  },
  {
    id: "TT-7",
    day: "Thursday",
    time: "10:00 AM - 11:30 AM",
    subject: "Data Structures & Algorithms (CS401)",
    room: "LT-102",
    teacher: "Dr. Rajesh Sharma",
    type: "Lecture"
  },
  {
    id: "TT-8",
    day: "Friday",
    time: "09:00 AM - 11:00 AM",
    subject: "Major Engineering Project Review",
    room: "Seminar Hall A",
    teacher: "Department Committee",
    type: "Seminar"
  }
];

export const INITIAL_LEAVE_REQUESTS = [
  {
    id: "LR-501",
    studentId: "STU-2026-001",
    studentName: "Govind Kushwaha",
    fromDate: "2026-10-25",
    toDate: "2026-10-26",
    reason: "Attending Smart India Hackathon Grand Finale",
    category: "Academic / Competition",
    submittedOn: "2026-10-18",
    status: "Approved",
    adminRemarks: "Approved by HOD. Produce participation certificate on return."
  },
  {
    id: "LR-502",
    studentId: "STU-2026-001",
    studentName: "Govind Kushwaha",
    fromDate: "2026-11-04",
    toDate: "2026-11-05",
    reason: "Family medical emergency",
    category: "Personal",
    submittedOn: "2026-10-19",
    status: "Pending",
    adminRemarks: "Under review by Department Office"
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: "NOTIF-1",
    recipientRole: "student",
    recipientId: "STU-2026-001",
    title: "Attendance Verified via Face AI",
    message: "Your attendance for CS402 (Machine Learning & AI) was successfully verified inside campus.",
    timestamp: "2026-10-20 09:06 AM",
    read: false,
    type: "success"
  },
  {
    id: "NOTIF-2",
    recipientRole: "student",
    recipientId: "STU-2026-001",
    title: "Hackathon Leave Request Approved",
    message: "Leave request for 25-26 Oct has been approved by HOD Dr. Rajesh Sharma.",
    timestamp: "2026-10-19 04:30 PM",
    read: true,
    type: "info"
  },
  {
    id: "NOTIF-3",
    recipientRole: "student",
    recipientId: "STU-2026-001",
    title: "Semester Attendance Target",
    message: "Your overall attendance is currently at 87.5% (Above mandatory 75% threshold).",
    timestamp: "2026-10-18 10:00 AM",
    read: true,
    type: "alert"
  },
  {
    id: "NOTIF-4",
    recipientRole: "teacher",
    recipientId: "TCH-2026-001",
    title: "Attendance Session Active",
    message: "Session SES-2026-402 for CS402 Lab is currently running with 38 check-ins.",
    timestamp: "2026-10-20 09:15 AM",
    read: false,
    type: "info"
  },
  {
    id: "NOTIF-5",
    recipientRole: "admin",
    recipientId: "ADM-2026-001",
    title: "New Faculty Registration Request",
    message: "Dr. Meenakshi Sundaram submitted registration with Teacher ID TCH-2026-004.",
    timestamp: "2026-10-18 11:20 AM",
    read: false,
    type: "alert"
  }
];

// Helper to get fresh deep clone of seed data
export function getInitialSeedState() {
  return {
    students: JSON.parse(JSON.stringify(INITIAL_STUDENTS)),
    teachers: JSON.parse(JSON.stringify(INITIAL_TEACHERS)),
    admins: JSON.parse(JSON.stringify(INITIAL_ADMINS)),
    authorityAllowlist: [...AUTHORITY_ADMIN_ALLOWLIST],
    pendingRegistrations: JSON.parse(JSON.stringify(INITIAL_PENDING_REGISTRATIONS)),
    activeSessions: JSON.parse(JSON.stringify(INITIAL_ACTIVE_SESSIONS)),
    attendanceHistory: JSON.parse(JSON.stringify(INITIAL_ATTENDANCE_HISTORY)),
    timetable: JSON.parse(JSON.stringify(INITIAL_TIMETABLE)),
    leaveRequests: JSON.parse(JSON.stringify(INITIAL_LEAVE_REQUESTS)),
    notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
    campusGeofence: { ...DEFAULT_CAMPUS_GEOFENCE }
  };
}

// Load state from localStorage or initialize from seed
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const state = getInitialSeedState();
      saveState(state);
      return state;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Could not read AttendX state from localStorage, using seed:", err);
    return getInitialSeedState();
  }
}

// Persist state to localStorage
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Could not write AttendX state to localStorage:", err);
  }
}

// Reset state to initial seed data
export function resetState() {
  const seed = getInitialSeedState();
  saveState(seed);
  return seed;
}

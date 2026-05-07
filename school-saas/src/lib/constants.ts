export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  PARENT: 'parent'
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused'
};

export const SYNC_INTERVAL = 5000; // 5 seconds
export const JWT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  SYNC: '/api/sync',
  STUDENTS: '/api/students',
  ATTENDANCE: '/api/attendance',
  GRADES: '/api/grades',
  ME: '/api/me'
};

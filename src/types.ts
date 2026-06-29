export interface Employee {
  id: string; // e.g. PEG-12345
  name: string;
  role: string;
  photoUrl: string;
  attendanceRate: number; // e.g. 98
  avgCheckIn: string; // e.g. "08:05"
}

export type AttendanceStatus = "MASUK" | "PULANG";
export type PunchStatus = "Tepat Waktu" | "Terlambat" | "Alpa";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // e.g. "Senin, 23 Mei 2026"
  dateKey: string; // e.g. "2026-06-28" for sorting
  checkInTime: string; // e.g. "07:58"
  checkOutTime?: string; // e.g. "17:05"
  checkInStatus: PunchStatus;
  checkOutStatus?: PunchStatus;
  locationName: string; // e.g. "HQ Office" or "Remote"
  latitude?: number;
  longitude?: number;
  checkInSelfie: string; // base64 or placeholder URL
  checkOutSelfie?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  employeePhoto: string;
  type: "Cuti Tahunan" | "Sakit" | "Cuti Khusus";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
}

export interface LeaveBalance {
  annual: number; // Cuti Tahunan sisa
  sickUsed: number; // Sakit dipakai
  specialAvailable: number; // Cuti Khusus tersedia
}

export interface SupportFaq {
  id: string;
  question: string;
  answer: string;
  iconName: string;
}

export interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where
} from "firebase/firestore";
import { AttendanceRecord, LeaveRequest, Employee, LeaveBalance, PunchStatus } from "./src/types";
import firebaseConfig from "./firebase-applet-config.json";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies
app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || "";
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini API client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini API Client:", error);
  }
} else {
  console.log("No valid GEMINI_API_KEY found. Chatbot will run in fallback offline mode.");
}

// Initialize Firebase App & Firestore
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Error Handling according to standard Firebase Integration guidelines
enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write"
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function resFirestoreError(res: Response, error: unknown, operationType: OperationType, path: string | null, status = 500) {
  try {
    handleFirestoreError(error, operationType, path);
  } catch (err: any) {
    res.status(status).json({ error: err.message });
  }
}

// Seed datasets
const initialEmployees: Record<string, Employee> = {
  "PEG-12345": {
    id: "PEG-12345",
    name: "Budi Santoso",
    role: "Senior Software Engineer",
    photoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_Ma3vrs7K3OLGSu1_9OLnzIWcjb_0goUla2CcNbz3e-CDC0rH14FL63YMH9oiUTAf8H9F_ruT0b4xIGiIRUkkC36Ip_Hhd5jINFp1OxcdbWWdf077WUtvHjE8Bs_jAYY72YotyndCz4tzv5PnK_F_ecaclxd9UDu6YOsV_TyBLGOdgQDFPzIznaiMEyfyWQRU5BKXA7wIJJ87lxRsxlD9Yg-14AkTy-n4HlHt2bCvNtv2_Jj0avLgr_Yzsdr0ZywLffZ0kh2LTVo",
    attendanceRate: 98,
    avgCheckIn: "08:05",
  },
  "PEG-777": {
    id: "PEG-777",
    name: "Ahmad Fauzi",
    role: "UI Designer",
    photoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5D4qkH8MPRGF1lwzFmBEGiwooMMAYlHNUJaKp6T7o5oKUpL8vES2apjEe7xPGzBeq9D46ZhFddLeWaNfUW8MQo1q4BLgXH-rkKCsyN9AlDBjH7t8KcHVo7MogN3qPt6V5SVblDY1qH-Dg0Z8bC35LHDlCm5uWYowaxGheVAWpN0MhSB7AZCmDBCzA7LQuZac4bXmEd-NDi1P6pzFBpeOZzG2FjAXeIl_gQPsnaMUSIUK8Zm_xnFMK9qHKgyJ2uZxcf-iRGHSa-mA",
    attendanceRate: 94,
    avgCheckIn: "08:12"
  },
  "PEG-888": {
    id: "PEG-888",
    name: "Siti Aminah",
    role: "Lead Developer",
    photoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDbgNUvpc7WH43f1WbW5UvXZ16u_lSwfEeAShHbdLMzZ4WkUPgFIUgRXL_PQIz0oXd74HS0mCLwacYNrehcGbwBMuYTqAB_hizXV1Na1jSAFVl6EMnYF0j31ppXYX4gB6F6uj5VAaOvcYSpXUk6MuWTC0rq_oib5B-Wa80J6tWkz6f4KcW4aACPh5BPVMBTLk2XwFgbq-7M2F8EYrRYCNamZnorCylr9nBCST0_2OBRxeKTjmHgLTfsz89CXjqrRcmbN5V6fkuSmTU",
    attendanceRate: 99,
    avgCheckIn: "07:55"
  },
  "admin": {
    id: "admin",
    name: "Admin HR",
    role: "HR Manager",
    photoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBEtzfMdK1-WMbcrivVgi5I77UZsZB3d5aBrQv7a9hS3LDAZAcJq5A-qmDkleHeLdAd5DWWoYaAHyxUV1S4aYr8MH1-7qirap8eRdbJvFv_3etlzYkctlvJjKqig_WEu_6rNo56uuK1GjIUZCI9wOoS2oUMoIvnmhN5Omw1c8YlIJODnyeatF7-aTluyieuKcZEQaShtnvmCvUabNgmugIbc8oQqrSezEyOHASkTmt9m5kKGhj5tINJBemvdavxgaa2np0YpggPREQ",
    attendanceRate: 100,
    avgCheckIn: "08:00",
  },
};

const initialLeaveBalances: Record<string, LeaveBalance> = {
  "PEG-12345": {
    annual: 12,
    sickUsed: 5,
    specialAvailable: 2,
  },
  "PEG-777": {
    annual: 8,
    sickUsed: 2,
    specialAvailable: 2,
  },
  "PEG-888": {
    annual: 15,
    sickUsed: 0,
    specialAvailable: 2,
  },
  "admin": {
    annual: 12,
    sickUsed: 0,
    specialAvailable: 2,
  },
};

const initialAttendanceHistory: AttendanceRecord[] = [
  {
    id: "rec-1",
    employeeId: "PEG-12345",
    employeeName: "Budi Santoso",
    date: "Senin, 23 Mei 2026",
    dateKey: "2026-05-23",
    checkInTime: "07:58",
    checkOutTime: "17:05",
    checkInStatus: "Tepat Waktu",
    checkOutStatus: "Tepat Waktu",
    locationName: "HQ Office",
    latitude: -6.17511,
    longitude: 106.86503,
    checkInSelfie: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVGRQTjHGgNKttjhEEt8VpojI1oJ24Pzc6CVqTf8Uj7KSa7tnVWq_sXT1R80EiuGPTeX6HPBV3zI31BzsaXtm8RV_BS_sEFMmWAMRtuI7JfXEQGe897JVMMbaJtVyD5DUNqofMGMmoLtWA4HwPQ4hqkyBkz8B-r9afXECHg0yfert0wvNgPsugaYF2iUBSsHN7o8NEsLLYGAOOFvzyFD9nTz-bwxLLXKC-owBX9YDTe9-IlXHCn2GKt0x3BcFCvnXS69luiEDSHPQ",
    checkOutSelfie: "https://lh3.googleusercontent.com/aida-public/AB6AXuBBb4SxzAQu7LL-51lBAFnBI8uOHv5c_GI0xi1-ilYTyHNlZE1pqDuSyDqlUMVpQ_ifXq4CirKymlf3saIMTtzVmqj31JvKTSkqDVUXPdp7UvCx-z4TzdZyzWjEVv_CQB9Mi7Xj79PvB0DXJ0vRC779yPGpldGmnp3vMV4BPzPpuA8SgaSOVevSOqfRtqJfevNd-Kw3YrvDjL3A7ZJATyESjdrXvjZIR9fQPrm8JJSniIgLinlCcLRRq-9JVnXQwKtlmc1TdhdpX2Y",
  },
  {
    id: "rec-2",
    employeeId: "PEG-12345",
    employeeName: "Budi Santoso",
    date: "Jumat, 20 Mei 2026",
    dateKey: "2026-05-20",
    checkInTime: "08:15",
    checkOutTime: "17:30",
    checkInStatus: "Terlambat",
    checkOutStatus: "Tepat Waktu",
    locationName: "Remote",
    latitude: -6.20876,
    longitude: 106.8456,
    checkInSelfie: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-L63MEl7RiTsWIpoCbcC45tEF9nFyY71Y5hPmzdsJKIIS-0Mz_sBexPAwfdUib2xZDNe25tHxVKmo5boF-4xSzTvaxP6YA1ejnxWUSNwAxfMb83Iae8euqrHBX3M8dOloeIsL_IP7D52rnd83G1y3HlkDw9u6AKi6MuzVjgX2w8F8ZVOqi6lW-bnCESrWl-3QWbUFmd0TWbFt1o0FaoT2a_VfCble4js8jYVe7agkyjGY4lAp9RtZ4hAeRc3XAaP9pFd6AqevFdg",
    checkOutSelfie: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-L63MEl7RiTsWIpoCbcC45tEF9nFyY71Y5hPmzdsJKIIS-0Mz_sBexPAwfdUib2xZDNe25tHxVKmo5boF-4xSzTvaxP6YA1ejnxWUSNwAxfMb83Iae8euqrHBX3M8dOloeIsL_IP7D52rnd83G1y3HlkDw9u6AKi6MuzVjgX2w8F8ZVOqi6lW-bnCESrWl-3QWbUFmd0TWbFt1o0FaoT2a_VfCble4js8jYVe7agkyjGY4lAp9RtZ4hAeRc3XAaP9pFd6AqevFdg",
  },
  {
    id: "rec-3",
    employeeId: "PEG-12345",
    employeeName: "Budi Santoso",
    date: "Kamis, 19 Mei 2026",
    dateKey: "2026-05-19",
    checkInTime: "07:45",
    checkOutTime: "16:00",
    checkInStatus: "Tepat Waktu",
    checkOutStatus: "Tepat Waktu",
    locationName: "Branch Office",
    latitude: -6.18042,
    longitude: 106.82831,
    checkInSelfie: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGrdXoPieBc37zBw6DuE2t-WSjYuFGoqrqkhPXAJU1_TYm9LUWJyVF2y7O1dWAiaEu990_JZY3-AiTkV6kVP5OdLYHRhKqqwzfiNLM8ZYR-u2OA79MOktdhjFeNa0VAXfnsdQtaKtSwmjExCxAYTjVNRTM02yzVpJhHCyAa9eBaU4KVpEbBd37-Ez2X14tLclQuPPgkADl1npnzevwFfagrbQIVZAeRCsl4Z_Y10Yp0mI9PH0jTWR3DMd_HYNlqF7i48RwSeXWI8g",
    checkOutSelfie: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGrdXoPieBc37zBw6DuE2t-WSjYuFGoqrqkhPXAJU1_TYm9LUWJyVF2y7O1dWAiaEu990_JZY3-AiTkV6kVP5OdLYHRhKqqwzfiNLM8ZYR-u2OA79MOktdhjFeNa0VAXfnsdQtaKtSwmjExCxAYTjVNRTM02yzVpJhHCyAa9eBaU4KVpEbBd37-Ez2X14tLclQuPPgkADl1npnzevwFfagrbQIVZAeRCsl4Z_Y10Yp0mI9PH0jTWR3DMd_HYNlqF7i48RwSeXWI8g",
  }
];

const initialLeaveRequests: LeaveRequest[] = [
  {
    id: "leave-1",
    employeeId: "PEG-777",
    employeeName: "Ahmad Fauzi",
    employeeRole: "UI Designer",
    employeePhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5D4qkH8MPRGF1lwzFmBEGiwooMMAYlHNUJaKp6T7o5oKUpL8vES2apjEe7xPGzBeq9D46ZhFddLeWaNfUW8MQo1q4BLgXH-rkKCsyN9AlDBjH7t8KcHVo7MogN3qPt6V5SVblDY1qH-Dg0Z8bC35LHDlCm5uWYowaxGheVAWpN0MhSB7AZCmDBCzA7LQuZac4bXmEd-NDi1P6pzFBpeOZzG2FjAXeIl_gQPsnaMUSIUK8Zm_xnFMK9qHKgyJ2uZxcf-iRGHSa-mA",
    type: "Cuti Tahunan",
    startDate: "12 Okt 2026",
    endDate: "14 Okt 2026",
    days: 3,
    reason: "Acara pernikahan keluarga di Bandung.",
    status: "PENDING",
    submittedAt: "2026-06-28T08:30:00Z"
  },
  {
    id: "leave-2",
    employeeId: "PEG-888",
    employeeName: "Siti Aminah",
    employeeRole: "Lead Developer",
    employeePhoto: "https://lh3.googleusercontent.com/aida-public/AB6AXuDbgNUvpc7WH43f1WbW5UvXZ16u_lSwfEeAShHbdLMzZ4WkUPgFIUgRXL_PQIz0oXd74HS0mCLwacYNrehcGbwBMuYTqAB_hizXV1Na1jSAFVl6EMnYF0j31ppXYX4gB6F6uj5VAaOvcYSpXUk6MuWTC0rq_oib5B-Wa80J6tWkz6f4KcW4aACPh5BPVMBTLk2XwFgbq-7M2F8EYrRYCNamZnorCylr9nBCST0_2OBRxeKTjmHgLTfsz89CXjqrRcmbN5V6fkuSmTU",
    type: "Sakit",
    startDate: "28 Jun 2026",
    endDate: "28 Jun 2026",
    days: 1,
    reason: "Izin kontrol kesehatan ke rumah sakit.",
    status: "PENDING",
    submittedAt: "2026-06-28T09:12:00Z"
  }
];

// Helper functions to manage Firebase seeding and resets
async function seedFirebaseDatabase() {
  try {
    // 1. Employees
    for (const [id, emp] of Object.entries(initialEmployees)) {
      await setDoc(doc(db, "employees", id), emp);
    }
    // 2. Balances
    for (const [id, bal] of Object.entries(initialLeaveBalances)) {
      await setDoc(doc(db, "leaveBalances", id), bal);
    }
    // 3. Attendance records
    for (const rec of initialAttendanceHistory) {
      await setDoc(doc(db, "attendance", rec.id), rec);
    }
    // 4. Leave requests
    for (const req of initialLeaveRequests) {
      await setDoc(doc(db, "leaveRequests", req.id), req);
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "seed");
    return false;
  }
}

// Check and auto-seed database if employees collection is empty
async function checkAndAutoSeed() {
  try {
    const snap = await getDocs(collection(db, "employees"));
    if (snap.empty) {
      console.log("No data found in Firestore employees. Seeding initial data...");
      await seedFirebaseDatabase();
    }
  } catch (err) {
    console.error("Auto-seed verification failed. Rules might be locking the collection.", err);
  }
}

// Call auto-seed check asynchronously
checkAndAutoSeed();

// API ROUTES

// 0. Get connection status & diagnostic details for the frontend
app.get("/api/status", async (req: Request, res: Response) => {
  try {
    // Attempt real getFromServer test as mandated by the Validate Connection to Firestore constraint
    const testDoc = doc(db, "employees", "admin");
    await getDoc(testDoc);
    res.json({
      firebaseConfigured: true,
      firestoreWorking: true,
      firestoreError: null,
      activeMode: "Database Server (Firebase Cloud)"
    });
  } catch (error) {
    res.json({
      firebaseConfigured: true,
      firestoreWorking: false,
      firestoreError: error instanceof Error ? error.message : String(error),
      activeMode: "Database Server (Firebase - Kendala Aturan/Koneksi)"
    });
  }
});

// 1. Get single employee data and balances
app.get("/api/employee/:id", async (req: Request, res: Response) => {
  const id = req.params.id.trim().toUpperCase();
  try {
    const empDoc = await getDoc(doc(db, "employees", id));
    if (!empDoc.exists()) {
      return res.status(404).json({ error: `Pegawai dengan ID "${id}" tidak ditemukan.` });
    }
    const balanceDoc = await getDoc(doc(db, "leaveBalances", id));
    const balance = balanceDoc.exists()
      ? balanceDoc.data() as LeaveBalance
      : { annual: 12, sickUsed: 0, specialAvailable: 2 };

    res.json({ employee: empDoc.data() as Employee, balance, firebaseConnected: true });
  } catch (error) {
    resFirestoreError(res, error, OperationType.GET, `employees/${id}`);
  }
});

// 2. List all employees (for superadmin and logins verification)
app.get("/api/employees", async (req: Request, res: Response) => {
  try {
    const snap = await getDocs(collection(db, "employees"));
    const employees = snap.docs.map(d => d.data() as Employee);
    res.json({ employees, firebaseConnected: true });
  } catch (error) {
    resFirestoreError(res, error, OperationType.LIST, "employees");
  }
});

// 3. Create a new employee or Admin (Superadmin Action)
app.post("/api/employee/create", async (req: Request, res: Response) => {
  const { id, name, role, photoUrl, annualBalance } = req.body;
  if (!id || !name || !role) {
    return res.status(400).json({ error: "ID, Nama, dan Jabatan wajib diisi." });
  }

  const newEmpId = id.trim().toUpperCase();
  const newEmployee: Employee = {
    id: newEmpId,
    name: name.trim(),
    role: role.trim(),
    photoUrl: photoUrl?.trim() || "https://lh3.googleusercontent.com/aida-public/AB6AXuB_Ma3vrs7K3OLGSu1_9OLnzIWcjb_0goUla2CcNbz3e-CDC0rH14FL63YMH9oiUTAf8H9F_ruT0b4xIGiIRUkkC36Ip_Hhd5jINFp1OxcdbWWdf077WUtvHjE8Bs_jAYY72YotyndCz4tzv5PnK_F_ecaclxd9UDu6YOsV_TyBLGOdgQDFPzIznaiMEyfyWQRU5BKXA7wIJJ87lxRsxlD9Yg-14AkTy-n4HlHt2bCvNtv2_Jj0avLgr_Yzsdr0ZywLffZ0kh2LTVo",
    attendanceRate: 100,
    avgCheckIn: "08:00"
  };

  const newBalance: LeaveBalance = {
    annual: Number(annualBalance) || 12,
    sickUsed: 0,
    specialAvailable: 2
  };

  try {
    await setDoc(doc(db, "employees", newEmpId), newEmployee);
    await setDoc(doc(db, "leaveBalances", newEmpId), newBalance);

    res.json({
      message: `Pegawai ${newEmployee.name} (${newEmpId}) berhasil ditambahkan!`,
      employee: newEmployee,
      balance: newBalance,
      firebaseConnected: true
    });
  } catch (error) {
    resFirestoreError(res, error, OperationType.WRITE, `employees/${newEmpId}`);
  }
});

// 4. Get attendance history
app.get("/api/attendance", async (req: Request, res: Response) => {
  const { employeeId } = req.query;
  try {
    let q;
    if (employeeId) {
      const idUpper = String(employeeId).trim().toUpperCase();
      q = query(collection(db, "attendance"), where("employeeId", "==", idUpper));
    } else {
      q = collection(db, "attendance");
    }

    const snap = await getDocs(q);
    const records = snap.docs.map(d => d.data() as AttendanceRecord);
    records.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    res.json(records);
  } catch (error) {
    resFirestoreError(res, error, OperationType.LIST, "attendance");
  }
});

// 5. Post Attendance Check-In
app.post("/api/attendance/checkin", async (req: Request, res: Response) => {
  const { employeeId, selfie, latitude, longitude, locationName } = req.body;

  if (!employeeId || !selfie) {
    return res.status(400).json({ error: "employeeId and selfie are required" });
  }

  const idUpper = employeeId.trim().toUpperCase();
  const now = new Date();
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":");
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const dateKey = now.toISOString().split("T")[0];

  try {
    // Verify check-in existence on Firestore
    const q = query(
      collection(db, "attendance"),
      where("employeeId", "==", idUpper),
      where("date", "==", dateStr)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return res.status(400).json({ error: "Sudah melakukan presensi masuk hari ini." });
    }

    let empName = "Pegawai";
    const empDoc = await getDoc(doc(db, "employees", idUpper));
    if (empDoc.exists()) {
      empName = empDoc.get("name") || "Pegawai";
    }

    // Check if late (late is after 08:00 AM)
    const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 0);
    const status: PunchStatus = isLate ? "Terlambat" : "Tepat Waktu";

    const recordId = `rec-${Date.now()}`;
    const newRecord: AttendanceRecord = {
      id: recordId,
      employeeId: idUpper,
      employeeName: empName,
      date: dateStr,
      dateKey,
      checkInTime: timeStr,
      checkInStatus: status,
      locationName: locationName || "HQ Office",
      latitude: latitude || -6.17511,
      longitude: longitude || 106.86503,
      checkInSelfie: selfie,
    };

    // Save check-in
    await setDoc(doc(db, "attendance", recordId), newRecord);

    // Dynamic Recalculate Attendance Rate
    const allPunchSnap = await getDocs(query(collection(db, "attendance"), where("employeeId", "==", idUpper)));
    const allPunches = allPunchSnap.docs.map(d => d.data() as AttendanceRecord);
    const total = allPunches.length;
    const onTime = allPunches.filter(r => r.checkInStatus === "Tepat Waktu").length;
    const calculatedRate = Math.round((onTime / total) * 100);

    if (empDoc.exists()) {
      await updateDoc(doc(db, "employees", idUpper), { attendanceRate: calculatedRate });
    }

    res.json({ message: "Check-in berhasil!", record: newRecord, firebaseConnected: true });
  } catch (error) {
    resFirestoreError(res, error, OperationType.WRITE, "attendance/checkin");
  }
});

// 6. Post Attendance Check-Out
app.post("/api/attendance/checkout", async (req: Request, res: Response) => {
  const { employeeId, selfie, latitude, longitude } = req.body;

  if (!employeeId || !selfie) {
    return res.status(400).json({ error: "employeeId and selfie are required" });
  }

  const idUpper = employeeId.trim().toUpperCase();
  const now = new Date();
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":");
  const todayStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  try {
    const q = query(
      collection(db, "attendance"),
      where("employeeId", "==", idUpper),
      where("date", "==", todayStr)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return res.status(400).json({ error: "Silakan lakukan presensi masuk terlebih dahulu." });
    }

    const docToUpdate = snap.docs[0];
    const record = docToUpdate.data() as AttendanceRecord;

    if (record.checkOutTime) {
      return res.status(400).json({ error: "Sudah melakukan presensi pulang hari ini." });
    }

    const updates = {
      checkOutTime: timeStr,
      checkOutStatus: "Tepat Waktu" as PunchStatus,
      checkOutSelfie: selfie
    };

    await updateDoc(doc(db, "attendance", docToUpdate.id), updates);

    res.json({
      message: "Check-out berhasil!",
      record: { ...record, ...updates },
      firebaseConnected: true
    });
  } catch (error) {
    resFirestoreError(res, error, OperationType.UPDATE, `attendance/checkout/${idUpper}`);
  }
});

// 7. Get Leave Requests
app.get("/api/leave", async (req: Request, res: Response) => {
  const { employeeId } = req.query;
  try {
    let q;
    if (employeeId) {
      const idUpper = String(employeeId).trim().toUpperCase();
      q = query(collection(db, "leaveRequests"), where("employeeId", "==", idUpper));
    } else {
      q = collection(db, "leaveRequests");
    }

    const snap = await getDocs(q);
    const requests = snap.docs.map(d => d.data() as LeaveRequest);
    requests.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    res.json(requests);
  } catch (error) {
    resFirestoreError(res, error, OperationType.LIST, "leaveRequests");
  }
});

// 8. Submit Leave Request
app.post("/api/leave/apply", async (req: Request, res: Response) => {
  const { employeeId, type, startDate, endDate, days, reason } = req.body;

  if (!employeeId || !type || !startDate || !endDate || !days || !reason) {
    return res.status(400).json({ error: "All leave request fields are required" });
  }

  const idUpper = employeeId.trim().toUpperCase();
  const requestId = `leave-${Date.now()}`;
  let empName = "Pegawai";
  let empRole = "Staf";
  let empPhoto = "";

  try {
    const empDoc = await getDoc(doc(db, "employees", idUpper));
    if (empDoc.exists()) {
      empName = empDoc.get("name") || "Pegawai";
      empRole = empDoc.get("role") || "Staf";
      empPhoto = empDoc.get("photoUrl") || "";
    }

    const newRequest: LeaveRequest = {
      id: requestId,
      employeeId: idUpper,
      employeeName: empName,
      employeeRole: empRole,
      employeePhoto: empPhoto,
      type,
      startDate,
      endDate,
      days: Number(days),
      reason,
      status: "PENDING",
      submittedAt: new Date().toISOString()
    };

    await setDoc(doc(db, "leaveRequests", requestId), newRequest);

    res.json({ message: "Pengajuan cuti/sakit berhasil dikirim!", request: newRequest, firebaseConnected: true });
  } catch (error) {
    resFirestoreError(res, error, OperationType.WRITE, `leaveRequests/${requestId}`);
  }
});

// 9. Approve Leave Request (Admin action)
app.post("/api/leave/approve", async (req: Request, res: Response) => {
  const { requestId } = req.body;
  try {
    const reqRef = doc(db, "leaveRequests", requestId);
    const reqSnap = await getDoc(reqRef);

    if (!reqSnap.exists()) {
      return res.status(404).json({ error: "Pengajuan cuti tidak ditemukan." });
    }

    const request = reqSnap.data() as LeaveRequest;
    request.status = "APPROVED";
    await setDoc(reqRef, request);

    // Update leave balance
    const balanceRef = doc(db, "leaveBalances", request.employeeId);
    const balanceSnap = await getDoc(balanceRef);
    const balance = balanceSnap.exists()
      ? balanceSnap.data() as LeaveBalance
      : { annual: 12, sickUsed: 0, specialAvailable: 2 };

    if (request.type === "Cuti Tahunan") {
      balance.annual = Math.max(0, balance.annual - request.days);
    } else if (request.type === "Sakit") {
      balance.sickUsed += request.days;
    }

    await setDoc(balanceRef, balance);

    res.json({ message: "Pengajuan disetujui!", request, firebaseConnected: true });
  } catch (error) {
    resFirestoreError(res, error, OperationType.UPDATE, `leaveRequests/${requestId}`);
  }
});

// 10. Reject Leave Request (Admin action)
app.post("/api/leave/reject", async (req: Request, res: Response) => {
  const { requestId } = req.body;
  try {
    const reqRef = doc(db, "leaveRequests", requestId);
    const reqSnap = await getDoc(reqRef);

    if (!reqSnap.exists()) {
      return res.status(404).json({ error: "Pengajuan cuti tidak ditemukan." });
    }

    const request = reqSnap.data() as LeaveRequest;
    request.status = "REJECTED";
    await setDoc(reqRef, request);

    res.json({ message: "Pengajuan ditolak!", request, firebaseConnected: true });
  } catch (error) {
    resFirestoreError(res, error, OperationType.UPDATE, `leaveRequests/${requestId}`);
  }
});

// 11. Update employee profile
app.post("/api/employee/update", async (req: Request, res: Response) => {
  const { employeeId, name, role, photoUrl } = req.body;
  if (!employeeId) {
    return res.status(400).json({ error: "employeeId is required" });
  }

  const idUpper = employeeId.trim().toUpperCase();

  try {
    const empRef = doc(db, "employees", idUpper);
    const empSnap = await getDoc(empRef);
    let empData: Employee;

    if (empSnap.exists()) {
      empData = empSnap.data() as Employee;
      if (name) empData.name = name;
      if (role) empData.role = role;
      if (photoUrl) empData.photoUrl = photoUrl;
      await setDoc(empRef, empData);
    } else {
      empData = {
        id: idUpper,
        name: name || "Pegawai Baru",
        role: role || "Staf",
        photoUrl: photoUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuB_Ma3vrs7K3OLGSu1_9OLnzIWcjb_0goUla2CcNbz3e-CDC0rH14FL63YMH9oiUTAf8H9F_ruT0b4xIGiIRUkkC36Ip_Hhd5jINFp1OxcdbWWdf077WUtvHjE8Bs_jAYY72YotyndCz4tzv5PnK_F_ecaclxd9UDu6YOsV_TyBLGOdgQDFPzIznaiMEyfyWQRU5BKXA7wIJJ87lxRsxlD9Yg-14AkTy-n4HlHt2bCvNtv2_Jj0avLgr_Yzsdr0ZywLffZ0kh2LTVo",
        attendanceRate: 100,
        avgCheckIn: "08:00"
      };
      await setDoc(empRef, empData);
    }

    res.json({ message: "Profil berhasil diperbarui!", employee: empData, firebaseConnected: true });
  } catch (error) {
    resFirestoreError(res, error, OperationType.UPDATE, `employees/${idUpper}`);
  }
});

// 12. One-click Firebase Database Initializer/Seeder
app.post("/api/database/seed", async (req: Request, res: Response) => {
  const success = await seedFirebaseDatabase();
  if (success) {
    res.json({
      success: true,
      message: "Database Firebase berhasil diatur ulang ke data awal default!",
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Gagal menyemai data awal ke Firebase Firestore.",
    });
  }
});

// 13. Reset Firestore database
app.post("/api/database/reset", async (req: Request, res: Response) => {
  try {
    const collections = ["employees", "leaveBalances", "attendance", "leaveRequests"];
    for (const col of collections) {
      const snap = await getDocs(collection(db, col));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, col, d.id));
      }
    }
    res.json({ success: true, message: "Database Firebase berhasil dikosongkan!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengosongkan database Firebase." });
  }
});

// 14. Support AI Chat proxy using @google/genai
app.post("/api/support/chat", async (req: Request, res: Response) => {
  const { message, chatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const systemInstruction = `
    Anda adalah Asisten Virtual AbsenKu, sebuah sistem presensi karyawan modern dengan verifikasi selfie dan GPS.
    Tugas Anda adalah membantu karyawan (seperti Budi Santoso) memecahkan masalah terkait absensi, GPS, selfie, pengajuan cuti, atau masalah teknis lainnya.
    Berikan jawaban dalam Bahasa Indonesia yang ramah, profesional, sopan, dan solutif.
    Gunakan pemformatan Markdown jika membantu kejelasan penjelasan Anda.
    
    Berikut beberapa info sistem AbsenKu yang bisa Anda gunakan untuk membantu:
    - Cara reset Lupa Kata Sandi: Pilih menu "Lupa Password" pada halaman login, masukkan email terdaftar, dan ikuti instruksi pemulihan di email.
    - Masalah GPS: Pastikan GPS HP dalam mode "High Accuracy", izin lokasi untuk aplikasi AbsenKu diaktifkan, dan coba restart aplikasi jika masih bermasalah.
    - Panduan selfie yang benar: Lakukan selfie di tempat dengan pencahayaan cukup, pastikan wajah terlihat utuh tanpa tertutup masker/topi (sesuai kebijakan perusahaan).
    - Cara mengunduh Laporan: Buka tab History, pilih rentang tanggal/periode (bulanan/mingguan), lalu klik tombol ekspor/unduh PDF di pojok kanan atas.
  `;

  if (ai) {
    try {
      const genaiContents = [];
      if (chatHistory && Array.isArray(chatHistory)) {
        for (const turn of chatHistory) {
          genaiContents.push({
            role: turn.sender === "user" ? "user" : "model",
            parts: [{ text: turn.text }]
          });
        }
      }
      genaiContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: genaiContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      return res.json({ reply: response.text || "Mohon maaf, saya sedang kesulitan memproses respon saat ini." });
    } catch (error) {
      console.error("Gemini API call failed:", error);
    }
  }

  // Offline / Fallback responsive AI mock answers
  setTimeout(() => {
    let reply = "Terima kasih telah menghubungi Hubungan Karyawan AbsenKu. ";
    const msgLower = message.toLowerCase();

    if (msgLower.includes("sandi") || msgLower.includes("password") || msgLower.includes("lupa")) {
      reply += "Untuk mengatur ulang kata sandi Anda, silakan klik tautan 'Lupa Kata Sandi?' di halaman login awal. Masukkan email atau ID Pegawai terdaftar Anda, lalu kami akan mengirimkan instruksi pengaturan ulang ke email Anda.";
    } else if (msgLower.includes("lokasi") || msgLower.includes("gps") || msgLower.includes("radius") || msgLower.includes("peta")) {
      reply += "Jika Anda mengalami kendala deteksi lokasi, harap pastikan bahwa:\n1. Layanan Lokasi (GPS) di perangkat Anda sudah aktif.\n2. Browser/Aplikasi telah diberikan izin Geolocation.\n3. Atur akurasi lokasi ke mode 'Tinggi'.\nCoba muat ulang halaman jika koordinat belum terkalibrasi dengan benar.";
    } else if (msgLower.includes("selfie") || msgLower.includes("foto") || msgLower.includes("kamera")) {
      reply += "Saat mengambil foto selfie untuk presensi, pastikan wajah Anda berada di area lingkaran kamera, dengan cahaya yang terang dan tidak membelakangi lampu. Wajah harus terlihat jelas, tanpa tertutup masker atau kacamata hitam untuk memastikan verifikasi biometrik berhasil.";
    } else if (msgLower.includes("laporan") || msgLower.includes("unduh") || msgLower.includes("history")) {
      reply += "Anda dapat mengunduh Laporan Absensi Anda melalui tab **History**. Di sana, Anda bisa memfilter berdasarkan bulan tertentu, lalu mengeklik tombol **Unduh Laporan** untuk mendapatkan ringkasan kehadiran dalam format PDF atau Excel.";
    } else if (msgLower.includes("cuti") || msgLower.includes("sakit") || msgLower.includes("izin")) {
      reply += "Untuk mengajukan Cuti atau Izin Sakit, Anda dapat masuk ke menu **Leave** (Izin/Cuti) lalu klik tombol **Ajukan Cuti/Sakit**. Isi tipe izin, tanggal mulai & selesai, jumlah hari, serta alasan lengkap Anda, lalu klik Submit agar dapat langsung disetujui oleh HR Admin.";
    } else {
      reply += "Saya siap membantu Anda mengatasi kendala absensi. Apakah Anda sedang mengalami masalah dengan verifikasi selfie, koordinat lokasi GPS, pengajuan cuti tahunan, atau ada pertanyaan lain mengenai profil profil kerja Anda?";
    }

    res.json({ reply });
  }, 800);
});

// VITE MIDDLEWARE SETUP
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

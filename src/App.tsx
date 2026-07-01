import React, { useState, useEffect } from "react";
import { Employee, AttendanceRecord, LeaveRequest, LeaveBalance } from "./types";
import LoginView from "./components/LoginView";
import HomeView from "./components/HomeView";
import HistoryView from "./components/HistoryView";
import LeaveView from "./components/LeaveView";
import SupportView from "./components/SupportView";
import ProfileView from "./components/ProfileView";
import AdminView from "./components/AdminView";

export default function App() {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [loading, setLoading] = useState(false);

  const isAdmin = !!(employee && (
    employee.id === "admin" ||
    employee.role.toLowerCase().includes("admin") ||
    employee.role.toLowerCase().includes("hr") ||
    employee.role.toLowerCase().includes("manager")
  ));

  // Fetch full dataset for the logged-in user
  const fetchAllData = async (empId: string) => {
    setLoading(true);
    try {
      // 1. Get employee & balance info
      const empRes = await fetch(`/api/employee/${empId}`);
      let isEmpAdmin = empId.toLowerCase() === "admin";

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployee(empData.employee);
        setBalance(empData.balance);

        const emp = empData.employee;
        isEmpAdmin = !!(emp && (
          emp.id === "admin" ||
          emp.role.toLowerCase().includes("admin") ||
          emp.role.toLowerCase().includes("hr") ||
          emp.role.toLowerCase().includes("manager")
        ));

        // Auto-switch to Admin tab if they have admin privileges and are at the home screen
        if (isEmpAdmin && activeTab === "home") {
          setActiveTab("admin");
        }
      }

      // 2. Get attendance history
      const historyRes = await fetch(`/api/attendance${!isEmpAdmin ? `?employeeId=${empId}` : ""}`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setAttendanceHistory(historyData);
      }

      // 3. Get leave requests
      const leaveRes = await fetch(`/api/leave`);
      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        setLeaveRequests(leaveData);
      }
    } catch (err) {
      console.error("Failed to load application data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchAllData(employeeId);
    } else {
      setEmployee(null);
      setBalance(null);
      setAttendanceHistory([]);
      setLeaveRequests([]);
    }
  }, [employeeId]);

  const handleLoginSuccess = (id: string) => {
    setEmployeeId(id);
    // Switch to admin tab if they have "admin" in their username initially
    if (id.toLowerCase().includes("admin")) {
      setActiveTab("admin");
    } else {
      setActiveTab("home");
    }
  };

  const handleLogout = () => {
    setEmployeeId(null);
    setActiveTab("home");
  };

  const handleUpdateProfile = async (name: string, role: string, photoUrl?: string) => {
    if (employee) {
      try {
        const response = await fetch("/api/employee/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            employeeId: employee.id,
            name,
            role,
            photoUrl
          })
        });
        if (response.ok) {
          const data = await response.json();
          setEmployee(data.employee);
        } else {
          console.error("Gagal memperbarui profil di server");
        }
      } catch (err) {
        console.error("Kesalahan jaringan saat memperbarui profil:", err);
      }
    }
  };

  // Render current tab view content
  const renderContentView = () => {
    if (loading || !employee || !balance) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
          <span className="material-symbols-outlined text-3xl text-primary animate-spin">refresh</span>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Memuat Data Zieda Absen (Zabsen)...</p>
        </div>
      );
    }

    switch (activeTab) {
      case "home":
        return (
          <HomeView
            employee={employee}
            attendanceHistory={attendanceHistory}
            onRefreshData={() => fetchAllData(employeeId!)}
            setActiveTab={setActiveTab}
          />
        );
      case "leave":
        return (
          <LeaveView
            employeeId={employee.id}
            balance={balance}
            leaveRequests={leaveRequests}
            onRefreshData={() => fetchAllData(employeeId!)}
          />
        );
      case "history":
        return <HistoryView employee={employee} attendanceHistory={attendanceHistory} />;
      case "support":
        return <SupportView />;
      case "profile":
        return (
          <ProfileView
            employee={employee}
            balance={balance}
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      case "admin":
        return <AdminView leaveRequests={leaveRequests} onRefreshData={() => fetchAllData(employeeId!)} />;
      default:
        return null;
    }
  };

  // Render proper header based on active tab view
  const renderHeader = () => {
    if (!employeeId || !employee) return null;

    let title = "Zieda Absen (Zabsen)";
    let icon = "fingerprint";

    if (activeTab === "history") {
      title = "Riwayat Absensi";
    } else if (activeTab === "profile") {
      title = "Profil";
    } else if (activeTab === "support") {
      title = "Bantuan Zabsen";
      icon = "help_outline";
    } else if (activeTab === "admin") {
      title = "Admin HR";
      icon = "dashboard";
    } else if (activeTab === "leave") {
      title = "Kalender & Cuti";
      icon = "calendar_month";
    }

    return (
      <header className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md shadow-sm flex justify-between items-center px-4 h-16 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {activeTab === "support" && (
            <button
              onClick={() => setActiveTab("home")}
              className="p-1.5 hover:bg-slate-100 rounded-full active:scale-90 transition-all cursor-pointer mr-1"
            >
              <span className="material-symbols-outlined text-primary text-xl font-bold">arrow_back</span>
            </button>
          )}
          <span className="material-symbols-outlined text-primary text-2xl font-bold">
            {icon}
          </span>
          <h1 className="text-lg font-extrabold text-primary tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert("Tidak ada notifikasi baru saat ini.")}
            className="w-8 h-8 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-500 relative cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
          </button>

          {employee && (
            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-sm shrink-0">
              <img
                className="w-full h-full object-cover"
                src={employee.photoUrl}
                alt="Profile"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>
      </header>
    );
  };

  // Nav actions
  const navItems = [
    { id: "home", label: "Beranda", icon: "home" },
    { id: "leave", label: "Cuti", icon: "calendar_today" },
    { id: "history", label: "Riwayat", icon: "history" },
    ...(isAdmin ? [{ id: "admin", label: "Admin", icon: "dashboard" }] : []),
    { id: "profile", label: "Profil", icon: "person" },
    { id: "support", label: "Bantuan", icon: "help_outline" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Background Decorative Atmosphere elements */}
      <div className="absolute top-[-5%] right-[-10%] w-96 h-96 bg-primary opacity-5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-10%] w-80 h-80 bg-amber-500 opacity-5 rounded-full blur-[80px] pointer-events-none" />

      {!employeeId ? (
        <div className="flex-1 flex items-center justify-center relative py-12">
          <LoginView onLoginSuccess={handleLoginSuccess} />
        </div>
      ) : (
        <>
          {renderHeader()}

          <main className="flex-1 pt-20 pb-28 px-4 max-w-lg w-full mx-auto relative z-10">
            {renderContentView()}
          </main>

          {/* Dynamic Unified Bottom Navigation bar */}
          <nav className="fixed bottom-0 left-0 w-full z-40 bg-white/90 backdrop-blur-md shadow-[0px_-4px_16px_rgba(151,0,10,0.03)] rounded-t-2xl flex justify-around items-center py-2.5 pb-safe border-t border-slate-100">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center py-1.5 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-primary-container/20 text-primary px-4 rounded-xl scale-105 font-bold"
                      : "text-slate-400 hover:text-slate-600 px-2 font-semibold"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    {item.icon}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider mt-0.5">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </>
      )}
    </div>
  );
}

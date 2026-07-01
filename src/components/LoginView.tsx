import React, { useState, useEffect } from "react";
import { Employee } from "../types";
import { motion } from "motion/react";

interface LoginViewProps {
  onLoginSuccess: (employeeId: string) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Superadmin Modal states
  const [showSuperadmin, setShowSuperadmin] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    firebaseConfigured: boolean;
    firestoreWorking: boolean;
    firestoreError: string | null;
    activeMode: string;
  } | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmp, setNewEmp] = useState({
    id: "",
    name: "",
    role: "Staff Keuangan",
    photoUrl: "",
    annualBalance: 12
  });

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch connection status and current list
  const fetchDbStatusAndEmployees = async () => {
    try {
      const resStatus = await fetch("/api/status");
      if (resStatus.ok) {
        const data = await resStatus.json();
        setDbStatus(data);
      }
      
      const resEmployees = await fetch("/api/employees");
      if (resEmployees.ok) {
        const data = await resEmployees.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error("Gagal memuat status database:", err);
    }
  };

  useEffect(() => {
    if (showSuperadmin) {
      fetchDbStatusAndEmployees();
    }
  }, [showSuperadmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedId = employeeId.trim();
    if (!trimmedId) {
      setErrorMsg("ID Pegawai atau Email wajib diisi.");
      return;
    }
    if (!password) {
      setErrorMsg("Kata sandi wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/employee/${trimmedId}`);
      const data = await response.json();
      
      if (!response.ok) {
        setErrorMsg(data.error || "ID Pegawai tidak terdaftar di sistem.");
      } else {
        // Successful login
        onLoginSuccess(data.employee.id);
      }
    } catch (err) {
      setErrorMsg("Gagal menghubungi server absensi.");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricClick = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess("PEG-12345"); // Log in as demo user automatically via fingerprint
    }, 1200);
  };

  const handleQuickLogin = (id: string) => {
    onLoginSuccess(id);
  };

  const handleCreateEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!newEmp.id || !newEmp.name || !newEmp.role) {
      setFormError("Mohon isi semua bidang wajib (ID, Nama, Jabatan).");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/employee/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newEmp.id,
          name: newEmp.name,
          role: newEmp.role,
          photoUrl: newEmp.photoUrl,
          annualBalance: newEmp.annualBalance
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess(data.message || "Pegawai berhasil ditambahkan!");
        setNewEmp({
          id: "",
          name: "",
          role: "Staf HRD",
          photoUrl: "",
          annualBalance: 12
        });
        fetchDbStatusAndEmployees(); // Refresh list
      } else {
        setFormError(data.error || "Gagal membuat pegawai.");
      }
    } catch (err) {
      setFormError("Kesalahan jaringan saat membuat pegawai.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    setActionLoading(true);
    setFormError("");
    setFormSuccess("");
    try {
      const res = await fetch("/api/database/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess(data.message || "Inisiasi database Firestore berhasil!");
        fetchDbStatusAndEmployees();
      } else {
        setFormError(data.error || data.message || "Gagal menginisiasi Firestore.");
      }
    } catch (err) {
      setFormError("Kesalahan jaringan saat menginisiasi database.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetMemoryDatabase = async () => {
    setActionLoading(true);
    setFormError("");
    setFormSuccess("");
    try {
      const res = await fetch("/api/database/reset", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess(data.message || "Database simulasi memori berhasil dikosongkan!");
        fetchDbStatusAndEmployees();
      } else {
        setFormError(data.error || "Gagal mengosongkan database.");
      }
    } catch (err) {
      setFormError("Kesalahan jaringan.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto z-10 px-4 py-8">
      {/* Welcome Header & Branding */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-primary text-[48px] mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>
            fingerprint
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
            Zieda <span className="text-primary">Absen</span> <span className="text-sm font-medium text-slate-400 tracking-wide">(Zabsen)</span>
          </h1>
        </div>

        {/* Dynamic Graphic Header */}
        <div className="relative w-full h-44 mb-6 rounded-2xl overflow-hidden bg-surface-container-low border border-slate-200/60 flex items-center justify-center group shadow-sm">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-90 transition-transform duration-700 group-hover:scale-105"
            style={{ 
              backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBPERz5PnRUkG2LN-Elwe0aTNlP7tAcwcgdhV_Hu2MbyKblGcs4JSeiwOWS-SyY0VY1jHL4IERAUwSb0yzQ_ylTVGePdSmjzqq6KbMB-3heC3OhxjPQf2hVYeVi8PM8iaYZcgbONKg_dXSmuzL3qO43Kxprsf-WATVkvFSxoVrk5gsVtFE1ypH2nPuHpjIPP3vs7KCYSrs9tGgjxf1_K8Xb_OhjSnSEHHyxT4cD0IIf20dsgZyZkel3p8eoZzJ8p5l6maOJEqOjg8Y')" 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#eff4ff]/90 to-transparent" />
          <div className="relative z-10 text-center px-4">
            <p className="text-xl font-bold text-on-surface mb-0.5">Selamat Datang</p>
            <p className="text-xs text-on-surface-variant font-medium">Mulai hari produktifmu dengan satu ketukan.</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white/85 backdrop-blur-md rounded-2xl shadow-[0px_12px_32px_rgba(151,0,10,0.05)] border border-slate-100 p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Input Group: Email/ID */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant ml-1" htmlFor="employeeId">
              Email atau ID Pegawai
            </label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl">
                person
              </span>
              <input
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all outline-none text-sm text-on-surface"
                id="employeeId"
                placeholder="contoh: peg-12345, admin"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
          </div>

          {/* Input Group: Password */}
          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-semibold text-on-surface-variant" htmlFor="password">
                Kata Sandi
              </label>
              <a 
                className="text-xs text-primary font-semibold hover:underline" 
                href="#forgot" 
                onClick={(e) => {
                  e.preventDefault();
                  alert("Kata sandi diuji coba bernilai bebas (masukkan apa saja). Cukup isi ID Pegawai!");
                }}
              >
                Informasi Sandi?
              </a>
            </div>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl">
                lock
              </span>
              <input
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all outline-none text-sm text-on-surface"
                id="password"
                placeholder="Masukkan kata sandi bebas"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">error</span>
              {errorMsg}
            </div>
          )}

          {/* Main Login Button */}
          <div className="pt-2">
            <button
              className="w-full py-3 bg-primary text-white font-semibold text-sm rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">refresh</span>
                  Memproses...
                </>
              ) : (
                <>
                  Masuk
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </div>

          {/* Biometric Section */}
          <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Atau masuk lebih cepat dengan</p>
            <button
              className="w-14 h-14 rounded-full bg-slate-100 hover:bg-primary-container/20 flex items-center justify-center text-primary transition-all active:scale-90 hover:scale-105 border border-slate-200/50 shadow-sm relative group cursor-pointer"
              type="button"
              onClick={handleBiometricClick}
            >
              {/* Pulse effect */}
              <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-25 group-hover:block" />
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                fingerprint
              </span>
            </button>
            <p className="text-xs text-primary font-bold">Gunakan Fingerprint</p>
          </div>
        </form>
      </div>

      {/* Developer Helper Panel to Switch Roles & Access Superadmin */}
      <div className="mt-4 p-4 bg-slate-100/95 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col items-center gap-3">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Akses Cepat Masuk</p>
          <div className="flex justify-center gap-2 mt-1.5">
            <button
              onClick={() => handleQuickLogin("PEG-12345")}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-primary text-xs font-semibold rounded-lg text-slate-700 hover:text-primary transition-colors cursor-pointer shadow-sm"
            >
              Karyawan: PEG-12345
            </button>
            <button
              onClick={() => handleQuickLogin("admin")}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-primary text-xs font-semibold rounded-lg text-slate-700 hover:text-primary transition-colors cursor-pointer shadow-sm"
            >
              HR Admin: admin
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowSuperadmin(true)}
          className="w-full mt-1 py-2 border-2 border-dashed border-primary/40 hover:border-primary text-primary bg-white text-xs font-bold rounded-xl hover:bg-primary/5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm font-bold animate-spin-slow">settings</span>
          🔧 SUPERADMIN & INISIASI DATABASE
        </button>
      </div>

      {/* Footer Links */}
      <div className="mt-6 text-center space-y-3">
        <p className="text-xs text-slate-500 font-medium">
          Belum punya akun?{" "}
          <a className="text-primary font-bold hover:underline" href="#contact-hr" onClick={(e) => { e.preventDefault(); setShowSuperadmin(true); }}>
            Buat di Superadmin Panel
          </a>
        </p>
        <div className="flex justify-center gap-6">
          <a className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors" href="#help">
            <span className="material-symbols-outlined text-base">help_outline</span>
            Bantuan
          </a>
          <a className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors" href="#lang">
            <span className="material-symbols-outlined text-base">language</span>
            Bahasa Indonesia
          </a>
        </div>
      </div>

      {/* SUPERADMIN OVERLAY MODAL */}
      {showSuperadmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col p-6 space-y-6 relative animate-fadeIn">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl font-bold">construction</span>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Superadmin & Kendali Database</h2>
                  <p className="text-xs text-slate-400 font-semibold">Kelola pengguna & pantau status database server</p>
                </div>
              </div>
              <button
                onClick={() => setShowSuperadmin(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-bold">close</span>
              </button>
            </div>

            {/* Diagnostic Connection Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status Hubungan Database</h3>
                {dbStatus ? (
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    {dbStatus.activeMode || "Database Server (Memori Lokal)"}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 animate-pulse">Mengecek koneksi...</span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {dbStatus?.firestoreWorking ? (
                  <span>
                    Sistem berhasil terhubung langsung ke <strong>Firebase Firestore Cloud</strong> secara real-time. Semua data presensi, verifikasi GPS, selfie, pengajuan cuti, dan asisten AI tersimpan dengan aman di cloud.
                  </span>
                ) : (
                  <span>
                    Sistem menggunakan <strong>Database Server Memori Lokal</strong> sebagai fallback. Semua fitur absensi, verifikasi GPS, selfie, pengajuan cuti, dan chat asisten AI berjalan 100% lancar secara responsif.
                  </span>
                )}
              </p>
            </div>

            {/* Form & Seed notifications */}
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">error</span>
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 animate-bounce-short">
                <span className="material-symbols-outlined text-base">check_circle</span>
                {formSuccess}
              </div>
            )}

            {/* Quick Actions (Seed Firestore / Clear Memory) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kendali Database</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSeedDatabase}
                  disabled={actionLoading}
                  className="py-2.5 px-3 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-110 transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">cloud_upload</span>
                  {actionLoading ? "Memproses..." : "Atur Ulang Data Demo"}
                </button>
                <button
                  onClick={handleResetMemoryDatabase}
                  disabled={actionLoading}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors border border-slate-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  Kosongkan Data Simulasi
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold italic text-center">
                *Tombol "Atur Ulang" akan mengatur ulang database memori lokal ke akun-akun demo awal (Budi, Fauzi, Aminah, Admin HR).
              </p>
            </div>

            {/* Create New User Section */}
            <form onSubmit={handleCreateEmployeeSubmit} className="space-y-3.5 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tambah Pegawai / Admin Baru</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">ID Pegawai (Mulai dengan PEG- atau admin)</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: PEG-999 atau PEG-ADMIN"
                    value={newEmp.id}
                    onChange={(e) => setNewEmp({ ...newEmp, id: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/15 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: Sarah Amelia"
                    value={newEmp.name}
                    onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/15 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Jabatan / Role</label>
                  <select
                    value={newEmp.role}
                    onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/15 transition-all"
                  >
                    <option value="Senior Developer">Senior Developer</option>
                    <option value="Staff Keuangan">Staff Keuangan</option>
                    <option value="Marketing Specialist">Marketing Specialist</option>
                    <option value="UI Designer">UI Designer</option>
                    <option value="HR Manager">HR Manager (Akses Admin HR)</option>
                    <option value="Admin HRD">Admin HRD (Akses Admin HR)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Sisa Kuota Cuti Tahunan (Hari)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={newEmp.annualBalance}
                    onChange={(e) => setNewEmp({ ...newEmp, annualBalance: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/15 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">URL Foto Profil (Opsional, kosongkan untuk foto default)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newEmp.photoUrl}
                  onChange={(e) => setNewEmp({ ...newEmp, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs font-semibold outline-none focus:border-primary transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                {actionLoading ? "Menyimpan..." : "Daftarkan Pegawai"}
              </button>
            </form>

            {/* List of active accounts with instant Login buttons */}
            <div className="space-y-3.5 pt-4 border-t border-slate-100 flex-1 flex flex-col min-h-0">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Daftar Akun Terdaftar (Klik untuk Masuk Instan)</h3>
              
              <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[180px] pr-1">
                {employees.map((emp) => {
                  const isAdmin = emp.id === "admin" || emp.role.toLowerCase().includes("admin") || emp.role.toLowerCase().includes("manager") || emp.role.toLowerCase().includes("hr");
                  return (
                    <div 
                      key={emp.id} 
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img 
                          src={emp.photoUrl} 
                          alt={emp.name} 
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">{emp.name}</p>
                          <p className="text-[9px] font-semibold text-slate-400 truncate leading-none mt-0.5">{emp.role}</p>
                          <span className={`inline-block text-[8px] font-extrabold px-1.5 py-0.2 mt-1 rounded ${isAdmin ? "bg-red-50 text-red-600 border border-red-100" : "bg-primary-container/25 text-primary"}`}>
                            {emp.id}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleQuickLogin(emp.id)}
                        className="px-2 py-1 bg-white hover:bg-primary hover:text-white text-[10px] font-bold text-primary border border-primary/20 rounded-lg shadow-sm transition-all shrink-0 cursor-pointer"
                      >
                        Masuk
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

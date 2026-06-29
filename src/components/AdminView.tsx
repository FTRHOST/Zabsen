import React, { useState } from "react";
import { LeaveRequest } from "../types";

interface AdminViewProps {
  leaveRequests: LeaveRequest[];
  onRefreshData: () => void;
}

export default function AdminView({ leaveRequests, onRefreshData }: AdminViewProps) {
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const pendingRequests = leaveRequests.filter((r) => r.status === "PENDING");

  const handleLeaveAction = async (requestId: string, action: "approve" | "reject") => {
    setActionLoadingId(requestId);
    const endpoint = action === "approve" ? "/api/leave/approve" : "/api/leave/reject";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Gagal memproses persetujuan.");
      } else {
        alert(data.message || `Pengajuan berhasil ${action === "approve" ? "disetujui" : "ditolak"}.`);
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome & Search */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-on-surface">Halo, Admin HR!</h2>
          <p className="text-xs font-semibold text-on-surface-variant mt-0.5">
            Kelola kehadiran tim hari ini secara real-time.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-xs font-semibold text-slate-700 shadow-sm"
            placeholder="Cari profil karyawan..."
            type="text"
            value={employeeQuery}
            onChange={(e) => setEmployeeQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Stats Grid (Bento Style) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2.5">
          <span className="material-symbols-outlined text-primary bg-red-50 p-2 rounded-xl w-fit border border-red-100/50">
            group
          </span>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Total Karyawan
            </p>
            <h3 className="text-xl font-extrabold mt-0.5 text-slate-800">1,248</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2.5">
          <span className="material-symbols-outlined text-amber-600 bg-amber-50 p-2 rounded-xl w-fit border border-amber-100/50">
            how_to_reg
          </span>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Hadir Hari Ini
            </p>
            <h3 className="text-xl font-extrabold mt-0.5 text-slate-800">1,182</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2.5">
          <span className="material-symbols-outlined text-indigo-600 bg-indigo-50 p-2 rounded-xl w-fit border border-indigo-100/50">
            event_busy
          </span>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Izin/Cuti
            </p>
            <h3 className="text-xl font-extrabold mt-0.5 text-slate-800">42</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2.5">
          <span className="material-symbols-outlined text-rose-600 bg-rose-50 p-2 rounded-xl w-fit border border-rose-100/50">
            schedule
          </span>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Terlambat
            </p>
            <h3 className="text-xl font-extrabold mt-0.5 text-slate-800 font-bold">24</h3>
          </div>
        </div>
      </section>

      {/* Attendance Progress Card with SVG layout */}
      <section className="bg-white p-5 rounded-2xl shadow-[0px_4px_12px_rgba(151,0,10,0.03)] border border-slate-100">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
            {/* Circular Progress Visual */}
            <svg className="w-full h-full -rotate-90">
              <circle
                className="text-slate-100"
                cx="80"
                cy="80"
                fill="transparent"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
              />
              <circle
                className="text-primary"
                cx="80"
                cy="80"
                fill="transparent"
                r="70"
                stroke="currentColor"
                strokeDasharray="439.8"
                strokeDashoffset="22.0" // 95% progress
                strokeWidth="10"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-primary">95%</span>
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mt-1">
                Attendance Rate
              </span>
            </div>
            {/* Pulsing ring behind */}
            <div className="absolute inset-2 rounded-full bg-primary/5 animate-pulse" />
          </div>

          <div className="flex-1 space-y-3.5">
            <h4 className="text-md font-extrabold text-on-surface leading-tight">
              Analisis Kehadiran Tim
            </h4>
            <p className="text-xs text-on-surface-variant font-semibold leading-relaxed">
              Kehadiran hari ini naik <span className="text-primary font-extrabold">2.4%</span>{" "}
              dibandingkan kemarin. Mayoritas tim melakukan check-in tepat pada pukul 08:15 WIB.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div>
                <p className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">
                  Check-in Paling Awal
                </p>
                <p className="text-xs font-bold text-on-surface mt-0.5">07:42 - Budi Santoso</p>
              </div>
              <div>
                <p className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">
                  Lokasi Paling Padat
                </p>
                <p className="text-xs font-bold text-on-surface mt-0.5">Gedung Pusat A</p>
              </div>
            </div>
            <button
              onClick={() => alert("Mengunduh analisis detail...")}
              className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:brightness-115 active:scale-98 transition-all cursor-pointer shadow-sm shadow-primary/20"
            >
              <span>Lihat Laporan Detail</span>
              <span className="material-symbols-outlined text-sm">trending_up</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pending Approvals */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-on-surface uppercase tracking-wider">
            Persetujuan Izin Pending ({pendingRequests.length})
          </h3>
          <button
            onClick={() => alert("Menampilkan semua data pengajuan cuti...")}
            className="text-primary font-bold text-xs hover:underline cursor-pointer"
          >
            Lihat Semua
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
            <span className="material-symbols-outlined text-4xl text-slate-300">
              assignment_turned_in
            </span>
            <p className="text-xs text-slate-400 font-semibold mt-2">
              Semua pengajuan cuti/sakit telah diproses.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-100 hover:border-primary/20 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/50 overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      src={req.employeePhoto}
                      alt={req.employeeName}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-on-surface leading-snug">
                      {req.employeeName}
                    </h5>
                    <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">
                      {req.employeeRole} • {req.type}
                    </p>
                    <p className="text-[10px] text-primary font-extrabold mt-1">
                      {req.startDate} - {req.endDate} ({req.days} Hari)
                    </p>
                  </div>
                </div>

                <div className="flex-1 px-2">
                  <p className="text-xs text-on-surface-variant font-semibold italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    "{req.reason}"
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  <button
                    disabled={actionLoadingId === req.id}
                    onClick={() => handleLeaveAction(req.id, "reject")}
                    className="flex-1 md:flex-none px-4 py-2 border border-red-200 text-[#93000a] font-bold text-xs bg-red-50/50 rounded-xl hover:bg-red-100/50 active:scale-95 transition-colors cursor-pointer"
                  >
                    Tolak
                  </button>
                  <button
                    disabled={actionLoadingId === req.id}
                    onClick={() => handleLeaveAction(req.id, "approve")}
                    className="flex-1 md:flex-none px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:brightness-110 active:scale-95 transition-colors cursor-pointer shadow-sm shadow-primary/10"
                  >
                    Setujui
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions Floating Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#ffd1cb] p-4 rounded-2xl text-[#930009] flex items-center justify-between border border-[#ffb4aa]/30 shadow-sm">
          <div className="space-y-0.5">
            <h5 className="text-xs font-bold uppercase tracking-wider">Laporan Mingguan</h5>
            <p className="text-[10px] font-semibold opacity-85">Sudah siap untuk diunduh</p>
          </div>
          <button
            onClick={() => alert("Mengunduh Laporan Mingguan HR...")}
            className="p-2 bg-[#930009]/10 rounded-full hover:bg-[#930009]/20 transition-all cursor-pointer flex items-center justify-center text-primary"
          >
            <span className="material-symbols-outlined text-lg">download</span>
          </button>
        </div>

        <div className="bg-[#fcdd83] p-4 rounded-2xl text-[#574500] flex items-center justify-between border border-amber-300/30 shadow-sm">
          <div className="space-y-0.5">
            <h5 className="text-xs font-bold uppercase tracking-wider">Verifikasi Lokasi</h5>
            <p className="text-[10px] font-semibold opacity-85">4 Titik butuh kalibrasi ulang</p>
          </div>
          <button
            onClick={() => alert("Melakukan kalibrasi ulang GPS Kantor...")}
            className="p-2 bg-[#574500]/10 rounded-full hover:bg-[#574500]/20 transition-all cursor-pointer flex items-center justify-center text-secondary"
          >
            <span className="material-symbols-outlined text-lg">map</span>
          </button>
        </div>
      </section>
    </div>
  );
}

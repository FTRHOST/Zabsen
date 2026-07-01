import React, { useState, useMemo } from "react";
import { AttendanceRecord, Employee } from "../types";

interface HistoryViewProps {
  employee: Employee;
  attendanceHistory: AttendanceRecord[];
}

export default function HistoryView({ employee, attendanceHistory }: HistoryViewProps) {
  const [selectedMonth, setSelectedMonth] = useState("Mei 2026");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const months = ["Mei 2026", "Oktober 2023", "Semua Bulan"];

  // Filter records dynamically based on selectedMonth and query
  const filteredRecords = useMemo(() => {
    return attendanceHistory.filter((rec) => {
      // Filter by Month
      if (selectedMonth === "Mei 2026") {
        if (!rec.date.includes("Mei") || !rec.date.includes("2026")) return false;
      } else if (selectedMonth === "Oktober 2023") {
        if (!rec.date.includes("Okt") || !rec.date.includes("2023")) return false;
      }

      // Filter by Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesLocation = rec.locationName.toLowerCase().includes(query);
        const matchesDate = rec.date.toLowerCase().includes(query);
        const matchesStatus = rec.checkInStatus.toLowerCase().includes(query);
        return matchesLocation || matchesDate || matchesStatus;
      }

      return true;
    });
  }, [attendanceHistory, selectedMonth, searchQuery]);

  // Calculate stats based on filtered records
  const stats = useMemo(() => {
    const totalDays = selectedMonth === "Mei 2026" ? 22 : selectedMonth === "Oktober 2023" ? 21 : attendanceHistory.length;
    const hadir = filteredRecords.length;
    const terlambat = filteredRecords.filter((r) => r.checkInStatus === "Terlambat").length;
    const alpa = Math.max(0, totalDays - hadir);

    return { totalDays, hadir, terlambat, alpa };
  }, [filteredRecords, selectedMonth, attendanceHistory]);

  const handleExport = () => {
    // Simulated formatted CSV download
    const headers = "Tanggal,Check-In,Check-Out,Lokasi,Status Check-In\n";
    const rows = filteredRecords
      .map(
        (r) =>
          `"${r.date}","${r.checkInTime}","${r.checkOutTime || "-"}","${r.locationName}","${
            r.checkInStatus
          }"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Absensi_Zabsen_${selectedMonth.replace(" ", "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("Laporan absensi berhasil diekspor sebagai file CSV!");
  };

  return (
    <div className="space-y-6">
      {/* Monthly Statistics Summary (Bento Style) */}
      <section className="grid grid-cols-2 gap-3 animate-fade-in">
        <div className="col-span-2 bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-[0px_4px_12px_rgba(151,0,10,0.04)] border border-slate-200/50 flex items-center justify-between">
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Total Hari Kerja</p>
            <h2 className="text-2xl font-extrabold text-on-surface">{stats.totalDays} Hari</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
            <span className="material-symbols-outlined text-primary">calendar_month</span>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-[0px_4px_12px_rgba(151,0,10,0.04)] border border-slate-200/50 flex flex-col justify-center">
          <p className="text-xs text-on-surface-variant font-medium">Hadir</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-extrabold text-primary">{stats.hadir}</h3>
            <span className="text-xs text-on-surface-variant font-semibold">Hari</span>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-[0px_4px_12px_rgba(151,0,10,0.04)] border border-slate-200/50 flex flex-col justify-center">
          <p className="text-xs text-on-surface-variant font-medium">Terlambat</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-extrabold text-amber-600">{stats.terlambat}</h3>
            <span className="text-xs text-on-surface-variant font-semibold">Kali</span>
          </div>
        </div>

        <div className="col-span-2 bg-white/70 backdrop-blur-md rounded-2xl p-4 border-l-4 border-red-600 shadow-[0px_4px_12px_rgba(151,0,10,0.04)] flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
            <span className="material-symbols-outlined text-primary">block</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Alpa / Tidak Hadir</p>
            <h3 className="text-lg font-bold text-[#93000a]">{stats.alpa} Hari</h3>
          </div>
        </div>
      </section>

      {/* Filter Bar with Dropdown */}
      <section className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex-shrink-0 px-4 py-2 bg-primary text-white rounded-full text-xs font-semibold flex items-center gap-1 shadow-md shadow-primary/10 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <span>{selectedMonth}</span>
            <span className="material-symbols-outlined text-lg">expand_more</span>
          </button>

          {showDropdown && (
            <div className="absolute left-0 mt-2 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden">
              {months.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setSelectedMonth(m);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-primary font-semibold transition-colors border-b border-slate-50 last:border-0 cursor-pointer"
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleExport}
          className="flex-shrink-0 px-4 py-2 border border-slate-200 text-on-surface-variant bg-white rounded-full text-xs font-semibold flex items-center gap-1 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">date_range</span>
          <span>Unduh Laporan</span>
        </button>

        {/* Search bar inside filter row */}
        <div className="relative flex-1 min-w-[160px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Cari aktivitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 bg-white rounded-full text-xs outline-none focus:border-primary transition-colors font-medium text-slate-700 shadow-sm"
          />
        </div>
      </section>

      {/* History List */}
      <section className="space-y-4">
        <h4 className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider px-1">
          Log Aktivitas
        </h4>

        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
            <span className="material-symbols-outlined text-4xl text-slate-300">history</span>
            <p className="text-xs text-slate-400 font-semibold mt-2">Tidak ada log aktivitas untuk periode ini.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-2xl p-4 shadow-[0px_4px_12px_rgba(151,0,10,0.03)] border border-slate-100 flex gap-4 hover:border-primary/20 transition-all duration-200 active:scale-[0.99] cursor-pointer"
              >
                {/* Selfie image */}
                <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden relative border border-slate-200/60">
                  <img
                    className="w-full h-full object-cover"
                    src={record.checkInSelfie || employee.photoUrl}
                    alt="Selfie"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-xs text-on-surface-variant font-medium">{record.date}</p>
                      <div className="flex items-center gap-1 text-on-surface font-bold text-xs mt-0.5">
                        <span className="material-symbols-outlined text-sm text-primary">
                          location_on
                        </span>
                        <span>{record.locationName}</span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase tracking-wider ${
                        record.checkInStatus === "Tepat Waktu"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                          : "bg-red-50 text-primary border border-red-100"
                      }`}
                    >
                      {record.checkInStatus}
                    </span>
                  </div>

                  {/* Checkin - Checkout grid line */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="text-center">
                      <p className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">
                        Check-In
                      </p>
                      <p className="text-sm font-extrabold text-[#930009]">{record.checkInTime}</p>
                    </div>
                    <div className="h-6 w-[1px] bg-slate-100" />
                    <div className="text-center">
                      <p className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">
                        Check-Out
                      </p>
                      <p className="text-sm font-extrabold text-on-surface">
                        {record.checkOutTime || "--:--"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

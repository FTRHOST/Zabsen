import React, { useState, useEffect } from "react";
import { LeaveBalance, LeaveRequest } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface LeaveViewProps {
  employeeId: string;
  balance: LeaveBalance;
  leaveRequests: LeaveRequest[];
  onRefreshData: () => void;
}

export default function LeaveView({ employeeId, balance, leaveRequests, onRefreshData }: LeaveViewProps) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedType, setSelectedType] = useState<"Cuti Tahunan" | "Sakit" | "Cuti Khusus">("Cuti Tahunan");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDayRing, setSelectedDayRing] = useState<number | null>(9); // 9 matches default mockup "9 Mei" selected

  const holidays = [
    { day: 1, name: "Hari Buruh Internasional", type: "Rabu • Libur Nasional" },
    { day: 9, name: "Kenaikan Isa Almasih", type: "Kamis • Libur Nasional" },
    { day: 23, name: "Hari Raya Waisak 2568 BE", type: "Kamis • Libur Nasional" },
  ];

  // Calendar dates for May 2026 (Starts on Friday, Saturday=error text, etc.)
  const calendarDays = [
    { day: 28, isCurrentMonth: false },
    { day: 29, isCurrentMonth: false },
    { day: 30, isCurrentMonth: false },
    { day: 1, isCurrentMonth: true, isHoliday: true },
    { day: 2, isCurrentMonth: true },
    { day: 3, isCurrentMonth: true },
    { day: 4, isCurrentMonth: true, isHoliday: true }, // Sun
    { day: 5, isCurrentMonth: true, isHoliday: true }, // Sun
    { day: 6, isCurrentMonth: true },
    { day: 7, isCurrentMonth: true },
    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true, isToday: true, isHoliday: true }, // Today matching spec
    { day: 10, isCurrentMonth: true },
    { day: 11, isCurrentMonth: true, isHoliday: true }, // Sun
    { day: 12, isCurrentMonth: true, isHoliday: true }, // Sun
    { day: 13, isCurrentMonth: true },
    { day: 14, isCurrentMonth: true },
    { day: 15, isCurrentMonth: true },
    { day: 16, isCurrentMonth: true },
    { day: 17, isCurrentMonth: true },
    { day: 18, isCurrentMonth: true, isHoliday: true }, // Sun
    { day: 19, isCurrentMonth: true, isHoliday: true }, // Sun
    { day: 20, isCurrentMonth: true },
    { day: 21, isCurrentMonth: true },
    { day: 22, isCurrentMonth: true },
    { day: 23, isCurrentMonth: true, isHoliday: true }, // Waisak
    { day: 24, isCurrentMonth: true },
    { day: 25, isCurrentMonth: true, isHoliday: true }, // Sun
  ];

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate || !reason.trim()) {
      alert("Harap lengkapi semua kolom formulir.");
      return;
    }

    // Estimate duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    if (timeDiff < 0) {
      alert("Tanggal selesai tidak boleh sebelum tanggal mulai.");
      return;
    }

    const daysCount = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    setLoading(true);

    try {
      const response = await fetch("/api/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          type: selectedType,
          startDate: new Date(startDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          endDate: new Date(endDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          days: daysCount,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Gagal mengirim pengajuan.");
      } else {
        alert(data.message || "Pengajuan cuti/sakit berhasil dikirim!");
        setShowApplyModal(false);
        setStartDate("");
        setEndDate("");
        setReason("");
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Section */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-on-surface">Mei 2026</h2>
          <div className="flex gap-2">
            <button
              onClick={() => alert("Melihat bulan sebelumnya...")}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200/40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary text-base">chevron_left</span>
            </button>
            <button
              onClick={() => alert("Melihat bulan berikutnya...")}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200/40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary text-base">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-[0px_4px_12px_rgba(151,0,10,0.02)] border border-slate-100">
          <div className="grid grid-cols-7 text-center mb-3">
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
              <span key={d} className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2">
            {calendarDays.map((cd, idx) => {
              const isSelected = cd.isCurrentMonth && selectedDayRing === cd.day;
              return (
                <button
                  key={idx}
                  disabled={!cd.isCurrentMonth}
                  onClick={() => cd.isCurrentMonth && setSelectedDayRing(cd.day)}
                  className={`relative flex items-center justify-center h-10 w-full rounded-xl text-xs font-bold transition-all relative ${
                    !cd.isCurrentMonth
                      ? "text-slate-300 pointer-events-none"
                      : isSelected
                      ? "ring-2 ring-primary ring-offset-2 scale-105"
                      : cd.isToday
                      ? "bg-primary-container text-on-primary-container font-extrabold shadow-sm border border-red-200"
                      : cd.isHoliday
                      ? "text-[#93000a] font-extrabold bg-red-50/50"
                      : "text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {cd.day}
                  {/* Subtle dots for holidays or pending requests */}
                  {cd.isCurrentMonth && holidays.some((h) => h.day === cd.day) && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex gap-4 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]" />
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Libur
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Hari Ini
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Leave Balance Cards (Bento Style) */}
      <section className="space-y-3.5">
        <h3 className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest ml-1">
          Saldo Cuti
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary text-white p-4 rounded-2xl shadow-md relative overflow-hidden group">
            <div className="absolute -right-1.5 -bottom-1.5 opacity-10 group-hover:scale-105 transition-transform duration-500 pointer-events-none">
              <span className="material-symbols-outlined text-6xl">event_available</span>
            </div>
            <p className="text-xs font-semibold opacity-85">Cuti Tahunan</p>
            <h4 className="text-4xl font-extrabold leading-none my-1">{balance.annual}</h4>
            <p className="text-[10px] font-bold uppercase tracking-wider">Sisa Hari</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-slate-100 p-3 rounded-xl flex-1 border border-slate-200/50 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">Sakit</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-primary">
                  {String(balance.sickUsed).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-on-surface-variant font-bold">Dipakai</span>
              </div>
            </div>
            <div className="bg-slate-100 p-3 rounded-xl flex-1 border border-slate-200/50 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">Cuti Khusus</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-secondary">
                  {String(balance.specialAvailable).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-on-surface-variant font-bold">Tersedia</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Action Button */}
      <section className="pt-2">
        <button
          onClick={() => setShowApplyModal(true)}
          className="w-full bg-[#ffd1cb] text-[#930009] border border-[#ffb4aa]/40 py-4 px-4 rounded-2xl flex items-center justify-center gap-2 active:scale-98 hover:brightness-105 transition-all shadow-md cursor-pointer font-bold"
        >
          <span className="material-symbols-outlined text-xl">add_circle</span>
          <span className="text-sm font-extrabold uppercase tracking-wider">Ajukan Cuti/Sakit</span>
        </button>
      </section>

      {/* Holiday list bottom */}
      <section className="space-y-3.5 pb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest ml-1">
            Libur Nasional Mei
          </h3>
          <span className="text-xs text-primary font-bold cursor-pointer hover:underline">
            Lihat Semua
          </span>
        </div>

        <div className="space-y-2.5">
          {holidays.map((h, idx) => (
            <div
              key={idx}
              className="bg-white p-3.5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm"
            >
              <div className="bg-red-50 text-primary w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border border-red-100 font-extrabold">
                <span className="text-sm">{String(h.day).padStart(2, "0")}</span>
                <span className="text-[8px] uppercase tracking-wider font-extrabold">Mei</span>
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-bold text-on-surface leading-snug">{h.name}</h5>
                <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">{h.type}</p>
              </div>
              <span className="material-symbols-outlined text-slate-300 hover:text-slate-400">
                info
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* My pending leave requests */}
      {leaveRequests.filter(r => r.employeeId === employeeId).length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest ml-1">
            Pengajuan Saya
          </h3>
          <div className="space-y-2">
            {leaveRequests.filter(r => r.employeeId === employeeId).map((r) => (
              <div key={r.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-on-surface">{r.type}</span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    r.status === "PENDING" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                    r.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                    "bg-red-50 text-red-600 border border-red-100"
                  }`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">{r.startDate} - {r.endDate} ({r.days} Hari)</p>
                <p className="text-xs text-slate-600 italic">"{r.reason}"</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LEAVE APPLY MODAL FORM OVERLAY */}
      <AnimatePresence>
        {showApplyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h4 className="text-xs font-extrabold text-on-surface uppercase tracking-wider">
                  Pengajuan Cuti atau Sakit
                </h4>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleApplySubmit} className="p-6 space-y-4">
                {/* Tipe Cuti dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Tipe Cuti</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary focus:bg-white"
                  >
                    <option value="Cuti Tahunan">Cuti Tahunan (Tahunan)</option>
                    <option value="Sakit">Sakit / Istirahat Medis</option>
                    <option value="Cuti Khusus">Cuti Khusus (Hamil, duka, nikah)</option>
                  </select>
                </div>

                {/* Date start - end */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Selesai</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary focus:bg-white"
                    />
                  </div>
                </div>

                {/* Alasan pengajuan */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Alasan Pengajuan</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Berobat ke RS, Keperluan Keluarga"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-primary focus:bg-white resize-none"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-base">refresh</span>
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">send</span>
                        Submit Pengajuan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

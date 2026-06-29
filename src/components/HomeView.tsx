import React, { useState, useEffect, useRef } from "react";
import { AttendanceRecord, Employee } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface HomeViewProps {
  employee: Employee;
  attendanceHistory: AttendanceRecord[];
  onRefreshData: () => void;
  setActiveTab: (tab: string) => void;
}

export default function HomeView({ employee, attendanceHistory, onRefreshData, setActiveTab }: HomeViewProps) {
  const [dateStr, setDateStr] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [inRadius, setInRadius] = useState<boolean>(true);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [punchLoading, setPunchLoading] = useState(false);
  const [clockedInToday, setClockedInToday] = useState<AttendanceRecord | null>(null);

  // Refs for video & canvas
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      };
      setDateStr(now.toLocaleDateString("id-ID", options));
    };
    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check if employee is clocked in today
  useEffect(() => {
    const todayStr = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    const todayRec = attendanceHistory.find(
      (rec) => rec.employeeId === employee.id && rec.date === todayStr
    );
    setClockedInToday(todayRec || null);
  }, [attendanceHistory, employee.id]);

  // Request standard location
  useEffect(() => {
    handleGetLocation();
  }, []);

  const handleGetLocation = () => {
    setGpsLoading(true);
    setGpsError("");
    if (!navigator.geolocation) {
      setGpsError("Geolocation tidak didukung oleh browser ini.");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setGpsLoading(false);

        // Simulated check if user is within office radius (e.g., HQ is roughly around Jakarta -6.17511, 106.86503)
        // For standard demo, we default to inRadius=true, unless extremely far
        setInRadius(true);
      },
      (error) => {
        console.error("GPS error:", error);
        setGpsError("Gagal mendeteksi koordinat GPS. Menggunakan fallback lokasi kantor.");
        setGpsLoading(false);
        // Fallback office coordinate
        setCoords({ lat: -6.17511, lng: 106.86503 });
        setInRadius(true);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Open camera overlay
  const handleOpenAttendance = () => {
    setShowCamera(true);
    setCameraLoading(true);
    setCameraError("");
    setCapturedPhoto(null);

    // Initialize HTML5 camera stream
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraLoading(false);
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        setCameraError(
          "Izin kamera ditolak atau tidak ditemukan. Menggunakan fallback foto verifikasi."
        );
        setCameraLoading(false);
      });
  };

  // Capture image from stream
  const handleCapture = () => {
    if (streamRef.current && videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setCapturedPhoto(dataUrl);

        // Turn off camera stream
        handleStopCameraStream();
      }
    } else {
      // Fallback captured photo matching Budi's placeholder photo if camera stream doesn't load
      setCapturedPhoto(employee.photoUrl);
    }
  };

  const handleStopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCloseCameraOverlay = () => {
    handleStopCameraStream();
    setShowCamera(false);
    setCapturedPhoto(null);
  };

  // Perform backend submit punch (MASUK or PULANG)
  const handlePunchSubmit = async () => {
    if (!capturedPhoto) return;

    setPunchLoading(true);
    const endpoint = clockedInToday ? "/api/attendance/checkout" : "/api/attendance/checkin";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.id,
          selfie: capturedPhoto,
          latitude: coords?.lat || -6.17511,
          longitude: coords?.lng || 106.86503,
          locationName: "HQ - Jakarta Office",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Gagal melakukan presensi.");
      } else {
        alert(data.message || "Presensi berhasil tercatat!");
        onRefreshData();
        handleCloseCameraOverlay();
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setPunchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Greeting & Date */}
      <section className="space-y-1">
        <p className="text-sm font-semibold text-on-surface-variant">Halo, {employee.name}</p>
        <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">
          {dateStr || "Selasa, 24 Mei 2026"}
        </h2>
      </section>

      {/* Location Status Card */}
      <div className="bg-white rounded-2xl p-4 shadow-[0px_4px_12px_rgba(151,0,10,0.03)] border border-slate-100 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-xl">location_on</span>
            <span className="text-xs font-bold text-on-surface">Lokasi Kerja Saat Ini</span>
          </div>
          {inRadius ? (
            <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold border border-emerald-100 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Berada di Radius
            </div>
          ) : (
            <div className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold border border-amber-100 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Luar Radius
            </div>
          )}
        </div>

        {/* Minimalist interactive map simulator */}
        <div className="relative w-full h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center brightness-95 opacity-80"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCWsMMq5cIie2IMN4GzVKprshU3_GJ2UVPjrxtCYxyaghOGS8RjdUF-rvNpQnitLPeKTuMooWr8jtD7XTvXYZw8jJw8Bk4UZes9TNQzpbLvWxpK1GX8u954liEVk7MPj30PYL-QaSAR4pp03rQv42RDGojcKfgcgowmYOz5cUoXKh-FBmX9mdQtRi9A6lt2zWhASZNdw4HbPHAl3jv3xNYsen0aQos-2qYcU2ekEy5gJYJxiLwrRZCBIMniIqvJHs7DyL71OTHeY70')",
            }}
          />
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-on-surface shadow-sm border border-slate-200">
            HQ - Jakarta Office
          </div>
          {/* Pulse marker on map */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="absolute w-8 h-8 rounded-full bg-primary/20 animate-ping" />
            <span className="material-symbols-outlined text-primary text-3xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
              location_on
            </span>
          </div>
        </div>

        {gpsError && <p className="text-[10px] text-slate-400 font-medium">{gpsError}</p>}
      </div>

      {/* Attendance Action Area (Check-In / Out Button with animated rings) */}
      <section className="flex flex-col items-center py-4 space-y-4">
        <div className="relative flex items-center justify-center">
          {/* Pulsing Backing circles */}
          <div className="absolute w-44 h-44 rounded-full bg-primary/10 animate-ping opacity-30" />
          <div className="absolute w-40 h-40 rounded-full bg-primary/20 opacity-20" />

          <button
            onClick={handleOpenAttendance}
            className={`relative w-32 h-32 rounded-full text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-105 active:scale-95 transition-all group cursor-pointer ${
              clockedInToday ? "bg-amber-600 shadow-amber-600/20" : "bg-primary"
            }`}
          >
            <span className="material-symbols-outlined text-4xl animate-pulse">
              camera_enhance
            </span>
            <span className="text-xs font-bold px-3 text-center leading-tight">
              {clockedInToday ? "Presensi Pulang" : "Presensi Masuk"}
            </span>
          </button>
        </div>

        <div className="text-center max-w-[260px] space-y-1">
          <p className="text-sm font-medium text-on-surface-variant">
            Ambil foto selfie untuk melakukan absensi
          </p>
          <div className="inline-flex items-center gap-1 text-primary font-semibold text-xs bg-primary/5 px-2.5 py-1 rounded-full">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>Bukti foto wajib terlihat jelas</span>
          </div>
        </div>
      </section>

      {/* Quick Stats Bento style */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-low p-4 rounded-2xl border border-slate-200/40 flex flex-col gap-1 shadow-sm">
          <span className="material-symbols-outlined text-secondary text-2xl font-medium">login</span>
          <span className="text-xs font-medium text-on-surface-variant">Jam Masuk</span>
          <span className="text-xl font-extrabold text-on-surface">
            {clockedInToday ? clockedInToday.checkInTime : "--:--"}
          </span>
        </div>
        <div className="bg-surface-container-low p-4 rounded-2xl border border-slate-200/40 flex flex-col gap-1 shadow-sm">
          <span className="material-symbols-outlined text-primary text-2xl font-medium">timer</span>
          <span className="text-xs font-medium text-on-surface-variant">Total Kerja</span>
          <span className="text-xl font-extrabold text-on-surface">
            {clockedInToday ? "08j 15m" : "--:--"}
          </span>
        </div>
      </section>

      {/* Attendance History */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
            Riwayat Absensi
          </h3>
          <button
            onClick={() => setActiveTab("history")}
            className="text-primary font-bold text-xs hover:underline cursor-pointer"
          >
            Lihat Semua
          </button>
        </div>

        <div className="space-y-2.5">
          {attendanceHistory.slice(0, 3).map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 shrink-0">
                  <img
                    className="w-full h-full object-cover transition-all group-hover:scale-105"
                    src={record.checkInSelfie || employee.photoUrl}
                    alt="Selfie"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-on-surface">
                    {record.checkOutTime ? "Presensi Pulang" : "Presensi Masuk"}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {record.date} • {record.checkInTime}
                  </span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                  record.checkOutTime
                    ? "bg-slate-100 text-slate-600"
                    : "bg-red-50 text-primary border border-red-100"
                }`}
              >
                {record.checkOutTime ? "PULANG" : "MASUK"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FULL SCREEN CAMERA OVERLAY */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h4 className="text-sm font-extrabold text-on-surface">
                  {clockedInToday ? "Verifikasi Selfie Pulang" : "Verifikasi Selfie Masuk"}
                </h4>
                <button
                  onClick={handleCloseCameraOverlay}
                  className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Viewport content */}
              <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                {cameraLoading && (
                  <div className="text-white flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-3xl">refresh</span>
                    <p className="text-xs font-semibold">Mengakses Kamera...</p>
                  </div>
                )}

                {cameraError && (
                  <div className="p-4 text-center text-white space-y-2">
                    <span className="material-symbols-outlined text-4xl text-amber-500">
                      no_photography
                    </span>
                    <p className="text-xs font-semibold leading-relaxed">{cameraError}</p>
                    <button
                      onClick={() => setCapturedPhoto(employee.photoUrl)}
                      className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                    >
                      Gunakan Foto Profil Demo
                    </button>
                  </div>
                )}

                {/* Live stream */}
                {!capturedPhoto && !cameraLoading && !cameraError && (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    {/* Circle guide overlay */}
                    <div className="absolute inset-0 border-4 border-dashed border-white/40 rounded-full m-8 pointer-events-none" />
                  </>
                )}

                {/* Captured Photo */}
                {capturedPhoto && (
                  <img
                    src={capturedPhoto}
                    alt="Captured"
                    className="w-full h-full object-cover scale-x-[-1]"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 flex flex-col gap-3">
                {!capturedPhoto ? (
                  <button
                    disabled={cameraLoading}
                    onClick={handleCapture}
                    className="w-full py-3 bg-primary text-white font-semibold text-sm rounded-xl shadow-md hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">photo_camera</span>
                    Ambil Foto
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        onClick={handleOpenAttendance}
                        className="flex-1 py-2.5 bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-300 active:scale-98 transition-all cursor-pointer"
                      >
                        Foto Ulang
                      </button>
                      <button
                        disabled={punchLoading}
                        onClick={handlePunchSubmit}
                        className="flex-1 py-2.5 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-700 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10"
                      >
                        {punchLoading ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-base">
                              refresh
                            </span>
                            Mengirim...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            Kirim Absensi
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">
                      Wajah Anda akan dicocokkan menggunakan verifikasi biometrik dengan database
                      perusahaan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from "react";
import { Employee, LeaveBalance } from "../types";

interface ProfileViewProps {
  employee: Employee;
  balance: LeaveBalance;
  onLogout: () => void;
  onUpdateProfile: (name: string, role: string, photoUrl?: string) => Promise<void>;
}

export default function ProfileView({ employee, balance, onLogout, onUpdateProfile }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(employee.name);
  const [role, setRole] = useState(employee.role);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile(name, role);
      setIsEditing(false);
      alert("Detail profil berhasil disimpan!");
    } catch (err) {
      alert("Gagal menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulatePhotoEdit = async () => {
    // Allows user to paste any image URL or cycles prebuilt cool photos
    const urls = [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBW3QWpaN0_dmIWTty3Z-e-Ny44ja8rVIlG7LHC9shxougpFdTRqXACtHTD7TVSJoP_jha_yE_uiL-69XGLBdOB3msdC9ooFVdkMyw2xwgpHQ-UbkZwrpQhHfVnDunkNe7co9EpkxRH16W3WnepYBfS0MAlttO_mI_MiN3zsORbhmOyH5KVKh4wVp1IBZ1-TwRsGDbfGJwIOuwYHBX11jDnUP2-w68vieWXS9j6XY6btZbHjelCCrIikQ99uCnXzn4vwps-1FgKekQ",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB_Ma3vrs7K3OLGSu1_9OLnzIWcjb_0goUla2CcNbz3e-CDC0rH14FL63YMH9oiUTAf8H9F_ruT0b4xIGiIRUkkC36Ip_Hhd5jINFp1OxcdbWWdf077WUtvHjE8Bs_jAYY72YotyndCz4tzv5PnK_F_ecaclxd9UDu6YOsV_TyBLGOdgQDFPzIznaiMEyfyWQRU5BKXA7wIJJ87lxRsxlD9Yg-14AkTy-n4HlHt2bCvNtv2_Jj0avLgr_Yzsdr0ZywLffZ0kh2LTVo",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB5D4qkH8MPRGF1lwzFmBEGiwooMMAYlHNUJaKp6T7o5oKUpL8vES2apjEe7xPGzBeq9D46ZhFddLeWaNfUW8MQo1q4BLgXH-rkKCsyN9AlDBjH7t8KcHVo7MogN3qPt6V5SVblDY1qH-Dg0Z8bC35LHDlCm5uWYowaxGheVAWpN0MhSB7AZCmDBCzA7LQuZac4bXmEd-NDi1P6pzFBpeOZzG2FjAXeIl_gQPsnaMUSIUK8Zm_xnFMK9qHKgyJ2uZxcf-iRGHSa-mA"
    ];
    const nextUrl = urls[Math.floor(Math.random() * urls.length)];
    setIsSaving(true);
    try {
      await onUpdateProfile(employee.name, employee.role, nextUrl);
      alert("Foto profil berhasil diperbarui!");
    } catch (err) {
      alert("Gagal memperbarui foto profil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Profile Section */}
      <section className="flex flex-col items-center">
        <div className="relative mb-4 group">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg shadow-primary/5">
            {/* Animated Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-red-100 animate-pulse pointer-events-none" />
            <img
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              src={employee.photoUrl}
              alt={employee.name}
              referrerPolicy="no-referrer"
            />
          </div>
          <button
            disabled={isSaving}
            onClick={handleSimulatePhotoEdit}
            className="absolute bottom-1 right-1 bg-primary p-2 rounded-full border-2 border-white shadow-md text-white hover:brightness-110 active:scale-90 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px] font-bold">
              {isSaving ? "refresh" : "edit"}
            </span>
          </button>
        </div>

        <div className="text-center space-y-1.5 w-full max-w-sm">
          {isEditing ? (
            <div className="space-y-2 px-4">
              <input
                disabled={isSaving}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-center text-sm font-bold focus:border-primary outline-none disabled:bg-slate-50"
              />
              <input
                disabled={isSaving}
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-1 border border-slate-200 rounded-xl text-center text-xs font-semibold text-slate-500 focus:border-primary outline-none disabled:bg-slate-50"
              />
              <div className="flex gap-2 justify-center pt-1">
                <button
                  disabled={isSaving}
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  disabled={isSaving}
                  onClick={handleSave}
                  className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-lg hover:brightness-110 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {isSaving && <span className="material-symbols-outlined text-xs animate-spin">refresh</span>}
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-extrabold text-on-surface flex items-center justify-center gap-1">
                {employee.name}
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              </h2>
              <p className="text-xs text-on-surface-variant font-bold">{employee.role}</p>
            </>
          )}

          <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-surface-container-low rounded-full border border-slate-200/50 shadow-sm">
            <span className="material-symbols-outlined text-sm text-primary">badge</span>
            <span className="text-[10px] font-extrabold text-on-surface-variant">
              {employee.id}
            </span>
          </div>
        </div>
      </section>

      {/* Stats Grid (Bento Style) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/75 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200/40 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-primary mb-1">event_available</span>
          <span className="text-xl font-extrabold text-on-surface">{employee.attendanceRate}%</span>
          <span className="text-xs text-on-surface-variant font-semibold">Kehadiran</span>
        </div>
        <div className="bg-white/75 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200/40 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-amber-600 mb-1">timer</span>
          <span className="text-xl font-extrabold text-on-surface">{employee.avgCheckIn}</span>
          <span className="text-xs text-on-surface-variant font-semibold">Rata-rata Masuk</span>
        </div>
      </div>

      {/* Sectioned List */}
      <div className="space-y-4">
        {/* Akun Section */}
        <div>
          <h3 className="text-[10px] font-extrabold text-primary mb-2 uppercase tracking-widest ml-1">
            Akun
          </h3>
          <div className="bg-white rounded-2xl shadow-[0px_4px_12px_rgba(151,0,10,0.02)] overflow-hidden border border-slate-100">
            <button
              onClick={() => alert(`Informasi Pribadi:\nNama: ${employee.name}\nID: ${employee.id}\nUnit: Engineering\nHubungi HR untuk perubahan data resmi.`)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                  person
                </span>
                <span className="text-sm font-semibold text-on-surface">Informasi Pribadi</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
            </button>
            <div className="h-[1px] bg-slate-50 mx-4" />
            <button
              onClick={() => alert(`Detail Pekerjaan:\nJabatan: ${employee.role}\nDepartemen: R&D\nTipe Kontrak: Karyawan Tetap`)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                  work
                </span>
                <span className="text-sm font-semibold text-on-surface">Detail Pekerjaan</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Keamanan & Preferensi */}
        <div>
          <h3 className="text-[10px] font-extrabold text-primary mb-2 uppercase tracking-widest ml-1">
            Keamanan & Preferensi
          </h3>
          <div className="bg-white rounded-2xl shadow-[0px_4px_12px_rgba(151,0,10,0.02)] overflow-hidden border border-slate-100">
            <button
              onClick={() => {
                const p = prompt("Masukkan kata sandi baru:");
                if (p) alert("Kata sandi berhasil diperbarui!");
              }}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                  lock
                </span>
                <span className="text-sm font-semibold text-on-surface">Ubah Kata Sandi</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
            </button>
            <div className="h-[1px] bg-slate-50 mx-4" />
            <button
              onClick={() => alert("Pengaturan Notifikasi:\nNotifikasi push diaktifkan.")}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                  notifications_active
                </span>
                <span className="text-sm font-semibold text-on-surface">Pengaturan Notifikasi</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-2xl font-bold shadow-md shadow-primary/25 hover:brightness-110 transition-all active:scale-98 cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}

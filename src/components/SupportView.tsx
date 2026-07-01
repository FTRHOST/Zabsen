import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, SupportFaq } from "../types";
import { motion, AnimatePresence } from "motion/react";

export default function SupportView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: "Halo! Saya Asisten AI Zabsen. Ada yang bisa saya bantu terkait absensi, GPS, selfie, atau pengajuan cuti hari ini?",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const faqs: SupportFaq[] = [
    {
      id: "faq-1",
      question: "Bagaimana cara reset Lupa Kata Sandi?",
      answer:
        "Pilih menu 'Lupa Password' pada halaman login, masukkan email terdaftar Anda, dan ikuti instruksi pemulihan kata sandi yang kami kirimkan ke kotak masuk email Anda.",
      iconName: "lock_reset",
    },
    {
      id: "faq-2",
      question: "Mengapa muncul Masalah Lokasi GPS?",
      answer:
        "Pastikan pengaturan GPS perangkat Anda dalam mode 'Akurasi Tinggi' dan browser/aplikasi Zabsen memiliki izin akses lokasi. Jika masih bermasalah, cobalah memuat ulang aplikasi atau berpindah ke area yang lebih terbuka.",
      iconName: "location_on",
    },
    {
      id: "faq-3",
      question: "Panduan Cara Absensi Foto yang benar",
      answer:
        "Gunakan pencahayaan yang cukup terang saat melakukan pengambilan foto selfie. Pastikan wajah Anda terlihat sepenuhnya di dalam bingkai, serta hindari menggunakan masker, topi, atau kacamata hitam yang menghalangi deteksi wajah.",
      iconName: "camera_alt",
    },
    {
      id: "faq-4",
      question: "Cara mengunduh Laporan Absensi",
      answer:
        "Buka tab 'History', pilih rentang tanggal atau periode bulan yang Anda inginkan, lalu klik tombol 'Unduh Laporan' di pojok kanan atas untuk mengekspor data absensi Anda langsung ke file CSV/Excel.",
      iconName: "description",
    },
  ];

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChat]);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  // Filter FAQs based on search
  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsgText = chatInput.trim();
    setChatInput("");

    const newMsg: ChatMessage = {
      sender: "user",
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatLoading(true);

    try {
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsgText,
          chatHistory: chatMessages,
        }),
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.reply,
            timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        throw new Error("Failed response");
      }
    } catch (err) {
      console.error(err);
      // Fallback answers in case of offline API
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Maaf, saya sedang offline. Harap periksa koneksi internet Anda atau pastikan GEMINI_API_KEY terkonfigurasi.",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Search Section */}
      <section className="relative text-center py-6 bg-gradient-to-br from-red-50/40 to-slate-50/50 rounded-2xl border border-slate-100 p-4 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
        <div className="relative z-10 text-center space-y-1">
          <h2 className="text-xl font-extrabold text-on-surface">Ada yang bisa kami bantu?</h2>
          <p className="text-xs text-on-surface-variant font-medium">
            Temukan jawaban atas pertanyaan Anda dengan cepat.
          </p>
        </div>
        <div className="relative max-w-md mx-auto mt-4">
          <div className="flex items-center bg-white rounded-xl shadow-md shadow-primary/5 border border-slate-200/50 p-1.5">
            <span className="material-symbols-outlined ml-2 text-slate-400 text-xl">search</span>
            <input
              className="w-full border-none focus:ring-0 bg-transparent py-1.5 px-3 text-sm text-on-surface outline-none font-medium"
              placeholder="Cari topik bantuan..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="mr-2 text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Quick Contact Bento Grid */}
      <section className="space-y-3">
        <h3 className="text-sm font-extrabold text-on-surface uppercase tracking-wider ml-1">
          Hubungi Kami
        </h3>
        <div className="grid grid-cols-2 gap-3.5">
          {/* WhatsApp Card */}
          <div
            onClick={() => alert("Mengalihkan ke WhatsApp Support (simulasi)...")}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md hover:border-[#25D366]/30 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 bg-[#25D366]/10 rounded-full flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[#25D366] text-2xl font-bold">
                chat
              </span>
            </div>
            <span className="text-xs font-bold text-on-surface">WhatsApp</span>
            <span className="text-[9px] text-[#25D366] font-extrabold uppercase tracking-widest mt-1">
              Fast Response
            </span>
          </div>

          {/* Live Chat Card */}
          <div
            onClick={() => setShowChat(true)}
            className="bg-red-50/40 p-4 rounded-xl shadow-sm border border-red-100 flex flex-col items-center text-center hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform relative">
              <span className="absolute w-2.5 h-2.5 bg-emerald-500 rounded-full right-0.5 top-0.5 border-2 border-red-50" />
              <span className="material-symbols-outlined text-primary text-2xl font-bold">
                support_agent
              </span>
            </div>
            <span className="text-xs font-bold text-on-surface">Live Chat AI</span>
            <span className="text-[9px] text-primary font-extrabold uppercase tracking-widest mt-1 animate-pulse">
              Aktif 24/7
            </span>
          </div>

          {/* Email Card */}
          <div
            onClick={() => alert("Membuka Email client (simulasi): support@absenku.com")}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-slate-500 text-2xl">mail</span>
            </div>
            <span className="text-xs font-bold text-on-surface">Email</span>
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
              Ticket Support
            </span>
          </div>

          {/* Call Center Card */}
          <div
            onClick={() => alert("Menghubungi Call Center (simulasi): 1500-888")}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-slate-500 text-2xl">call</span>
            </div>
            <span className="text-xs font-bold text-on-surface">Call Center</span>
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
              Jam Kerja Office
            </span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-on-surface uppercase tracking-wider ml-1">
            Topik Populer
          </h3>
          <button
            onClick={() => alert("Semua FAQ ditampilkan.")}
            className="text-primary font-bold text-xs hover:underline cursor-pointer"
          >
            Lihat Semua
          </button>
        </div>

        <div className="space-y-2">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
            >
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => toggleFaq(faq.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center border border-primary/10">
                    <span className="material-symbols-outlined text-primary text-base">
                      {faq.iconName}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">{faq.question}</span>
                </div>
                <span
                  className="material-symbols-outlined text-slate-400 transition-transform duration-300"
                  style={{
                    transform: openFaqId === faq.id ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  expand_more
                </span>
              </button>

              <div
                className="transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: openFaqId === faq.id ? "200px" : "0px",
                  opacity: openFaqId === faq.id ? 1 : 0,
                  overflow: "hidden",
                }}
              >
                <p className="p-4 bg-slate-50 border-t border-slate-50 text-xs text-on-surface-variant font-medium leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Illustration Promo Card */}
      <section>
        <div className="relative rounded-2xl overflow-hidden h-36 flex items-center p-5 bg-gradient-to-r from-primary to-primary-container shadow-lg shadow-primary/10">
          <div className="relative z-10 max-w-[65%] space-y-1">
            <h4 className="text-sm font-extrabold text-white">Butuh Solusi Lain?</h4>
            <p className="text-[10px] text-white/80 font-medium leading-relaxed">
              Tim Support AI kami siap membantu memecahkan kendala teknis secara instan.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 w-1/3 h-full opacity-30">
            <img
              className="w-full h-full object-contain object-right-bottom scale-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdDvVSQctCG_TKa83qBmNV95vRVgqCI5IzS9psbt_XSLD9S1XPkPjxiyPe7vbQPYCq9HFlCHM828WbinYYFBbFlR7iWUCdz9XsTmX0xCMO1otuDU6hjUAT87Z7AUztdeMc0wVepEV2OcaFSCaUmmMwm0DozQiHpeZPCBV5vAD0P-odWaeQ5V2p2QYRYdmtc9gDuLndYZEDvpwLT2N-eaM5LIpm_u4CqRqlcmZEEuovByPoBHD7CWnkREI6kansn_EtdBeK8di4NxE"
              alt="Promo Support"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* FLOATING ACTION CHAT PULSE BUTTON */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-24 right-4 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-40 animate-bounce cursor-pointer shadow-primary/30 hover:scale-105 active:scale-90 transition-transform border border-red-500/50"
      >
        <span className="material-symbols-outlined text-lg">chat_bubble</span>
      </button>

      {/* INTERACTIVE CHAT OVERLAY */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex flex-col items-center justify-end md:justify-center p-4"
          >
            <div className="w-full max-w-md h-[80vh] md:h-[600px] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 bg-primary text-white flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center relative">
                    <span className="absolute w-2 h-2 rounded-full bg-emerald-500 bottom-0.5 right-0.5" />
                    <span className="material-symbols-outlined text-white text-lg">
                      support_agent
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold">Virtual Assistant Zabsen</h4>
                    <p className="text-[10px] text-white/70 font-semibold leading-none">Online - AI-Powered</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg text-white">close</span>
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm font-medium leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-primary text-white rounded-tr-none"
                          : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-slate-400 font-semibold mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex items-center gap-1.5 p-2 bg-white rounded-xl shadow-sm border border-slate-100 w-24">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-75" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-150" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-300" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Footer */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik pesan Anda..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs font-semibold outline-none focus:border-primary transition-colors focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:brightness-110 active:scale-90 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm font-bold rotate-[-30deg]">send</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

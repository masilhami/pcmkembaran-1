import { client } from "@/lib/sanity.client";

export const dynamic = "force-dynamic";

interface SanitySchedule {
  day: string;
  startTime: string;
  endTime: string;
  eventName: string;
  speaker?: string;
  broadcastMode: string;
}

interface SanityRadioConfig {
  radioName: string;
  stationTagline?: string;
  schedules: SanitySchedule[];
}

// Fungsi mengambil data murni dari Sanity
async function getRadioSchedules(): Promise<SanityRadioConfig | null> {
  try {
    const query = `
      *[_type == "radioConfig"][0] {
        radioName,
        stationTagline,
        schedules[] {
          day,
          startTime,
          endTime,
          eventName,
          speaker,
          broadcastMode
        }
      }
    `;
    const data = await client.fetch<SanityRadioConfig>(query, {}, { cache: 'no-store' });
    return data || null;
  } catch (error) {
    console.error("Gagal menarik data jadwal Sanity:", error);
    return null;
  }
}

// Fungsi memetakan nama hari bahasa inggris dari Sanity ke Indonesia untuk badge
const translateDay = (day: string) => {
  const days: { [key: string]: string } = {
    everyday: "Setiap Hari",
    Monday: "Senin",
    Tuesday: "Selasa",
    Wednesday: "Rabu",
    Thursday: "Kamis",
    Friday: "Jumat",
    Saturday: "Sabtu",
    Sunday: "Minggu"
  };
  return days[day] || day;
};

// Fungsi kosmetik untuk badge tipe siaran
const getModeBadge = (mode: string) => {
  switch (mode) {
    case "live_relay":
    case "relay_radio_fm":
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">📡 Relay FM</span>;
    case "youtube_live":
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">🎥 YouTube Live</span>;
    default:
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">🎵 Playlist MP3</span>;
  }
};

export default async function JadwalRadioPage() {
  const config = await getRadioSchedules();

  if (!config || !config.schedules || config.schedules.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center p-8 bg-white rounded-xl shadow-md max-w-md">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Jadwal Belum Tersedia</h2>
          <p className="text-slate-500 text-sm">Rangkaian jadwal siaran radio belum dikonfigurasi atau gagal dimuat dari studio.</p>
        </div>
      </div>
    );
  }

  // Mengurutkan jadwal berdasarkan jam mulai siaran (startTime) terkecil
  const sortedSchedules = [...config.schedules].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER STATION */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            🗓️ Jadwal Siaran {config.radioName}
          </h1>
          {config.stationTagline && (
            <p className="mt-3 text-lg text-slate-500 italic">
              "{config.stationTagline}"
            </p>
          )}
          <div className="mt-4 h-1 w-20 bg-blue-600 mx-auto rounded-full"></div>
        </div>

        {/* LIST JADWAL */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
            <h2 className="font-semibold text-lg">Rangkaian Acara Hari Ini</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">Waktu Indonesia Barat (WIB)</span>
          </div>

          <div className="divide-y divide-slate-200">
            {sortedSchedules.map((schedule, index) => (
              <div 
                key={index} 
                className="p-6 sm:grid sm:grid-cols-4 sm:gap-6 items-center hover:bg-slate-50 transition-colors duration-150"
              >
                {/* KOLOM JAM & HARI */}
                <div className="mb-3 sm:mb-0">
                  <div className="text-xl font-bold text-blue-600 tracking-wide">
                    {schedule.startTime} - {schedule.endTime}
                  </div>
                  <div className="mt-1">
                    <span className="inline-block bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded">
                      {translateDay(schedule.day)}
                    </span>
                  </div>
                </div>

                {/* KOLOM NAMA PROGRAM & PEMATERI */}
                <div className="sm:col-span-2 mb-4 sm:mb-0">
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {schedule.eventName}
                  </h3>
                  {schedule.speaker && (
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                      👤 Bersama: <span className="font-medium text-slate-700">{schedule.speaker}</span>
                    </p>
                  )}
                </div>

                {/* KOLOM BADGE MODE SIARAN */}
                <div className="flex sm:justify-end">
                  {getModeBadge(schedule.broadcastMode)}
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* FOOTER INFORMASI */}
        <div className="mt-8 text-center text-xs text-slate-400">
          * Jadwal dapat berubah sewaktu-waktu mengikuti siaran langsung darurat atau interupsi Adzan Otomatis.
        </div>

      </div>
    </div>
  );
}
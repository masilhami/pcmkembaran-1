import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 🟢 INFO: Pustaka "crypto" Node.js dihapus total karena Next.js mendukung 
// objek global web standar 'crypto.randomUUID()' secara native.

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, mp3_url, duration, duration_seconds } = body;

    console.log("📥 Menerima Request Body:", body);

    if (!title || !mp3_url) {
      return NextResponse.json(
        { error: "Parameter 'title' dan 'mp3_url' wajib dikirim!" },
        { status: 400 }
      );
    }

    // Konversi durasi secara fleksibel dan aman
    const finalDuration = parseInt(duration || duration_seconds || "0", 10);
    if (isNaN(finalDuration) || finalDuration <= 0) {
      return NextResponse.json(
        { error: "Durasi wajib berupa angka detik valid!" },
        { status: 400 }
      );
    }

    // 🧹 1. Bersihkan tabel dengan penanganan eror mandiri
    try {
      await prisma.radioStream.deleteMany({});
    } catch (dbErr: any) {
      console.warn("⚠️ Gagal melakukan flush data lama:", dbErr.message);
    }

    // 📥 2. Buat UUID menggunakan objek global standard Web API (Mulus & Anti-Crash)
    const generatedId = crypto.randomUUID(); 

    const newStream = await prisma.radioStream.create({
      data: {
        id: generatedId, // Mengisi kolom UUID di database menggunakan id hasil generate di atas
        title: title,
        audio_url: mp3_url,
        duration: finalDuration,
        start_time: new Date(), // Menandai detik siaran dimulai serempak sekarang
      },
    });

    return NextResponse.json({
      success: true,
      message: "Jadwal berhasil diperbarui ke database!",
      data: newStream
    }, { status: 200 });

  } catch (error: any) {
    console.error("💥 CRASH FATAL PADA API TRIGGER:", error);
    
    // 🟢 TAKTIK PENYELAMAT: Kita paksa kirim status 200 agar cron-job.org 
    // mau membongkar isi pesan eror aslinya secara transparan di layar!
    return NextResponse.json(
      { 
        success: false, 
        Pesan_Eror_Asli: error.message || "Internal Server Error",
        Kode_Prisma: error.code || "Tidak ada kode",
        Baris_Crash: error.stack ? error.stack.split('\n')[0] : "Tidak ada stack",
        Saran_Solusi: "Cek koneksi DATABASE_URL di env Vercel / Jalankan prisma db push"
      },
      { status: 200 } 
    );
  }
}
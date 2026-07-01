import fs from 'fs';
import readline from 'readline';

async function cleanNdjson() {
  const fileStream = fs.createReadStream('data-asli.ndjson');
  const writeStream = fs.createWriteStream('teks-murni.ndjson');
  
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const doc = JSON.parse(line);
      
      // 1. Buang dokumen fisik gambar dan file asset agar tidak dicekal CDN
      if (doc._type === 'sanity.imageAsset' || doc._type === 'sanity.fileAsset') {
        continue;
      }
      
      // 2. Bersihkan referensi inline yang menempel di dalam artikel/tulisan
      if (doc.mainImage) delete doc.mainImage;
      if (doc.image) delete doc.image;
      if (doc.file) delete doc.file;
      
      // Tulis kembali baris tulisan yang sudah bersih total
      writeStream.write(JSON.stringify(doc) + '\n');
    } catch (e) {
      // Jika ada baris yang rusak dari manipulasi sebelumnya, kita skip aman
      continue;
    }
  }
  console.log('🔥 BERHASIL! File teks-murni.ndjson siap di-import tanpa drama gambar/audio.');
}

cleanNdjson();
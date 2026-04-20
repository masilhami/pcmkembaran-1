const fs = require('fs');
const path = require('path');

// Sesuaikan nama file dengan yang ada di folder Anda
const inputFileName = '33.02_kelurahan.geojson'; 
const outputDir = path.join(__dirname, 'public', 'data');
const outputFile = path.join(outputDir, 'kembaran-sectors.json');

try {
    console.log('📡 Memulai Operasi Ekstraksi...');

    // 1. Cek apakah file input ada
    if (!fs.existsSync(inputFileName)) {
        throw new Error(`File ${inputFileName} tidak ditemukan di folder root!`);
    }

    // 2. Baca Data
    const rawData = fs.readFileSync(inputFileName);
    const geojson = JSON.parse(rawData);

    // 3. Filter Sektor Kembaran (020)
    const kembaranFeatures = geojson.features.filter(
        (f) => f.properties.kd_kecamatan === "020"
    );

    if (kembaranFeatures.length === 0) {
        console.log('⚠️ Peringatan: Tidak ada data dengan kode kecamatan 020.');
    }

    const result = {
        type: "FeatureCollection",
        features: kembaranFeatures
    };

    // 4. Pastikan folder tujuan ada
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 5. Tulis file hasil ke folder public/data
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

    console.log(`✅ MISI BERHASIL!`);
    console.log(`📍 ${kembaranFeatures.length} Desa berhasil diamankan.`);
    console.log(`📂 File siap di: public/data/kembaran-sectors.json`);

} catch (err) {
    console.error(`💥 KEGAGALAN SISTEM: ${err.message}`);
}
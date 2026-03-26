<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PasangSurut;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportPasang extends Command
{
    protected $signature = 'import:pasang
                            {--file=storage/app/pasang_surut.xlsx : Path ke file XLSX}
                            {--tahun=2026 : Tahun data}
                            {--fresh : Hapus data tahun ini sebelum import}';

    protected $description = 'Import data pasang surut (filter 2.6-3.0m, deteksi 2 puncak per hari)';

    private array $bulanMap = [
        'Januari'=>1,'Februari'=>2,'Maret'=>3,'April'=>4,
        'Mei'=>5,'Juni'=>6,'Juli'=>7,'Agustus'=>8,
        'September'=>9,'Oktober'=>10,'November'=>11,'Desember'=>12,
    ];

    private array $bulanHijriyah = [
        1=>'Muharram',2=>'Safar',3=>'Rabiul Awal',4=>'Rabiul Akhir',
        5=>'Jumadil Ula',6=>'Jumadil Akhir',7=>'Rajab',8=>'Syaban',
        9=>'Ramadan',10=>'Syawal',11=>'Dzulqaidah',12=>'Dzulhijjah',
    ];

    public function handle(): int
    {
        $file  = base_path($this->option('file'));
        $tahun = (int) $this->option('tahun');
        $fresh = $this->option('fresh');

        if (!file_exists($file)) {
            $this->error("File tidak ditemukan: {$file}");
            return 1;
        }

        $this->info("Membaca file: {$file} | Tahun: {$tahun}");

        if ($fresh) {
            $deleted = PasangSurut::where('tahun', $tahun)->delete();
            $this->warn("Dihapus {$deleted} baris.");
        }

        try {
            $spreadsheet = IOFactory::load($file);
        } catch (\Exception $e) {
            $this->error("Gagal membaca: " . $e->getMessage());
            return 1;
        }

        $totalImported = 0;

        foreach ($spreadsheet->getSheetNames() as $sheetName) {
            $bulanNama = trim($sheetName);
            if (!isset($this->bulanMap[$bulanNama])) continue;

            $bulanAngka = $this->bulanMap[$bulanNama];
            $sheet      = $spreadsheet->getSheetByName($sheetName);
            $rows       = $sheet->toArray(null, true, true, false);
            array_shift($rows);

            // Kumpulkan semua (jam, tinggi) per tanggal
            $perTanggal = [];
            foreach ($rows as $row) {
                $tgl    = isset($row[1]) ? (int) $row[1] : null;
                $jam    = isset($row[2]) ? (int) $row[2] : null;
                $tinggi = isset($row[3]) && is_numeric($row[3]) ? (float) $row[3] : null;

                if (!$tgl || $jam === null || $tinggi === null) continue;
                if ($tgl < 1 || $tgl > 31) continue;
                if ($tinggi < 2.6 || $tinggi > 3.0) continue;

                // Jam 24 tetap disimpan sebagai 24 (ditampilkan sebagai 23.59)
                // Jangan diubah ke 23 agar tidak bentrok dengan jam 23 asli
                if ($jam < 0 || $jam > 24) continue;

                if (!isset($perTanggal[$tgl])) $perTanggal[$tgl] = [];
                $perTanggal[$tgl][] = ['jam' => $jam, 'tinggi' => $tinggi];
            }

            if (empty($perTanggal)) {
                $this->line("  {$bulanNama}: tidak ada data.");
                continue;
            }

            $batch = [];
            foreach ($perTanggal as $tgl => $entries) {
                // Urutkan berdasarkan jam
                usort($entries, fn($a, $b) => $a['jam'] - $b['jam']);

                // Pisah jadi kelompok berdasarkan gap > 3 jam
                $groups = [];
                $current = [$entries[0]];
                for ($i = 1; $i < count($entries); $i++) {
                    if ($entries[$i]['jam'] - $entries[$i-1]['jam'] > 3) {
                        $groups[] = $current;
                        $current  = [$entries[$i]];
                    } else {
                        $current[] = $entries[$i];
                    }
                }
                $groups[] = $current;

                [$yh, $mh, $dh] = $this->toHijri($tahun, $bulanAngka, $tgl);

                foreach ($groups as $puncakKe => $group) {
                    $jams       = array_column($group, 'jam');
                    $heights    = array_column($group, 'tinggi');
                    $jamMulai   = min($jams);
                    $jamSelesai = max($jams);
                    $maxTinggi  = max($heights);
                    $jamPuncak  = $group[array_search($maxTinggi, $heights)]['jam'];

                    $batch[] = [
                        'tahun'          => $tahun,
                        'bulan_angka'    => $bulanAngka,
                        'bulan_nama'     => $bulanNama,
                        'tanggal'        => $tgl,
                        'puncak_ke'      => $puncakKe + 1,
                        'jam'            => $jamPuncak,
                        'jam_mulai'      => $jamMulai,
                        'jam_selesai'    => $jamSelesai,
                        'ketinggian'     => $maxTinggi,
                        'tgl_hijriyah'   => $dh,
                        'bulan_hijriyah' => $this->bulanHijriyah[$mh] ?? 'Unknown',
                        'phase'          => 0,
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ];
                }
            }

            // Upsert dengan unique key tahun+bulan_angka+tanggal+puncak_ke
            PasangSurut::upsert(
                $batch,
                ['tahun', 'bulan_angka', 'tanggal', 'puncak_ke'],
                ['jam', 'jam_mulai', 'jam_selesai', 'ketinggian', 'tgl_hijriyah', 'bulan_hijriyah', 'updated_at']
            );

            $totalImported += count($batch);
            $dua = count(array_filter($batch, fn($b) => $b['puncak_ke'] === 2));
            $this->info("  ✓ {$bulanNama}: " . count($batch) . " baris (" . ($dua > 0 ? "{$dua} hari dua puncak" : "semua 1 puncak") . ")");
        }

        $this->newLine();
        $this->info("Selesai! Total: {$totalImported} baris diimport.");
        return 0;
    }

    private function toHijri(int $year, int $month, int $day): array
    {
        if ($month <= 2) { $year--; $month += 12; }
        $A  = intdiv($year, 100);
        $B  = 2 - $A + intdiv($A, 4);
        $JD = (int)(365.25 * ($year + 4716)) + (int)(30.6001 * ($month + 1)) + $day + $B - 1524;
        $jd = $JD;
        $l  = $jd - 1948440 + 10632;
        $n  = intdiv($l - 1, 10631);
        $l  = $l - 10631 * $n + 354;
        $j  = intdiv(10985 - $l, 5316) * intdiv(50 * $l, 17719)
            + intdiv($l, 5670) * intdiv(43 * $l, 15238);
        $l  = $l - intdiv(30 - $j, 15) * intdiv(17719 * $j, 50)
            - intdiv($j, 16) * intdiv(15238 * $j, 43) + 29;
        $mh = intdiv(24 * $l, 709);
        $dh = $l - intdiv(709 * $mh, 24);
        $yh = 30 * $n + $j - 30;
        return [(int)$yh, (int)$mh, (int)$dh];
    }
}
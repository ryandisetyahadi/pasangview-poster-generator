<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PasangSurut;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PasangAirController extends Controller
{
    private array $hariId = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    private array $bulanNum = [
        'Januari'=>1,'Februari'=>2,'Maret'=>3,'April'=>4,
        'Mei'=>5,'Juni'=>6,'Juli'=>7,'Agustus'=>8,
        'September'=>9,'Oktober'=>10,'November'=>11,'Desember'=>12,
    ];
    private array $bulanHijriyah = [
        1=>'Muharram',2=>'Safar',3=>'Rabiul Awal',4=>'Rabiul Akhir',
        5=>'Jumadil Ula',6=>'Jumadil Akhir',7=>'Rajab',8=>'Syaban',
        9=>'Ramadan',10=>'Syawal',11=>'Dzulqaidah',12=>'Dzulhijjah',
    ];

    /**
     * GET /api/pasang-air/analisis?bulan=Maret&tahun=2026
     * Analisis semua hari >= 2.6m, dibagi 2 phase berdasarkan bulan Hijriyah
     */
    public function analisis(Request $request): JsonResponse
    {
        $request->validate([
            'bulan' => 'required|string',
            'tahun' => 'sometimes|integer|min:2020|max:2100',
        ]);

        $bulan = $request->input('bulan');
        $tahun = (int) $request->input('tahun', date('Y'));
        $bulanAngka = $this->bulanNum[$bulan] ?? null;

        if (!$bulanAngka) {
            return response()->json(['success' => false, 'message' => 'Nama bulan tidak valid.'], 422);
        }

        $rows = PasangSurut::where('tahun', $tahun)
            ->where('bulan_nama', $bulan)
            ->orderBy('tanggal')
            ->get();

        if ($rows->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => "Tidak ada data {$bulan} {$tahun} dengan ketinggian >= 2.6m.",
                'phase1'  => null,
                'phase2'  => null,
            ], 404);
        }

        // Tentukan 2 bulan Hijriyah yang ada di bulan Masehi ini
        // Bulan Hijriyah pertama = phase 1, kedua = phase 2
        $hijriMonths = $this->getHijriMonthsInMasehiMonth($tahun, $bulanAngka);
        $hijriMonth1 = $hijriMonths[0]; // bulan Hijriyah pertama
        $hijriMonth2 = $hijriMonths[1] ?? null; // bulan Hijriyah kedua

        // Pisah rows berdasarkan bulan Hijriyah tanggalnya
        $phase1Rows = collect();
        $phase2Rows = collect();

        foreach ($rows as $row) {
            [, $mh,] = $this->toHijri($tahun, $bulanAngka, $row->tanggal);
            if ($mh === $hijriMonth1) {
                $phase1Rows->push($row);
            } else {
                $phase2Rows->push($row);
            }
        }

        return response()->json([
            'success' => true,
            'bulan'   => $bulan,
            'tahun'   => $tahun,
            'total'   => $rows->count(),
            'phase1'  => $this->formatPhase($phase1Rows, $tahun, $bulanAngka, 1, $hijriMonth1),
            'phase2'  => $this->formatPhase($phase2Rows, $tahun, $bulanAngka, 2, $hijriMonth2),
        ]);
    }

    /**
     * GET /api/pasang-air?bulan=Mei&tgl_start=5&tgl_end=8&tahun=2026
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'bulan'     => 'required|string',
            'tgl_start' => 'required|integer|min:1|max:31',
            'tgl_end'   => 'required|integer|min:1|max:31|gte:tgl_start',
            'tahun'     => 'sometimes|integer|min:2020|max:2100',
        ]);

        $bulan    = $request->input('bulan');
        $tglStart = (int) $request->input('tgl_start');
        $tglEnd   = (int) $request->input('tgl_end');
        $tahun    = (int) $request->input('tahun', date('Y'));

        $rows = PasangSurut::where('tahun', $tahun)
            ->where('bulan_nama', $bulan)
            ->whereBetween('tanggal', [$tglStart, $tglEnd])
            ->orderBy('tanggal')
            ->get();

        if ($rows->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => "Data {$bulan} tanggal {$tglStart}-{$tglEnd} tahun {$tahun} tidak ditemukan.",
                'data'    => [],
            ], 404);
        }

        $periode = $tglStart === $tglEnd
            ? "{$tglStart} {$bulan} {$tahun}"
            : "{$tglStart} – {$tglEnd} {$bulan} {$tahun}";

        $bulanAngka = $this->bulanNum[$bulan] ?? 1;

        return response()->json([
            'success' => true,
            'periode' => $periode,
            'tahun'   => $tahun,
            'bulan'   => $bulan,
            'data'    => $this->formatRows($rows, $tahun, $bulanAngka),
        ]);
    }

    /**
     * GET /api/pasang-air/tahun-tersedia
     */
    public function tahunTersedia(): JsonResponse
    {
        $tahunList = PasangSurut::select('tahun')
            ->distinct()
            ->orderByDesc('tahun')
            ->pluck('tahun');

        return response()->json(['tahun' => $tahunList]);
    }

    // =========================================================
    // HELPERS
    // =========================================================

    /**
     * Dapatkan 2 bulan Hijriyah yang ada dalam 1 bulan Masehi
     * Selalu tepat 2 bulan Hijriyah per bulan Masehi
     */
    private function getHijriMonthsInMasehiMonth(int $tahun, int $bulanAngka): array
    {
        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $bulanAngka, $tahun);
        $months = [];
        for ($d = 1; $d <= $daysInMonth; $d++) {
            [, $mh,] = $this->toHijri($tahun, $bulanAngka, $d);
            if (!in_array($mh, $months)) {
                $months[] = $mh;
            }
            if (count($months) === 2) break;
        }
        return $months;
    }

    private function formatPhase($rows, int $tahun, int $bulanAngka, int $phaseNum, ?int $hijriMonth): ?array
    {
        if ($rows->isEmpty() || $hijriMonth === null) return null;

        $data = $this->formatRows($rows, $tahun, $bulanAngka);

        $tglPertama  = $rows->first();
        $tglTerakhir = $rows->last();

        $periodeM = $tglPertama->tanggal === $tglTerakhir->tanggal
            ? "{$tglPertama->tanggal} {$tglPertama->bulan_nama} {$tahun}"
            : "{$tglPertama->tanggal}–{$tglTerakhir->tanggal} {$tglPertama->bulan_nama} {$tahun}";

        $namaHijri = $this->bulanHijriyah[$hijriMonth] ?? '';
        $label     = $phaseNum === 1 ? 'Pasang Purnama' : 'Pasang Bulan Baru';

        return [
            'phase'      => $phaseNum,
            'label'      => $label,
            'periode'    => $periodeM,
            'periode_h'  => $namaHijri,
            'jumlah'     => $rows->count(),
            'data'       => $data,
        ];
    }

    private function formatRows($rows, int $tahun, int $bulanAngka): array
    {
        return $rows->map(function ($row) use ($tahun, $bulanAngka) {
            $d        = mktime(0, 0, 0, $bulanAngka, $row->tanggal, $tahun);
            $namaHari = $this->hariId[date('w', $d)];

            // Format jam: jam 24 → 23.59, selainnya → HH.00
            $fmtJam = function(int $jam): string {
                if ($jam === 24) return '23.59';
                return str_pad($jam, 2, '0', STR_PAD_LEFT) . '.00';
            };

            $jamMulaiStr   = $fmtJam($row->jam_mulai);
            $jamSelesaiStr = $fmtJam($row->jam_selesai);

            $jamDisplay = $row->jam_mulai === $row->jam_selesai
                ? $jamMulaiStr . ' WITA'
                : $jamMulaiStr . ' – ' . $jamSelesaiStr . ' WITA';

            [, $mh, $dh] = $this->toHijri($tahun, $bulanAngka, $row->tanggal);

            // Label hari — puncak ke-2 diberi tanda agar bisa dibedakan di frontend
            $hariLabel = "{$namaHari}, {$row->tanggal} {$row->bulan_nama}";

            return [
                'hari'           => $hariLabel,
                'puncak_ke'      => (int) $row->puncak_ke,
                'pasang'         => (float) $row->ketinggian,
                'jam'            => $jamDisplay,
                'tgl_hijriyah'   => $dh,
                'bulan_hijriyah' => $this->bulanHijriyah[$mh] ?? '',
            ];
        })->values()->toArray();
    }

    /**
     * Konversi tanggal Masehi ke Hijriyah
     */
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
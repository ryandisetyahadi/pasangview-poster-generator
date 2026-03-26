<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasangSurut extends Model
{
    protected $table = 'pasang_surut';

    protected $fillable = [
        'tahun', 'bulan_angka', 'bulan_nama', 'tanggal', 'puncak_ke',
        'jam', 'jam_mulai', 'jam_selesai', 'ketinggian',
        'tgl_hijriyah', 'bulan_hijriyah', 'phase',
    ];

    protected $casts = [
        'tahun'       => 'integer',
        'bulan_angka' => 'integer',
        'tanggal'     => 'integer',
        'puncak_ke'   => 'integer',
        'jam'         => 'integer',
        'jam_mulai'   => 'integer',
        'jam_selesai' => 'integer',
        'ketinggian'  => 'decimal:2',
    ];
}
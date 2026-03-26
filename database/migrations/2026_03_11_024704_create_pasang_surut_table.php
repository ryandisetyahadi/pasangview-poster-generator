<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pasang_surut', function (Blueprint $table) {
            $table->id();
            $table->smallInteger('tahun');
            $table->tinyInteger('bulan_angka');
            $table->string('bulan_nama', 20);
            $table->tinyInteger('tanggal');
            $table->tinyInteger('puncak_ke')->default(1); // 1 = puncak pertama, 2 = puncak kedua
            $table->tinyInteger('jam');                   // jam puncak tertinggi
            $table->tinyInteger('jam_mulai');             // jam pertama >= 2.6m di puncak ini
            $table->tinyInteger('jam_selesai');           // jam terakhir >= 2.6m di puncak ini
            $table->decimal('ketinggian', 4, 2);          // ketinggian tertinggi di puncak ini
            $table->tinyInteger('tgl_hijriyah');
            $table->string('bulan_hijriyah', 30);
            $table->tinyInteger('phase')->default(0);
            $table->timestamps();

            $table->index(['tahun', 'bulan_angka', 'tanggal']);
            $table->index(['tahun', 'bulan_angka']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pasang_surut');
    }
};
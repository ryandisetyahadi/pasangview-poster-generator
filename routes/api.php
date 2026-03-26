<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PasangAirController;

Route::prefix('pasang-air')->group(function () {
    Route::get('/',               [PasangAirController::class, 'index']);
    Route::get('/analisis',       [PasangAirController::class, 'analisis']);
    Route::get('/tahun-tersedia', [PasangAirController::class, 'tahunTersedia']);
});
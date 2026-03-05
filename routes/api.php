<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PasangAirController;

Route::get('/pasang-air', [PasangAirController::class, 'index']);
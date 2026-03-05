<?php

use Illuminate\Support\Facades\Route;

Route::get('/pasangview', function () {
    return response()
        ->view('pasangview.index')
        ->header('X-Robots-Tag', 'noindex')
        ->header('Cache-Control', 'no-store, no-cache');
});
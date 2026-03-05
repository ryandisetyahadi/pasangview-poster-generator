<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class PasangAirController extends Controller
{
    public function index(): JsonResponse
    {
        $data = [
            'periode' => '5 - 8 Mei 2026',
            'data' => [
                [
                    'hari'   => 'Selasa',
                    'pasang' => 2.4,
                    'jam'    => '16.00 - 18.00 WITA',
                ],
                [
                    'hari'   => 'Rabu',
                    'pasang' => 2.5,
                    'jam'    => '17.00 - 19.00 WITA',
                ],
                [
                    'hari'   => 'Kamis',
                    'pasang' => 2.6,
                    'jam'    => '17.30 - 19.30 WITA',
                ],
            ],
        ];

        return response()->json($data);
    }
}
<?php /* PasangView v8 */ ?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PasangView &mdash; Poster Generator</title>
    <link rel="stylesheet" href="{{ asset('css/pasangview.css') }}?v={{ time() }}" />
</head>
<body>
<div id="app-wrapper">

    <!-- EDITOR PANEL -->
    <div id="editor-panel">
        <h2 id="editor-title">Panel Editor</h2>

        <div class="editor-row">
            <div class="editor-section">
                <label class="editor-label">Upload Background</label>
                <input type="file" id="input-bg" accept="image/*" />
            </div>
            <div class="editor-section">
                <label class="editor-label">Opacity Overlay: <span id="opacity-value">0.72</span></label>
                <input type="range" id="slider-opacity" min="0" max="1" step="0.01" value="0.72" />
            </div>
            <div class="editor-section editor-section-sm">
                <label class="editor-label">Warna Overlay</label>
                <input type="color" id="input-overlay-color" value="#ffffff" />
            </div>
        </div>

        <!-- Warna Kustomisasi -->
        <div class="editor-section" style="margin-bottom:14px;">
            <label class="editor-label">Kustomisasi Warna</label>
            <div class="color-picker-row">
                <div class="color-pick-item">
                    <input type="color" id="color-aksen" value="#D32F2F" />
                    <span>Aksen<br/><small>Header, Border, Imbauan</small></span>
                </div>
                <div class="color-pick-item">
                    <input type="color" id="color-periode" value="#FBC02D" />
                    <span>Periode<br/><small>Subheader Tanggal</small></span>
                </div>
                <div class="color-pick-item">
                    <input type="color" id="color-tabel" value="#0D1B2A" />
                    <span>Tabel & Footer<br/><small>Header Tabel & Footer</small></span>
                </div>
            </div>
        </div>

        <!-- Logo Header Dinamis -->
        <div class="editor-section" style="margin-bottom:14px;">
            <div class="logo-section-header">
                <label class="editor-label">&#128444; Logo Header</label>
                <button id="btn-add-logo" type="button">+ Tambah Logo</button>
            </div>
            <div id="logo-upload-grid"></div>
        </div>

        <div class="editor-row">
            <div class="editor-section">
                <label class="editor-label">Tanggal Mulai</label>
                <input type="date" id="input-date-start" />
            </div>
            <div class="editor-section">
                <label class="editor-label">Tanggal Selesai</label>
                <input type="date" id="input-date-end" />
            </div>
            <div class="editor-section editor-section-sm">
                <label class="editor-label">&nbsp;</label>
                <button id="btn-apply-dates">&#10003; Terapkan</button>
            </div>
        </div>

        <div class="editor-row">
            <div class="editor-section">
                <label class="editor-label">Nama Instansi Baris 1</label>
                <input type="text" id="input-instansi1" value="BADAN PENANGGULANGAN BENCANA DAERAH" />
            </div>
            <div class="editor-section">
                <label class="editor-label">Nama Instansi Baris 2</label>
                <input type="text" id="input-instansi2" value="KOTA BANJARMASIN" />
            </div>
        </div>

        <div class="editor-row">
            <div class="editor-section">
                <label class="editor-label">Kotak Informasi</label>
                <textarea id="textarea-informasi" rows="4">Perkiraan ini menunjukkan pasang tertinggi yang biasanya terjadi sore hingga malam. Ketinggian diukur dari titik surut terendah (LAT) Muara Sungai Barito.
Saat pasang purnama dan kondisi cuaca buruk (angin, hujan, tekanan udara rendah), air bisa naik lebih tinggi dari angka ini.</textarea>
            </div>
            <div class="editor-section">
                <label class="editor-label">Imbauan (satu poin per baris)</label>
                <textarea id="textarea-imbauan" rows="4">Tinggikan barang berharga dan instalasi listrik
Perhatikan jadwal pasang tertinggi
Siapkan saluran air agar tidak tersumbat
Waspada anak - anak dan lansia
Ikuti informasi resmi dari BMKG dan Pemkot Banjarmasin</textarea>
            </div>
        </div>

        <div class="editor-section">
            <button id="btn-download">&#11015; Download PNG (1080x1350)</button>
        </div>
    </div>

    <!-- POSTER -->
    <div id="poster-stage">
        <div id="poster">
            <div id="poster-overlay"></div>
            <div id="poster-inner">

                <!-- Logo row — pill putih -->
                <div id="poster-logo-row">
                    <div id="logo-pill"></div>
                </div>

                <!-- Teks instansi -->
                <div id="poster-instansi">
                    <p id="instansi-line1">BADAN PENANGGULANGAN BENCANA DAERAH</p>
                    <p id="instansi-line2">KOTA BANJARMASIN</p>
                </div>

                <!-- Header merah -->
                <div id="poster-header">
                    <h1 id="header-line1">WASPADA</h1>
                    <h1 id="header-line2">AIR PASANG ROB</h1>
                </div>

                <!-- Periode kuning -->
                <div id="poster-periode-wrap">
                    <div id="poster-periode">
                        <span id="text-periode">Memuat data...</span>
                    </div>
                </div>

                <!-- Tabel -->
                <div id="poster-table-wrapper">
                    <table id="poster-table">
                        <thead>
                            <tr>
                                <th>Hari</th>
                                <th>Pasang Maks (m)</th>
                                <th>Jam Puncak</th>
                            </tr>
                        </thead>
                        <tbody id="table-body"></tbody>
                    </table>
                </div>

                <!-- Informasi -->
                <div id="poster-info-box">
                    <p id="text-informasi">Perkiraan ini menunjukkan pasang tertinggi yang biasanya terjadi sore hingga malam. Ketinggian diukur dari titik surut terendah (LAT) Muara Sungai Barito.
Saat pasang purnama dan kondisi cuaca buruk (angin, hujan, tekanan udara rendah), air bisa naik lebih tinggi dari angka ini.</p>
                </div>

                <!-- Imbauan -->
                <div id="poster-imbauan-box">
                    <div id="imbauan-header">IMBAUAN KEPADA MASYARAKAT</div>
                    <ul id="imbauan-list"></ul>
                </div>

            </div><!-- /poster-inner -->

            <!-- Footer PERMANEN -->
            <div id="poster-footer">
                <div class="footer-col">
                    <div class="footer-logo-wrap">
                        <img src="{{ asset('images/footer-left.png') }}" alt="Logo BPBD"
                             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
                        <div class="footer-logo-ph" style="display:none;">LOGO<br/>BPBD</div>
                    </div>
                    <div class="footer-col-text">
                        <p class="ft-bold">Layanan Darurat Bencana</p>
                        <p class="ft-bold">Kota Banjarmasin</p>
                        <p class="ft-sub">Call Center Pusdalops-PB:</p>
                        <p class="ft-telp">+62851-8689-1117</p>
                    </div>
                </div>
                <div class="footer-divider"></div>
                <div class="footer-col footer-col-right">
                    <div class="footer-col-text footer-text-right">
                        <p class="ft-bold">Layanan Darurat</p>
                        <p class="ft-bold">Kota Banjarmasin:</p>
                        <p class="ft-nomor">112</p>
                        <p class="ft-sub">Gratis, Bebas Pulsa, 24 Jam</p>
                    </div>
                    <div class="footer-logo-wrap">
                        <img src="{{ asset('images/footer-right.png') }}" alt="Logo 112"
                             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
                        <div class="footer-logo-ph" style="display:none;">LOGO<br/>112</div>
                    </div>
                </div>
            </div>

            <!-- Sosmed PERMANEN -->
            <div id="poster-sosmed">
                <span class="sosmed-item">&#128248; bpbd_kota_banjarmasin</span>
                <span class="sosmed-sep">|</span>
                <span class="sosmed-item">&#128248; bpbd banjarmasin</span>
                <span class="sosmed-sep">|</span>
                <span class="sosmed-item">&#128241; 0851-8689-1117</span>
                <span class="sosmed-sep">|</span>
                <span class="sosmed-item">&#9993; bpbdk.bjm3&#64;gmail.com</span>
                <span class="sosmed-sep">|</span>
                <span class="sosmed-item">&#127760; www.bpbdbanjarmasin.kota.co.id</span>
            </div>

        </div>
    </div>

</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" crossorigin="anonymous"></script>
<script src="{{ asset('js/pasangview.js') }}?v={{ time() }}"></script>
</body>
</html>
<?php /* PasangView v10 */ ?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PasangView &mdash; Poster Generator</title>
    <link rel="stylesheet" href="{{ asset('css/pasangview.css') }}?v={{ time() }}" />
    <script src="{{ asset('js/pasang-data.js') }}?v={{ time() }}"></script>
</head>
<body>
<div id="app-wrapper">

    <div id="editor-panel">
        <h2 id="editor-title">PasangView — Poster Generator</h2>

        <!-- 1. BACKGROUND -->
        <div class="editor-card">
            <div class="editor-card-title">&#128444; Background &amp; Overlay</div>
            <div class="editor-row">
                <div class="editor-section" style="flex:2;">
                    <label class="editor-label">Upload Gambar Background</label>
                    <input type="file" id="input-bg" accept="image/*" />
                </div>
                <div class="editor-section">
                    <label class="editor-label">Opacity: <span id="opacity-value">0.72</span></label>
                    <input type="range" id="slider-opacity" min="0" max="1" step="0.01" value="0.72" />
                </div>
            </div>
            <div class="editor-row" style="margin-bottom:0;align-items:center;">
                <div class="color-pick-item" style="flex:1;">
                    <input type="color" id="overlay-color1" value="#ffffff" />
                    <span>Warna 1<br/><small>Atas/Kiri</small></span>
                </div>
                <div class="gradient-arrow">&#8594;</div>
                <div class="color-pick-item" style="flex:1;">
                    <input type="color" id="overlay-color2" value="#ffffff" />
                    <span>Warna 2<br/><small>Bawah/Kanan</small></span>
                </div>
                <div class="editor-section editor-section-sm" style="flex:1.2;">
                    <label class="editor-label">Arah Gradasi</label>
                    <select id="overlay-direction">
                        <option value="to bottom">&#8595; Atas-Bawah</option>
                        <option value="to right">&#8594; Kiri-Kanan</option>
                        <option value="to bottom right">&#8600; Diagonal</option>
                        <option value="to top right">&#8599; Diagonal 2</option>
                    </select>
                </div>
                <div id="gradient-preview" style="flex:0 0 56px;height:38px;border-radius:6px;border:1px solid #ddd;margin-left:8px;"></div>
            </div>
        </div>

        <!-- 2. WARNA -->
        <div class="editor-card">
            <div class="editor-card-title">&#127912; Warna &amp; Teks</div>
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
                    <span>Tabel &amp; Footer<br/><small>Header Tabel &amp; Footer</small></span>
                </div>
            </div>
            <div style="margin-top:10px;">
                <label class="editor-label">Warna Teks Umum</label>
                <div style="display:flex;gap:16px;margin-top:6px;">
                    <label class="toggle-transparent-row" style="gap:6px;font-size:13px;">
                        <input type="radio" name="text-color-mode" id="tc-auto" checked /> Otomatis
                    </label>
                    <label class="toggle-transparent-row" style="gap:6px;font-size:13px;">
                        <input type="radio" name="text-color-mode" id="tc-white" /> &#9744; Putih
                    </label>
                    <label class="toggle-transparent-row" style="gap:6px;font-size:13px;">
                        <input type="radio" name="text-color-mode" id="tc-black" /> &#9632; Hitam
                    </label>
                </div>
            </div>
        </div>

        <!-- 3. LOGO -->
        <div class="editor-card">
            <div class="editor-card-title" style="display:flex;justify-content:space-between;align-items:center;">
                <span>&#127991; Logo Header</span>
                <button id="btn-add-logo" type="button">+ Tambah Logo</button>
            </div>
            <div id="logo-upload-grid"></div>
        </div>

        <!-- 4. TANGGAL & INSTANSI -->
        <div class="editor-card">
            <div class="editor-card-title">&#128197; Tanggal &amp; Instansi</div>
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
            <div class="editor-row" style="margin-bottom:0;">
                <div class="editor-section">
                    <label class="editor-label">Instansi Baris 1</label>
                    <input type="text" id="input-instansi1" value="BADAN PENANGGULANGAN BENCANA DAERAH" />
                </div>
                <div class="editor-section">
                    <label class="editor-label">Instansi Baris 2</label>
                    <input type="text" id="input-instansi2" value="KOTA BANJARMASIN" />
                </div>
            </div>
        </div>

        <!-- 5. DATA PASANG SURUT -->
        <div class="editor-card">
            <div class="editor-card-title">&#128202; Data Pasang Surut</div>
            <p class="card-hint">Pilih bulan &rarr; klik <b>Analisis</b> &rarr; pilih Phase 1 atau Phase 2.</p>
            <div class="editor-row" style="align-items:flex-end;gap:8px;">
                <div class="editor-section" style="flex:2;">
                    <label class="editor-label">Bulan</label>
                    <select id="db-bulan">
                        <option>Januari</option><option>Februari</option><option>Maret</option>
                        <option>April</option><option>Mei</option><option>Juni</option>
                        <option>Juli</option><option>Agustus</option><option>September</option>
                        <option>Oktober</option><option>November</option><option>Desember</option>
                    </select>
                </div>
                <div class="editor-section editor-section-sm">
                    <label class="editor-label">Tahun</label>
                    <input type="number" id="db-tahun" min="2024" max="2099" value="2026" />
                </div>
                <div class="editor-section editor-section-sm">
                    <label class="editor-label">&nbsp;</label>
                    <button id="btn-analisis">&#128269; Analisis</button>
                </div>
            </div>

            <div id="phase-result-wrap" style="display:none;margin-top:12px;">
                <div id="phase-info" class="phase-info-box"></div>
                <div class="phase-btn-row">
                    <button id="btn-phase1" class="phase-btn phase-btn-active">&#127765; Phase 1 — Purnama</button>
                    <button id="btn-phase2" class="phase-btn">&#127761; Phase 2 — Bulan Baru</button>
                </div>
            </div>

            <div id="jam-override-wrap" style="display:none;margin-top:10px;">
                <label class="editor-label" style="margin-bottom:6px;display:block;">&#9998; Override Jam Puncak</label>
                <div id="jam-override-list"></div>
            </div>
            <div id="db-status" class="db-status-msg"></div>
        </div>

        <!-- 6. KONTEN -->
        <div class="editor-card">
            <div class="editor-card-title">&#128221; Konten Poster</div>
            <div class="editor-row" style="margin-bottom:0;">
                <div class="editor-section">
                    <label class="editor-label">Kotak Keterangan</label>
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
        </div>

        <!-- 7. TRANSPARANSI -->
        <div class="editor-card">
            <div class="editor-card-title">&#9639; Transparansi Elemen</div>
            <div class="transp-row">
                <div class="transp-col">
                    <div class="transp-col-title">Status &amp; Tanggal</div>
                    <label class="toggle-transparent-row">
                        <input type="checkbox" id="chk-header-transparent" /><span>Header &amp; Periode</span>
                    </label>
                </div>
                <div class="transp-divider"></div>
                <div class="transp-col">
                    <div class="transp-col-title">Prakiraan Pasang</div>
                    <label class="toggle-transparent-row">
                        <input type="checkbox" id="chk-tabel-all-transparent" /><span>Seluruh Tabel</span>
                    </label>
                    <label class="toggle-transparent-row">
                        <input type="checkbox" id="chk-tabel-header-transparent" /><span>Header Tabel</span>
                    </label>
                    <label class="toggle-transparent-row">
                        <input type="checkbox" id="chk-tabel-transparent" /><span>Baris Tabel</span>
                    </label>
                </div>
                <div class="transp-divider"></div>
                <div class="transp-col">
                    <div class="transp-col-title">Keterangan</div>
                    <label class="toggle-transparent-row">
                        <input type="checkbox" id="chk-info-transparent" /><span>Penjelasan</span>
                    </label>
                </div>
                <div class="transp-divider"></div>
                <div class="transp-col">
                    <div class="transp-col-title">Himbauan</div>
                    <label class="toggle-transparent-row">
                        <input type="checkbox" id="chk-imbauan-transparent" /><span>Imbauan Warga</span>
                    </label>
                </div>
            </div>
        </div>

        <button id="btn-download">&#8595; Download PNG (1080&#215;1350)</button>
    </div>

    <!-- POSTER -->
    <div id="poster-stage">
        <div id="poster">
            <img id="poster-bg" src="" alt="" />
            <div id="poster-overlay"></div>
            <div id="poster-inner">
                <div id="poster-logo-row"><div id="logo-pill"></div></div>
                <div id="poster-instansi">
                    <p id="instansi-line1">BADAN PENANGGULANGAN BENCANA DAERAH</p>
                    <p id="instansi-line2">KOTA BANJARMASIN</p>
                </div>
                <div id="poster-header">
                    <h1 id="header-line1">STATUS</h1>
                    <h1 id="header-line2">AIR PASANG ROB</h1>
                </div>
                <div id="poster-periode-wrap">
                    <div id="poster-periode"><span id="text-periode">Memuat data...</span></div>
                </div>
                <div id="poster-table-wrapper">
                    <table id="poster-table">
                        <thead><tr><th>Hari</th><th>Pasang Maks (m)</th><th>Jam Puncak</th></tr></thead>
                        <tbody id="table-body"></tbody>
                    </table>
                </div>
                <div id="poster-info-box"><p id="text-informasi"></p></div>
                <div id="poster-imbauan-box">
                    <div id="imbauan-header">IMBAUAN KEPADA MASYARAKAT</div>
                    <ul id="imbauan-list"></ul>
                </div>
            </div>
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
            <div id="poster-sosmed">
                <span class="sosmed-item">bpbd_kota_banjarmasin</span>
                <span class="sosmed-sep">|</span>
                <span class="sosmed-item">bpbd banjarmasin</span>
                <span class="sosmed-sep">|</span>
                <span class="sosmed-item">0851-8689-1117</span>
                <span class="sosmed-sep">|</span>
                <span class="sosmed-item">bpbdk.bjm3@gmail.com</span>
                <span class="sosmed-sep">|</span>
                <span class="sosmed-item">www.bpbdbanjarmasin.kota.co.id</span>
            </div>
        </div>
    </div>

</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" crossorigin="anonymous"></script>
<script src="{{ asset('js/pasangview.js') }}?v={{ time() }}"></script>
</body>
</html>
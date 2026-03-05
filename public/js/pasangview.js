'use strict';

document.addEventListener('DOMContentLoaded', function () {

    var POSTER_W = 1080;
    var POSTER_H = 1350;

    var poster            = document.getElementById('poster');
    var posterStage       = document.getElementById('poster-stage');
    var overlay           = document.getElementById('poster-overlay');
    var textPeriode       = document.getElementById('text-periode');
    var tableBody         = document.getElementById('table-body');
    var textInformasi     = document.getElementById('text-informasi');
    var imbauanList       = document.getElementById('imbauan-list');
    var inputBg           = document.getElementById('input-bg');
    var sliderOpacity     = document.getElementById('slider-opacity');
    var opacityValue      = document.getElementById('opacity-value');
    var inputOverlayColor = document.getElementById('input-overlay-color');
    var textareaInfo      = document.getElementById('textarea-informasi');
    var textareaImbauan   = document.getElementById('textarea-imbauan');
    var btnDownload       = document.getElementById('btn-download');
    var inputDateStart    = document.getElementById('input-date-start');
    var inputDateEnd      = document.getElementById('input-date-end');
    var btnApplyDates     = document.getElementById('btn-apply-dates');
    var inputInstansi1    = document.getElementById('input-instansi1');
    var inputInstansi2    = document.getElementById('input-instansi2');
    var colorAksen        = document.getElementById('color-aksen');
    var colorPeriodeEl    = document.getElementById('color-periode');
    var colorTabel        = document.getElementById('color-tabel');
    var logoUploadGrid    = document.getElementById('logo-upload-grid');
    var btnAddLogo        = document.getElementById('btn-add-logo');

    var logoSlots = [
        { src: '/images/logo1.png', transparent: true  },
        { src: '/images/logo2.png', transparent: false },
        { src: '/images/logo3.png', transparent: false },
    ];

    var HARI_ID  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    var BULAN_ID = ['Januari','Februari','Maret','April','Mei','Juni',
                    'Juli','Agustus','September','Oktober','November','Desember'];
    var apiData  = [];

    /* ====================================================
       SCALE PREVIEW
       ==================================================== */
    function applyScale() {
        var maxW  = Math.min(window.innerWidth - 32, 700);
        var scale = maxW / POSTER_W;
        posterStage.style.width  = maxW + 'px';
        posterStage.style.height = Math.round(POSTER_H * scale) + 'px';
        poster.style.transform   = 'scale(' + scale + ')';
    }
    applyScale();
    window.addEventListener('resize', applyScale);

    /* ====================================================
       DATE UTILITIES
       ==================================================== */
    function formatTanggal(d) {
        return HARI_ID[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN_ID[d.getMonth()] + ' ' + d.getFullYear();
    }
    function formatPeriode(s, e) {
        if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear())
            return s.getDate() + ' - ' + e.getDate() + ' ' + BULAN_ID[e.getMonth()] + ' ' + e.getFullYear();
        return s.getDate() + ' ' + BULAN_ID[s.getMonth()] + ' - ' + e.getDate() + ' ' + BULAN_ID[e.getMonth()] + ' ' + e.getFullYear();
    }
    function getDateRange(s, e) {
        var dates = [], cur = new Date(s); cur.setHours(0,0,0,0);
        var fin = new Date(e); fin.setHours(0,0,0,0);
        while (cur <= fin) { dates.push(new Date(cur)); cur.setDate(cur.getDate()+1); }
        return dates;
    }
    function parseLocalDate(str) {
        var p = str.split('-');
        return new Date(+p[0], +p[1]-1, +p[2]);
    }

    /* ====================================================
       API
       ==================================================== */
    async function loadData() {
        try {
            var res  = await fetch('/api/pasang-air');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            var json = await res.json();
            apiData  = json.data;
            if (!inputDateStart.value && !inputDateEnd.value) {
                textPeriode.textContent = json.periode;
                renderTableFromApiData(json.data);
            } else {
                renderFromDates();
            }
        } catch(e) { textPeriode.textContent = 'Gagal memuat data'; console.error(e); }
    }

    function renderTableFromApiData(rows) {
        while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);
        if (!rows || !rows.length) return;
        var mx = Math.max.apply(null, rows.map(function(r){ return r.pasang; }));
        rows.forEach(function(row) {
            var tr = document.createElement('tr');
            if (row.pasang === mx) tr.classList.add('row-peak');
            ['hari','pasang','jam'].forEach(function(k, i) {
                var td = document.createElement('td');
                td.textContent = i===1 ? row.pasang.toFixed(1) : row[k];
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
        scheduleCompress();
    }

    function renderFromDates() {
        if (!inputDateStart.value || !inputDateEnd.value) return;
        var start = parseLocalDate(inputDateStart.value);
        var end   = parseLocalDate(inputDateEnd.value);
        if (start > end) { alert('Tanggal mulai tidak boleh melebihi tanggal selesai.'); return; }
        textPeriode.textContent = formatPeriode(start, end);
        while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);
        if (!apiData.length) return;
        var dates  = getDateRange(start, end);
        var mx     = Math.max.apply(null, apiData.map(function(r){ return r.pasang; }));
        dates.forEach(function(date, idx) {
            var row = apiData[idx % apiData.length];
            var tr  = document.createElement('tr');
            if (row.pasang === mx) tr.classList.add('row-peak');
            var td1 = document.createElement('td'); td1.textContent = formatTanggal(date);
            var td2 = document.createElement('td'); td2.textContent = row.pasang.toFixed(1);
            var td3 = document.createElement('td'); td3.textContent = row.jam;
            tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
            tableBody.appendChild(tr);
        });
        scheduleCompress();
    }

    /* ====================================================
       AUTO-COMPRESS
       ==================================================== */
    var compressTimer = null;

    function autoCompress() {
        var inner  = document.getElementById('poster-inner');
        var footer = document.getElementById('poster-footer');
        var sosmed = document.getElementById('poster-sosmed');
        if (!inner) return;

        inner.style.transition   = 'none';
        inner.style.transform    = 'scale(1)';
        inner.style.marginBottom = '0';
        inner.style.flex         = 'none';

        var prevT = poster.style.transform;
        poster.style.transform = 'scale(1)';

        requestAnimationFrame(function(){ requestAnimationFrame(function(){
            var available = POSTER_H - (footer ? footer.offsetHeight : 0) - (sosmed ? sosmed.offsetHeight : 0);
            var contentH  = inner.offsetHeight;

            inner.style.flex       = '1';
            inner.style.transition = 'transform 0.3s ease';
            poster.style.transform = prevT;

            if (contentH <= available) return;
            var scale = Math.max(available / contentH, 0.50);
            inner.style.flex            = 'none';
            inner.style.transform       = 'scale(' + scale + ')';
            inner.style.transformOrigin = 'top center';
            inner.style.marginBottom    = '-' + Math.round(contentH * (1-scale)) + 'px';
        }); });
    }

    function scheduleCompress() {
        clearTimeout(compressTimer);
        compressTimer = setTimeout(autoCompress, 150);
    }

    /* ====================================================
       IMBAUAN
       ==================================================== */
    function renderImbauan(text) {
        while (imbauanList.firstChild) imbauanList.removeChild(imbauanList.firstChild);
        text.split('\n').map(function(l){ return l.trim(); }).filter(Boolean).forEach(function(line) {
            var li = document.createElement('li'); li.textContent = line; imbauanList.appendChild(li);
        });
        scheduleCompress();
    }

    /* ====================================================
       OVERLAY
       ==================================================== */
    function hexToRgb(hex) {
        return parseInt(hex.slice(1,3),16)+','+parseInt(hex.slice(3,5),16)+','+parseInt(hex.slice(5,7),16);
    }
    function updateOverlay() {
        var v = Math.min(1, Math.max(0, parseFloat(sliderOpacity.value)));
        overlay.style.background  = 'rgba(' + hexToRgb(inputOverlayColor.value) + ',' + v + ')';
        opacityValue.textContent  = v.toFixed(2);
    }

    /* ====================================================
       COLOR PICKERS — Aksen + Periode
       ==================================================== */
    function isDark(hex) {
        var r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
        return (r*0.299 + g*0.587 + b*0.114) < 128;
    }
    function applyColors() {
        var aksen = colorAksen.value;
        var per   = colorPeriodeEl.value;
        var tbl   = colorTabel.value;

        var header = document.getElementById('poster-header');
        if (header) header.style.background = aksen;

        var periodeBox = document.getElementById('poster-periode');
        if (periodeBox) periodeBox.style.background = per;
        var tPer = document.getElementById('text-periode');
        if (tPer) tPer.style.color = isDark(per) ? '#fff' : '#0D1B2A';

        var infoBox = document.getElementById('poster-info-box');
        if (infoBox) infoBox.style.borderColor = aksen;

        var imbauanBox = document.getElementById('poster-imbauan-box');
        if (imbauanBox) imbauanBox.style.borderColor = aksen;
        var imbauanHdr = document.getElementById('imbauan-header');
        if (imbauanHdr) imbauanHdr.style.background = aksen;

        /* Header tabel + footer */
        document.querySelectorAll('#poster-table thead tr').forEach(function(tr){
            tr.style.background = tbl;
        });
        var footer = document.getElementById('poster-footer');
        if (footer) footer.style.background = tbl;
        var sosmed = document.getElementById('poster-sosmed');
        if (sosmed) sosmed.style.background = tbl;
    }
    colorAksen.addEventListener('input', applyColors);
    colorPeriodeEl.addEventListener('input', applyColors);
    colorTabel.addEventListener('input', applyColors);

    /* ====================================================
       LOGO DINAMIS
       ==================================================== */
    function renderLogoRow() {
        var pill    = document.getElementById('logo-pill');
        var logoRow = document.getElementById('poster-logo-row');
        if (!pill) return;
        while (pill.firstChild) pill.removeChild(pill.firstChild);

        var visible = logoSlots.filter(function(s){ return s.src; });
        logoRow.style.display = visible.length ? 'flex' : 'none';

        visible.forEach(function(slot) {
            var wrap = document.createElement('div');
            wrap.className = 'poster-logo-item' + (slot.transparent ? ' logo-transparent' : '');
            var img = document.createElement('img');
            img.src     = slot.src;
            img.onerror = function(){ wrap.style.display='none'; scheduleCompress(); };
            img.onload  = function(){ scheduleCompress(); };
            wrap.appendChild(img);
            pill.appendChild(wrap);
        });
        scheduleCompress();
    }

    function renderLogoGrid() {
        while (logoUploadGrid.firstChild) logoUploadGrid.removeChild(logoUploadGrid.firstChild);
        logoSlots.forEach(function(slot, idx) {
            var slotEl = document.createElement('div');
            slotEl.className = 'logo-upload-slot';

            var btnRemove = document.createElement('button');
            btnRemove.className   = 'logo-slot-remove';
            btnRemove.textContent = '×';
            btnRemove.onclick = (function(i){ return function() {
                logoSlots.splice(i, 1); renderLogoGrid(); renderLogoRow();
            }; })(idx);

            var preview = document.createElement('div');
            preview.className = 'logo-slot-preview' + (slot.transparent ? ' transparent-slot' : '');
            if (slot.src) {
                var img = document.createElement('img');
                img.src     = slot.src;
                img.onerror = function(){ preview.innerHTML='<div class="logo-slot-placeholder">Gagal<br/>load</div>'; };
                preview.appendChild(img);
            } else {
                preview.innerHTML = '<div class="logo-slot-placeholder">Klik<br/>upload</div>';
            }

            var label = document.createElement('div');
            label.className   = 'logo-slot-label';
            label.textContent = 'Logo ' + (idx+1);

            var input = document.createElement('input');
            input.type      = 'file';
            input.accept    = 'image/*';
            input.className = 'logo-slot-input';
            input.addEventListener('change', (function(i){ return function(e) {
                var file = e.target.files[0];
                if (!file || !file.type.startsWith('image/')) return;
                var reader = new FileReader();
                reader.onload = function(ev) {
                    logoSlots[i].src = ev.target.result;
                    renderLogoGrid(); renderLogoRow();
                };
                reader.readAsDataURL(file);
            }; })(idx));

            /* Toggle bulat / transparan */
            var toggleWrap = document.createElement('label');
            toggleWrap.className = 'logo-slot-toggle';
            toggleWrap.title = 'Aktifkan untuk logo berbentuk tameng/perisai (tidak dipotong bulat)';
            var toggleChk = document.createElement('input');
            toggleChk.type    = 'checkbox';
            toggleChk.checked = slot.transparent;
            toggleChk.addEventListener('change', (function(i){ return function() {
                logoSlots[i].transparent = this.checked;
                renderLogoGrid(); renderLogoRow();
            }; })(idx));
            var toggleSpan = document.createElement('span');
            toggleSpan.textContent = slot.transparent ? '▣ Transparan' : '● Bulat';
            toggleWrap.appendChild(toggleChk);
            toggleWrap.appendChild(toggleSpan);

            slotEl.appendChild(btnRemove);
            slotEl.appendChild(preview);
            slotEl.appendChild(label);
            slotEl.appendChild(input);
            slotEl.appendChild(toggleWrap);
            logoUploadGrid.appendChild(slotEl);
        });
    }

    btnAddLogo.addEventListener('click', function() {
        logoSlots.push({ src: null, transparent: false });
        renderLogoGrid();
    });

    /* ====================================================
       EXPORT PNG
       ==================================================== */
    btnDownload.addEventListener('click', async function() {
        btnDownload.textContent = 'Memproses...';
        btnDownload.disabled    = true;

        var inner   = document.getElementById('poster-inner');
        var prevT   = poster.style.transform;
        var prevW   = posterStage.style.width;
        var prevH   = posterStage.style.height;
        var prevOv  = posterStage.style.overflow;
        var prevIT  = inner ? inner.style.transform   : '';
        var prevIMB = inner ? inner.style.marginBottom : '';
        var prevFl  = inner ? inner.style.flex         : '';

        try {
            if (inner) { inner.style.transform='scale(1)'; inner.style.marginBottom='0'; inner.style.flex='1'; }
            poster.style.transform     = 'scale(1)';
            posterStage.style.width    = POSTER_W + 'px';
            posterStage.style.height   = POSTER_H + 'px';
            posterStage.style.overflow = 'visible';
            await new Promise(function(r){ setTimeout(r, 120); });

            var canvas = await html2canvas(poster, {
                width: POSTER_W, height: POSTER_H, scale: 1, useCORS: true, allowTaint: true, logging: false
            });
            var link = document.createElement('a');
            link.download = 'pasangview.png';
            link.href     = canvas.toDataURL('image/png');
            link.click();
        } catch(err) { console.error(err); alert('Gagal export. Coba lagi.'); }
        finally {
            if (inner) { inner.style.transform=prevIT; inner.style.marginBottom=prevIMB; inner.style.flex=prevFl; }
            poster.style.transform     = prevT;
            posterStage.style.width    = prevW;
            posterStage.style.height   = prevH;
            posterStage.style.overflow = prevOv;
            btnDownload.textContent    = '⬇ Download PNG (1080×1350)';
            btnDownload.disabled       = false;
        }
    });

    /* ====================================================
       INIT
       ==================================================== */
    applyScale();
    loadData();
    renderLogoGrid();
    renderLogoRow();
    updateOverlay();

    setTimeout(function() {
        renderImbauan(textareaImbauan.value);
        textInformasi.textContent = textareaInfo.value;
        scheduleCompress();
    }, 200);

    (function() {
        var today = new Date(), end = new Date(today);
        end.setDate(today.getDate() + 3);
        function pad(n){ return n<10?'0'+n:''+n; }
        function fmt(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
        inputDateStart.value = fmt(today);
        inputDateEnd.value   = fmt(end);
    })();

    btnApplyDates.addEventListener('click', renderFromDates);
    sliderOpacity.addEventListener('input', updateOverlay);
    inputOverlayColor.addEventListener('input', updateOverlay);

    inputBg.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        var r = new FileReader();
        r.onload = function(ev) {
            poster.style.backgroundImage    = "url('" + ev.target.result + "')";
            poster.style.backgroundSize     = 'cover';
            poster.style.backgroundPosition = 'center';
        };
        r.readAsDataURL(file);
    });

    textareaInfo.addEventListener('input', function() { textInformasi.textContent = this.value; scheduleCompress(); });
    textareaImbauan.addEventListener('input', function() { renderImbauan(this.value); });
    inputInstansi1.addEventListener('input', function() { document.getElementById('instansi-line1').textContent = this.value; scheduleCompress(); });
    inputInstansi2.addEventListener('input', function() { document.getElementById('instansi-line2').textContent = this.value; scheduleCompress(); });

});
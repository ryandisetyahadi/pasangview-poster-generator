'use strict';

document.addEventListener('DOMContentLoaded', function () {

    var POSTER_W = 1080;
    var POSTER_H = 1350;

    var poster           = document.getElementById('poster');
    var posterBg         = document.getElementById('poster-bg');
    var posterStage      = document.getElementById('poster-stage');
    var overlay          = document.getElementById('poster-overlay');
    var textPeriode      = document.getElementById('text-periode');
    var tableBody        = document.getElementById('table-body');
    var textInformasi    = document.getElementById('text-informasi');
    var imbauanList      = document.getElementById('imbauan-list');
    var inputBg          = document.getElementById('input-bg');
    var sliderOpacity    = document.getElementById('slider-opacity');
    var opacityValue     = document.getElementById('opacity-value');
    var overlayColor1    = document.getElementById('overlay-color1');
    var overlayColor2    = document.getElementById('overlay-color2');
    var overlayDirection = document.getElementById('overlay-direction');
    var gradientPreview  = document.getElementById('gradient-preview');
    var textareaInfo     = document.getElementById('textarea-informasi');
    var textareaImbauan  = document.getElementById('textarea-imbauan');
    var btnDownload      = document.getElementById('btn-download');
    var inputDateStart   = document.getElementById('input-date-start');
    var inputDateEnd     = document.getElementById('input-date-end');
    var btnApplyDates    = document.getElementById('btn-apply-dates');
    var inputInstansi1   = document.getElementById('input-instansi1');
    var inputInstansi2   = document.getElementById('input-instansi2');
    var colorAksen       = document.getElementById('color-aksen');
    var colorPeriodeEl   = document.getElementById('color-periode');
    var colorTabel       = document.getElementById('color-tabel');
    var logoUploadGrid   = document.getElementById('logo-upload-grid');
    var btnAddLogo       = document.getElementById('btn-add-logo');

    /* Transparan */
    var chkHeaderTransp      = document.getElementById('chk-header-transparent');
    var chkTabelAllTransp    = document.getElementById('chk-tabel-all-transparent');
    var chkTabelHeaderTransp = document.getElementById('chk-tabel-header-transparent');
    var chkTabelTransp       = document.getElementById('chk-tabel-transparent');
    var chkInfoTransp        = document.getElementById('chk-info-transparent');
    var chkImbauanTransp     = document.getElementById('chk-imbauan-transparent');

    /* Warna teks umum — default hitam karena kotak-kotak poster berlatar putih */
    var globalTextColor = '#111111';

    function getAutoTextColor(){
        /* Hitung warna efektif: overlay di atas bg #5c8fa8 */
        var c1=overlayColor1.value, c2=overlayColor2.value;
        var op=parseFloat(sliderOpacity.value);
        /* Rata-rata dua warna overlay */
        var or=(parseInt(c1.slice(1,3),16)+parseInt(c2.slice(1,3),16))/2;
        var og=(parseInt(c1.slice(3,5),16)+parseInt(c2.slice(3,5),16))/2;
        var ob=(parseInt(c1.slice(5,7),16)+parseInt(c2.slice(5,7),16))/2;
        /* Campurkan dengan #5c8fa8 (92,143,168) berdasarkan opacity overlay */
        var er=or*op+92*(1-op);
        var eg=og*op+143*(1-op);
        var eb=ob*op+168*(1-op);
        var lum=er*0.299+eg*0.587+eb*0.114;
        /* Jika bg terang → teks hitam, jika gelap → teks putih */
        return lum>160 ? '#111111' : '#ffffff';
    }

    function resolveTextColor(){
        var tcAuto  = document.getElementById('tc-auto');
        var tcWhite = document.getElementById('tc-white');
        var tcBlack = document.getElementById('tc-black');
        if(tcWhite && tcWhite.checked) return '#ffffff';
        if(tcBlack && tcBlack.checked) return '#111111';
        return getAutoTextColor();
    }

    /* Pasang event ke radio */
    setTimeout(function(){
        ['tc-auto','tc-white','tc-black'].forEach(function(id){
            var el=document.getElementById(id);
            if(el) el.addEventListener('change', function(){
                globalTextColor = resolveTextColor();
                applyGlobalTextColor();
            });
        });
    }, 200);

    var logoSlots = [
        { src: '/images/logo1.png', transparent: true  },
        { src: '/images/logo2.png', transparent: false },
        { src: '/images/logo3.png', transparent: false },
    ];

    var HARI_ID  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    var BULAN_ID = ['Januari','Februari','Maret','April','Mei','Juni',
                    'Juli','Agustus','September','Oktober','November','Desember'];
    var apiData        = [];
    var exportBgDataUrl= null;
    var compressTimer  = null;

    /* ====================================================
       SCALE PREVIEW
       ==================================================== */
    function applyScale(){
        var maxW  = Math.min(window.innerWidth-32, 700);
        var scale = maxW / POSTER_W;
        posterStage.style.width        = maxW+'px';
        posterStage.style.height       = Math.round(POSTER_H*scale)+'px';
        poster.style.transform         = 'scale('+scale+')';
        poster.style.transformOrigin   = 'top left';
    }
    applyScale();
    window.addEventListener('resize', applyScale);

    /* ====================================================
       HELPERS
       ==================================================== */
    function isDark(hex){
        var r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
        return (r*0.299+g*0.587+b*0.114)<128;
    }
    function hexToRgba(hex,a){
        var r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
        return 'rgba('+r+','+g+','+b+','+a+')';
    }
    function fmt2(n){ return n<10?'0'+n:''+n; }
    function fmtDate(d){ return d.getFullYear()+'-'+fmt2(d.getMonth()+1)+'-'+fmt2(d.getDate()); }
    function formatTanggal(d){
        return HARI_ID[d.getDay()]+', '+d.getDate()+' '+BULAN_ID[d.getMonth()]+' '+d.getFullYear();
    }
    function formatPeriode(s,e){
        if(s.getMonth()===e.getMonth()&&s.getFullYear()===e.getFullYear())
            return s.getDate()+' - '+e.getDate()+' '+BULAN_ID[e.getMonth()]+' '+e.getFullYear();
        return s.getDate()+' '+BULAN_ID[s.getMonth()]+' - '+e.getDate()+' '+BULAN_ID[e.getMonth()]+' '+e.getFullYear();
    }
    function getDateRange(s,e){
        var dates=[],cur=new Date(s); cur.setHours(0,0,0,0);
        var fin=new Date(e); fin.setHours(0,0,0,0);
        while(cur<=fin){dates.push(new Date(cur));cur.setDate(cur.getDate()+1);}
        return dates;
    }
    function parseLocalDate(str){ var p=str.split('-'); return new Date(+p[0],+p[1]-1,+p[2]); }

    /* ====================================================
       OVERLAY GRADASI
       ==================================================== */
    function updateOverlay(){
        var v  = Math.min(1,Math.max(0,parseFloat(sliderOpacity.value)));
        var c1 = overlayColor1.value, c2=overlayColor2.value, dir=overlayDirection.value;
        overlay.style.background = 'linear-gradient('+dir+','+hexToRgba(c1,v)+','+hexToRgba(c2,v)+')';
        opacityValue.textContent = v.toFixed(2);
        gradientPreview.style.background = 'linear-gradient('+dir+','+c1+','+c2+')';
    }

    /* ====================================================
       WARNA TEKS — terpusat, semua elemen ikut globalTextColor
       ==================================================== */
    function applyGlobalTextColor(){
        /* CSS handles defaults (black) and transparent states (white).
           JS only overrides when user explicitly picks white/black via radio. */
        var tcAuto  = document.getElementById('tc-auto');
        if(tcAuto && tcAuto.checked) return; /* let CSS do it */
        var tc = globalTextColor;
        ['instansi-line1','instansi-line2'].forEach(function(id){
            var el=document.getElementById(id);
            if(el) el.style.setProperty('color', tc, 'important');
        });
        document.querySelectorAll('#poster-table tbody td').forEach(function(td){
            td.style.setProperty('color', tc, 'important');
        });
        if(textInformasi) textInformasi.style.setProperty('color', tc, 'important');
        document.querySelectorAll('#imbauan-list li').forEach(function(li){
            li.style.setProperty('color', tc, 'important');
        });
    }

    /* ====================================================
       COLOR PICKERS — aksen/periode/tabel punya warna sendiri
       ==================================================== */
    function applyColors(){
        var aksen = colorAksen.value;
        var per   = colorPeriodeEl.value;
        var tbl   = colorTabel.value;

        /* Header */
        var hEl=document.getElementById('poster-header');
        if(hEl) hEl.style.background=aksen;
        var hc=isDark(aksen)?'#fff':'#111';
        ['header-line1','header-line2'].forEach(function(id){
            var el=document.getElementById(id); if(el) el.style.color=hc;
        });

        /* Periode */
        var pEl=document.getElementById('poster-periode');
        if(pEl) pEl.style.background=per;
        var tPer=document.getElementById('text-periode');
        if(tPer) tPer.style.color=isDark(per)?'#fff':'#111';

        /* Info border */
        var iEl=document.getElementById('poster-info-box');
        if(iEl) iEl.style.borderColor=aksen;

        /* Imbauan */
        var ibEl=document.getElementById('poster-imbauan-box');
        if(ibEl) ibEl.style.borderColor=aksen;
        var ihEl=document.getElementById('imbauan-header');
        if(ihEl){ ihEl.style.background=aksen; ihEl.style.color=isDark(aksen)?'#fff':'#111'; }

        /* Tabel header */
        document.querySelectorAll('#poster-table thead tr').forEach(function(tr){ tr.style.background=tbl; });
        document.querySelectorAll('#poster-table thead th').forEach(function(th){
            th.style.color=isDark(tbl)?'#fff':'#111';
        });

        /* Footer + sosmed */
        var fEl=document.getElementById('poster-footer'); if(fEl) fEl.style.background=tbl;
        var sEl=document.getElementById('poster-sosmed'); if(sEl) sEl.style.background=tbl;

        /* Teks body pakai globalTextColor */
        applyGlobalTextColor();
    }

    colorAksen.addEventListener('input', applyColors);
    colorPeriodeEl.addEventListener('input', applyColors);
    colorTabel.addEventListener('input', applyColors);

    /* ====================================================
       TRANSPARAN
       ==================================================== */
    function applyTransparent(){
        var hEl =document.getElementById('poster-header');
        var pEl =document.getElementById('poster-periode');
        var twEl=document.getElementById('poster-table-wrapper');
        var iEl =document.getElementById('poster-info-box');
        var ibEl=document.getElementById('poster-imbauan-box');
        if(hEl)  hEl.classList.toggle('is-transparent', chkHeaderTransp.checked);
        if(pEl)  pEl.classList.toggle('is-transparent',  chkHeaderTransp.checked);
        var all=chkTabelAllTransp.checked;
        if(twEl){
            twEl.classList.toggle('is-transparent-header', chkTabelHeaderTransp.checked||all);
            twEl.classList.toggle('is-transparent',        chkTabelTransp.checked||all);
        }
        if(iEl)  iEl.classList.toggle('is-transparent',  chkInfoTransp.checked);
        if(ibEl){
            ibEl.classList.toggle('is-transparent',        chkImbauanTransp.checked);
            ibEl.classList.toggle('is-transparent-header', chkImbauanTransp.checked);
        }
    }
    [chkHeaderTransp,chkTabelAllTransp,chkTabelHeaderTransp,chkTabelTransp,
     chkInfoTransp,chkImbauanTransp].forEach(function(c){ c.addEventListener('change',applyTransparent); });

    /* ====================================================
       TABEL RENDER
       ==================================================== */
    function buildRow(c1,c2,c3,peak,isPuncak2){
        var tr=document.createElement('tr');
        if(peak) tr.classList.add('row-peak');
        if(isPuncak2) tr.classList.add('row-puncak2');
        [c1,c2,c3].forEach(function(t){
            var td=document.createElement('td'); td.textContent=t; tr.appendChild(td);
        });
        return tr;
    }
    function renderTableFromApiData(rows){
        while(tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);
        if(!rows||!rows.length) return;
        var mx=Math.max.apply(null,rows.map(function(r){return r.pasang;}));
        rows.forEach(function(row){
            var isPuncak2 = row.puncak_ke === 2;
            tableBody.appendChild(buildRow(row.hari,row.pasang.toFixed(1),row.jam,row.pasang===mx,isPuncak2));
        });
        applyGlobalTextColor(); scheduleCompress();
    }
    function renderFromDates(){
        if(!inputDateStart.value||!inputDateEnd.value) return;
        var start=parseLocalDate(inputDateStart.value), end=parseLocalDate(inputDateEnd.value);
        if(start>end){alert('Tanggal mulai tidak boleh melebihi tanggal selesai.');return;}
        textPeriode.textContent=formatPeriode(start,end);
        while(tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);
        if(!apiData.length) return;
        var dates=getDateRange(start,end);
        var mx=Math.max.apply(null,apiData.map(function(r){return r.pasang;}));
        dates.forEach(function(date,idx){
            var row=apiData[idx%apiData.length];
            tableBody.appendChild(buildRow(formatTanggal(date),row.pasang.toFixed(1),row.jam,row.pasang===mx));
        });
        applyGlobalTextColor(); scheduleCompress();
    }

    /* ====================================================
       API
       ==================================================== */
    async function loadData(bulan, tglStart, tglEnd){
        try{
            // Jika dipanggil tanpa parameter, pakai tanggal hari ini s/d +3 hari
            if(!bulan){
                var today = new Date();
                var BULAN_ID_LIST = ['Januari','Februari','Maret','April','Mei','Juni',
                                     'Juli','Agustus','September','Oktober','November','Desember'];
                bulan    = BULAN_ID_LIST[today.getMonth()];
                tglStart = today.getDate();
                tglEnd   = Math.min(tglStart + 3, new Date(today.getFullYear(), today.getMonth()+1, 0).getDate());
            }

            var url = '/api/pasang-air?bulan='+encodeURIComponent(bulan)
                    + '&tgl_start='+tglStart
                    + '&tgl_end='+tglEnd;

            var res  = await fetch(url);
            var json = await res.json();

            if(!json.success){
                textPeriode.textContent = json.message || 'Data tidak ditemukan';
                return;
            }

            textPeriode.textContent = json.periode;
            renderTableFromApiData(json.data);
        }catch(e){
            textPeriode.textContent='Gagal memuat data';
            console.error(e);
        }
    }

    /* ====================================================
       IMBAUAN
       ==================================================== */
    function renderImbauan(text){
        while(imbauanList.firstChild) imbauanList.removeChild(imbauanList.firstChild);
        text.split('\n').map(function(l){return l.trim();}).filter(Boolean).forEach(function(line){
            var li=document.createElement('li'); li.textContent=line; imbauanList.appendChild(li);
        });
        applyGlobalTextColor(); scheduleCompress();
    }

    /* ====================================================
       AUTO-COMPRESS (hanya untuk preview)
       ==================================================== */
    function getInner(){ return document.getElementById('poster-inner'); }
    function autoCompress(){
        var inner =getInner();
        var footer=document.getElementById('poster-footer');
        var sosmed=document.getElementById('poster-sosmed');
        if(!inner) return;
        inner.style.transition='none'; inner.style.transform='scale(1)';
        inner.style.marginBottom='0';  inner.style.flex='none';
        var prevT=poster.style.transform, prevO=poster.style.transformOrigin;
        poster.style.transform='scale(1)';
        requestAnimationFrame(function(){ requestAnimationFrame(function(){
            var avail=POSTER_H-(footer?footer.offsetHeight:0)-(sosmed?sosmed.offsetHeight:0);
            var ch=inner.offsetHeight;
            inner.style.flex='1'; inner.style.transition='transform 0.3s ease';
            poster.style.transform=prevT; poster.style.transformOrigin=prevO;
            if(ch<=avail) return;
            var sc=Math.max(avail/ch,0.50);
            inner.style.flex='none'; inner.style.transform='scale('+sc+')';
            inner.style.transformOrigin='top center';
            inner.style.marginBottom='-'+Math.round(ch*(1-sc))+'px';
        }); });
    }
    function scheduleCompress(){ clearTimeout(compressTimer); compressTimer=setTimeout(autoCompress,150); }

    /* ====================================================
       LOGO
       ==================================================== */
    function renderLogoRow(){
        var pill=document.getElementById('logo-pill');
        var logoRow=document.getElementById('poster-logo-row');
        if(!pill) return;
        while(pill.firstChild) pill.removeChild(pill.firstChild);
        var vis=logoSlots.filter(function(s){return s.src;});
        logoRow.style.display=vis.length?'flex':'none';
        vis.forEach(function(slot){
            var wrap=document.createElement('div');
            wrap.className='poster-logo-item'+(slot.transparent?' logo-transparent':'');
            var img=document.createElement('img'); img.src=slot.src;
            img.onerror=function(){wrap.style.display='none';scheduleCompress();};
            img.onload=function(){scheduleCompress();};
            wrap.appendChild(img); pill.appendChild(wrap);
        });
        scheduleCompress();
    }
    function renderLogoGrid(){
        while(logoUploadGrid.firstChild) logoUploadGrid.removeChild(logoUploadGrid.firstChild);
        logoSlots.forEach(function(slot,idx){
            var slotEl=document.createElement('div'); slotEl.className='logo-upload-slot';
            var btnRm=document.createElement('button'); btnRm.className='logo-slot-remove'; btnRm.textContent='×';
            btnRm.onclick=(function(i){return function(){logoSlots.splice(i,1);renderLogoGrid();renderLogoRow();};})(idx);
            var preview=document.createElement('div');
            preview.className='logo-slot-preview'+(slot.transparent?' transparent-slot':'');
            if(slot.src){
                var img=document.createElement('img'); img.src=slot.src;
                img.onerror=function(){preview.innerHTML='<div class="logo-slot-placeholder">Gagal</div>';};
                preview.appendChild(img);
            } else { preview.innerHTML='<div class="logo-slot-placeholder">Upload</div>'; }
            var lbl=document.createElement('div'); lbl.className='logo-slot-label'; lbl.textContent='Logo '+(idx+1);
            var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.className='logo-slot-input';
            inp.addEventListener('change',(function(i){return function(e){
                var f=e.target.files[0]; if(!f||!f.type.startsWith('image/')) return;
                var r=new FileReader(); r.onload=function(ev){logoSlots[i].src=ev.target.result;renderLogoGrid();renderLogoRow();};
                r.readAsDataURL(f);
            };})(idx));
            var tgl=document.createElement('label'); tgl.className='logo-slot-toggle';
            var tChk=document.createElement('input'); tChk.type='checkbox'; tChk.checked=slot.transparent;
            tChk.addEventListener('change',(function(i){return function(){
                logoSlots[i].transparent=this.checked;renderLogoGrid();renderLogoRow();
            };})(idx));
            var tSpan=document.createElement('span'); tSpan.textContent=slot.transparent?'▣ Transparan':'● Bulat';
            tgl.appendChild(tChk); tgl.appendChild(tSpan);
            slotEl.appendChild(btnRm); slotEl.appendChild(preview); slotEl.appendChild(lbl);
            slotEl.appendChild(inp); slotEl.appendChild(tgl);
            logoUploadGrid.appendChild(slotEl);
        });
    }
    btnAddLogo.addEventListener('click',function(){logoSlots.push({src:null,transparent:false});renderLogoGrid();});

    /* ====================================================
       BACKGROUND UPLOAD
       ==================================================== */
    inputBg.addEventListener('change',function(e){
        var f=e.target.files[0]; if(!f||!f.type.startsWith('image/')) return;
        var r=new FileReader(); r.onload=function(ev){
            exportBgDataUrl=ev.target.result;
            posterBg.src=ev.target.result; posterBg.style.display='block';
        }; r.readAsDataURL(f);
    });

    /* ====================================================
       EXPORT PNG — semua digambar ke canvas secara manual
       1. bg image  2. overlay  3. konten (html2canvas di tempat)
       ==================================================== */
    btnDownload.addEventListener('click', async function(){
        btnDownload.textContent='Memproses...'; btnDownload.disabled=true;

        var inner  = getInner();
        var footer = document.getElementById('poster-footer');
        var sosmed = document.getElementById('poster-sosmed');

        /* Simpan state */
        var savedPStyle = poster.getAttribute('style') || '';
        var savedIStyle = inner ? (inner.getAttribute('style') || '') : '';
        var savedSW     = posterStage.style.width;
        var savedSH     = posterStage.style.height;
        var savedSOv    = posterStage.style.overflow;
        var restored    = false;

        function restore(){
            if(restored) return; restored=true;
            posterBg.style.visibility = '';
            overlay.style.visibility  = '';
            poster.setAttribute('style', savedPStyle);
            if(inner) inner.setAttribute('style', savedIStyle);
            posterStage.style.width    = savedSW;
            posterStage.style.height   = savedSH;
            posterStage.style.overflow = savedSOv;
            applyScale(); scheduleCompress();
        }

        try{
            /* ---- LANGKAH 1: Reset poster transform tapi PERTAHANKAN inner scale ---- */
            posterStage.style.width    = POSTER_W + 'px';
            posterStage.style.height   = POSTER_H + 'px';
            posterStage.style.overflow = 'hidden';
            poster.style.cssText = [
                'width:'  + POSTER_W + 'px',
                'height:' + POSTER_H + 'px',
                'transform:none',
                'transform-origin:top left',
                'overflow:hidden',
                'display:flex',
                'flex-direction:column',
                'position:relative'
            ].join(';');
            /* inner TIDAK di-reset — biarkan scale dari autoCompress tetap aktif */

            /* Sembunyikan bg & overlay — keduanya digambar manual ke canvas */
            posterBg.style.visibility = 'hidden';
            overlay.style.visibility  = 'hidden';

            /* Tunggu layout settle */
            await new Promise(function(r){ setTimeout(r, 400); });

            var exportH = POSTER_H;
            var actualH = POSTER_H;
            var scaleDown = 1;

            /* ---- LANGKAH 2: Buat canvas final selalu 1080×1350 ---- */
            var finalCanvas = document.createElement('canvas');
            finalCanvas.width  = POSTER_W;
            finalCanvas.height = exportH;
            var fctx = finalCanvas.getContext('2d');

            /* Layer 1: warna solid default */
            fctx.fillStyle = '#5c8fa8';
            fctx.fillRect(0, 0, POSTER_W, exportH);

            /* Layer 2: bg image */
            if(exportBgDataUrl){
                await new Promise(function(res){
                    var bi = new Image();
                    bi.onload = function(){
                        var iw = bi.naturalWidth, ih = bi.naturalHeight;
                        var sc = Math.max(POSTER_W/iw, exportH/ih);
                        var dw = iw*sc, dh = ih*sc;
                        fctx.drawImage(bi, (POSTER_W-dw)/2, (exportH-dh)/2, dw, dh);
                        res();
                    };
                    bi.onerror = function(){ res(); };
                    bi.src = exportBgDataUrl;
                });
            }

            /* Layer 3: overlay gradasi */
            var op  = parseFloat(sliderOpacity.value);
            var c1  = overlayColor1.value, c2 = overlayColor2.value, dir = overlayDirection.value;
            var grd;
            if(dir === 'to bottom')            grd = fctx.createLinearGradient(0,0,0,exportH);
            else if(dir === 'to right')        grd = fctx.createLinearGradient(0,0,POSTER_W,0);
            else if(dir === 'to bottom right') grd = fctx.createLinearGradient(0,0,POSTER_W,exportH);
            else                               grd = fctx.createLinearGradient(0,exportH,POSTER_W,0);
            grd.addColorStop(0, hexToRgba(c1,op));
            grd.addColorStop(1, hexToRgba(c2,op));
            fctx.fillStyle = grd;
            fctx.fillRect(0, 0, POSTER_W, exportH);

            /* ---- LANGKAH 3: Capture konten DOM ---- */
            poster.style.background = 'transparent';
            var contentCanvas = await html2canvas(poster, {
                width          : POSTER_W,
                height         : actualH,
                scale          : 1,
                useCORS        : false,
                allowTaint     : false,
                logging        : false,
                backgroundColor: null,
                scrollX        : 0,
                scrollY        : 0,
                windowWidth    : POSTER_W,
                windowHeight   : actualH
            });

            /* ---- LANGKAH 4: Gabungkan — scale down konten agar muat 1350px ---- */
            fctx.drawImage(contentCanvas, 0, 0, POSTER_W, actualH,
                                          0, 0, POSTER_W, exportH);

            /* ---- LANGKAH 5: Restore & download ---- */
            restore();

            var link = document.createElement('a');
            link.download = 'pasangview.png';
            link.href = finalCanvas.toDataURL('image/png');
            link.click();

        } catch(err){
            console.error(err);
            alert('Gagal export: ' + err.message);
            restore();
        } finally {
            btnDownload.textContent = '⬇ Download PNG (1080×1350)';
            btnDownload.disabled    = false;
        }
    });

    /* ====================================================
       INIT
       ==================================================== */
    (function(){
        var today=new Date(), end=new Date(today); end.setDate(today.getDate()+3);
        if(inputDateStart) inputDateStart.value=fmtDate(today);
        if(inputDateEnd)   inputDateEnd.value=fmtDate(end);
    })();
    applyScale();
    updateOverlay();
    renderLogoGrid();
    renderLogoRow();
    setTimeout(function(){
        textInformasi.textContent = textareaInfo.value;
        globalTextColor = resolveTextColor();
        renderImbauan(textareaImbauan.value);
        applyColors();
        /* Data diisi manual via card Data Pasang Surut */
        textPeriode.textContent = 'Pilih bulan & tanggal di panel kiri';
    },150);

    /* ====================================================
       EVENTS
       ==================================================== */
    btnApplyDates && btnApplyDates.addEventListener('click', renderFromDates);

    /* ====================================================
       DATA PASANG SURUT — Auto Phase Detection
       ==================================================== */
    var dbBulan         = document.getElementById('db-bulan');
    var dbTahun         = document.getElementById('db-tahun');
    var btnAnalisis     = document.getElementById('btn-analisis');
    var dbStatus        = document.getElementById('db-status');
    var phaseResultWrap = document.getElementById('phase-result-wrap');
    var phaseInfo       = document.getElementById('phase-info');
    var btnPhase1       = document.getElementById('btn-phase1');
    var btnPhase2       = document.getElementById('btn-phase2');
    var jamOverrideWrap = document.getElementById('jam-override-wrap');
    var jamOverrideList = document.getElementById('jam-override-list');
    var currentRows     = [];
    var phaseData       = {phase1: null, phase2: null};
    var activePhase     = 1;

    function dbMsg(msg, ok){
        if(!dbStatus) return;
        dbStatus.textContent = msg;
        dbStatus.style.color = ok ? '#2e7d32' : '#c62828';
    }

    function renderJamOverride(rows){
        if(!jamOverrideList || !jamOverrideWrap) return;
        jamOverrideList.innerHTML = '';
        rows.forEach(function(row, i){
            var wrap = document.createElement('div');
            wrap.className = 'jam-override-row';
            var lbl = document.createElement('span');
            lbl.textContent = row.hari;
            lbl.className = 'jam-override-label';
            var inp = document.createElement('input');
            inp.type = 'text';
            inp.value = row.jam;
            inp.placeholder = 'mis. 17.00 – 19.00 WITA';
            inp.className = 'jam-override-input';
            inp.dataset.idx = i;
            inp.addEventListener('input', function(){
                currentRows[parseInt(this.dataset.idx)].jam = this.value;
                renderTableFromApiData(currentRows);
            });
            wrap.appendChild(lbl);
            wrap.appendChild(inp);
            jamOverrideList.appendChild(wrap);
        });
        jamOverrideWrap.style.display = rows.length ? 'block' : 'none';
    }

    function applyPhase(phase){
        activePhase = phase;
        var pd = phase === 1 ? phaseData.phase1 : phaseData.phase2;
        if(!pd || !pd.data || !pd.data.length){
            dbMsg('Phase ' + phase + ' tidak ada data.', false);
            return;
        }

        currentRows = pd.data.slice();
        renderTableFromApiData(currentRows);
        renderJamOverride(currentRows);
        textPeriode.textContent = pd.periode;

        // Update tombol aktif
        if(btnPhase1) btnPhase1.classList.toggle('phase-btn-active', phase===1);
        if(btnPhase2) btnPhase2.classList.toggle('phase-btn-active', phase===2);

        dbMsg('\u2713 Phase ' + phase + ' (' + pd.label + '): ' + pd.jumlah + ' hari ditampilkan.', true);
        scheduleCompress();
    }

    async function runAnalisis(){
        if(!dbBulan) return;
        var bulan = dbBulan.value;
        var tahun = parseInt(dbTahun.value) || 2026;

        dbMsg('Menganalisis data ' + bulan + ' ' + tahun + '...', true);
        if(btnAnalisis) btnAnalisis.disabled = true;
        if(phaseResultWrap) phaseResultWrap.style.display = 'none';

        try{
            var json = await (await fetch(
                '/api/pasang-air/analisis?bulan='+encodeURIComponent(bulan)+'&tahun='+tahun
            )).json();

            if(!json.success){
                dbMsg('\u26a0 ' + json.message, false);
                return;
            }

            phaseData = {phase1: json.phase1, phase2: json.phase2};

            // Tampilkan info
            if(phaseInfo){
                var p1 = json.phase1, p2 = json.phase2;
                var infoHtml = '<strong>' + json.total + ' hari</strong> pasang \u22652.6m di ' + bulan + ' ' + tahun + '<br>';
                infoHtml += '\u{1F315} <b>Phase 1 (Purnama)</b>: ' + (p1 ? p1.jumlah + ' hari \u2014 ' + p1.periode_h : 'tidak ada') + '<br>';
                infoHtml += '\u{1F311} <b>Phase 2 (Bulan Baru)</b>: ' + (p2 ? p2.jumlah + ' hari \u2014 ' + p2.periode_h : 'tidak ada');
                phaseInfo.innerHTML = infoHtml;
            }

            if(phaseResultWrap) phaseResultWrap.style.display = 'block';

            // Disable tombol phase yang kosong
            if(btnPhase1) btnPhase1.disabled = !json.phase1;
            if(btnPhase2) btnPhase2.disabled = !json.phase2;

            // Auto tampilkan phase 1
            applyPhase(json.phase1 ? 1 : 2);
            dbMsg('\u2713 Analisis selesai. Pilih Phase 1 atau Phase 2.', true);

        }catch(e){
            dbMsg('Gagal terhubung ke API.', false);
            console.error(e);
        }finally{
            if(btnAnalisis) btnAnalisis.disabled = false;
        }
    }

    btnAnalisis && btnAnalisis.addEventListener('click', runAnalisis);
    btnPhase1   && btnPhase1.addEventListener('click', function(){ applyPhase(1); });
    btnPhase2   && btnPhase2.addEventListener('click', function(){ applyPhase(2); });
    sliderOpacity.addEventListener('input', function(){ updateOverlay(); globalTextColor=resolveTextColor(); applyGlobalTextColor(); });
    overlayColor1.addEventListener('input', function(){ updateOverlay(); globalTextColor=resolveTextColor(); applyGlobalTextColor(); });
    overlayColor2.addEventListener('input', function(){ updateOverlay(); globalTextColor=resolveTextColor(); applyGlobalTextColor(); });
    overlayDirection.addEventListener('change', updateOverlay);
    textareaInfo.addEventListener('input', function(){
        textInformasi.textContent=this.value; applyGlobalTextColor(); scheduleCompress();
    });
    textareaImbauan.addEventListener('input', function(){ renderImbauan(this.value); });
    inputInstansi1.addEventListener('input', function(){
        document.getElementById('instansi-line1').textContent=this.value; scheduleCompress();
    });
    inputInstansi2.addEventListener('input', function(){
        document.getElementById('instansi-line2').textContent=this.value; scheduleCompress();
    });

});
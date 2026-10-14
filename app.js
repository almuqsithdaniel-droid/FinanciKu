// ==============================================
// DATA & KONFIGURASI
// ==============================================
let data = {
    dompet: [
        { id: 'umum', nama: 'Dompet Utama', saldo: 0, warna: 'primary', catatan: 'Dompet untuk semua kebutuhan' }
    ],
    transaksi: [],
    tujuan: [],
    targetUtama: 1000000,
    pengaturan: { tema: 'terang' }
};

let chartInstance = null;

// ==============================================
// FUNGSI FORMAT
// ==============================================
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

function formatTanggal(tanggalStr) {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date(tanggalStr));
}

// ==============================================
// PENYIMPANAN DATA
// ==============================================
function simpanData() {
    localStorage.setItem('dataTabungan', JSON.stringify(data));
}

function muatData() {
    const tersimpan = localStorage.getItem('dataTabungan');
    if (tersimpan) {
        data = JSON.parse(tersimpan);
        if (!data.dompet) data.dompet = [];
        if (data.dompet.length === 0) {
            data.dompet.push({ id: 'umum', nama: 'Dompet Utama', saldo: 0, warna: 'primary', catatan: 'Dompet untuk semua kebutuhan' });
        }
        if (!data.transaksi) data.transaksi = [];
        if (!data.tujuan) data.tujuan = [];
        if (!data.pengaturan) data.pengaturan = { tema: 'terang' };
    }

    if (data.pengaturan.tema === 'gelap') {
        document.documentElement.classList.add('dark');
    }
}

// ==============================================
// HITUNG RINGKASAN
// ==============================================
function hitungRingkasan(filterBulan = 'semua', dompetId = 'semua') {
    let daftar = [...data.transaksi];

    if (filterBulan !== 'semua') {
        const sekarang = new Date();
        const targetBulan = new Date(sekarang.getFullYear(), sekarang.getMonth() + parseInt(filterBulan), 1);
        const bulanBerikutnya = new Date(targetBulan.getFullYear(), targetBulan.getMonth() + 1, 1);
        daftar = daftar.filter(t => {
            const tgl = new Date(t.tanggal);
            return tgl >= targetBulan && tgl < bulanBerikutnya;
        });
    }

    if (dompetId !== 'semua') {
        daftar = daftar.filter(t => t.dompetId === dompetId);
    }

    const totalMasuk = daftar.filter(t => t.jenis === 'masuk').reduce((sum, t) => sum + t.jumlah, 0);
    const totalKeluar = daftar.filter(t => t.jenis === 'keluar').reduce((sum, t) => sum + t.jumlah, 0);
    const totalSaldo = data.dompet.reduce((sum, d) => sum + d.saldo, 0);

    return { totalMasuk, totalKeluar, saldo: totalSaldo };
}

// ==============================================
// PERBARUI PILIHAN DOMPET DI FORM
// ==============================================
function perbaruiPilihanDompet() {
    const filterDompet = document.getElementById('filterDompet');
    const dompetTransaksi = document.getElementById('dompetTransaksi');
    const dariDompet = document.getElementById('dariDompet');
    const keDompet = document.getElementById('keDompet');

    const pilihFilter = filterDompet ? filterDompet.value : 'semua';
    const pilihDompet = dompetTransaksi ? dompetTransaksi.value : '';
    const pilihDari = dariDompet ? dariDompet.value : '';
    const pilihKe = keDompet ? keDompet.value : '';

    if (filterDompet) {
        filterDompet.innerHTML = '<option value="semua">Semua Dompet</option>';
        data.dompet.forEach(d => {
            filterDompet.innerHTML += `<option value="${d.id}">${d.nama}</option>`;
        });
        filterDompet.value = pilihFilter;
    }

    if (dompetTransaksi) {
        dompetTransaksi.innerHTML = '<option value="">Pilih dompet</option>';
        data.dompet.forEach(d => {
            dompetTransaksi.innerHTML += `<option value="${d.id}">${d.nama}</option>`;
        });
        dompetTransaksi.value = pilihDompet;
    }

    if (dariDompet) {
        dariDompet.innerHTML = '<option value="">Pilih dompet asal</option>';
        data.dompet.forEach(d => {
            dariDompet.innerHTML += `<option value="${d.id}">${d.nama} — ${formatRupiah(d.saldo)}</option>`;
        });
        dariDompet.value = pilihDari;
    }

    if (keDompet) {
        keDompet.innerHTML = '<option value="">Pilih dompet tujuan</option>';
        data.dompet.forEach(d => {
            keDompet.innerHTML += `<option value="${d.id}">${d.nama} — ${formatRupiah(d.saldo)}</option>`;
        });
        keDompet.value = pilihKe;
    }
}

// ==============================================
// TAMPILAN DAFTAR DOMPET
// ==============================================
function perbaruiDaftarDompet() {
    const kontainer = document.getElementById('daftarDompet');
    if (!kontainer) return;

    if (!data.dompet.length) {
        kontainer.innerHTML = `
            <div class="col-span-full text-center py-8 text-slate-400">
                <i class="fa fa-credit-card text-3xl mb-2 opacity-30"></i>
                <p>Belum ada dompet. Buat dompet pertama Anda!</p>
            </div>
        `;
        perbaruiPilihanDompet();
        return;
    }

    kontainer.innerHTML = data.dompet.map(d => `
        <div class="dompet-card bg-white dark:bg-surface rounded-2xl overflow-hidden shadow-glow">
            <div class="h-2 bg-${d.warna}"></div>
            <div class="p-5">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-${d.warna}/10 flex items-center justify-center text-${d.warna}">
                            <i class="fa fa-credit-card"></i>
                        </div>
                        <h4 class="font-semibold">${d.nama}</h4>
                    </div>
                    <div class="flex gap-1">
                        <button class="text-xs text-slate-400 hover:text-primary edit-dompet" data-id="${d.id}" title="Ubah">
                            <i class="fa fa-pencil"></i>
                        </button>
                        ${d.id !== 'umum' ? `
                        <button class="text-xs text-slate-400 hover:text-accent hapus-dompet" data-id="${d.id}" title="Hapus">
                            <i class="fa fa-trash"></i>
                        </button>
                        ` : ''}
                    </div>
                </div>
                <p class="text-xs text-slate-400 mb-3">${d.catatan || 'Tidak ada keterangan'}</p>
                <p class="text-xl font-bold">${formatRupiah(d.saldo)}</p>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.edit-dompet').forEach(btn => {
        btn.onclick = () => {
            const dompet = data.dompet.find(d => d.id === btn.dataset.id);
            if (dompet) bukaModalDompet(dompet);
        };
    });

    document.querySelectorAll('.hapus-dompet').forEach(btn => {
        btn.onclick = () => {
            if (!confirm('⚠️ Menghapus dompet akan memindahkan saldonya ke Dompet Utama. Lanjutkan?')) return;
            const dompetHapus = data.dompet.find(d => d.id === btn.dataset.id);
            const dompetUtama = data.dompet.find(d => d.id === 'umum');
            if (dompetHapus && dompetUtama && dompetHapus.id !== 'umum') {
                dompetUtama.saldo += dompetHapus.saldo;
                data.transaksi.forEach(t => {
                    if (t.dompetId === dompetHapus.id) t.dompetId = 'umum';
                });
                data.dompet = data.dompet.filter(d => d.id !== dompetHapus.id);
                simpanData();
                perbaruiTampilan();
            }
        };
    });

    perbaruiPilihanDompet();
}

// ==============================================
// BUKA/TUTUP MODAL DOMPET
// ==============================================
function bukaModalDompet(dompet = null) {
    const modal = document.getElementById('modalDompet');
    const content = document.getElementById('modalDompetContent');
    const judul = document.getElementById('judulDompet');

    if (dompet) {
        judul.textContent = 'Ubah Dompet';
        document.getElementById('dompetId').value = dompet.id;
        document.getElementById('namaDompet').value = dompet.nama;
        document.getElementById('saldoAwal').value = dompet.saldo;
        document.getElementById('catatanDompet').value = dompet.catatan || '';
        document.querySelector(`input[name="warnaDompet"][value="${dompet.warna}"]`).checked = true;
    } else {
        judul.textContent = 'Dompet Baru';
        document.getElementById('dompetId').value = '';
        document.getElementById('namaDompet').value = '';
        document.getElementById('saldoAwal').value = '0';
        document.getElementById('catatanDompet').value = '';
        document.querySelector('input[name="warnaDompet"][value="purple"]').checked = true;
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
    }, 10);
}

function tutupModalDompet() {
    const modal = document.getElementById('modalDompet');
    const content = document.getElementById('modalDompetContent');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('formDompet').reset();
    }, 200);
}

// ==============================================
// SIMPAN DOMPET
// ==============================================
document.getElementById('formDompet').addEventListener('submit', function(e) {
    e.preventDefault();
    const idLama = document.getElementById('dompetId').value;
    const nama = document.getElementById('namaDompet').value.trim();
    const saldo = parseInt(document.getElementById('saldoAwal').value) || 0;
    const warna = document.querySelector('input[name="warnaDompet"]:checked').value;
    const catatan = document.getElementById('catatanDompet').value.trim();

    if (idLama) {
        const dompet = data.dompet.find(d => d.id === idLama);
        if (dompet) {
            dompet.nama = nama;
            dompet.saldo = saldo;
            dompet.warna = warna;
            dompet.catatan = catatan;
        }
    } else {
        const idBaru = 'dompet_' + Date.now();
        data.dompet.push({
            id: idBaru,
            nama: nama,
            saldo: saldo,
            warna: warna,
            catatan: catatan
        });
    }

    simpanData();
    tutupModalDompet();
    perbaruiTampilan();
});

// ==============================================
// TAMPILAN UTAMA
// ==============================================
function perbaruiTampilan() {
    muatData();

    const filterBulanEl = document.getElementById('filterBulan');
    const nilaiBulanIni = hitungRingkasan(filterBulanEl ? filterBulanEl.value : 'semua');
    const nilaiBulanLalu = hitungRingkasan('-1');

    const totalSaldoEl = document.getElementById('totalSaldo');
    if (totalSaldoEl) totalSaldoEl.textContent = formatRupiah(nilaiBulanIni.saldo);

    const jumlahDompetEl = document.getElementById('jumlahDompet');
    if (jumlahDompetEl) jumlahDompetEl.textContent = data.dompet.length;

    const totalMasukEl = document.getElementById('totalMasuk');
    if (totalMasukEl) totalMasukEl.textContent = formatRupiah(nilaiBulanIni.totalMasuk);

    const totalKeluarEl = document.getElementById('totalKeluar');
    if (totalKeluarEl) totalKeluarEl.textContent = formatRupiah(nilaiBulanIni.totalKeluar);

    const persenMasukEl = document.getElementById('persenMasuk');
    if (persenMasukEl) {
        const persenMasuk = nilaiBulanLalu.totalMasuk === 0 ? 100 :
            Math.round(((nilaiBulanIni.totalMasuk - nilaiBulanLalu.totalMasuk) / nilaiBulanLalu.totalMasuk) * 100);
        persenMasukEl.textContent = `${persenMasuk >= 0 ? '+' : ''}${persenMasuk}%`;
    }

    const persenKeluarEl = document.getElementById('persenKeluar');
    if (persenKeluarEl) {
        const persenKeluar = nilaiBulanLalu.totalKeluar === 0 ? 0 :
            Math.round(((nilaiBulanIni.totalKeluar - nilaiBulanLalu.totalKeluar) / nilaiBulanLalu.totalKeluar) * 100);
        persenKeluarEl.textContent = `${persenKeluar >= 0 ? '+' : ''}${persenKeluar}%`;
    }

    const persen = Math.min(100, Math.round((nilaiBulanIni.saldo / data.targetUtama) * 100));
    const sisa = Math.max(0, data.targetUtama - nilaiBulanIni.saldo);

    const targetSaatIniEl = document.getElementById('targetSaatIni');
    if (targetSaatIniEl) targetSaatIniEl.textContent = formatRupiah(nilaiBulanIni.saldo);

    const targetTotalEl = document.getElementById('targetTotal');
    if (targetTotalEl) targetTotalEl.textContent = formatRupiah(data.targetUtama);

    const progressTargetEl = document.getElementById('progressTarget');
    if (progressTargetEl) progressTargetEl.style.width = `${persen}%`;

    const persenTargetEl = document.getElementById('persenTarget');
    if (persenTargetEl) persenTargetEl.textContent = `${persen}%`;

    const sisaTargetEl = document.getElementById('sisaTarget');
    if (sisaTargetEl) sisaTargetEl.textContent = persen >= 100 ? '🎉 Tercapai!' : `Sisa ${formatRupiah(sisa)}`;

    perbaruiDaftarDompet();
    perbaruiDaftarTransaksi();
    perbaruiDaftarTujuan();
    perbaruiGrafik();
}

// ==============================================
// DAFTAR TRANSAKSI
// ==============================================
function perbaruiDaftarTransaksi() {
    const kontainer = document.getElementById('daftarTransaksi');
    if (!kontainer) return;

    const cariEl = document.getElementById('cariTransaksi');
    const cari = cariEl ? cariEl.value.toLowerCase() : '';

    const filterJenisEl = document.getElementById('filterJenis');
    const jenis = filterJenisEl ? filterJenisEl.value : 'semua';

    const filterDompetEl = document.getElementById('filterDompet');
    const dompetId = filterDompetEl ? filterDompetEl.value : 'semua';

    let daftar = [...data.transaksi].reverse();

    if (dompetId !== 'semua') {
        daftar = daftar.filter(t => t.dompetId === dompetId);
    }

    daftar = daftar.filter(t => {
        const cocokCari = t.keterangan.toLowerCase().includes(cari) || t.kategori.toLowerCase().includes(cari);
        const cocokJenis = jenis === 'semua' || t.jenis === jenis;
        return cocokCari && cocokJenis;
    });

    if (!daftar.length) {
        kontainer.innerHTML = `
            <div class="text-center py-8 text-slate-400">
                <i class="fa fa-search text-3xl mb-2 opacity-30"></i>
                <p>Tidak ada transaksi yang ditemukan</p>
            </div>
        `;
        return;
    }

    kontainer.innerHTML = daftar.map((t, i) => {
        const dompet = data.dompet.find(d => d.id === t.dompetId);
        const warna = dompet?.warna || 'primary';
        return `
        <div class="transaction-item py-4 flex items-center justify-between gap-3" style="animation-delay: ${i * 0.06}s">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center ${
                    t.jenis === 'masuk' ? 'bg-green-100 text-secondary dark:bg-green-900/30 dark:text-green-400' :
                    t.jenis === 'keluar' ? 'bg-red-100 text-accent dark:bg-red-900/30 dark:text-red-400' :
                    'bg-purple-100 text-purple dark:bg-purple-900/30'
                }">
                    <i class="fa ${
                        t.jenis === 'masuk' ? 'fa-arrow-down' :
                        t.jenis === 'keluar' ? 'fa-arrow-up' : 'fa-exchange'
                    }"></i>
                </div>
                <div>
                    <p class="font-medium">${t.keterangan}</p>
                    <p class="text-xs text-slate-400">${formatTanggal(t.tanggal)} • ${t.kategori} • <span class="text-${warna}">${dompet?.nama || 'Dompet'}</span></p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-bold ${
                    t.jenis === 'masuk' ? 'text-secondary' :
                    t.jenis === 'keluar' ? 'text-accent' : 'text-purple'
                }">
                    ${t.jenis === 'masuk' ? '+' : t.jenis === 'keluar' ? '-' : '↔'}${formatRupiah(t.jumlah)}
                </p>
                <div class="flex gap-2 mt-1 justify-end">
                    <button class="text-xs text-slate-400 hover:text-primary edit-transaksi" data-id="${t.id}" title="Ubah">
                        <i class="fa fa-pencil"></i>
                    </button>
                    <button class="text-xs text-slate-400 hover:text-accent hapus-transaksi" data-id="${t.id}" title="Hapus">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    document.querySelectorAll('.hapus-transaksi').forEach(btn => {
        btn.onclick = () => {
            if (!confirm('Yakin menghapus transaksi ini?')) return;
            const trx = data.transaksi.find(t => t.id === btn.dataset.id);
            if (trx) {
                const dompet = data.dompet.find(d => d.id === trx.dompetId);
                if (dompet) {
                    if (trx.jenis === 'masuk') dompet.saldo -= trx.jumlah;
                    if (trx.jenis === 'keluar') dompet.saldo += trx.jumlah;
                }
                data.transaksi = data.transaksi.filter(t => t.id !== trx.id);
                simpanData();
                perbaruiTampilan();
            }
        };
    });

    document.querySelectorAll('.edit-transaksi').forEach(btn => {
        btn.onclick = () => {
            const trx = data.transaksi.find(t => t.id === btn.dataset.id);
            if (trx) bukaModalTransaksi(trx.jenis, trx);
        };
    });
}

// ==============================================
// MODAL TRANSAKSI
// ==============================================
function bukaModalTransaksi(jenis, trx = null) {
    const modal = document.getElementById('modalTransaksi');
    const content = document.getElementById('modalContent');
    const title = document.getElementById('modalTitle');

    if (trx) {
        title.textContent = trx.jenis === 'masuk' ? 'Ubah Pemasukan' : 'Ubah Pengeluaran';
        document.getElementById('transaksiId').value = trx.id;
        document.getElementById('jenisTransaksi').value = trx.jenis;
        document.getElementById('dompetTransaksi').value = trx.dompetId;
        document.getElementById('keterangan').value = trx.keterangan;
        document.getElementById('jumlah').value = trx.jumlah;
        document.getElementById('kategori').value = trx.kategori;
        document.getElementById('tanggal').value = trx.tanggal;
    } else {
        title.textContent = jenis === 'masuk' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran';
        document.getElementById('transaksiId').value = '';
        document.getElementById('jenisTransaksi').value = jenis;
        document.getElementById('dompetTransaksi').value = data.dompet[0]?.id || '';
        document.getElementById('keterangan').value = '';
        document.getElementById('jumlah').value = '';
        document.getElementById('kategori').value = 'umum';
        document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];
    }

    modal.classList.remove('hidden');
    setTimeout(() => content.classList.remove('scale-95', 'opacity-0'), 10);
}

function tutupModalTransaksi() {
    const modal = document.getElementById('modalTransaksi');
    const content = document.getElementById('modalContent');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('formTransaksi').reset();
    }, 200);
}

document.getElementById('formTransaksi').addEventListener('submit', function(e) {
    e.preventDefault();
    const idLama = document.getElementById('transaksiId').value;
    const jenis = document.getElementById('jenisTransaksi').value;
    const dompetId = document.getElementById('dompetTransaksi').value;
    const keterangan = document.getElementById('keterangan').value.trim();
    const jumlah = parseInt(document.getElementById('jumlah').value);
    const kategori = document.getElementById('kategori').value;
    const tanggal = document.getElementById('tanggal').value;

    const dompet = data.dompet.find(d => d.id === dompetId);
    if (!dompet) { alert('Pilih dompet terlebih dahulu!'); return; }

    if (idLama) {
        const trxLama = data.transaksi.find(t => t.id === idLama);
        if (trxLama) {
            const dompetLama = data.dompet.find(d => d.id === trxLama.dompetId);
            if (dompetLama) {
                if (trxLama.jenis === 'masuk') dompetLama.saldo -= trxLama.jumlah;
                if (trxLama.jenis === 'keluar') dompetLama.saldo += trxLama.jumlah;
            }
            data.transaksi = data.transaksi.filter(t => t.id !== idLama);
        }
    }

    data.transaksi.push({
        id: 'trx_' + Date.now(),
        jenis, dompetId, keterangan, jumlah, kategori, tanggal
    });

    if (jenis === 'masuk') dompet.saldo += jumlah;
    if (jenis === 'keluar') dompet.saldo -= jumlah;

    simpanData();
    tutupModalTransaksi();
    perbaruiTampilan();
});

// ==============================================
// PINDAH SALDO
// ==============================================
function bukaModalPindah() {
    const modal = document.getElementById('modalPindah');
    const content = document.getElementById('modalPindahContent');
    document.getElementById('formPindah').reset();
    modal.classList.remove('hidden');
    setTimeout(() => content.classList.remove('scale-95', 'opacity-0'), 10);
}

function tutupModalPindah() {
    const modal = document.getElementById('modalPindah');
    const content = document.getElementById('modalPindahContent');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

document.getElementById('formPindah').addEventListener('submit', function(e) {
    e.preventDefault();
    const dariId = document.getElementById('dariDompet').value;
    const keId = document.getElementById('keDompet').value;
    const jumlah = parseInt(document.getElementById('jumlahPindah').value);
    const keterangan = document.getElementById('keteranganPindah').value.trim() || 'Pemindahan saldo';

    if (dariId === keId) { alert('Dompet asal dan tujuan tidak boleh sama!'); return; }

    const dariDompet = data.dompet.find(d => d.id === dariId);
    const keDompet = data.dompet.find(d => d.id === keId);

    if (!dariDompet || !keDompet) return;
    if (dariDompet.saldo < jumlah) { alert('Saldo tidak mencukupi!'); return; }

    dariDompet.saldo -= jumlah;
    keDompet.saldo += jumlah;

    data.transaksi.push({
        id: 'trx_' + Date.now() + '_1',
        jenis: 'pindah',
        dompetId: dariId,
        keterangan: keterangan + ' → ' + keDompet.nama,
        jumlah: jumlah,
        kategori: 'Pindah Keluar',
        tanggal: new Date().toISOString().split('T')[0]
    });
    data.transaksi.push({
        id: 'trx_' + Date.now() + '_2',
        jenis: 'pindah',
        dompetId: keId,
        keterangan: keterangan + ' ← ' + dariDompet.nama,
        jumlah: jumlah,
        kategori: 'Pindah Masuk',
        tanggal: new Date().toISOString().split('T')[0]
    });

    simpanData();
    tutupModalPindah();
    perbaruiTampilan();
});

// ==============================================
// DAFTAR TUJUAN
// ==============================================
function perbaruiDaftarTujuan() {
    const kontainer = document.getElementById('daftarTujuan');
    if (!kontainer) return;

    if (!data.tujuan.length) {
        kontainer.innerHTML = `
            <div class="text-center py-6 text-slate-400">
                <i class="fa fa-flag-o text-3xl mb-2 opacity-30"></i>
                <p class="text-sm">Belum ada tujuan. Buat tujuan pertama Anda!</p>
            </div>
        `;
        return;
    }

    kontainer.innerHTML = data.tujuan.map(t => {
        const persen = Math.min(100, Math.round((t.terkumpul / t.target) * 100));
        return `
        <div class="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-semibold">${t.nama}</h4>
                <button class="text-xs text-slate-400 hover:text-accent hapus-tujuan" data-id="${t.id}">
                    <i class="fa fa-times"></i>
                </button>
            </div>
            ${t.catatan ? `<p class="text-xs text-slate-400 mb-2">${t.catatan}</p>` : ''}
            <div class="flex justify-between text-xs mb-2">
                <span>${formatRupiah(t.terkumpul)}</span>
                <span class="text-slate-400">/ ${formatRupiah(t.target)}</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5 mb-1 overflow-hidden">
                <div class="bg-warning h-full rounded-full progress-bar" style="width: ${persen}%"></div>
            </div>
            <p class="text-xs text-slate-500">${persen}% tercapai</p>
        </div>
        `;
    }).join('');

    document.querySelectorAll('.hapus-tujuan').forEach(btn => {
        btn.onclick = () => {
            if (!confirm('Yakin menghapus tujuan ini?')) return;
            data.tujuan = data.tujuan.filter(t => t.id !== btn.dataset.id);
            simpanData();
            perbaruiTampilan();
        };
    });
}

// ==============================================
// GRAFIK
// ==============================================
function perbaruiGrafik() {
    const canvas = document.getElementById('keuanganChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const bulanan = {};
    data.transaksi.forEach(t => {
        const bulan = new Date(t.tanggal).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        if (!bulanan[bulan]) bulanan[bulan] = { masuk: 0, keluar: 0 };
        if (t.jenis === 'masuk') bulanan[bulan].masuk += t.jumlah;
        if (t.jenis === 'keluar') bulanan[bulan].keluar += t.jumlah;
    });

    const label = Object.keys(bulanan).sort((a, b) => new Date(a) - new Date(b));
    const dataMasuk = label.map(b => bulanan[b].masuk);
    const dataKeluar = label.map(b => bulanan[b].keluar);

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: label,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: dataMasuk,
                    backgroundColor: 'rgba(0, 180, 42, 0.5)',
                    borderColor: 'rgba(0, 180, 42, 1)',
                    borderRadius: 8,
                    barThickness: 22
                },
                {
                    label: 'Pengeluaran',
                    data: dataKeluar,
                    backgroundColor: 'rgba(245, 63, 63, 0.5)',
                    borderColor: 'rgba(245, 63, 63, 1)',
                    borderRadius: 8,
                    barThickness: 22
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 700 },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    backgroundColor: '#1E293B',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 10,
                    callbacks: { label: c => `${c.dataset.label}: ${formatRupiah(c.raw)}` }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { callback: v => v.toLocaleString('id-ID') }
                }
            }
        }
    });
}

// ==============================================
// INISIALISASI & EVENT LISTENER
// ==============================================
document.addEventListener('DOMContentLoaded', function() {
    perbaruiTampilan();

      // Tema — DIPERBAIKI
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.onclick = () => {
            const html = document.documentElement;
            const sedangGelap = html.classList.contains('dark');
            
            if (sedangGelap) {
                html.classList.remove('dark');
                data.pengaturan.tema = 'terang';
            } else {
                html.classList.add('dark');
                data.pengaturan.tema = 'gelap';
            }
            
            simpanData();
        };
    }

    // Tombol utama
    const btnDompet = document.getElementById('btnTambahDompet');
    if (btnDompet) btnDompet.onclick = () => bukaModalDompet();

    const btnMasuk = document.getElementById('btnTambahMasuk');
    if (btnMasuk) btnMasuk.onclick = () => bukaModalTransaksi('masuk');

    const btnKeluar = document.getElementById('btnTambahKeluar');
    if (btnKeluar) btnKeluar.onclick = () => bukaModalTransaksi('keluar');

    const btnPindah = document.getElementById('btnPindahDompet');
    if (btnPindah) btnPindah.onclick = () => bukaModalPindah();

    // Tutup modal
    const btnBatalDompet = document.getElementById('btnBatalDompet');
    if (btnBatalDompet) btnBatalDompet.onclick = tutupModalDompet;

    const btnBatal = document.getElementById('btnBatal');
    if (btnBatal) btnBatal.onclick = tutupModalTransaksi;

    const btnBatalPindah = document.getElementById('btnBatalPindah');
    if (btnBatalPindah) btnBatalPindah.onclick = tutupModalPindah;

    // Tutup klik luar
    ['modalDompet', 'modalTransaksi', 'modalPindah'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal) modal.onclick = e => {
            if (e.target === modal) {
                if (id === 'modalDompet') tutupModalDompet();
                if (id === 'modalTransaksi') tutupModalTransaksi();
                if (id === 'modalPindah') tutupModalPindah();
            }
        };
    });

    // Filter
    const filterBulan = document.getElementById('filterBulan');
    if (filterBulan) filterBulan.onchange = perbaruiTampilan;

    const cari = document.getElementById('cariTransaksi');
    if (cari) cari.oninput = perbaruiDaftarTransaksi;

    const filterJenis = document.getElementById('filterJenis');
    if (filterJenis) filterJenis.onchange = perbaruiDaftarTransaksi;

    const filterDompet = document.getElementById('filterDompet');
    if (filterDompet) filterDompet.onchange = perbaruiDaftarTransaksi;

    // Ekspor/Impor
    const exportBtn = document.getElementById('exportData');
    if (exportBtn) exportBtn.onclick = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tabungan_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importBtn = document.getElementById('importData');
    const fileInput = document.getElementById('fileInput');
    if (importBtn && fileInput) {
        importBtn.onclick = () => fileInput.click();
        fileInput.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = evt => {
                try {
                    const baru = JSON.parse(evt.target.result);
                    if (confirm('Ganti semua data dengan file yang diimpor?')) {
                        data = baru;
                        simpanData();
                        perbaruiTampilan();
                        alert('Impor berhasil!');
                    }
                } catch {
                    alert('File tidak valid!');
                }
            };
            reader.readAsText(file);
        };
    }

    // Reset
    const resetBtn = document.getElementById('btnResetData');
    if (resetBtn) resetBtn.onclick = () => {
        if (confirm('⚠️ Yakin menghapus SEMUA data? Tindakan ini tidak bisa dibatalkan!')) {
            localStorage.removeItem('dataTabungan');
            data = {
                dompet: [{ id: 'umum', nama: 'Dompet Utama', saldo: 0, warna: 'primary', catatan: 'Dompet untuk semua kebutuhan' }],
                transaksi: [], tujuan: [], targetUtama: 1000000, pengaturan: { tema: 'terang' }
            };
            perbaruiTampilan();
        }
    };

    // Target utama
    const aturTarget = document.getElementById('aturTarget');
    if (aturTarget) aturTarget.onclick = () => {
        const baru = prompt('Masukkan target tabungan utama (Rp):', data.targetUtama);
        if (baru && !isNaN(parseInt(baru))) {
            data.targetUtama = parseInt(baru);
            simpanData();
            perbaruiTampilan();
        }
    };

    // Tujuan tabungan
    const btnTujuan = document.getElementById('btnTambahTujuan');
    const modalTarget = document.getElementById('modalTarget');
    if (btnTujuan && modalTarget) {
        btnTujuan.onclick = () => {
            modalTarget.classList.remove('hidden');
        };
    }
    const btnBatalTarget = document.getElementById('btnBatalTarget');
    if (btnBatalTarget && modalTarget) {
        btnBatalTarget.onclick = () => modalTarget.classList.add('hidden');
    }
    const formTarget = document.getElementById('formTarget');
    if (formTarget && modalTarget) {
        formTarget.onsubmit = e => {
            e.preventDefault();
            const nama = document.getElementById('namaTujuan').value.trim();
            const jumlah = parseInt(document.getElementById('jumlahTarget').value);
            const catatan = document.getElementById('catatanTujuan').value.trim();
            if (!nama || !jumlah) return;
            data.tujuan.push({
                id: 'tujuan_' + Date.now(),
                nama,
                target: jumlah,
                terkumpul: 0,
                catatan
            });
            simpanData();
            formTarget.reset();
            modalTarget.classList.add('hidden');
            perbaruiTampilan();
        };
    }
});


function perbaruiDaftarTujuan() {
    const kontainer = document.getElementById('daftarTujuan');
    if (!kontainer) return;

    if (!data.tujuan.length) {
        kontainer.innerHTML = `
            <div class="text-center py-6 text-slate-400">
                <i class="fa fa-flag-o text-3xl mb-2 opacity-30"></i>
                <p class="text-sm">Belum ada tujuan. Buat tujuan pertama Anda!</p>
            </div>
        `;
        return;
    }

    kontainer.innerHTML = data.tujuan.map(t => {
        const persen = Math.min(100, Math.round((t.terkumpul / t.target) * 100));
        return `
        <div class="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-semibold">${t.nama}</h4>
                <div class="flex gap-1">
                    <button class="text-xs text-slate-400 hover:text-primary setor-tujuan" data-id="${t.id}" title="Setor ke Tujuan">
                        <i class="fa fa-plus-circle"></i>
                    </button>
                    <button class="text-xs text-slate-400 hover:text-accent hapus-tujuan" data-id="${t.id}" title="Hapus">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
            </div>
            ${t.catatan ? `<p class="text-xs text-slate-400 mb-2">${t.catatan}</p>` : ''}
            <div class="flex justify-between text-xs mb-2">
                <span>${formatRupiah(t.terkumpul)}</span>
                <span class="text-slate-400">/ ${formatRupiah(t.target)}</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5 mb-1 overflow-hidden">
                <div class="bg-warning h-full rounded-full progress-bar" style="width: ${persen}%"></div>
            </div>
            <p class="text-xs text-slate-500">${persen}% tercapai</p>
        </div>
        `;
    }).join('');

    // Tombol Setor ke Tujuan
    document.querySelectorAll('.setor-tujuan').forEach(btn => {
        btn.onclick = () => {
            const tujuan = data.tujuan.find(t => t.id === btn.dataset.id);
            if (tujuan) bukaModalSetorTujuan(tujuan);
        };
    });

    // Hapus Tujuan
    document.querySelectorAll('.hapus-tujuan').forEach(btn => {
        btn.onclick = () => {
            if (!confirm('Yakin menghapus tujuan ini?')) return;
            data.tujuan = data.tujuan.filter(t => t.id !== btn.dataset.id);
            simpanData();
            perbaruiTampilan();
        };
    });
}


// ==============================================
// SETOR SALDO DOMPET KE TUJUAN TABUNGAN — DIPERBAIKI
// ==============================================
let tujuanAktif = null;

function bukaModalSetorTujuan(tujuan) {
    tujuanAktif = tujuan;
    const modal = document.getElementById('modalSetorTujuan');
    const namaTujuanEl = document.getElementById('namaTujuanSetor');
    const sisaEl = document.getElementById('sisaSetor');
    const dompetSetorEl = document.getElementById('dompetSetor');
    
    if (namaTujuanEl) namaTujuanEl.textContent = tujuan.nama;
    if (sisaEl) {
        const sisa = Math.max(0, tujuan.target - tujuan.terkumpul);
        sisaEl.textContent = `Sisa: ${formatRupiah(sisa)}`;
    }
    
    // Isi daftar dompet
    if (dompetSetorEl) {
        dompetSetorEl.innerHTML = '<option value="">Pilih dompet asal</option>';
        data.dompet.forEach(d => {
            dompetSetorEl.innerHTML += `<option value="${d.id}">${d.nama} — ${formatRupiah(d.saldo)}</option>`;
        });
    }
    
    const jumlahSetorEl = document.getElementById('jumlahSetor');
    if (jumlahSetorEl) jumlahSetorEl.value = '';
    
    if (modal) modal.classList.remove('hidden');
}

function tutupModalSetorTujuan() {
    tujuanAktif = null;
    const modal = document.getElementById('modalSetorTujuan');
    if (modal) modal.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', function() {
    const formSetor = document.getElementById('formSetorTujuan');
    if (formSetor) {
        formSetor.onsubmit = e => {
            e.preventDefault();
            if (!tujuanAktif) {
                alert('Tujuan tidak ditemukan!');
                return;
            }
            
            const dompetId = document.getElementById('dompetSetor').value;
            const jumlah = parseInt(document.getElementById('jumlahSetor').value);
            
            if (!dompetId) {
                alert('Silakan pilih dompet asal!');
                return;
            }
            if (!jumlah || isNaN(jumlah) || jumlah <= 0) {
                alert('Masukkan jumlah yang valid!');
                return;
            }
            
            const dompet = data.dompet.find(d => d.id === dompetId);
            if (!dompet) {
                alert('Dompet tidak ditemukan!');
                return;
            }
            
            if (dompet.saldo < jumlah) {
                alert(`Saldo tidak mencukupi!\nSaldo: ${formatRupiah(dompet.saldo)}\nDiperlukan: ${formatRupiah(jumlah)}`);
                return;
            }

            // ✅ Kurangi saldo dompet
            dompet.saldo = dompet.saldo - jumlah;
            
            // ✅ Tambah ke terkumpul tujuan
            tujuanAktif.terkumpul = tujuanAktif.terkumpul + jumlah;
            if (tujuanAktif.terkumpul > tujuanAktif.target) {
                tujuanAktif.terkumpul = tujuanAktif.target;
            }
            
            // ✅ Catat transaksi
            data.transaksi.push({
                id: 'trx_' + Date.now(),
                jenis: 'keluar',
                dompetId: dompetId,
                keterangan: `Setor ke: ${tujuanAktif.nama}`,
                jumlah: jumlah,
                kategori: 'tabungan',
                tanggal: new Date().toISOString().split('T')[0]
            });
            
            simpanData();
            tutupModalSetorTujuan();
            perbaruiTampilan();
            
            if (tujuanAktif.terkumpul >= tujuanAktif.target) {
                setTimeout(() => {
                    alert(`🎉 Tercapai!\nTujuan: ${tujuanAktif.nama}\nTarget: ${formatRupiah(tujuanAktif.target)}`);
                }, 300);
            } else {
                alert(`✅ Berhasil disetor!\nDari: ${dompet.nama}\nJumlah: ${formatRupiah(jumlah)}\nSaldo tersisa: ${formatRupiah(dompet.saldo)}`);
            }
        };
    }
    
    const btnBatalSetor = document.getElementById('btnBatalSetor');
    if (btnBatalSetor) {
        btnBatalSetor.onclick = tutupModalSetorTujuan;
    }
});


function muatData() {
    const tersimpan = localStorage.getItem('dataTabungan');
    if (tersimpan) {
        data = JSON.parse(tersimpan);
        if (!data.dompet) data.dompet = [];
        if (data.dompet.length === 0) {
            data.dompet.push({ id: 'umum', nama: 'Dompet Utama', saldo: 0, warna: 'primary', catatan: 'Dompet untuk semua kebutuhan' });
        }
        if (!data.transaksi) data.transaksi = [];
        if (!data.tujuan) data.tujuan = [];
        if (!data.pengaturan) data.pengaturan = { tema: 'terang' };
    }

    // ✅ Terapkan tema dengan benar saat halaman dibuka
    terapkanTema(data.pengaturan.tema);
}

// ==============================================
// PENGELOLAAN TEMA — VERSI DIPERBAIKI
// ==============================================

// Terapkan tema yang tersimpan
function terapkanTema(tema) {
    const html = document.documentElement;
    if (tema === 'gelap') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
}

// Muat tema saat halaman dibuka
function muatTema() {
    const tersimpan = localStorage.getItem('temaTabungan');
    const tema = tersimpan || 'terang';
    terapkanTema(tema);
}

// Ganti tema saat tombol diklik
function pasangTombolTema() {
    const tombol = document.getElementById('themeToggle');
    if (!tombol) return;

    tombol.onclick = function () {
        const html = document.documentElement;
        const sedangGelap = html.classList.contains('dark');
        const temaBaru = sedangGelap ? 'terang' : 'gelap';
        
        terapkanTema(temaBaru);
        localStorage.setItem('temaTabungan', temaBaru);
    };
}

// Jalankan saat halaman siap
document.addEventListener('DOMContentLoaded', function () {
    muatTema();
    pasangTombolTema();
});

/* ============================================================
   Hilal & Serkan — Katılım Formu
   ------------------------------------------------------------
   ⚙️  KURULUM: Aşağıdaki SCRIPT_URL satırına, Google Apps
   Script'ten aldığınız "/exec" ile biten adresi yapıştırın.
   Adımlar için KURULUM.md dosyasına bakın.

   Boş bırakılırsa site "deneme modunda" çalışır: form çalışır,
   ekranlar görünür, ancak yanıt hiçbir yere kaydedilmez.
   ============================================================ */

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwTQzRyH2CdDQd3jbx_Fhrvs9rEpVGmPbWE7Rh68O-fxqU53H-dW8B7XgKhLF0feX5p/exec';

/* ============================================================ */

const EVENTS = {
    kina: {
        key: 'kina',
        label: 'Kına Gecesi',
        locative: 'kına gecemizde', // "Sizi … 3 kişi olarak ağırlamak için…"
        title: 'Hilal & Serkan — Kına Gecesi',
        dateText: '28 Ağustos 2026 · Cuma · 19.00',
        venue: 'Triya İstanbul, Kartal / İstanbul',
        // Europe/Istanbul yıl boyu UTC+3 → 19.00 yerel = 16:00 UTC
        startUTC: '20260828T160000Z',
        endUTC: '20260828T210000Z',
        details: 'Hilal & Serkan\'ın kına gecesi. Mutluluğumuza ortak olduğunuz için teşekkür ederiz.',
        ics: 'kina.ics'
    },
    dugun: {
        key: 'dugun',
        label: 'Düğün',
        locative: 'düğünümüzde',
        title: 'Hilal & Serkan — Düğün',
        dateText: '5 Eylül 2026 · Cumartesi · 19.00',
        venue: 'Diltaş Düğün ve Kongre Merkezi, Meram / Konya',
        startUTC: '20260905T160000Z',
        endUTC: '20260905T210000Z',
        details: 'Hilal & Serkan\'ın düğün töreni. Not: 05.09.2026 Cumartesi günü saat 17.00\'de damat evinden konvoy hareket edecektir.',
        ics: 'dugun.ics'
    }
};

const WEDDING_DATE = new Date('2026-09-05T19:00:00+03:00');
const STORAGE_KEY = 'hs-rsvp-2026';

const $ = (id) => document.getElementById(id);

/* ============================================================
   GERİ SAYIM
   ============================================================ */
function tick() {
    const diff = WEDDING_DATE - new Date();

    if (diff <= 0) {
        $('countdown').hidden = true;
        return;
    }

    const s = Math.floor(diff / 1000);
    const pad = (n) => String(n).padStart(2, '0');

    $('cdDays').textContent = Math.floor(s / 86400);
    $('cdHours').textContent = pad(Math.floor(s / 3600) % 24);
    $('cdMins').textContent = pad(Math.floor(s / 60) % 60);
    $('cdSecs').textContent = pad(s % 60);
}

tick();
setInterval(tick, 1000);

/* ============================================================
   KİŞİ SAYISI (+ / −)
   ============================================================ */
const MIN_COUNT = 1;
const MAX_COUNT = 15;

function getCount(id) {
    return parseInt($(id).dataset.value, 10) || MIN_COUNT;
}

function setCount(id, value) {
    const v = Math.min(MAX_COUNT, Math.max(MIN_COUNT, value));
    const out = $(id);
    out.dataset.value = v;
    out.textContent = v;

    // Sınıra gelince ilgili butonu pasifleştir
    document.querySelectorAll(`.step[data-target="${id}"]`).forEach((btn) => {
        const step = parseInt(btn.dataset.step, 10);
        btn.disabled = (step < 0 && v === MIN_COUNT) || (step > 0 && v === MAX_COUNT);
    });
}

document.querySelectorAll('.step').forEach((btn) => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        setCount(target, getCount(target) + parseInt(btn.dataset.step, 10));
    });
});

/* ============================================================
   "KATILIYORUM" SEÇİLİNCE KİŞİ SAYISINI GÖSTER
   ============================================================ */
['kina', 'dugun'].forEach((key) => {
    document.querySelectorAll(`input[name="${key}"]`).forEach((radio) => {
        radio.addEventListener('change', () => {
            const attending = radio.value === 'Katılıyor';
            $(key + 'Counter').hidden = !attending;
            $(key + 'Block').classList.remove('invalid');
            hideError();
        });
    });
});

setCount('kinaCount', 2);
setCount('dugunCount', 2);

/* ============================================================
   FORM DOĞRULAMA VE GÖNDERİM
   ============================================================ */
const form = $('rsvpForm');
const submitBtn = $('submitBtn');
const errorBox = $('formError');

function showError(msg, focusEl) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (focusEl) setTimeout(() => focusEl.focus({ preventScroll: true }), 400);
}

function hideError() {
    errorBox.hidden = true;
}

function selectedValue(name) {
    const el = form.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const nameInput = $('guestName');
    const name = nameInput.value.trim();

    if (name.length < 3) {
        nameInput.classList.add('invalid');
        showError('Lütfen adınızı ve soyadınızı yazın.', nameInput);
        return;
    }
    nameInput.classList.remove('invalid');

    const kina = selectedValue('kina');
    const dugun = selectedValue('dugun');

    if (!kina) {
        $('kinaBlock').classList.add('invalid');
        showError('Lütfen kına gecesi için katılım durumunuzu seçin.');
        $('kinaBlock').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    if (!dugun) {
        $('dugunBlock').classList.add('invalid');
        showError('Lütfen düğün için katılım durumunuzu seçin.');
        $('dugunBlock').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const payload = {
        name: name,
        phone: $('guestPhone').value.trim(),
        kina: kina,
        kinaCount: kina === 'Katılıyor' ? getCount('kinaCount') : 0,
        dugun: dugun,
        dugunCount: dugun === 'Katılıyor' ? getCount('dugunCount') : 0,
        // Tarayıcı saatine göre damga; sunucu tarafında da ayrıca kaydedilir
        clientTime: new Date().toLocaleString('tr-TR')
    };

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        await send(payload);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        showThanks(payload, true);
    } catch (err) {
        console.error('Gönderim hatası:', err);
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        showError('Bağlantı sağlanamadı. Lütfen internetinizi kontrol edip tekrar deneyin.');
    }
});

/**
 * Apps Script'e gönderim.
 *
 * URLSearchParams + özel başlık YOK → "basit istek" sayılır, tarayıcı
 * CORS preflight (OPTIONS) yapmaz. Apps Script bunu doPost içinde
 * e.parameter olarak okur.
 *
 * mode: 'no-cors' kullanılıyor çünkü Apps Script isteği
 * googleusercontent.com'a yönlendiriyor ve bazı tarayıcılarda yanıt
 * okunamıyor. Önemli nokta: CORS hatası "istek gitmedi" demek DEĞİLDİR —
 * satır tabloya çoktan yazılmış olur. Bu yüzden ASLA tekrar denemiyoruz;
 * aksi hâlde her yanıt tabloya iki kez düşerdi.
 * Gerçek bağlantı hatasında (internet yok) fetch yine de reddediyor,
 * dolayısıyla üstteki try/catch hata mesajını gösterebiliyor.
 */
async function send(payload) {
    if (!SCRIPT_URL) {
        console.info('[Deneme modu] Yanıt kaydedilmedi. Veri:', payload);
        await new Promise((r) => setTimeout(r, 700));
        return;
    }

    const body = new URLSearchParams();
    Object.keys(payload).forEach((k) => body.append(k, payload[k]));

    await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: body });
}

/* ============================================================
   TEŞEKKÜR EKRANI + TAKVİME EKLE
   ============================================================ */
/**
 * Takvim dosyasının adresi.
 *
 * iPhone/iPad/Mac'te "webcal://" kullanıyoruz. Sebebi: WhatsApp,
 * Instagram gibi uygulamaların içindeki tarayıcı, https ile biten bir
 * .ics dosyasını indirip orada bırakıyor — Takvim'e devretmiyor, yani
 * kullanıcı açısından "hiçbir şey olmuyor". webcal:// ise tarayıcıyı
 * atlayıp doğrudan işletim sistemine gider, o da Takvim'i açar.
 * Diğer cihazlarda normal https adresi daha iyi çalışıyor.
 */
function icsUrl(ev) {
    const tam = new URL(ev.ics, location.href).href;
    const apple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
    return apple ? tam.replace(/^https?:/, 'webcal:') : tam;
}

function gcalUrl(ev) {
    const p = new URLSearchParams({
        action: 'TEMPLATE',
        text: ev.title,
        details: ev.details,
        location: ev.venue
    });
    // dates ayıracı "/" kodlanmadan kalmalı, bu yüzden ayrı ekleniyor
    return 'https://calendar.google.com/calendar/render?' + p.toString() +
        '&dates=' + ev.startUTC + '/' + ev.endUTC;
}

const ICON_APPLE = '<svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10z"/></svg>';
const ICON_GOOGLE = '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 10.6V17h-2v-5.4l-3-3L9.4 7 12 9.6 14.6 7 16 8.6l-3 3z"/></svg>';

function showThanks(data, scroll) {
    form.hidden = true;
    $('thanks').hidden = false;

    const coming = [];
    if (data.kina === 'Katılıyor') coming.push(EVENTS.kina);
    if (data.dugun === 'Katılıyor') coming.push(EVENTS.dugun);

    const firstName = data.name.split(' ')[0];

    if (coming.length === 0) {
        $('thanksTitle').textContent = 'Teşekkür ederiz';
        $('thanksText').textContent =
            `Bilgilendirdiğiniz için teşekkürler ${firstName}. Sizi aramızda göremeyeceğimiz için üzgünüz, yine de bizi hatırladığınız için minnettarız.`;
    } else {
        $('thanksTitle').textContent = 'Teşekkür ederiz!';
        // Her etkinliğin kişi sayısı farklı olabilir; ayrı ayrı yazıyoruz.
        const parca = coming
            .map((e) => `${e.locative} ${data[e.key + 'Count']} kişi`)
            .join(', ');
        $('thanksText').textContent =
            `Yanıtınız bize ulaştı ${firstName}. Sizi ${parca} olarak ağırlamak için sabırsızlanıyoruz.`;

        $('calendarZone').hidden = false;
        $('calendarButtons').innerHTML = coming.map((ev) => `
            <div class="cal-card">
                <h4>${ev.label}</h4>
                <p>${ev.dateText}<br>${ev.venue}</p>
                <div class="cal-links">
                    <!-- "download" YOK: dosyayı indirmek yerine Takvim'e devreder -->
                    <a href="${icsUrl(ev)}">${ICON_APPLE} Apple Takvim</a>
                    <a href="${gcalUrl(ev)}" target="_blank" rel="noopener">${ICON_GOOGLE} Google Takvim</a>
                </div>
            </div>`).join('') +
            `<p class="cal-note">Düğme çalışmazsa Google Takvim'i deneyin.</p>`;
    }

    // Sadece yeni gönderimde kaydır. Daha önce yanıt vermiş biri linki
    // tekrar açtığında (mekân/tarihe bakmak için) sayfa başında kalsın.
    if (scroll) $('thanks').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============================================================
   DAHA ÖNCE YANIT VERİLMİŞSE
   ============================================================ */
(function restore() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
        const data = JSON.parse(saved);
        $('guestName').value = data.name || '';
        $('guestPhone').value = data.phone || '';

        ['kina', 'dugun'].forEach((key) => {
            const radio = form.querySelector(`input[name="${key}"][value="${data[key]}"]`);
            if (radio) {
                radio.checked = true;
                if (data[key] === 'Katılıyor') {
                    $(key + 'Counter').hidden = false;
                    setCount(key + 'Count', data[key + 'Count']);
                }
            }
        });

        showThanks(data, false);
    } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
    }
})();

$('editBtn').addEventListener('click', () => {
    $('thanks').hidden = true;
    form.hidden = false;
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    hideError();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

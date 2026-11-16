# INFINITE RIDE — Proje Durumu

**16 Kasım 2026 · v1.1.0 · Arayüz yenilemesi ve manuel direksiyon düzeltmesi.**

## v1.1 değişiklikleri

Kullanıcı ana menü/arayüzün gerçek bir oyun gibi görünmesini ve karakterin kendiliğinden sağa sola yönelmesinin düzeltilmesini istedi. Mevcut oyun sistemleri korunarak `index.html`, `style.css` ve UI yöneticisi yenilendi: turuncu/koyu lacivert görsel dil, özgün SVG simgeler, motosiklet vitrini, üç mod kartı, rota/trafik alanı, canlı rekorlar, dijital hız/devir/vites/nitro, yeni pause/ayar/yardım/sonuç ekranları. Ana menüde oklarla seçim ve Enter ile başlatma, tam ekran ve klavye odak yönetimi eklendi. Desktop, portre ve yatay için ayrı düzenler vardır.

Otomatik yönelmenin kaynağı oyuncuya da uygulanan yol eğriliği beslemesi ve otomatik yön düzeltmesiydi. Oyuncu artık mutlak sürüş yönünü saklar; sıfır direksiyonda yol eğriliği yönü veya yatışı değiştirmez. Tuş bırakılınca yaw sönümlenir, karşı direksiyon uygulanmaz. Dış koridor sınırı da oyuncuyu kendiliğinden çevirmiyor. AI yarışçılar aynı mevcut yol yardımını açıkça `{ roadAssist: true }` ile kullanır. Takip kamerası yolun bağımsız ileri noktasına değil oyuncunun sürüş yönüne bakar.

Test otomasyonu manuel oyuncuya gerçekten direksiyon girdisi üretir; normal oyuna autopilot eklenmedi. Yalnızca `?test=1&debug=1` içindeki TestDriver hızlandırılmış/gerçek zamanlı test sürüşünü çalıştırabilir. Devir çubuğu ve motor sesi `motorcycle/engine.js` içindeki aynı hesaplamayı kullanır.

34/34 Node testi, üretim build'i ve sekiz dosyalı e2e paketi geçti. Son yerleşim değişikliklerinden sonra arayüz paketi ayrıca yeniden çalıştırıldı. Yeni manuel yön testleri beş virajda otomatik dönüş/yatma olmadığını, tuş bırakınca salınım olmadığını doğruladı. Yedi ekran ölçüsü, modal klavye odağı, gerçek tam ekran ve menü/pause/sonuç akışları denendi. Görsel incelemede yatay ayar düğmesinin dock altında kalması, dar telefonda dokunmatik düğme çakışması ve mobil göstergenin motosikleti örtmesi düzeltildi. 24 simüle dakikalık yoğun trafik sürüşü + gerçek zamanlı kontrol aralığında yaklaşık 17.04 km tamamlandı; son render aralığında sürüşün hâlâ devam ettiği ayrıca assert edildi. Tam ölçümler TEST_REPORT ve artifacts içinde.

## Yetki ve çalışma düzeni

Kullanıcı ikinci talimatında Aşama 2–6 için önceden devam onayı verdi. Aşamalar aynı dosyalarda sırayla uygulandı; her kararlı aşama commit edildi. Kritik test sorunu bulunduğunda düzeltildi ve tekrar test edildi. Harici hesaba push, hesap bağlantısı veya canlı yayın yapılmadı. Kullanıcıya yeniden aşama onayı sorulmaz. Özgün uzun vadeli gereksinimler `docs/PROJECT_BRIEF.md` içindedir.

## Tamamlanan aşamalar

| Aşama | Gerçek sonuç                                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | 120 Hz fizik, kontrol edilebilir özgün motosiklet, üç kamera, seed tabanlı sonsuz yol, temel arazi/HUD                                                                                           |
| 2     | Forest/Highland/Mountain/Coastal, 450 m geçişler, yoğun instanced çevre, deniz/zirveler, bariyer/reflektör/uyarı levhaları, materyal ve atmosfer                                                 |
| 3     | Yedi araç türü, iki yönlü trafik, dört yoğunluk + kapalı, 56 nesnelik havuz, takip/fren/sollama/dönüş, çarpışma ve yakın geçiş                                                                   |
| 4     | Free Ride, Traffic Rush puan/combo/rekor, üç AI ile 3 km yarış, geri sayım, üç kontrol noktası, bitiş/sıralama/süre/sonuç                                                                        |
| 5     | Dinamik Web Audio, nitro, canlı kokpit, dört saat ve dinamik döngü, far havuzu, gerçek/saklanan ayarlar, mobil ve görsel polish                                                                  |
| 6     | Kapsamlı regresyon, gerçek mesh raycast'i, AI/yoğun trafik düzeltmeleri, köprü/tünel eksiklerinin kapatılması, GPU/listener temizliği ve mobil yatay düzeltmesi; son uzun test/paket doğrulaması |

## Mimari

ES Modules + Three.js 0.187 + Vite 8.3.8. Three.js tek çalışma bağımlılığıdır; Playwright test aracıdır. Backend, UI framework veya harici fizik motoru yoktur.

- **Game:** intro/countdown/running/paused/crashed/results yaşam döngüsü. Sabit 1/120 s fizik, ayrı render/kamera/UI. Odak kaybında güvenli duraklatma. Ses yalnızca kullanıcı etkileşiminden sonra açılır.
- **RoadPath:** seed, yol merkezi/çerçevesi/eğimi/eğriliği ve tek yüzey kaynağı. `s/d` metre cinsindedir. Render ve fizik 4 m kesitleri ve üçgen köşegenlerini paylaşır. Aşağı raycast'ler gerçek asfalt mesh'inde aynı teması doğrular.
- **WorldManager:** 12 × 128 m parça. 512 m floating origin. Mevcut grup/geometri/buffer'lar yeniden doldurulur; GPU'ya büyük mutlak koordinatlar gönderilmez.
- **BiomeManager:** varsayılan seed 7049, yaklaşık 1.8 km bölümler, 450 m yumuşak geçiş. Dört biyom, manuel seçim veya keşif. Yol x-z koridoru boyunca sonsuz ilerler; dallanan açık dünya değildir.
- **Terrain/Road/Furniture/Structures:** shared materyal/geometri ve InstancedMesh. Deniz, dağ kütleleri, bitkiler, yol detayları, 128 m köprüler ve dağda 256 m tüneller aynı yol çerçevesini izler. Tünelde far açılır.
- **MotorcyclePhysics/Model:** saf arcade fizik; oyuncunun mutlak sürüş yönü/yatma ayrı; manuel direksiyon, eğim, direnç, fren, düşük toprak tutuşu, hızla kontrollü yön tepkisi ve nitro. Yol eğriliği yardımı sadece AI için opt-in. Model tekerlek/gidon/yük aktarımı/fren lambası ve gerçek hızı gösteren kokpit içerir. `engine.js` devir/vites hesabını ses ve HUD arasında paylaşır.
- **TrafficSimulation/AI/Manager:** saf simülasyon + ayrı instanced çizim. 56 aktör havuzu; düşük/orta/yüksek/aşırı 12/24/38/56 hedef. Uygun boşluk yoksa spawn ertelenir. Takip AI'sı, eğri hız sınırı, güvenli karşı şerit ve dönüş alanı rezervasyonu. Kuyruk ayırma önden arkaya çözülür.
- **CollisionSystem:** görünür araç boyutlarından türeyen yönlü kutular; dünya x-z düzleminde süpürülmüş SAT. Yakın geçiş mesafesi kutu köşeleri/kenarları arasından hesaplanır. Yol kenarı engelleri de algılanır.
- **Session/Race/Save:** mod puanı/combo ve rekor. Rakipler aynı fizik/yolu kullanır, şerit planını bitirene kadar korur ve trafik/diğer yarışçılara tepki verir. Bitişten sonra yolu boşaltırlar. Bozuk/kapalı depolama oyunu durdurmaz.
- **Time/Renderer/Audio/Performance:** dört saat + 12 dakika dinamik döngü; değişen gökyüzü/güneş/gölge/sis; motosiklet farı + en fazla dört yakın araç farı. Dört kalıcı ses kaynağı ve en fazla sekiz eşzamanlı efekt. Grafik kalitesi ve uyarlanan piksel oranı.
- **Input/UI:** klavye ve çoklu dokunma; üç mod kartı, pause, yardım, ayarlar ve sonuçlar. SVG simgeler ve yerel fontlarla turuncu/lacivert oyun arayüzü; modal odak döngüsü, klavyeyle mod seçimi/başlatma, tam ekran. Dinleyiciler AbortController ile; GPU/ses kaynakları modül sahipleri tarafından temizlenir.

## Son doğrulama

34 Node testi ve tam `npm run test:e2e` paketi geçti: 21 sürüş kontrolü, 4 biyom render'i, 6 trafik, 6 mod, 8 polish, 6 kapsamlı arayüz/manuel direksiyon kontrolü, 3 yaşam döngüsü/mobil kontrolü ve Pages alt yol testi. Kaza sonrası dönüş, durağan oyuncuya çarpma, gerçek 3 km yarış bitişi, skorun reload sonrası saklanması ve ses çıkışının sıfırlanması denendi. GPU kaynak sayıları dispose sonunda sıfıra indi; klavye/UI dinleyicilerinin kaldırıldığı doğrulandı. Yeni arayüz 1440×900, 1366×768, 1280×720, 1024×600, 390×844, 360×740 ve 844×390 ölçülerinde denendi.

Sonuç ayrıntıları ve uzun test ölçümleri `TEST_REPORT.md` ile `artifacts/*-results.json` içindedir. Son uzun test geçti: 24 simüle dakikada 16.82 km, gerçek zamanlı devamıyla toplam 17.04 km; sabit 12 parça/56 araçlık havuz, son 137 GPU geometrisi/5 doku. Isınma sonrası GC heap aralığı farkı 1.90 MiB. Ayrı 12.005 s gerçek zamanlı ölçümde yüksek kalite, DPR 1 ve 1440×900'de yaklaşık 60.06 FPS / p95 16.7 ms (RTX 5060). Gerçek zamanlı aralıkta da açık test kontrolcüsü manuel fiziğe direksiyon girdileri üretir; normal oyuna yardım eklenmez. Saatlerce gerçek sürüş iddia edilmez.

## Son kalite kontrolünde düzeltilenler

- Yoğun trafikte yeterli dönüş alanı olmadan başlayan AI sollamaları: konvoyun ötesindeki gerçek boşluk ve manevra rezervasyonu eklendi.
- Sırasız araç ayırmanın kuyrukta geriye sıçrama üretmesi: önden arkaya çözüm eklendi.
- Yarışçıların her karede şerit hedefini değiştirmesi: kalıcı sollama/geri dönüş planı ve süpürülen koridor güvenliği eklendi. Canlı trafik ile yarış AI testinde NPC çakışması kalmadı.
- Bitiren rakibin çizgide durması kaldırıldı.
- Durağan oyuncuya gelen aracın çarpışması artık algılanır.
- Yatay mobil menü taşması ve ayar kapatma düğmesinin başlığın altında kalması düzeltildi.
- Köprü/tünel yol teması ve tünel farı test edildi; tünel girişlerinde bitki yerleşimi temizlendi.

## Bilinen sınırlar

Stilize procedural geometri kullanılır; fotogerçekçi taranmış modeller yoktur. Tam rigid-body/ragdoll yerine arcade sürüş ve kutu çarpışması vardır. Her yönde tek şerit bulunur; çok şeritli otoyol genişlemesi yoktur. Sesler sentezlenmiştir. Gerçek telefon, Safari/Firefox, saatler süren duvar saati sürüşü ve canlı GitHub Pages dağıtımı doğrulanmadı. Üretim build'i Three.js vendor parçası (~546 kB minify / 135 kB gzip) için boyut uyarısı verebilir; bu bir build hatası değildir.

## Git ve teslim

`main` dalı. Aşama commit'leri: `d08333d` çekirdek; `07de38b` dünya; `399e66e` trafik; `45dc104` modlar; `f969dc6` polish; `9cfb1e9` v1.0.0 son QA. v1.1 commit mesajı: `fix(game): rebuild racing UI and remove player auto-steering`. Uzak depo/push yoktur. Güncel teslim arşivi `release/INFINITE-RIDE-v1.1.0.zip`; kaynaklar, dist, lisans ve güncel doğrulama çıktıları içerir; node_modules/.git içermez. Arşivde commit ve dosya SHA-256 değerlerini taşıyan RELEASE_MANIFEST.json vardır. Önceki sürüm arşivleri korunur.

## Devam noktası

Oynanabilir sürüm incelemeye hazırdır. Sonraki geliştirmelerde mevcut regresyonları koru. Gerçek mobil ve farklı tarayıcıların QA'sı, çok şeritli yol ve daha gelişmiş varlık/fizik kalitesi aday ek işlerdir; tamamlanmış gösterilmez. Kullanıcının yeni yönlendirmesiyle aynı kod tabanından devam edilir.

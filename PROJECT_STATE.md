# INFINITE RIDE — Proje Durumu

Son güncelleme: **16 Kasım 2026**. **Aşama 1 ön kontrolü geçti. Aşama 2 tamamlandı; Aşama 3 sırada.**

## Çalışma kuralı

Kullanıcı 16 Kasım 2026 tarihli yeni talimatıyla Aşama 2–6 için önceden devam onayı verdi. Her aşama aynı dosyalarda ilerler; kritik testler geçmeden sonraki aşamaya geçilmez. Çalışan mekanikler korunur, uygulama çalıştırılır, mümkün testler yapılır, bu dosya güncellenir ve her kararlı aşama yerel commit ile kaydedilir. Harici yayınlama bu yetkinin kapsamında değildir.

Özgün uzun vadeli ürün tanımı `docs/PROJECT_BRIEF.md` içinde korunmuştur. Bu belgedeki tüm oyun hedefleri birden uygulanmaz; kullanıcının aşama sınırlaması ve bu durum dosyası esas alınır.

## Tamamlanan kapsam

- Three.js/WebGL 2 sahnesi; temel ışık, gölge, sis ve gökyüzü.
- Kontrol edilebilir spor motosikleti; gaz, fren, direksiyon, viraja yatış, eğim ve yol dışı tutuş.
- 120 Hz fizik, FPS bağımsız girdi/hareket, odak kaybında güvenli duraklatma.
- Üç kamera; hızla FOV, kokpit görünümü, yol dışı titreşimi, yeniden konumlandırmada kararlı takip.
- Gerçekten devam eden seed tabanlı inişli çıkışlı yol ve temel arazi.
- 12 parça havuzu, 128 m parçalar, 4 m örnekleme, 512 m floating origin.
- KM/H, mesafe, yüzey ve kamera HUD'u; başlangıç/duraklatma; klavye ve çoklu dokunmatik girdi.
- Vite üretim derlemesi; Pages workflow'u; README, otomatik testler ve ZIP teslimi.

## Mimari ve kararlar

Tek çalışma bağımlılığı Three.js; Vite ve Playwright geliştirme araçları. ES Modules. UI framework veya fizik motoru yok; mevcut sürüş gereksinimi için ayrı saf JavaScript fizik modülü daha küçük ve test edilebilir.

`Game` sistemleri birleştirir. `RoadPath` rota ve yüzeyin tek kaynağıdır. `RoadGenerator` ve `TerrainGenerator` aynı örnek ve köşegenleri kullanır. `MotorcyclePhysics` s/d yol koordinatında hareket eder, görünür mesh ile aynı üçgen yüzeyi örnekler. Viraj yardımı yolun açısal hızını izler; oyuncu yön hatasına kumanda eder, tutuş açısal hızı sınırlar. Görsel yatış, fiziksel heading'den ayrıdır. Normal hızlarda rahat yolculuk, yüksek hızda fren gerektiren virajlar hedeflenir.

`WorldManager` parça nesnelerini ve geometri buffer'larını yeniden doldurur. Seed deterministiktir, varsayılan 7049; `?seed=metin` ile değişir. Dünya koordinatları CPU'da double, GPU'da parça/origin çevresinde küçüktür. Mevcut yol işlevi uzunlamasına ilerleyen kıvrımlı bir güzergâhtır; serbest açık dünya veya dallanan yol ağı değildir.

Motosiklet özgün geometrik modeldir; statik parçalar materyale göre birleştirilir, tekerlekler/gidon/kask grupları ayrı animasyon alır. Ağaç ve kayalar InstancedMesh'tir. Kamera önce motosikletin ötelemesini devralır, sonra bakış/çerçevelemeyi yumuşatır; böylece hız arttığında geride kalıp motoru küçültmez. Dinleyiciler AbortController ile kaldırılır; geometri/materyal dispose sorumlulukları modüllerdedir.

## Doğrulama

Son test sayıları, gerçek donanım/FPS ölçümü, ekran görüntüleri ve sınırlar **TEST_REPORT.md** dosyasındadır. Node testleri uzun mesafe davranışını hızlandırılmış simülasyonla kontrol eder; saatlerce kesintisiz gerçek oynanmış gibi değerlendirilmez.

## Bilinen sınırlar ve eksikler

- Dünya, temel açık tepeler ortamıdır. Gelişmiş orman/dağ biyomları ve materyal/atmosfer kalitesi Aşama 2 kapsamıdır.
- Trafik ve fiziksel engel/araç çarpışması yok. Ağaç/kayalar dekor; yol dışı koridoru ±26 m ile sınırlı. R güvenli dönüş sağlar.
- Ses, nitro, kayıt, skor/combo, yarış ve gün/gece yok; bunlara ait sahte düğmeler yok.
- Tutuş sınırını aşan virajda yüksek hız dışarı sürükleyebilir; temel arcade davranışıdır. Tam rijit cisim, lastik temas kuvveti veya ragdoll simülasyonu değildir.
- Gerçek mobil cihaz, Safari/Firefox ve saatler süren fiziksel sürüş henüz denenmedi.
- GitHub Pages için yapılandırma hazır; dış hesaba yayınlama yapılmadı.
- Three.js vendor paketi yaklaşık 545 kB minify / 135 kB gzip; Vite'nin 500 kB uyarısı bu motor paketine aittir, build hatası değildir.

## Sürüm kaydı

Yerel Git deposu `main` dalında tutulur. Aşama 1 commit mesajı: `feat(core): complete stage 1 playable motorcycle foundation`. Uzak depo eklenmedi ve push/yayın yapılmadı. Teslim arşivi: `release/INFINITE-RIDE-Stage-1.zip`; kaynaklar, `dist/` ve son doğrulama çıktıları bulunur, `node_modules/` ve `.git/` dahil değildir.

## Sıradaki işler — yalnızca onaydan sonra

**Aşama 2 / Dünya kalitesi:** mevcut yolu ve fizik testlerini koruyarak orman/dağ ortamı, biyom sistemi, yol tabelaları, bariyerler, atmosfer, materyal/ışık ve model iyileştirmeleri.

Sonraki aşamalar: 3 trafik/çarpışma/sollama; 4 oyun modları; 5 ses/gün-gece/polish; 6 kapsamlı son test ve teslim. Kullanıcı kapsamı değiştirmedikçe bu sıra korunur.

## Aşama 2 kaydı

Dört biyom, 450 m yumuşak biyom geçişi, biyoma göre rota/zemin parametreleri, kıyı denizi ve kayalıkları, dağ kütleleri, yoğun çam/karma orman, yaylalar, instanced çalı/ot/kaya, bariyer, reflektör ve viraj uyarı levhaları eklendi. Güzergâh başlangıç ekranından veya `?biome=forest|coastal|mountain|highland` ile seçilir. Yol/fizik ortak yüzeyi korunur. 15 Node testi ve dört biyom Chromium render/konsol kontrolü geçti; dört biyomun görüntüleri incelendi. Aşama 1'in 21 tarayıcı kontrolü yeni dünyada da geçti. Parça havuzu 50 km testinde sınırlı kalıyor.

## Aşama 3 kaydı

Sedan, hatchback, SUV, spor otomobil, kamyon, otobüs ve motosiklet için özgün birleşik geometriler; iki yönlü trafik, dört yoğunluk ve kapalı seçeneği; 56 nesnelik sabit havuz; eğriliğe göre hız, güvenli takip, boş karşı şeritte sollama ve dönüş eklendi. Süpürülmüş yönlü kutular ile oyuncu/araç ve yol kenarı çarpışmaları, görünür kaza ve kurtarma, gövde boyutları üzerinden yakın geçiş ve tek seferlik sollama olayları var. 21 Node testi (10 dakikalık hızlandırılmış trafik dahil), 5 trafik Chromium senaryosu geçti. Araç ve kaza görüntüleri incelendi. `?test=1&debug=1` sadece otomatik test düzenlemesi için ayrı sürücü açar; normal oyunda erişilmez. Sonraki: Aşama 4 modlar, skor ve yarış.

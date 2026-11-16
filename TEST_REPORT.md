# Aşama 1 doğrulama raporu

Tarih: **16 Kasım 2026**. Sürüm: **0.1.0**. Yalnızca Aşama 1 kapsamı.

## Sonuç

| Kontrol                | Sonuç                                                                          |
| ---------------------- | ------------------------------------------------------------------------------ |
| `npm install`          | Başarılı; kurulumda 0 güvenlik açığı bildirildi                                |
| `npm run dev`          | Yerel Vite sunucusu başlatıldı, oyun çalıştı                                   |
| `npm test`             | **12/12 geçti**                                                                |
| `npm run build`        | Başarılı; üretim paketi `dist/` içinde                                         |
| `npm run test:browser` | Üretim derlemesinde **21/21 kontrol geçti**                                    |
| `npm run test:pages`   | `/renamed-infinite-ride/` alt yolunda oyun açıldı ve sürüldü; hatalı istek yok |
| Tarayıcı konsolu       | Son üretim testinde JavaScript/WebGL hatası yok                                |
| Varlık yüklemeleri     | Son üretim testinde başarısız istek / HTTP hata durumu yok                     |

Build sırasında Three.js vendor paketi için 500 kB parça boyutu uyarısı var. Paket yaklaşık **544.52 kB minify / 134.99 kB gzip**; derleme başarılı. Bu bir eksik import veya çalışma hatası değil.

## Fizik ve sonsuz yol

Node testleri şunları doğruladı:

- Aynı seed aynı yol; farklı seed farklı yol üretir.
- 100 km boyunca yol örnekleri sonlu ve süreklidir; eğim/eğrilik sınırları korunur.
- Fizik yüzeyi, render edilen arazinin aynı köşe/köşegenleriyle üçgen interpolasyonu kullanır.
- Bitişik yol mesh'lerinin kenarları, uzak koordinatlar dahil, tolerans içinde birleşir.
- Gaz kademeli hızlandırır; gaz bırakma yavaşlatır; fren daha güçlü yavaşlatır ve geri gitmez.
- Direksiyon, hareket yönünü ve ardından yanal konumu değiştirir; dururken yana kaydırmaz.
- Yaklaşık 80 km/h test sürücüsüyle **10 km üzeri hızlandırılmış sürüşte** yol takibi ve görünen yükseklik tutarlıdır.
- Yol dışı hızlanma azalır; R kurtarması mesafeyi koruyarak şeride döner.
- Aynı 16 saniyelik girdi **30, 60 ve 144 FPS** render adımlarında aynı fizik sonucunu verir.
- Uzun tab suspension zaman sıçraması sınırlanır; birikmiş fizik zamanı temizlenir.
- Yüksek hızlı takip kamerası floating-origin değişimi boyunca motosikleti yakın tutar.
- **50 km** boyunca yol parçası yenileme ve **10.000 km** koordinata sıçrama sonrası havuz **12 parça** olarak kalır; sahne nesneleri/geometri kimlikleri yeniden kullanılır, yerel koordinatlar küçük kalır.

Bu mesafeler hızlandırılmış otomatik simülasyondur. Gerçekte saatlerce oyun oynandığı veya tarayıcı belleğinin saatlerce profillendiği anlamına gelmez.

## Chromium oynanış testi

Gerçek Chromium 159 render motoru, Windows, 1440×900 masaüstü görünümü; D3D11 üzerinden **NVIDIA GeForce RTX 5060**.

Son gerçek zamanlı gaz testinde:

- Yaklaşık **620 m** ilerleme ve **205 km/h** hıza ulaşma.
- **512 m origin** değişimi ve yeni yol parçası geri dönüşümü.
- Ölçüm anında yaklaşık **60.0 FPS**, **131 draw call**, **76 GPU geometrisi**, **12 aktif parça**.
- Hıza tepki veren FOV ve motosikleti geride bırakmayan kamera.

21 kontrol; açılış, dururken hareketsizlik, gaz/HUD, sonsuz parça döngüsü/rebase, FOV, kamera mesafesi, direksiyon, yol dışı tutuş, fren, R kurtarması, kask/geniş kameralar, duraklatma, devam etme, odak kaybı, yeniden başlatma, başlangıca dönme, mobil düğmeler, dokunmatik gaz, eşzamanlı gaz/direksiyon ve konsol/istek hatalarını kapsar.

390×844 dokunmatik emülasyonda gerçek CDP touch olaylarıyla gaz ve direksiyon birlikte denendi. Portre kadrajı ve HUD konumları ekran görüntülerinde incelendi. Bu test gerçek bir telefonun GPU/ısı/pil veya Safari davranışını doğrulamaz.

İlk headless çalıştırma SwiftShader yazılımsal çizimi seçti ve düşük FPS verdi. GPU arka ucu açıkça seçildiğinde son ölçüm 60 FPS oldu. Düşük güçlü donanımlar için genel bir 60 FPS garantisi verilmez.

Ham sonuçlar: [browser-results.json](artifacts/browser-results.json), [pages-results.json](artifacts/pages-results.json).

## Görsel kontrol ve düzeltilenler

[Başlangıç](artifacts/01-intro.png), [sürüş](artifacts/02-riding.png), [kask](artifacts/03-helmet.png), [geniş takip](artifacts/04-wide.png), [mobil](artifacts/05-mobile.png) görüntüleri incelendi.

- Yüksek hızda kamera gecikmesinin motosikleti fazla küçültmesi giderildi; regresyon testi eklendi.
- Kask kamerası, kafa geometrisi gösterilmeden aynalar/kokpit görünecek şekilde düzenlendi.
- Fairing yüzlerinin yönü ve gaz/fren yük aktarımı düzeltildi.
- Statik motosiklet parçaları materyale göre birleştirilerek çizim çağrıları azaltıldı.
- Şerit çizgisi buffer boyutu sabitlendi, yol dokusunun parça sınırındaki fazı eşlendi.
- Portre görünümünde kamera uzaklığı ve hız göstergesi düzeltilerek motor/dokunmatik düğme çakışması azaltıldı.
- Vite 8'in `manualChunks` fonksiyon imzasına uyum sağlandı.

## Henüz doğrulanmayanlar

- Gerçek mobil donanım, Firefox ve Safari.
- Saatler süren kesintisiz gerçek oyun / GPU bellek profili.
- GitHub hesabına gerçek Pages dağıtımı. Yerel üretim alt-yol testi geçti; workflow hazır.
- Trafik, çarpışma, yarış, ses, biyom ve gece; bu aşamada uygulanmadıkları için test edilmiş gösterilmez.

Windows'ta mevcut Chrome penceresine yapılan computer-use bağlantısı adresi güvenilir biçimde belirleyemediği için araç bu oturumda durdu; o pencereye daha fazla girdi gönderilmedi. Tarayıcı doğrulaması ayrı Playwright/Chromium test sürecinde tamamlandı.

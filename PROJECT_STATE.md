# INFINITE RIDE — Proje durumu

**17 Kasım 2026 · v1.1.1 · GitHub ve Pages yayın hazırlığı**

## Ürün ve sürümler

Tarayıcıda çalışan bağımsız bir 3D motosiklet oyunu. Altı geliştirme aşamasında sonsuz dünya, trafik, Free Ride/Traffic Rush/Race, ses, ayarlar, test ve dağıtım altyapısı tamamlandı. v1.1 arayüzü yeniledi ve oyuncunun otomatik yol takibini kaldırdı. v1.1.1 profesyonel ürün belgeleri, üretim güvenliği ve otomatik yayına odaklanır.

Kaynak deposu `emengin/infinite-ride`, planlanan canlı adres `https://emengin.github.io/infinite-ride/`. Yayın doğrulaması henüz tamamlanmadı; GitHub iş akışları ve canlı kontrol başarılı olmadan yayın tamamlanmış sayılmamalı.

## Mimari

- **Altyapı:** JavaScript ES modülleri, Three.js 0.187.0, Vite 8.3.8. Playwright geliştirme test aracıdır. Backend veya hesap servisi yoktur.
- **Game:** intro/countdown/running/paused/crashed/results yaşam döngüsü. Fizik 120 Hz; çizim, kamera, ses ve UI ayrıdır. Odak kaybı duraklatır ve girdileri temizler.
- **RoadPath/WorldManager:** fizik ve görünür yol aynı 4 m kesit/üçgen yüzeyini örnekler. 12 × 128 m parça ve 512 m floating origin; geometri/buffer'lar yeniden kullanılır.
- **Biyomlar:** Forest, Coastal, Mountain ve Highland. Yaklaşık 1.8 km bölgeler ve 450 m geçişler. Köprü, tünel, deniz, tepeler, instanced bitkiler ve yol detayları.
- **Motosiklet:** arcade fizik, manuel mutlak yön, gerçek yüzey teması, eğim/direnç/fren/tutuş ve nitro. AI yarışçılar açıkça etkinleştirilen yol yardımı kullanır. Devir/vites hesabı ses ve HUD arasında paylaşılır.
- **Trafik:** yedi model ve 56 aktörlük havuz; iki yön, takip/fren, eğri hız sınırı, sollama ve şeride dönüş. Güvenli boşluk yoksa doğum veya manevra ertelenir.
- **Çarpışma:** dünya x-z düzleminde süpürülmüş SAT kutuları; araç/yol kenarı engelleri ve geometrik yakın geçiş mesafesi.
- **Modlar/kayıt:** Rush puan/combo/rekor; üç AI ile 3 km Race, üç kontrol noktası, sıralama, sonuç ve kurtarma cezası. `localStorage` kullanılamazsa oyun devam eder.
- **Atmosfer:** dört saat + 12 dakika dinamik döngü; sınırlı far havuzu, gökyüzü/gölge/sis ve sentezlenen ses. Kalite ve uyarlanan çözünürlük kaynak kullanımını sınırlar.
- **Arayüz:** üç mod kartı, rota/trafik alanı, dijital hız/devir/nitro, mola/ayar/yardım/sonuç, modal odak yönetimi ve tam ekran. Yedi ekran ölçüsünde klavye/dokunma yerleşimi doğrulanmıştır.

## v1.1.1 güvenlik ve yayın kararları

Üretim CSP'si dış bağlantıları, satır içi betikleri ve dinamik betik derlemeyi engeller. Test/snapshot API'si yalnızca geliştirme veya loopback hostlarında açılır; genel yayın adresinde query parametreleriyle etkinleşmez. Tarayıcı testleri aynı üretim paketini hem loopback hem genel host davranışıyla doğrular.

Bağımlılıklar kilitlidir. Actions tam commit kimliklerine sabitlenir; checkout kimlik bilgilerini kalıcı tutmaz. Derleme işi yalnızca kaynak okur; Pages yazma ve OIDC yetkisi dağıtım işine aittir. Pull request'ler yayın yapmaz. Ortam dosyaları, anahtarlar, yerel araçlar, test çıktıları ve bağımlılıklar Git'e eklenmez.

## Doğrulama

v1.1.1 için 34 Node testi, üretim build'i ve dört üretim güvenlik tarayıcı senaryosu geçti. Dokuz dosyalı tam e2e paketi geçti. `npm audit` bilinen açık bildirmiyor. Kaynak ve tam Git geçmişindeki 143 blob üzerinde anahtar taraması geçti; kişisel bilgisayar yolu bulunmadı. GitHub güvenlik ayarları ve canlı yayın kontrolü tamamlanmalıdır.

v1.1.0 uzun sürüş kanıtı: 24 simüle dakikada 16.82 km, gerçek zamanlı devamıyla yaklaşık 17.04 km; sabit 12 parça/56 aktör havuzu ve son 137 geometri/5 doku. Isınma sonrası GC heap aralığı farkı 1.90 MiB; ayrı 12 s RTX 5060/D3D11 ölçümünde yaklaşık 60 FPS. Bu önceki sürüm ölçümüdür; her cihaz veya saatlerce gerçek zamanlı oynanış garantisi değildir.

## Sınırlar ve devam noktası

Stilize geometri ve arcade fizik kullanılır. Tam rijit cisim/ragdoll, çok şeritli otoyollar ve çevrimiçi çok oyunculu yoktur. Gerçek telefon, Safari/Firefox ve uzun süreli donanım koşulları ayrıca doğrulanmalıdır. Kaynak için ayrıca açık kaynak lisansı atanmadı; üçüncü taraf lisansları korunur.

Kalan yayın işleri: depoyu oluşturmak, kaynakları göndermek, Pages/güvenlik ayarlarını açmak ve canlı adresi gerçek tarayıcıda doğrulamak. Sonuçlar bu dosya ve TEST_REPORT içinde güncellenir. Diğer oyun depoları bu çalışmanın kapsamında değildir.

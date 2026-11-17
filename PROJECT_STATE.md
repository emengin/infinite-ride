# INFINITE RIDE — Proje durumu

**17 Kasım 2026 · v1.1.1 · GitHub ve Pages yayını doğrulandı**

## Ürün ve sürümler

Tarayıcıda çalışan bağımsız bir 3D motosiklet oyunu. Altı geliştirme aşamasında sonsuz dünya, trafik, Free Ride/Traffic Rush/Race, ses, ayarlar, test ve dağıtım altyapısı tamamlandı. v1.1 arayüzü yeniledi ve oyuncunun otomatik yol takibini kaldırdı. v1.1.1 profesyonel ürün belgeleri, üretim güvenliği ve otomatik yayına odaklanır.

Kaynak deposu [emengin/infinite-ride](https://github.com/emengin/infinite-ride), yeni özel adres [motobike.emengin.dev](https://motobike.emengin.dev/). Kaynak geçmişi korunarak yayınlandı. İlk GitHub Pages adresinde HTTPS, üretim paketi ve üç modun canlı tarayıcı kontrolü başarılı. Özel alan adı geçişinin HTTPS/canlı doğrulaması aşağıdaki kayıtta ayrıca izlenir.

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

Bağımlılıklar kilitlidir. Actions tam commit kimliklerine sabitlenir; checkout kimlik bilgilerini kalıcı tutmaz. Derleme işi yalnızca kaynak okur; Pages yazma ve OIDC yetkisi dağıtım işine aittir. Pull request'ler yayın yapmaz. Ortam dosyaları, anahtarlar, yerel araçlar, test çıktıları ve bağımlılıklar Git'e eklenmez. GPU'suz CI tarayıcı kontrolleri sabit bir kısa duvar saati beklemesi yerine gerçek sürüş durumunu sınırlı süreyle bekler; FPS ölçümüyle karıştırılmaz.

## Doğrulama

v1.1.1 için 34 Node testi, üretim build'i ve dört üretim güvenlik tarayıcı senaryosu geçti. Dokuz dosyalı tam e2e paketi geçti. `npm audit` bilinen açık bildirmiyor. Kaynak ve yayın öncesi tam Git geçmişindeki 143 blob üzerinde anahtar taraması geçti; kişisel bilgisayar yolu bulunmadı.

[İlk başarılı yayın iş akışı](https://github.com/emengin/infinite-ride/actions/runs/44044933551), temiz kurulum, bağımlılık denetimi, 34 test, üretim build'i, Pages alt-yol testi, güvenlik tarayıcı testi ve dağıtımı tamamladı. Canlı HTTPS adresinde doğru paket yüklendi; Free Ride, Traffic Rush ve Race gerçek klavye gazıyla başlatıldı. Kamera, pause, menü dönüşü ve ses ayarı çalıştı; konsol/runtime/yükleme hatası veya oyun tarafından dış alan isteği görülmedi. Test API'si genel hostta kapalı kaldı.

GitHub secret scanning, push protection, Dependabot güvenlik güncellemeleri ve özel güvenlik bildirimi açıktır. Yayın kontrolünde açık Dependabot ve secret scanning uyarıları sıfırdı. Bu kontroller mutlak güvenlik garantisi olarak yorumlanmaz.

v1.1.0 uzun sürüş kanıtı: 24 simüle dakikada 16.82 km, gerçek zamanlı devamıyla yaklaşık 17.04 km; sabit 12 parça/56 aktör havuzu ve son 137 geometri/5 doku. Isınma sonrası GC heap aralığı farkı 1.90 MiB; ayrı 12 s RTX 5060/D3D11 ölçümünde yaklaşık 60 FPS. Bu önceki sürüm ölçümüdür; her cihaz veya saatlerce gerçek zamanlı oynanış garantisi değildir.

## Sınırlar ve devam noktası

### Özel alan adı geçişi — 17 Kasım 2026

Kullanıcının seçtiği adres `motobike.emengin.dev` olarak GitHub Pages'e kaydedildi. Cloudflare CNAME kaydı `motobike → emengin.github.io` genel DNS'te doğrulandı. Üretim canonical/Open Graph ve README bağlantıları yeni adrese taşındı. Actions dağıtımı `base: './'` ile devam eder; `CNAME` dosyası kullanılmaz. GitHub sertifikayı onayladı ve zorunlu HTTPS açıldı; sertifikanın uç sunuculara yayılması ve gerçek tarayıcı kontrolü henüz beklemede. İlk yayın testleri özel alan adının testi olarak sunulmaz. Diğer iki oyunun adresleri ve ayarları korunur.

Stilize geometri ve arcade fizik kullanılır. Tam rijit cisim/ragdoll, çok şeritli otoyollar ve çevrimiçi çok oyunculu yoktur. Gerçek telefon, Safari/Firefox ve uzun süreli donanım koşulları ayrıca doğrulanmalıdır. Kaynak için ayrıca açık kaynak lisansı atanmadı; üçüncü taraf lisansları korunur.

Yayın kabulü tamamlandı. Sonraki bakım işleri gerçek telefon/Safari/Firefox doğrulaması, oyuncu geri bildirimleri ve bağımlılık güncellemeleridir. Sonraki kod değişikliklerinde mevcut regresyon ve üretim güvenlik testleri korunmalıdır. Diğer oyun depoları bu çalışmanın kapsamında değildir.

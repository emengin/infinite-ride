# Güvenlik politikası

INFINITE RIDE'ın desteklenen sürümü `main` dalındaki güncel yayındır. Oyun statik bir tarayıcı uygulamasıdır; kullanıcı hesabı, sunucu taraflı oturum, veritabanı veya istemciye yerleştirilmiş API anahtarı kullanmaz.

## Güvenlik bildirimi

Şüpheli bir açık [GitHub'ın özel güvenlik bildirimi](https://github.com/emengin/infinite-ride/security/advisories/new) üzerinden iletilebilir. Etkilenen sürüm, tarayıcı ve kişisel veri içermeyen yeniden üretme adımları yeterlidir. Parola, erişim anahtarı veya kişisel bilgi açık issue, yorum ya da pull request içine eklenmemelidir.

## Koruma ve bakım

- Üretim içerik güvenliği politikası uzak bağlantıları, satır içi betikleri ve dinamik JavaScript derlemeyi kısıtlar. Oyun kaynakları aynı yayından yüklenir.
- Ayarlar ve kişisel skorlar bu tarayıcıdaki `localStorage` alanında tutulur. Site verileri silinerek temizlenebilir; paylaşılan veya doğrulanmış bir çevrimiçi skor tablosu yoktur.
- Otomasyon sürücüsü yalnızca geliştirme veya loopback sunucularında kullanılabilir. Genel yayın adresinde URL parametreleriyle test kontrolü açılmaz.
- Bağımlılıklar kilit dosyasıyla kurulur. CI otomatik testleri, üretim derlemesini, Pages alt yolunu, güvenlik kontrollerini ve `npm audit` denetimini çalıştırır.
- Actions eylemleri tam commit kimliklerine sabitlenir; yayın yetkileri test/derleme işinden ayrıdır. Pull request'ler canlıya yayın yapamaz.
- `.env`, özel anahtar ve sertifika dosyaları depoya eklenmez. Oyuna üçüncü taraf servis anahtarı yerleştirilmemelidir.

Temiz bir tarama veya başarılı testler koşulsuz güvenlik garantisi değildir. Yeni uyarılar ve güncellemeler düzenli olarak değerlendirilir. GitHub Pages, siteye bağlantı sırasında standart barındırma bilgilerini işleyebilir; oyunun kendisi analiz veya reklam kodu çalıştırmaz.

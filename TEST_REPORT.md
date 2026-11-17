# INFINITE RIDE v1.1.1 — Doğrulama

**17 Kasım 2026 · Üretim güvenliği ve GitHub Pages yayını**

## Son sonuçlar

| Denetim             | Sonuç                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `npm ci --ignore-scripts` | Temiz kurulum başarılı; 19 paket denetlendi, 0 güvenlik açığı bildirildi                       |
| `npm test`          | **34 / 34 geçti**                                                                                   |
| `npm run build`     | Başarılı; `dist/` hazır                                                                             |
| `npm run test:e2e`  | Dokuz tarayıcı test dosyası başarılı                                                                |
| Çekirdek oynanış    | **21 kontrol**; gaz/fren/yön/kamera, gerçek sürüş/rebase, pause/restart ve dokunma                  |
| Dünya               | **4 biyom** render/konsol kontrolü ve görsel inceleme                                               |
| Trafik              | **6 senaryo**; yedi model, kaza/kurtarma, yakın geçiş ve durağan oyuncuya gelen araç                |
| Modlar              | **6 senaryo**; serbest sürüş, Rush puan/kayıt/sonuç ve gerçek 3 km yarış bitişi                     |
| Polish              | **8 kontrol**; ses çıkışı/RPM/rüzgâr/mute, ayarlar, nitro ve dört saat                              |
| Yeni arayüz/kontrol | **6 kapsamlı kontrol**; manuel yön, tuş bırakma, mod/Enter, modal odak, tam ekran ve 7 ekran ölçüsü |
| Yaşam döngüsü/mobil | **3 kapsamlı kontrol**; köprü/tünel, GPU/listener temizliği, portre/yatay ekran                     |
| Pages               | `/renamed-infinite-ride/` altında üretim paketi açıldı ve sürüldü; hatalı istek yok                 |

Son e2e paketinde JavaScript/WebGL konsol hatası veya runtime exception görülmedi. Asset ve üretim alt-yol yüklemeleri geçti. Three.js vendor parçası yaklaşık **546.46 kB minify / 135.44 kB gzip**; Vite'nin 500 kB uyarısı motor paketinin büyüklüğüdür, build başarısızlığı değildir.

## Üretim güvenliği

Dört yeni tarayıcı senaryosu geçti: genel hostta `?debug=1&test=1` ile test/snapshot API'si açılmıyor; aynı üretim paketi CSP altında sürüş, pause, ayarlar ve kamerayı çalıştırıyor; zararsız satır içi betik ve dış bağlantı denemeleri engelleniyor; açık loopback test otomasyonu regresyonlar için kullanılabiliyor.

`npm audit` üretim ve geliştirme bağımlılıklarında 0 bilinen açık bildiriyor. Tam Git geçmişindeki 143 blob ve mevcut kaynaklar bilinen erişim/özel anahtar desenleriyle tarandı; eşleşme veya kişisel bilgisayar yolu bulunmadı. Bu desen taraması her olası gizli bilgiyi bulma garantisi değildir. Kimlik bilgileri test veya yayın dosyalarına eklenmedi.

CI eylemleri resmi etiketlerin tam commit kimliklerine sabitlendi. Test/derleme işi yalnızca kaynak okur; Pages ve OIDC yayın yetkileri dağıtım işine ayrıldı. Pull request'ler yayın yapmaz. Ortam/özel anahtar dosyaları ignore kurallarıyla korunur.

## GitHub ve canlı yayın doğrulaması

[GitHub deposu](https://github.com/emengin/infinite-ride) ve [HTTPS oyun adresi](https://emengin.github.io/infinite-ride/) yayınlandı. [44044933551 numaralı iş akışı](https://github.com/emengin/infinite-ride/actions/runs/44044933551) başarılı: temiz kurulum, bağımlılık denetimi, 34 Node testi, build, Chromium Pages ve güvenlik senaryoları, ardından Pages dağıtımı. Linux yazılım WebGL testleri performans karşılaştırması olarak kullanılmaz; gerçek sürüş durumunu sınırlı süreyle bekler.

Canlı sayfada yerel üretimle aynı `index-CZhuqqeF.js` paketi ve CSP doğrulandı. Chromium ile gerçek HTTPS adresinde dört kontrol grubu geçti: üretim yüklemesi/güvenlik ve üç modda klavyeyle başlangıç-gaz-kamera-pause-menü döngüsü. Free Ride içinde ses ayarı da uygulandı. Race geri sayımdan sonra sürüşe geçti; canlı test tam yarış bitişini tekrar ölçmez, bu senaryo yerel e2e paketinde ayrıca geçmiştir.

`?debug=1&test=1` parametreleriyle bile genel hostta test API'si erişilemez. Konsol/runtime hatası veya başarısız istek yoktu; oyunun tüm ağ istekleri kendi Pages yolu altında kaldı. Menü ve yarış görüntüleri görsel olarak incelendi. GitHub Pages HTTPS zorunludur; secret scanning, push protection, Dependabot ve özel güvenlik bildirimleri açıktır. Kontrol anında açık bağımlılık ve gizli anahtar uyarıları sıfırdı.

Canlı kontrol kayıtları ve ekran görüntüleri yerel `artifacts/infinite-ride-publish/` klasöründe tutulur; kimlik bilgisi veya yerel yayın araçları dağıtım paketine dahil edilmez.

### Özel alan adı — 17 Kasım 2026

Yeni canlı adres [motobike.emengin.dev](https://motobike.emengin.dev/). [44047665558 numaralı yayın](https://github.com/emengin/infinite-ride/actions/runs/44047665558) başarılı. Yerel üretim build'i, Pages alt yol testi ve dört güvenlik senaryosu yeniden geçti; CI ayrıca temiz kurulum, npm audit ve 34 Node testini çalıştırdı.

- Genel DNS'te `motobike.emengin.dev → emengin.github.io` CNAME kaydı doğrulandı.
- HTTPS 200; normal CA ve alan adı kontrolü açıkken sertifika doğrulandı. Sertifika hatalarını yok sayan seçenek kullanılmadı. GitHub Pages `https_enforced: true`.
- HTTP adresi ve eski `https://emengin.github.io/infinite-ride/` adresi yeni HTTPS köküne 301 yönlendi.
- Üretim paketinde canonical, Open Graph sayfa ve görsel adresleri yeni alan adını kullanıyor. Üç mod gerçek klavye girdisiyle tekrar başlatılıp sürüldü; kamera, pause, menü dönüşü ve ses ayarı çalıştı.
- Yeni genel hostta `?debug=1&test=1` test API'sini açmadı. Konsol/runtime veya başarısız istek yoktu; oyun istekleri aynı alan adında kaldı.
- Pong ve Gencebay Roads HTTPS 200 döndürdü; her ikisinin Pages alan adı, HTTPS ve yayın türü ayarları değişmedi.

Bu kısa canlı kontrol tam 3 km yarış/uzun sürüş testinin tekrarı olarak sunulmaz. Ayrıntılı sonuçlar `custom-domain-results.json`, `custom-domain-workflow.json` ve `custom-live-results.json` içinde yerel olarak saklanır. Yayınlanan v1.1.1 ZIP'i ilk sürüm anlık görüntüsüdür; içindeki eski oyun bağlantısı da yeni adrese yönlenir.

## Fizik, yol ve AI kapsamı

- Seed tutarlılığı; 100 km yol sürekliliği ve eğim/eğrilik sınırları.
- Arazi üçgen interpolasyonu ve bitişik asfalt mesh kenarlarının birleşmesi.
- Dört biyomda gerçek asfalt mesh'ine aşağı raycast; fizik temas yüksekliği ile görünür asfalt eşleşiyor. Köprü ve tünel örnekleri dahil.
- Kademeli gaz, sürtünme/motor freni, fren, FPS bağımsız direksiyon/yatma, yol dışı tutuş, kurtarma.
- 30/60/144 FPS render adımlarının aynı 120 Hz fizik sonucunu üretmesi.
- Yaklaşık 80 km/h AI yol yardımı ile 10 km üzeri simülasyon; yardım yalnızca AI için açıkça etkinleştirilir.
- Oyuncunun beş farklı virajda sıfır direksiyonla dünya yönünü ve sıfır yatışı koruması; tuş bırakılınca karşı direksiyon/salınım oluşmaması; dış sınırın yönü otomatik değiştirmemesi.
- Gaz/fren ve nitro karşılaştırmaları manuel direksiyondan bağımsız düz yol fikstüründe yapılır.
- 50 km yol parçası geri dönüşümü ve 10.000 km koordinata rebase: 12 grup/geometri kimliği korunuyor; GPU'ya giden koordinatlar küçük kalıyor.
- Yedi araç türü, yoğunluk hedefleri ve iki yön; güvenli uzak spawn.
- Frenleyen takip AI'sı, açık yolda tamamlanan sollama ve şeride dönüş; konvoyda dönüş alanı yoksa manevranın reddi.
- On simüle dakika boyunca 56 araçlık havuzun sabit kalması ve aynı şeritte gövde çakışmaması.
- Yüksek hızda süpürülmüş kutu çarpışması ve dar ama çarpışmasız geçiş.
- Canlı trafik ile yarış AI'sında NPC gövde çakışmaması, bitiren rakiplerin ilerlemeye devam etmesi.
- Rush puan kaynakları/combo sonlanması, yarış kontrol noktaları/sıralama/bitiş, bozuk/kapalı depolama toleransı.
- Nitro gücü, yakıt boşalması/kilidi/yenilenmesi; dinamik gün döngüsü ve bozuk ayarların sınırlandırılması.

## Tarayıcı ve görsel doğrulama

Gerçek Chromium 159 render motoru kullanıldı. Masaüstü 1440×900; Windows D3D11 / **NVIDIA GeForce RTX 5060**. Üç saniyelik gerçek klavye gazı sürüşünden sonra yalnızca test ortamındaki kontrolcü 25 simüle saniye boyunca manuel fiziğe gerçek direksiyon girdileri üretti. Toplam yaklaşık 1.13 km ve 157 km/h görüldü; kamera FOV, yol parçası döngüsü ve 512 m origin geçişi doğrulandı. Bu otomatik kontrolcü normal oyunda etkin değildir.

Free Ride 1.5 km üzerinde devam etti. Race geri sayımdan sonra hızlandırılmış gerçek fizik sürücüsüyle **3 km güzergâhı**, üç kontrol noktasını ve bitişi tamamladı. Rush'ta yakın geçiş puanı alındı, kaza sonuç ekranını açtı ve rekor localStorage'da doğrulandı. Bunlar sonuç ekranını doğrudan çağıran sahte testler değildir; gerçek Game.step sistemleri çalıştırılır. Kontrollü trafik/başlangıç düzenlemesi yalnızca `?test=1&debug=1` ile açılan test sürücüsünde yapılır.

Yeni arayüz 1440×900, 1366×768, 1280×720, 1024×600, 390×844, 360×740 ve 844×390 boyutlarında kontrol edildi. 390/360 portre ve 844 yatay dokunmatik emülasyonu kullanıldı; düğmelerin birbirini örtmediği geometrik olarak doğrulandı. Gerçek CDP touch olaylarıyla eşzamanlı gaz/direksiyon ayrıca test edildi. Her ölçüde mod kartları tıklandı, ayarlar değiştirilip uygulandı, sürüş/duraklatma/sonuç/menü dönüşü denendi. Modal Tab/Shift+Tab döngüsü, ↑/↓ mod seçimi, Enter başlatma ve tam ekran aç/kapat testleri geçti.

İncelenen görüntüler: yeni ana menü, HUD, pause, yardım, ayarlar, sonuç ekranları; dizüstü, portre ve yatay düzenler. Mevcut dört biyom/üç kamera/yedi araç/kaza/yarış/Rush/dört saat/köprü/tünel regresyon görüntüleri de yeniden üretildi. Yeni arayüz görüntüleri `artifacts/ui-*.png`; diğer sonuçlar aynı klasördedir.

Web Audio, kullanıcı tıklamasından önce açılmadı. Tıklamadan sonra AudioContext çalıştı; analizör RMS çıkışı sıfırdan farklıydı. Gazla RPM ve rüzgâr parametreleri arttı; ses seviyesi sıfırken RMS <0.0001 oldu. Bu, sinyal/işlev doğrulamasıdır; kayıt stüdyosu düzeyinde öznel ses değerlendirmesi yapıldığı iddia edilmez.

## Önceki uzun sürüş ölçümü — v1.1.0 / 16 Kasım 2026

Manuel fizik ile **24 dakikalık hızlandırılmış tam oyun testi geçti**. En yoğun trafikte yaklaşık **16.82 km** simülasyon sürüşü ve ardından gerçek zamanlı sürüş aralığıyla toplam **17.04 km** ilerleme gerçekleşti. Her 120 simüle saniyede trafik ilerlemeye devam etti; hata/kaza olmadı. **12 dünya parçası**, **56 araçlık havuz**, son durumda **137 GPU geometrisi / 5 doku** vardı. Geometri sayısı ilk kez görülen kaynaklar GPU'ya yüklendikten sonra sabit kaldı.

Isınma sonrası GC ile ölçülen JS heap yaklaşık **7.20–9.10 MiB** aralığındaydı; max–min farkı **1.90 MiB**. Kontrolsüz bir büyüme gözlenmedi; bu, saatlerce bellek sızıntısı bulunmadığına ilişkin kesin bir garanti değildir.

Hızlandırılmış testte JavaScript fizik döngüsü grafik karelerini beklemez; o aralıktaki FPS sayacı performans ölçümü olarak kullanılmadı. Ardından uyarlanan çözünürlük sıfırlanarak tam piksel oranı **1** ile ayrı **12.005 s** gerçek `requestAnimationFrame` ölçümü yapıldı: **721 kare / yaklaşık 60.06 FPS**, p95 **16.7 ms**. Bu aralıkta test kontrolcüsü normal fizik döngüsüne direksiyon/gaz/fren girdileri üretir; sürüşün sonunda hâlâ `running` olduğu doğrulanır. Donanım RTX 5060 / D3D11 / 1440×900, yüksek kaliteydi. Bu çalışma 24 dakikalık hızlandırılmış simülasyondur; saatlerce gerçek zamanlı oynanış olarak sunulmaz.

## Temizleme ve bulunan hatalar

Dispose sonrasında renderer sayacı **0 geometri / 0 doku** gösterdi. Kaldırılmış klavye ve başlangıç düğmesi dinleyicileri artık oyunu etkilemedi; debug erişimi kaldırıldı. Restart yeni dünyalar/AudioContext'ler biriktirmez; mevcut sistemler sıfırlanır.

Kalite kontrolünde düzeltilen önemli sorunlar:

- Yüksek hızda takip kamerasının geride kalması; portrede motosiklet/HUD çakışması.
- Kaskta kokpitin görünmemesi, fairing yüz yönleri ve ters yük aktarımı.
- Sabit olmayan şerit çizgisi buffer boyutu ve parça sınırında doku fazı.
- En yoğun trafikte dönüş alanı olmadan başlayan sollamalar ve sırasız kuyruk ayırması.
- Yarış AI'sında şerit hedefinin her karede değişmesi ve rakiplerin bitişte durması.
- Durağan oyuncuya gelen aracın çarpışmasının atlanması.
- Yatay mobil menü taşması ve ayar kapatma düğmesinin başlık altında kalması.
- Oyuncunun kendi kendine sağa/sola yönelmesi: yol eğriliği yardımı oyuncudan kaldırıldı, yalnızca AI'da açıkça etkinleştiriliyor; kamera oyuncu yönüne bakıyor.
- Yatay menüde yeni dock'un ayar düğmesini örtmesi; 360 px ekranda kamera/fren düğmesi çakışması; sonuç ekranındaki işlevsiz pause düğmesi.
- GPU'suz CI'da sabit süreli gaz kontrolünün erken ölçüm yapması: Pages ve üretim güvenlik testleri gerçek hız eşiğine ulaşmayı zaman sınırıyla bekler.

## Sınırlar

Gerçek telefon GPU/ısı/pil koşulları, Safari/Firefox ve saatlerce duvar saati sürüşü test edilmedi. Üretim alt yol ve canlı Pages kontrolleri geçti. İlk Windows headless denemesinde SwiftShader düşük FPS verdi; donanım D3D11 seçilerek ölçüm yapıldı. Her donanım için 60 FPS garantisi verilmez. Fizik arcade ve görseller stilizedir; tam rijit cisim/ragdoll veya fotogerçekçilik doğrulaması iddia edilmez.

Ham kayıtlar: `browser-results.json`, `world-results.json`, `traffic-results.json`, `modes-results.json`, `polish-results.json`, `interface-results.json`, `audit-results.json`, `pages-results.json`, `security-results.json`, `soak-results.json`.

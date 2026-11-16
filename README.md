# INFINITE RIDE

**The Road Never Ends.** — v1.1.0

Three.js ile geliştirilmiş, tamamen tarayıcıda çalışan bağımsız bir motosiklet oyunu. Sonsuz yollar, dört procedural biyom, iki yönlü trafik ve üç oynanabilir mod içerir. Backend, hesap, ücretli API veya oyun sırasında CDN'den indirilen varlık gerekmez.

## Çalıştırma

Node.js **22.12+** gerekir; önerilen sürüm **24 LTS**.

```sh
npm install
npm run dev
```

Terminalde gösterilen adresi açıp **SÜRÜŞE BAŞLA** düğmesine tıklayın. Motor durarak başlar; **W** tuşunu basılı tutun. Windows PowerShell `npm.ps1` dosyasını engelliyorsa komutlarda `npm` yerine **`npm.cmd`** kullanın; sistem güvenlik ayarını değiştirmeniz gerekmez.

Üretim sürümü:

```sh
npm run build
npm run preview
```

Önizleme: <http://127.0.0.1:4173/>. ZIP içindeki `dist/` hazır statik oyundur. `index.html` dosyasını çift tıklamak yerine HTTP sunucusu kullanın; `file://` üzerinden ES modülleri tarayıcılarca engellenebilir.

## Oyun modları

| Mod              | Oynanış                                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **FREE RIDE**    | Sonsuz sürüş. Trafik, biyom, saat ve kamera seçilebilir. Duraklatma menüsünden yolculuk özeti alınabilir.                                                                            |
| **TRAFFIC RUSH** | Mesafe, hız, sollama, yakın geçiş ve karşı şeritte risk puan getirir. Combo 7 saniye içinde yeni hareketle korunur. Kaza sürüşü bitirir; en iyi skor cihazda saklanır.               |
| **RACE**         | NOVA, ATLAS ve ECHO'ya karşı 3 km yarış. 3 saniyelik geri sayım, 750/1500/2250 m kontrol noktaları, bitiş çizgisi, sıralama ve sonuç ekranı vardır. Kurtarma +3 saniye ceza getirir. |

Rakipler aynı yol yüzeyi ve motosiklet fiziğini kullanır. Trafik araçlarını ve diğer yarışçıları hesaba katarlar. Bitişe ulaşan rakipler çizginin üstünde durmaz, yolu boşaltır.

## Kontroller

| Girdi               | İşlev                                                      |
| ------------------- | ---------------------------------------------------------- |
| W / ↑               | Gaz; basılı tutun                                          |
| S / ↓               | Fren                                                       |
| A D / ← →           | Sola / sağa yönelme                                        |
| Shift               | Gazla birlikte nitro; kullanımda azalır, bırakılınca dolar |
| C / V               | Takip → kask → sinematik kamera                            |
| R                   | Aynı güzergâh noktasında sağ şeride dön; hız sıfırlanır    |
| Esc / sağ üst düğme | Duraklat / devam et                                        |
| F3                  | İsteğe bağlı motor/FPS telemetrisi                         |

Dokunmatik cihazlarda gaz, fren, yön, nitro, kamera ve duraklatma düğmeleri bulunur. Gaz ve yön birlikte tutulabilir. Portre ve yatay yerleşim desteklenir. Pencere veya sekme odağı kaybolunca oyun duraklar ve girdiler bırakılır.

Direksiyon tamamen manueldir: motor yolu kendi kendine takip etmez, tuş bırakıldığında kendiliğinden sağa/sola dönmez. Virajları A/D veya yön tuşlarıyla alın; kamera oyuncunun sürüş yönünü izler. Yüksek hızda tutuş sınırı aşılabilir; virajdan önce frenleyin. Toprakta hızlanma ve tutuş azalır. Bariyer, ağaç/kaya veya araçla çarpışma görünür ve sesli tepki oluşturur. Free Ride ve Race'te güvenli dönüş mümkündür; Rush'ta kaza sonuç ekranına götürür.

v1.1 arayüzü motosikleti gösteren ana menü, üç mod kartı, rota/trafik seçim alanı, dijital hız/devir/nitro göstergesi ve yeni duraklatma/ayar/sonuç ekranları içerir. Ana menüde ↑/↓ mod değiştirir, Enter sürüşü başlatır. Sağ üst düğme desteklenen tarayıcılarda tam ekranı açıp kapatır. Portre ve yatay dokunmatik yerleşimler ayrıca düzenlenmiştir.

## Dünya ve ayarlar

- **Forest Road:** yoğun çam/karma orman, yeşil zemin ve pus.
- **Highland Road:** açık yaylalar, seyrek bitki örtüsü, geniş görüş.
- **Mountain Pass:** yükselen kayalıklar, zirveler ve dağ tünelleri.
- **Coastal Road:** kıyı kayalıkları, deniz ve açık ufuk.

Keşif seçeneğinde biyomlar yaklaşık 1.8 km bölümlerle ve 450 m yumuşak geçişlerle değişir. Viraj/eğim parametreleri ve çevre renkleri birlikte örneklenir. Yol 128 m parçalardan oluşur; 12 parça yeniden kullanılır ve 512 m aralıkla floating origin uygulanır. Köprüler ve dağ tünelleri yolun eğimini takip eder; tünelde far otomatik açılır.

Ayarlar menüsündeki kalite, çözünürlük, kamera, kontrol hassasiyeti, trafik yoğunluğu, biyom, günün saati, hava ve ses gerçek sistemlere bağlıdır. Saat seçenekleri gün doğumu, gündüz, gün batımı, gece ve **12 dakikalık dinamik döngüdür**. Hava açık veya puslu olabilir. Gece motosikletin gerçek spot farı ve yakındaki araçlar için sınırlı bir ışık havuzu kullanılır.

Ayarlar ve rekorlar `localStorage` içinde bu cihazda saklanır. Depolama kullanılamazsa oyun çalışmaya devam eder. Yarış sırasında güzergâh ve trafik kilitlidir; diğer ayarlar değiştirilebilir. Biyom değişikliği motosikleti güvenle sağ şeride alır. Düşük FPS'de çözünürlük ölçeği kontrollü azaltılır; sabit parça ve araç havuzları korunur.

Varsayılan yol seed'i **7049**. Aynı seed ve biyom seçimi aynı yolu üretir. Örnek adresler:

```text
/?seed=benim-yolum
/?biome=coastal&time=sunset&traffic=low
/?mode=race
/?debug=1
```

`?test=1&debug=1` yalnızca regresyon testlerinde senaryo kurma/hızlandırılmış fizik sürüşü için kullanılır. Normal oyunda bu sürücü açılmaz.

## Testler

```sh
npm test
```

34 Node testi; FPS bağımsız fizik, gerçek asfalt mesh'ine raycast ile temas, yol birleşimleri, seed, biyom geçişleri, köprü/tünel, kaynak havuzları, trafik/sollama/çarpışma, yarış AI'sı, skor/kayıt, nitro ve saat döngüsünü kapsar. Yeni regresyonlar girdisiz yön/yatış, tuş bırakma sonrası salınım ve dünya sınırında otomatik yön düzeltme olmamasını doğrular. Gaz/fren/nitro testleri düz bir yol fikstüründe, AI yol yardımı ayrıca açıkça etkinleştirilerek test edilir.

Tarayıcı testleri için bir kez:

```sh
npx playwright install chromium
npm run build
npm run test:e2e
npm run test:soak
```

`test:e2e`, gerekiyorsa üretim önizlemesini başlatır ve klavye/dokunma, dört biyom, trafik, üç mod, ses/ayarlar, yaşam döngüsü, portre/yatay görünüm ve Pages alt yol testlerini sırayla çalıştırır. `test:soak`, 24 dakikalık hızlandırılmış tam oyun sürüşünü ve ayrı bir gerçek zamanlı FPS aralığını denetler. Hızlandırılmış simülasyon sırasında grafik karesi beklenmez; FPS ölçümü ayrıca gerçek `requestAnimationFrame` zamanlarıyla yapılır.

Sonuç JSON'ları ve görüntüler `artifacts/` altındadır. [TEST_REPORT.md](TEST_REPORT.md) gerçek sonuçları ve test sınırlarını belirtir. Windows testleri kullanılabilir GPU için D3D11'i seçer; diğer sistemlerde Chromium'un varsayılan arka ucu kullanılır. Gerçek telefonlar ve bütün tarayıcı/donanımlar için aynı performans garanti edilmez.

## Kod yapısı

| Dizin                   | Sorumluluk                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `src/core/`             | Oyun yaşam döngüsü, girdi, sabit adım, kayıt, performans ve test sürücüsü             |
| `src/world/`            | Tek yol/yüzey kaynağı, biyomlar, arazi, yol yapıları, parça havuzu ve saat            |
| `src/motorcycle/`       | Saf sürüş fiziği ve bağımsız özgün model/animasyon                                    |
| `src/traffic/`          | Araç geometrileri, sabit havuz, takip/sollama AI'sı ve instanced çizim                |
| `src/physics/`          | Dünya koordinatlarında süpürülmüş yönlü kutu çarpışmaları ve geometrik geçiş mesafesi |
| `src/modes/`            | Serbest/Rush oturumu, yarış AI'sı, kontrol noktaları ve bitiş kapısı                  |
| `src/rendering/`        | Render, ışık, gökyüzü, far havuzu ve üç kamera                                        |
| `src/audio/`, `src/ui/` | Web Audio sentezi ve arayüz                                                           |

Yol doğrultusundaki `s` ve sağa doğru `d` metre cinsindedir. Yol ve arazi 4 m örneklemeyi ve üçgen köşegenlerini paylaşır. Motosiklet görünür yol yüzeyini takip eder; bağımsız düz bir fizik zemini yoktur. GPU koordinatları her zaman parça/origin çevresinde küçüktür. Geliştirme kaydı ve devam noktası [PROJECT_STATE.md](PROJECT_STATE.md) dosyasındadır. Özgün ürün hedefi `docs/PROJECT_BRIEF.md` içinde korunmuştur.

## GitHub Pages

1. Projeyi kendi GitHub deponuza gönderin; varsayılan dal `main` olsun.
2. **Settings → Pages → Build and deployment → Source → GitHub Actions** seçin.
3. `.github/workflows/deploy.yml`, `main` push'unda kurulum, Node testleri, üretim build'i ve Chromium alt-yol kontrolü yapıp `dist/` çıktısını yayınlar. Elle de tetiklenebilir.

Vite **`base: './'`** kullanır. Hem kullanıcı kökü hem `https://kullanici.github.io/depo-adi/` altında çalışır. Depo adı değişince base'i değiştirmeniz gerekmez. Mutlak base isterseniz proje deposunda `'/yeni-depo-adi/'`, kullanıcı deposu/özel alan adında `'/'` kullanın. Bütün çalışma varlıkları paketin içindedir. Gerçek GitHub hesabına push veya yayın bu geliştirme oturumunda yapılmadı.

## Bilinen sınırlar

- Görsel tarz özgün, stilize procedural geometridir; fotogerçekçi taranmış/GLB varlık paketi değildir.
- Fizik manuel arcade direksiyon, yüzey takibi ve yönlü kutu çarpışmaları kullanır. AI rakipler açıkça etkinleştirilen yol yardımı kullanır. Tam rijit cisim/ragdoll simülasyonu yoktur.
- Yol her yönde bir şerittir. Genişleyen çok şeritli otoyollar bu sürümde yoktur.
- Sesler dinamiktir ancak sentezlenmiştir; gerçek motosiklet kayıtları kullanılmaz.
- Gerçek mobil donanım, Safari/Firefox, saatler süren duvar saati oynanışı ve canlı GitHub dağıtımı ayrıca doğrulanmalıdır.

## Varlıklar ve lisanslar

Motosiklet/sürücü, yedi trafik modeli, çevre, yapılar, dokular, gökyüzü, kokpit ve sesler proje kodunda üretilir. Dış model, ses, font veya görsel indirilmedi; sistem fontları kullanılır. Çalışma bağımlılığı **Three.js (MIT)**; geliştirme araçları **Vite (MIT)** ve **Playwright (Apache-2.0)**. Three.js lisansı [public/assets/licenses/three.LICENSE.txt](public/assets/licenses/three.LICENSE.txt) içindedir ve `dist/` paketine kopyalanır. Diğer lisanslar ilgili npm paketlerinde bulunur. Kaynak kod için ayrıca bir açık kaynak lisansı seçilmedi; bunu proje sahibi belirleyebilir.

Teknik kaynaklar: [Three.js belgeleri](https://threejs.org/docs/), [Vite Pages dağıtımı](https://vite.dev/guide/static-deploy.html#github-pages), [Web Audio uygulama notları](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).

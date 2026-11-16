# INFINITE RIDE

**The Road Never Ends.** — Aşama 1 / Oynanabilir çekirdek

Tarayıcıda çalışan, Three.js ve Vite ile geliştirilmiş bağımsız bir 3B motosiklet oyunu. Backend, hesap, ücretli API ve oyun sırasında internetten indirilen varlık gerektirmez.

## Başlatma

Node.js **22.12+** (önerilen 24 LTS) gerekir. Proje klasöründe:

```sh
npm install
npm run dev
```

Terminaldeki yerel adresi açın; **SÜRÜŞE BAŞLA** düğmesine tıklayın. Bu aşamada motor durarak başlar, gaz için **W** basılı tutulur. Windows PowerShell `npm.ps1` çalıştırmasını engelliyorsa komutlarda `npm` yerine **`npm.cmd`** kullanın; güvenlik ayarını değiştirmeniz gerekmez.

```sh
npm run build
npm run preview
```

Üretim önizlemesi: <http://127.0.0.1:4173/>. `dist/index.html` dosyasını çift tıklamak yerine HTTP sunucusu kullanın; tarayıcılar `file://` üzerinden ES modüllerini engeller.

## Kontroller

| Girdi                   | İşlev                                      |
| ----------------------- | ------------------------------------------ |
| W / ↑                   | Gaz; basılı tutun                          |
| S / ↓                   | Fren                                       |
| A D / ← →               | Sola / sağa yönelme                        |
| C / V                   | Takip → kask → geniş takip kamerası        |
| R                       | Aynı mesafede sağ şeride dön, hızı sıfırla |
| Esc / sağ üstteki düğme | Duraklat / devam et                        |
| F3                      | FPS ve motor telemetrisi                   |

Dokunmatik cihazlarda gaz, fren, sol/sağ, kamera ve duraklatma düğmeleri bulunur. Gaz ve direksiyon aynı anda kullanılabilir. Sekme veya pencere odağı kaybolursa oyun otomatik duraklar ve girdiler bırakılır.

Virajlar normal hızlarda yol yardımıyla takip edilir. A/D motosikletin yönünü değiştirir; doğrudan yana ışınlamaz. Yüksek hızda tutuş sınırı aşılabilir. Gazı bırakın veya frenleyin; yol dışına çıkarsanız **R** ile geri dönebilirsiniz.

## Bu aşamada çalışanlar

- İvmelenme, hava/yuvarlanma direnci, motor freni, eğim etkisi, fren ve hızla değişen yön tepkisi.
- 120 Hz sabit adımlı fizik; yumuşak yatış, dönen tekerlekler, dönen gidon, yük aktarımı ve fren lambası.
- Özgün geometrik spor motosikleti ve sürücü silueti.
- Hıza göre FOV değişimiyle takip, görünür kokpitli kask ve geniş takip kameraları.
- Seed tabanlı virajlı, inişli çıkışlı, iki şeritli sonsuz yol; banket ve kesintisiz işaretlemeler.
- Fizikle aynı üçgen yüzeyi kullanan arazi; temel tepeler, seyrek ağaçlar ve kayalar.
- 12 adet 128 m yol parçasının yeniden kullanımı; 512 m aralıkla floating origin.
- KM/H, mesafe, otomatik vites göstergesi, yüzey/tutuş durumu; başlangıç ve duraklatma ekranları.
- GitHub Pages üretim paketi ve dağıtım workflow'u.

**Henüz yok:** trafik, araç/engel çarpışmaları, sollama, yarış, skor/combo, nitro, ses, kayıt, biyom geçişleri, gelişmiş orman/dağ ortamı, bariyer/tabela/köprü/tünel, gün/gece ve ayrıntılı ayarlar. Bunlar ilgili sonraki aşamalara aittir. Çevre ağaçları ve kayaları bu aşamada görsel dekorasyondur; fiziksel engel değildir. Shift için sahte bir nitro işlevi veya tamamlanmamış mod düğmeleri sunulmaz.

## Testler

```sh
npm test
```

Node testleri; seed tutarlılığı, yüzey/üçgen eşleşmesi, yol birleşimleri, gaz/fren/direksiyon, yol dışı sürüş, 30/60/144 FPS eşdeğerliği, uzun sürüş, kamera/rebase ve kaynak havuzunu denetler.

Gerçek Chromium motorunda otomatik oynanış testi:

```sh
npx playwright install chromium
npm run build
npm run preview
# Ayrı bir terminalde:
npm run test:browser
# Depo adı değişmiş gibi bir alt yolda üretim paketi kontrolü:
npm run test:pages
```

Varsayılan hedef `http://127.0.0.1:4173/`. İsteğe bağlı `RIDE_URL` ortam değişkeniyle sunucu adresi değiştirilebilir. JSON sonuçları ve ekran görüntüleri `artifacts/` altına yazılır. Windows'ta test, kullanılabilir donanımı ölçmek için Chromium'un D3D11 arka ucunu seçer; diğer işletim sistemlerinde varsayılan arka uç kullanılır. Son doğrulanmış sonuçlar [TEST_REPORT.md](TEST_REPORT.md) içinde kayıtlıdır. Gerçek telefon ve farklı donanımlar için 60 FPS garantisi verilmez.

## Mimari

- `src/core/Game.js`: yaşam döngüsü, sabit fizik adımı ve sistemlerin birlikte çalışması.
- `src/world/RoadPath.js`: seed, yol çerçevesi, teğet, eğim, eğrilik ve ortak yüzey örneklemesi.
- `src/world/WorldManager.js`: sınırlı parça havuzu ve floating origin.
- `src/world/RoadGenerator.js`, `TerrainGenerator.js`: tekrar kullanılan mesh/buffer/materyaller ve instanced çevre.
- `src/motorcycle/`: saf sürüş fiziği ve ayrı görsel model/animasyon.
- `src/rendering/`: ışık/render ve bağımsız kamera kontrolü.
- `src/core/InputManager.js`, `src/ui/UIManager.js`: klavye/dokunma ve arayüz.

Yol doğrultusundaki `s` ve sağa doğru `d` metre cinsindendir. Arazi ve yol 4 m örnek aralığını ve üçgen köşegenlerini paylaşır. Fizik aynı yüzeyden yükseklik alır; yolun altında bağımsız düz bir fizik zemini bulunmaz. GPU'ya dünya boyutunda koordinatlar gönderilmez. Aynı seed aynı güzergâhı üretir: varsayılan seed **7049**; özel rota için `?seed=benim-yolum`, telemetri için `?debug=1` kullanılabilir.

Aşama ilerledikçe [PROJECT_STATE.md](PROJECT_STATE.md) güncellenecek. Aşama 2 bu teslimde başlatılmadı.

## GitHub Pages

1. Bu klasörü bir GitHub deposuna gönderin; varsayılan dal `main` olsun.
2. Deponun **Settings → Pages → Build and deployment → Source** alanında **GitHub Actions** seçin.
3. `.github/workflows/deploy.yml`, `main` push'unda test/build yapar ve `dist/` çıktısını Pages'e yükler. Actions sekmesinden elle de çalıştırılabilir.

`vite.config.js` içindeki **`base: './'`**, hem `https://kullanici.github.io/depo/` hem kök alan adı için göreli varlık yolları üretir. Depo adı değiştiğinde base'i değiştirmeniz gerekmez. Sabit bir mutlak base tercih ederseniz proje deposunda `'/yeni-depo-adi/'`, kullanıcı deposu veya özel alan adında `'/'` kullanın. Tüm oyun varlıkları paketlenir; CDN bağımlılığı yoktur. GitHub hesabında gerçek dağıtım henüz yapılmadı.

## Varlıklar ve lisanslar

Motosiklet, sürücü, bitkiler, kayalar, arazi, gökyüzü ve asfalt dokusu proje içinde özgün kodla üretilir. Dış model, ses, font veya görsel indirilmedi. Sistem fontları kullanılır. Three.js **MIT**, Vite **MIT**, Playwright **Apache-2.0** lisanslıdır; lisans metinleri ilgili npm paketlerinde bulunur. Dağıtılan Three.js motorunun lisansı ayrıca [public/assets/licenses/three.LICENSE.txt](public/assets/licenses/three.LICENSE.txt) dosyasındadır ve üretim paketine de kopyalanır. Bu teslim proje kaynak kodu için ayrıca bir açık kaynak lisansı seçmez; bunu proje sahibi belirleyebilir.

Teknik başvuru: [Three.js belgeleri](https://threejs.org/docs/), [Vite GitHub Pages dağıtımı](https://vite.dev/guide/static-deploy.html#github-pages).

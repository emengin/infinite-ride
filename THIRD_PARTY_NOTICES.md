# Varlıklar ve üçüncü taraf lisansları

## Özgün içerikler

Motosiklet, sürücü, trafik araçları, arazi, yol yapıları, bitki örtüsü, dokular, gökyüzü, kokpit ve arayüz simgeleri proje kodunda oluşturulur. Sesler Web Audio API ile sentezlenir. Çalışma sırasında dış model, font, müzik, görsel, CDN veya yapay zekâ servisi çağrılmaz.

Proje OpenAI Codex yardımıyla geliştirilmiştir. Bu geliştirme aracı oyunun çalışma bağımlılığı değildir. Slow Roads ve Traffic Rider türün tasarım referanslarıdır; bu oyunların kaynak kodu, modelleri, sesleri veya markaları kullanılmamıştır.

## Bağımlılıklar

| Bileşen    | Sürüm   | Lisans     | Rol                                    |
| ---------- | ------- | ---------- | -------------------------------------- |
| Three.js   | 0.187.0 | MIT        | WebGL çizimi, geometri, ışık ve kamera |
| Vite       | 8.3.8   | MIT        | Geliştirme ve üretim derlemesi         |
| Playwright | 1.65.1  | Apache-2.0 | Geliştirme sırasında tarayıcı testleri |

Three.js lisansı [public/assets/licenses/three.LICENSE.txt](public/assets/licenses/three.LICENSE.txt) içinde korunur ve üretim paketine kopyalanır. Vite ve Playwright lisansları kurulu npm paketlerinde bulunur; üretim oyununun çalışması için bu araçların kurulması gerekmez. `package-lock.json` tam bağımlılık ağacını sabitler.

Kaynak kodu için ayrıca bir açık kaynak lisansı atanmış değildir. Üçüncü taraf bileşenlerin lisansları kendi içerikleri için geçerlidir.

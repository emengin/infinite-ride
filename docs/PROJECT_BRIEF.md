# INFINITE RIDE — Ürün kapsamı ve tasarım

INFINITE RIDE, kesintisiz yolculuk, trafik içindeki risk/ödül ve yapay zekâ rakiplere karşı yarışı aynı tarayıcı oyununda sunar. Tasarım, oyuncunun doğrudan sürüşe ulaşmasına ve kısa bir maç ile uzun serbest yolculuk arasında seçim yapmasına dayanır.

## Oynanış

Oyuncu tek bir motosikleti gaz, fren, manuel direksiyon ve nitroyla kontrol eder. Takip, kask ve geniş takip kameraları farklı görüşler sunar. Yatış, tekerlek hareketi, motor devri, rüzgâr ve arayüz sürüş durumuna tepki verir.

| Mod          | Kural                                                                          |
| ------------ | ------------------------------------------------------------------------------ |
| Free Ride    | Sonsuz serbest sürüş; kullanıcı tarafından bitirilen yolculuk özeti            |
| Traffic Rush | Mesafe/hız/sollama/yakın geçiş puanı, combo, kaza ile biten tur ve yerel rekor |
| Race         | Üç AI rakip, geri sayım, 3 km güzergâh, üç kontrol noktası ve sonuç sıralaması |

Araçlara veya yol kenarı engellerine çarpışma oynanışı etkiler. Güvenli kurtarma Free Ride ve Race'te sürüşü sürdürür; Race süresine ceza ekler. Trafik iki yönlüdür ve yedi araç sınıfı içerir.

## Dünya ve görsel dil

Dört ortam orman, kıyı, dağ ve yayla yollarını temsil eder. Seed tabanlı yol/zemin üretimi, biyom geçişleri, köprüler, tüneller, yol çizgileri ve kenar detayları aynı yüzey verisini kullanır. Sanat yaklaşımı stilize prosedürel geometridir; harici fotogerçekçi model paketi kullanılmaz.

Arayüz turuncu/koyu lacivert bir görsel sistem, mod kartları, motosiklet vitrini, dijital göstergeler ve tutarlı mola/ayar/sonuç ekranlarından oluşur. Klavye ve çoklu dokunma desteklenir.

## Mimari ve kaynak yönetimi

- Sabit 1/120 saniye fizik adımı, bağımsız çizim/kamera güncellemesi.
- Tek yol/yüzey kaynağı, 12 × 128 m dünya parçası ve 512 m floating origin.
- Çevrede instanced çizim; trafikte 56 aktörlük sabit havuz.
- Dünya düzleminde süpürülmüş yönlü kutu çarpışmaları.
- Dört saat ve dinamik gün döngüsü, sınırlı far havuzu, Web Audio sesleri.
- Ayar ve kişisel rekorlar için tarayıcı saklama; oyun sunucusu veya hesap yok.

## Yayın ilkeleri

Üretim yalnızca statik dosyalardan oluşur. Kaynaklar aynı yayından yüklenir; uzaktan kod, reklam, analiz, model veya yapay zekâ servisi kullanılmaz. Test kontrolü genel yayın adresinde açılmaz. Yayın öncesinde bağımlılık, build, oynanış ve tarayıcı güvenlik kontrolleri çalıştırılır.

## Mevcut sınırlar

Arcade fizik ve stilize görseller hedeflenir. Tam rijit cisim/ragdoll, çok şeritli otoyol genişlemesi, çevrimiçi çok oyunculu mod ve sunucu tarafından doğrulanan skor sistemi uygulanmış değildir. Her tarayıcı/donanım için aynı performans taahhüt edilmez. Gerçek doğrulama kapsamı test raporunda tutulur.

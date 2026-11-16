# PROJE: INFINITE RIDE — Sonsuz Motosiklet Sürüş ve Trafik Oyunu

## ROLÜN

Sen kıdemli bir Game Engine Developer, Three.js/WebGL Graphics Engineer, Physics Programmer, Procedural Generation Engineer, Game AI Developer ve UI/UX Designer olarak çalışacaksın.

Amacın bana GitHub Pages üzerinden ücretsiz yayınlayabileceğim, tamamen web tarayıcısında çalışan, üçüncü şahıs ve birinci şahıs kamera seçenekleri bulunan, sonsuz yollarda motosiklet sürdüğüm, trafiğe girdiğim ve yarışabildiğim kaliteli bir 3D oyun geliştirmek.

Bu projeye bir web sitesi değil, bağımsız bir oyun projesi olarak yaklaş.

**Oyun ismi: INFINITE RIDE**

**Oyun sloganı: The Road Never Ends.**

### OYUNUN TEMEL FELSEFESİ

Slow Roads'un sonsuz yolculuk ve huzurlu atmosfer hissini, Traffic Rider'ın hız, trafik, sollama ve motosiklet sürüş deneyimiyle birleştiren özgün bir oyun oluştur.

Fakat iki oyunun kodlarını, modellerini veya tasarımlarını kopyalama. Bu konseptlerden ilham alarak yeni bir oyun geliştir.

Oyuncu ister düşük hızda manzaranın tadını çıkarmalı, ister yüksek hızda araçların arasından geçerek heyecanlı sürüş yapabilmelidir.

Oyunun en önemli özellikleri:

1. Gerçekten sonsuza devam eden yollar.
2. Keyifli ve doğal hissettiren motosiklet fiziği.
3. Yapay zekâ tarafından kontrol edilen canlı trafik.
4. Görsel açıdan güzel ve değişken doğal manzaralar.
5. Trafikte sollama ve risk-ödül mekanikleri.
6. Yarış yapılabilecek oyun modları.
7. Modern, kaliteli ve akıcı bir arayüz.
8. Uzun süre oynandığında performansı bozulmayan bir oyun motoru.

Oyuncunun motosiklet sürdüğünü gerçekten hissetmesini istiyorum.

Bu bir statik demo, animasyonlu landing page veya yalnızca teknik örnek olmayacak.

# 1. TEKNİK ALTYAPI

Teknolojiler:

- Three.js: 3D grafik ve render motoru.
- JavaScript ES Modules: Oyun sistemleri.
- Vite: Build ve geliştirme ortamı.
- HTML5 ve CSS3: Arayüz.
- Web Audio API: Ses sistemi.
- Gerektiğinde uygun bir hafif fizik veya matematik kütüphanesi.

Mümkün olduğunca az ve güvenilir bağımlılık kullan.

Oyun tamamen client-side çalışsın. Backend, veritabanı veya ücretli API gerektirmesin.

Tüm proje GitHub Pages ile uyumlu olsun.

### Kod mimarisi

Aşağıdaki sorumlulukları mümkün olduğunca ayrı modüllere böl:

- Game — Oyun yaşam döngüsü.
- Renderer — Grafik motoru.
- WorldManager — Dünya yönetimi.
- RoadGenerator — Procedural yol üretimi.
- TerrainGenerator — Arazi oluşturma.
- BiomeManager — Çevre ve biyomlar.
- MotorcycleController — Sürüş.
- MotorcyclePhysics — Araç dinamikleri.
- TrafficManager — Trafik oluşturma.
- TrafficAI — Araç davranışları.
- CollisionSystem — Çarpışmalar.
- RaceManager — Yarış mekanikleri.
- CameraController — Kameralar.
- InputManager — Klavye ve mobil kontrol.
- AudioManager — Sesler.
- UIManager — Arayüz.
- SaveManager — LocalStorage kayıtları.
- PerformanceManager — Performans ve optimizasyon.

Modüler yapı mantıklı olsun. Gereksiz soyutlama ve karmaşıklık üretme.

# 2. SONSUZ YOL ÜRETİMİ — ANA MEKANİK

Oyunun dünyası sonsuz bir karayolu sistemi üzerine kurulu olacak.

Oyuncunun her yöne özgürce gidebildiği dev bir açık dünya üretmeye çalışma.

Bunun yerine sürekli ilerleyen ve procedural olarak oluşturulan kaliteli bir sürüş yolu üret.

### Yol yapısı

Yollar şu unsurları içersin:

- İki yönlü trafik.
- Her yönde başlangıçta birer şerit.
- Düzgün şerit işaretlemeleri.
- Yol kenarı asfalt detayları.
- Emniyet şeritleri veya banketler.
- Virajlar.
- Eğimli çıkış ve inişler.
- Vadilerden ve tepelerden geçen güzergâhlar.
- Bariyerler.
- Viraj uyarı işaretleri.
- Yol tabelaları.
- Köprüler.
- Tüneller.

Bazı güzergâhlarda iki şeritli karayolundan daha geniş bir otoyola geçilebilsin. Ancak bunu temel mekanikler çalıştıktan sonra ekle.

### Gerçek sonsuzluk

Oyuncunun önündeki yol parçalarını dinamik üret.

Bir chunk sistemi tasarla.

- Oyuncunun önünde yeterli mesafede yol oluştur.
- Geride kalan chunk'ları temizle veya yeniden kullan.
- Road geometry ve şerit çizgileri kesintisiz birleşsin.
- Keskin ve fiziksel olarak mantıksız dönüşler oluşmasın.
- Yolun zeminle bağlantısı kopmasın.
- Motosiklet yol üzerinde düzgün hizalansın.
- Yol üretimi aynı seed ile tekrar oluşturulabilsin.
- Uzun sürüşlerde koordinat hassasiyetinin bozulmaması için floating-origin veya uygun bir koordinat sistemi uygula.

Yol algoritmasında Catmull-Rom spline, Bezier veya daha uygun bir yöntem kullanabilirsin.

Ancak yalnızca hazır spline nesnesi kullanmakla yetinme. Tanjant, viraj yönü, yol genişliği, eğim, şerit konumu ve trafik hareketini yol geometrisiyle tutarlı tut.

### Çok önemli

Görsel yoldan bağımsız düz bir çarpışma zemini oluşturma. Motor gerçekten görünen yol yüzeyini takip etsin.

Özellikle virajlarda yol geometrisi, motosikletin hareket doğrultusu ve araçların konumu birbirini doğru takip etmelidir.

# 3. DÜNYA VE MANZARA OLUŞTURMA

Oyuncu aynı manzarayı sürekli görmek zorunda kalmamalı.

Procedural Biome System geliştir.

İlk hedef dört ana ortam:

**FOREST ROAD**

Yoğun orman, uzun ağaçlar, yeşil tepeler, yol kenarı çimenleri, uzak dağlar, sabah sisi ve huzurlu atmosfer.

**COASTAL ROAD**

Deniz manzarası, kıyı boyunca virajlı yollar, kayalıklar, açık gökyüzü, kıyı bitki örtüsü ve gün batımı.

**MOUNTAIN PASS**

Yüksek rakım, keskin virajlar, dağlar, kayalık yüzeyler, uçurum bariyerleri, tüneller ve uzun yokuşlar.

**HIGHLAND ROAD**

Geniş tepeler, otlaklar, uzun düzlükler, seyrek ağaçlar, uzaktaki dağ siluetleri ve açık manzara.

### Biyom geçişleri

Bir biyomdan diğerine aniden geçilmesin.

Manzara, bitki örtüsü, arazi renkleri ve çevre detayları kademeli değişsin.

Örnek:

Orman → Seyrek orman → Açık tepeler → Dağ yolu.

Biyomların yol üretim parametreleri farklı olabilsin.

Dağ yollarında daha fazla viraj, kıyı yollarında daha geniş manzaralar, yüksek arazilerde daha uzun düzlükler bulunabilsin.

### Arazi sistemi

Yollar boşlukta duran asfalt şeritleri gibi görünmemeli.

Yolun çevresinde gerçek 3D arazi hissi olmalı.

- Procedural arazi mesh'leri.
- Tepeler ve vadiler.
- Yolun araziye oturması.
- Dağ siluetleri.
- Uzaklık sisi.
- Arazi materyalleri.
- Ağaçlar ve çalılar.
- Kayalar.
- Yol kenarı detayları.
- Çevre nesnelerinin mantıklı dağılımı.

Ağaçları ve çevre objelerini performans için InstancedMesh gibi uygun yöntemlerle çiz.

### Grafik hedefi

Basit düz yeşil zemin, silindir ağaçlar ve gri bir asfalt çizgisi istemiyorum.

İlk sürümde bile manzara bilinçli bir sanat yönetimine sahip olmalıdır.

Fotogerçekçilik şart değil; ancak kaliteli, tutarlı ve atmosferik bir görünüm zorunlu.

# 4. MOTOSİKLET MODELİ

Oyuncunun motoru oyunun merkezinde olacak.

Varsayılan motosiklet modern bir spor motosiklet olsun.

Modelde ayırt edilebilir şekilde şu bölümler bulunsun:

- Ön ve arka tekerlekler.
- Lastikler.
- Fren diskleri.
- Ön amortisör.
- Şasi.
- Depo.
- Sele.
- Gidon.
- Farlar.
- Egzoz.
- Arka stop lambası.
- Sürücü karakteri veya uygun bir sürücü silueti.

Mümkünse açık lisanslı, optimize edilmiş bir GLB/GLTF motosiklet modeli kullan.

Model indiremediğin veya lisansını doğrulayamadığın durumda proje çalışmasını engelleme. Geometrik olarak daha detaylı, özgün bir motosiklet modeli oluştur.

Sadece iki tekerleğe bağlanmış bir kutuyu motosiklet modeli diye teslim etme.

### Model animasyonları

- Tekerlekler hareketle dönsün.
- Gidon viraj yönüne dönsün.
- Motosiklet yatabilsin.
- Sürücü uygun şekilde hareket etsin.
- Frenleme sırasında ön tarafa ağırlık aktarımı hissi olsun.
- Gaz verme sırasında hafif arka süspansiyon etkisi oluşsun.
- Farlar ve fren lambası çalışsın.

Modelin hareketleri fizik sistemindeki durumlarla senkronize olsun.

# 5. MOTOSİKLET FİZİĞİ

Bu sistem oyunun en önemli parçalarından biridir.

Arcade ve simülasyon dengesi oluştur.

Gerçek fizik hissi önemli fakat oyunu zor veya sinir bozucu hale getirme.

### Hızlanma

Gaz basılı tutulduğunda motosiklet kontrollü hızlansın.

Hız bir anda maksimuma çıkmasın.

Hızlanma karakteristiği hız arttıkça değişsin.

### Frenleme

Fren gerçek bir yavaşlama hissi vermeli.

Fren bırakıldığında motor aniden durmamalı.

Gaz verilmediğinde hafif motor freni veya sürtünme etkisi bulunmalı.

### Direksiyon

Düşük hızlarda direksiyon daha çevik olsun.

Yüksek hızlarda direksiyon hareketleri daha kontrollü gerçekleşsin.

A ve D tuşları motosikleti doğrudan yatay eksende kaydırmasın.

Motosikletin yönü, yol doğrultusu ve sürüş fiziği birlikte güncellensin.

### Yatma mekaniği

Motosiklet viraja girdiğinde doğal şekilde yatsın.

Yatma açısı şu unsurlardan etkilensin:

- Hız.
- Direksiyon girdisi.
- Virajın keskinliği.
- Hareket yönü.
- Kontrol hassasiyeti.

Yatma animasyonu yumuşak olsun.

Motosiklet yatarken fiziksel hareket doğrultusu ile görsel gövde yatışını ayrı hesapla.

Motosiklet virajdan çıktığında doğal biçimde dikleşsin.

### Yol dışına çıkma

Oyuncu asfalt dışına çıkabilsin fakat:

- Tutuş azalsın.
- Hızlanma zorlaşsın.
- Kamera hafif titreşsin.
- Çimen veya toprak üzerinde farklı sürüş hissi oluşsun.

### Kaza sistemi

Araçlara ve çevresel engellere çarpılabilsin.

Kaza şiddeti hız ve çarpışma yönüne göre değerlendirilsin.

İlk sürümde gelişmiş ragdoll sistemi zorunlu değil. Fakat çarpışma sonucu görünür tepki, ekran efekti, ses ve yeniden başlatma mekanizması bulunmalı.

Çarpışma kutuları gerçek model boyutlarına mantıklı biçimde uyum sağlamalı.

### Teknik gereksinimler

- Delta-time kullan.
- Gerekliyse fixed timestep fizik döngüsü oluştur.
- Hareketi FPS değerinden bağımsız yap.
- Kamera ve fizik hesaplarını birbirinden ayır.
- Kontrollerin gecikmesini minimumda tut.
- Girdi yumuşatması kullan ama direksiyon hissini hantallaştırma.

# 6. CANLI TRAFİK SİSTEMİ

Oyunun ikinci en önemli özelliği trafiktir.

Yolda boş boş ilerleyen birkaç kutu istemiyorum.

Gerçek bir trafik deneyimi oluştur.

### Trafik türleri

- Sedan.
- Hatchback.
- SUV.
- Spor otomobil.
- Kamyon.
- Otobüs.
- Diğer motosikletler.

Araçların hepsi aynı modelden oluşmasın.

Farklı renkler, boyutlar ve hız karakteristikleri kullan.

### Trafiğin hareketi

Trafik araçları procedural yol geometrisini takip etmeli.

Araçların yönü yolun gerçek teğetine göre ayarlanmalı.

Öndeki araçla mesafe korunmalı.

Trafik içinde farklı hızlarda araçlar bulunmalı.

Uygun yerlerde sollama davranışları oluştur.

Karşı yönden gelen trafik de bulunmalı.

### Trafik yapay zekâsı

En azından şu davranışları oluştur:

- Lane following.
- Speed control.
- Safe following distance.
- Overtaking decision.
- Collision avoidance.
- Lane change.
- Traffic spawn/despawn.

Araçların hepsi birbirinin içinden geçmemeli.

İlk sürümde gerçekçi trafik kurallarının tamamına ihtiyaç yok. Ancak yapay zekâ davranışları mantıklı, kararlı ve oynanabilir olmalı.

### Trafik oluşturma

Araçlar oyuncunun önünde ve uygun mesafelerde oluşturulsun.

Oyuncunun hemen önünde aniden belirmesinler.

Görüş alanı dışına çıkan araçlar yeniden kullanılabilsin.

Trafik yoğunluğu:

- Low.
- Medium.
- High.
- Extreme.

Yoğunluk arttığında FPS değerinin aşırı düşmesini engelle.

### Trafik etkileşimleri

Oyuncu:

- Araçları sollayabilsin.
- Araçların arasından geçebilsin.
- Karşı yöndeki araçlardan kaçınabilsin.
- Dar aralıklardan geçerek bonus kazanabilsin.
- Yüksek hızda risk alabilsin.

Yakın geçiş algılama sistemi geliştir.

Mesafeyi gerçek çarpışma geometrileri üzerinden hesapla.

# 7. YARIŞ SİSTEMİ

Oyunda üç ana mod bulunacak.

## FREE RIDE

Sonsuz sürüş modu.

Oyuncu hiçbir yarış baskısı olmadan motosiklet kullanır.

Trafik yoğunluğunu, biyomu, hava ve günün saatini değiştirebilir.

Öncelik manzara ve sürüş keyfidir.

## TRAFFIC RUSH

Puan toplama modu.

Puan kaynakları:

- Kat edilen mesafe.
- Yüksek hız.
- Başarılı sollamalar.
- Yakın geçişler.
- Karşı yöndeki trafikte riskli sürüş.
- Çarpışmadan devam etme.

Bir combo sistemi oluştur.

Başarılı hareketler çarpanı artırabilsin.

Çarpışma gerçekleştiğinde combo sıfırlansın veya oyun sona ersin.

Skorlar LocalStorage ile kaydedilsin.

## RACE MODE

Yapay zekâ motosiklet rakiplerine karşı yarış.

Örneğin oyuncu ve 3 AI motosiklet yarışabilir.

Yarış başlangıcında geri sayım olsun.

Rakipler pist olarak kullanılan procedural yol güzergâhını takip etsin.

Yarışın belirli bir mesafe sonunda bitiş çizgisi bulunsun.

Kontrol noktaları, sıralama, süre ve bitiş ekranı oluştur.

Rakiplerin birbirine göre farklı sürüş karakterleri olsun.

Oyuncu yarışı bitirdiğinde sonuç ekranına ulaşabilsin.

**Önemli:** Hiçbir modu sadece menüde görünen sahte bir buton olarak bırakma.

Bir mod eksikse tamamlanmış gibi gösterme.

# 8. KAMERA SİSTEMİ

Üç farklı kamera oluştur.

### THIRD PERSON CAMERA

Varsayılan kamera.

Motosikletin arkasından takip eder.

Yumuşak hareket eder.

Virajlarda motosikletin yatışını ve yolun yönünü doğal biçimde takip eder.

### HELMET CAMERA

Birinci şahıs sürüş kamerası.

Kamera sürücünün kafa hizasında olsun.

Hız hissi belirgin olmalı.

Direksiyon ve motosikletin ön bölümleri uygun şekilde görünebilmeli.

### CINEMATIC CAMERA

Daha uzakta bulunan sinematik takip kamerası.

Motosikleti ve yolun çevresini daha geniş bir açıyla göster.

### Dinamik kamera davranışları

- Hız arttığında FOV yükselsin.
- Hızlanmada hafif kamera gecikmesi olsun.
- Frenlemede uygun kamera hareketi oluşsun.
- Virajlarda yumuşak takip olsun.
- Yol dışına çıkıldığında titreşim ekle.
- Çarpışmada kamera tepkisi oluştur.

Kamera asla yolun altına girmemeli veya motosikleti kaybetmemeli.

# 9. GRAFİK MOTORU VE GÖRSEL KALİTE

Görsel hedefim sıradan bir JavaScript demosundan çok daha yüksek.

Modern, atmosferik, temiz, kaliteli bir 3D oyun istiyorum.

### Işıklandırma

- Directional sunlight.
- Ambient/environment lighting.
- Soft shadows.
- Atmospheric fog.
- Gün doğumu renkleri.
- Gün batımı renkleri.
- Gece ışıklandırması.

### Gökyüzü

- Doğal gökyüzü gradyanı.
- Güneş konumu.
- Günün saatine göre renk değişimleri.
- Bulutlar.
- Hafif atmosferik pus.

### Yol materyali

- Asfalt materyali.
- Yol çizgileri.
- Asfaltın hafif yüzey detayları.
- Yol kenarı doku geçişleri.
- Viraj bariyerleri.
- Tabelalar.

### Araç materyalleri

- Metalik gövde.
- Cam yüzeyler.
- Lastik materyali.
- Farlar.
- Fren lambaları.
- Uygun yansımalar.

### Post processing

Performans elverdiğinde:

- Tonemapping.
- Color grading.
- Hafif bloom.
- Ambient occlusion veya daha ekonomik alternatifleri.
- Uzaklık atmosferi.

Efektleri körü körüne ekleme. Görsel katkısı yüksek, performans maliyeti düşük çözümleri tercih et.

### Sanat yönetimi

Görsel tutarlılık çok önemli.

Bütün modeller ve materyaller aynı oyunun parçası gibi görünmeli.

Mümkünse mevcut telifsiz ve optimize edilmiş modellerle kaliteyi artır.

Dış varlıklar kullanıyorsan lisansları README içinde belirt.

# 10. GÜN VE GECE DÖNGÜSÜ

Oyun dünyasında zaman değişebilsin.

Seçenekler:

- Sunrise.
- Day.
- Sunset.
- Night.
- Dynamic Cycle.

Günün saatine göre:

- Gökyüzü değişsin.
- Güneş açısı değişsin.
- Gölge yönleri güncellensin.
- Ortam ışığı değişsin.
- Araç farları devreye girsin.
- Yolun atmosferi değişsin.

Gece sürüşünde yol tamamen görünmez hale gelmesin.

Motosikletin farı ön yolu aydınlatsın.

# 11. SES MOTORU

Sürüş hissi ses olmadan eksik kalır.

Web Audio API veya uygun telifsiz ses dosyaları kullan.

### Motosiklet sesi

- Rölanti.
- Hızlanma.
- Yüksek devir.
- Gaz bırakma.
- Frenleme.
- Rüzgâr sesi.

Motor sesi hız ve gaz girdisiyle dinamik değişsin.

Sabit bir ses dosyasını sürekli aynı şekilde oynatma.

### Çevre sesleri

- Trafik araçları.
- Yakın geçen araçlar.
- Çarpışma.
- Yol dışı sürüş.
- Menü etkileşimleri.
- Gerektiğinde hafif atmosferik sesler.

Tarayıcıların ses başlatma politikalarına uygun davran. Ses kullanıcı etkileşiminden sonra başlatılsın.

# 12. KLAVYE VE MOBİL KONTROLLER

Masaüstü:

W: Gaz.

S: Fren.

A: Sola yönel.

D: Sağa yönel.

Shift: Nitro.

C: Kamera değiştir.

R: Motosikleti sıfırla.

ESC: Pause.

V: Kamera perspektifi seçimi veya bakış tercihi.

Fare ile menü etkileşimleri yapılabilsin.

Gerekirse fare ile kameraya bakma özelliği ekle. Ancak fare kullanımı sürüşü bozmasın.

Mobil:

- Gaz butonu.
- Fren butonu.
- Sol ve sağ kontrol.
- Kamera değişimi.
- Nitro.
- Pause.

Mobil ekran üzerinde butonların konumu ergonomik olsun.

# 13. KULLANICI ARAYÜZÜ

Bu oyun için modern bir arayüz tasarla.

Görsel dil:

- Koyu antrasit.
- Kırık beyaz.
- Kontrollü neon turuncu veya limon yeşili vurgu rengi.
- Modern sans-serif tipografi.
- Minimal ama etkileyici animasyonlar.

Oyun arayüzünü yarış oyunu hissi verecek şekilde tasarla.

### ANA MENÜ

Tam ekran 3D arka plan.

Arka planda motosikletin bulunduğu sinematik bir sahne veya aktif oyun dünyası.

Büyük INFINITE RIDE logosu.

The Road Never Ends sloganı.

Menü:

- FREE RIDE
- TRAFFIC RUSH
- RACE
- SETTINGS
- HOW TO PLAY

Menüler güzel geçiş animasyonlarına sahip olsun.

### OYUN EKRANI

- Büyük ama görüşü kapatmayan KM/H göstergesi.
- Kat edilen mesafe.
- Skor.
- Nitro durumu.
- Kamera göstergesi.
- Yarış sıralaması.
- Yarış zamanı.
- Combo çarpanı.

Bilgiler modlara göre gösterilsin.

### AYARLAR

- Grafik kalitesi.
- Çözünürlük ölçeği.
- Trafik yoğunluğu.
- Ses seviyesi.
- Kamera tercihi.
- Kontrol hassasiyeti.
- Günün saati.
- Biyom tercihi.

Ayarlar gerçek oyun sistemlerine bağlı olsun.

### PAUSE MENÜSÜ

- Resume.
- Restart.
- Settings.
- Main Menu.

### OYUN SONU EKRANI

- Toplam mesafe.
- Maksimum hız.
- Skor.
- Başarılı sollama.
- Yakın geçiş sayısı.
- Yarış pozisyonu.
- Yeniden dene.

UI bileşenleri gereksiz yer kaplamamalı. Oyuncu her zaman 3D dünyayı rahatça görebilmeli.

# 14. PERFORMANS MÜHENDİSLİĞİ

Oyunun saatlerce çalışabilecek bir temel üzerine kurulmasını istiyorum.

Bu yüzden performansı geliştirme sürecinin başından itibaren düşün.

### Hedefler

- Orta seviye bilgisayarlarda 60 FPS hedefi.
- Desteklenen mobil cihazlarda mümkün olduğunca akıcı deneyim.
- Uzun süreli sürüşte kontrol altında tutulan bellek tüketimi.
- Minimum gereksiz draw call.
- Düzgün garbage collection davranışı.

### Teknikler

- Object pooling.
- InstancedMesh.
- Geometry reuse.
- Material reuse.
- Chunk lifecycle management.
- Frustum culling.
- LOD.
- Adaptive pixel ratio.
- Delta-time.
- Fixed timestep physics.
- Gereksiz sahne güncellemelerini azaltma.

Oyunun uzun süreli çalışmasında:

- Sürekli biriken road mesh'ler olmamalı.
- Eski trafik araçları bellekte kalmamalı.
- Event listener sızıntıları olmamalı.
- Gereksiz materyal ve texture kopyaları oluşmamalı.

Gerekirse FPS ve temel performans bilgilerini gösteren isteğe bağlı debug paneli ekle.

# 15. OYUN KALİTESİ VE HİS

Bu bölüm en az teknik maddeler kadar önemlidir.

Oyunun oynanışı zevkli olmak zorunda.

Özellikle şu durumları test et:

**Durum 1 — Sakin yolculuk**

Oyuncu ormanlık bir yolda 70–90 KM/H hızla gider.

Ağaçlar ve manzara akıcı geçer.

Yolun virajları doğal hissedilir.

Kamera motosikleti güzel takip eder.

**Durum 2 — Yüksek hız**

Oyuncu 180 KM/H hıza ulaşır.

Kamera FOV değişir.

Rüzgâr sesi artar.

Yol ve trafik daha hızlı akıyormuş gibi hissedilir.

Kontroller hassas fakat yönetilebilir kalır.

**Durum 3 — Trafik sollama**

Oyuncunun önünde yavaş bir otomobil vardır.

Oyuncu karşı şeridi kontrol ederek sollama yapabilir.

Yakın geçiş sistemi doğru çalışır.

Araç çarpışmaları gerçek şekilde algılanır.

**Durum 4 — Keskin viraj**

Oyuncu dağ yolunda viraja girer.

Motosiklet doğal biçimde yatar.

Kamera hareketi takip eder.

Hız fazla olduğunda yol dışına çıkma riski oluşur.

**Durum 5 — Uzun sürüş**

Oyuncu uzun süre ilerler.

Yol bitmez.

Yeni manzaralar oluşur.

Trafik devam eder.

Performans giderek bozulmaz.

Bu senaryoları projenin temel kabul testleri olarak kullan.

# 16. GITHUB PAGES YAYINLAMA

Proje GitHub Pages ile tam uyumlu olacak.

Şunları hazırla:

- package.json.
- vite.config.js.
- index.html.
- src klasörü.
- public/assets klasörü.
- README.md.
- .gitignore.
- GitHub Actions deployment workflow.

Vite için GitHub Pages base path konusunu doğru yönet.

Repository adı değişse bile yapılandırmanın nasıl güncelleneceği README'de açıklansın.

npm install, npm run dev ve npm run build komutları düzgün çalışmalı.

Production build sırasında hata olmamalı.

Asset path'leri GitHub Pages üzerinde bozulmamalı.

GitHub Actions ile otomatik yayınlama yapılandırması ekle.

GitHub Pages'in statik hosting sınırlarına uygun davran.

# 17. GELİŞTİRME AŞAMALARI

Proje büyük olduğu için kontrollü geliştir.

Ancak bana sürekli soru sorma ve aşamaları yalnızca açıklamakla yetinme.

Gerçek kodu oluştur.

### AŞAMA 1 — OYNANABİLİR ÇEKİRDEK

- Three.js sahnesi.
- Çalışan motosiklet kontrolü.
- Sürüş fiziği.
- Dinamik kamera.
- Sonsuz yol üretimi.
- Temel arazi.
- Hız göstergesi.

Bu aşamanın sonunda motosiklete binip gerçekten yol alabilmeliyim.

### AŞAMA 2 — DÜNYA KALİTESİ

- Orman ve dağlık ortam.
- Biyom sistemi.
- Yol tabelaları.
- Bariyerler.
- Atmosfer.
- Daha iyi materyaller.
- Işıklandırma.
- Motosiklet modelinin iyileştirilmesi.

Bu aşamanın sonunda sürüş ortamı görsel olarak etkileyici olmalı.

### AŞAMA 3 — TRAFİK

- AI araçlar.
- Şerit takibi.
- Farklı araç modelleri.
- Takip mesafesi.
- Araç yoğunluğu.
- Çarpışmalar.
- Sollama sistemi.

Bu aşamanın sonunda trafikte gerçekten sürüş yapabilmeliyim.

### AŞAMA 4 — OYUN MODLARI

- Free Ride.
- Traffic Rush.
- Race Mode.
- Skor.
- Combo.
- AI yarışçılar.
- Yarış sonuçları.

### AŞAMA 5 — POLISH

- Modern ana menü.
- Ses sistemi.
- Gün/gece döngüsü.
- Kamera iyileştirmeleri.
- Hız efektleri.
- UI animasyonları.
- Kontrol iyileştirmeleri.
- Performans optimizasyonu.

### AŞAMA 6 — TEST VE TESLİM

- Build kontrolü.
- Konsol hatalarının kontrolü.
- Girdi testleri.
- Sonsuz yol testi.
- Trafik AI testi.
- Çarpışma testi.
- Yarış testi.
- FPS ölçümü.
- GitHub Pages uyumluluğu.

Gerçekten kontrol edemediğin veya test edemediğin şeyleri test edilmiş gibi gösterme.

# 18. KESİNLİKLE İSTEMEDİĞİM ŞEYLER

- Sadece düz bir yol ve basit birkaç geometrik şekil.
- Dekoratif ama kontrol edilemeyen motosiklet.
- Sonsuz gibi görünüp kısa mesafede biten yol.
- Asfaltın altında kalan motosiklet.
- Virajlara uyum sağlamayan trafik.
- Araçların birbirinin içinden geçmesi.
- İçeriği boş menü butonları.
- Çalışmayan yarış modu.
- Gereksiz bağımlılıklar.
- Güzel görünen ama oynanamayan prototip.
- Birinci şahıs kamera diye motosikletin gövdesinin içine yerleştirilmiş kamera.
- Hız değişse bile aynı kalan kamera ve ses.
- Kullanılmayan fonksiyonlarla şişirilmiş kod.
- Eksik importlar.
- GitHub Pages'de açılmayan asset dosyaları.
- Sadece README ve iskelet oluşturup projenin tamamlandığını söylemek.
- Gerçekte yapılmamış testleri yapılmış gibi göstermek.

# 19. KALİTE ÖNCELİĞİ VE KAPSAM YÖNETİMİ

Zorunlu öncelik sırası:

1. Stabil motosiklet hareketi.
2. Kesintisiz sonsuz yol.
3. Yol ile uyumlu kamera.
4. Trafik ve çarpışmalar.
5. Görsel olarak kaliteli dünya.
6. Sürüş hissi ve ses.
7. Oyun modları.
8. Arayüz ve ek efektler.

Bütün özellikleri aynı anda yüzeysel biçimde yapma.

Öncelikle temel mekanikleri kaliteli ve güvenilir hale getir.

Geliştirme kaynakları sınırlıysa onlarca kalitesiz özellik üretmek yerine az sayıda ama çalışan ve iyi tasarlanmış mekanik geliştir.

Ancak nihai hedefin bütün sistemleri tamamlamak olsun.

Her yeni özelliği mevcut çalışan oyunla entegre et.

Kod değişikliklerinde daha önce çalışan sistemleri bozmamaya dikkat et.

# 20. TESLİMAT VE SON TALİMAT

Projeyi gerçek dosyalar halinde oluştur.

Sadece uzun kod açıklamaları gönderme.

Çalıştırılabilir proje klasörü ve ZIP arşivi hazırla.

README içinde geliştirme, build ve GitHub Pages yayınlama komutları bulunmalı.

Mümkünse gerçek tarayıcıda oyun sahnesini açıp kontrol et.

Oyun açılmıyorsa bunu tespit edip düzelt.

Teslim sonunda:

- Gerçekten çalışan özellikleri belirt.
- Eksik özellikleri açıkça belirt.
- Yapılan testleri ve sonuçlarını yaz.
- Projeyi indirmem için dosya bağlantısı sağla.

**En önemli son talimat:**

Bu oyunu bir web sitesi olarak değil, oyuncunun uzun süre vakit geçirmek isteyeceği gerçek bir 3D motosiklet oyunu olarak geliştir.

Bana sadece çalışan bir yazılım değil; keyifli kontrolleri, güzel manzaraları, sonsuz yolları, araç trafiği ve hız hissiyle oyun deneyimi sun.

Hemen geliştirmeye başla. Teknik kararları kendin ver, gerekli dosyaları oluştur, test edebildiklerini test et ve bu oturumda tamamlayabildiğin en iyi çalışan sürümü teslim et.
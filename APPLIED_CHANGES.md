# Uygulanan İyileştirmeler

- Derleme riskleri azaltıldı:
  - `IS_ANDROID`, `DREAM_DATA`, `BackupSnapshot`, `getOfflineAiReply` import/export akışı düzeltildi.
  - `.js` dosyaları tek kaynak olacak şekilde `.ts/.tsx` dosyalarına yönlendirildi.
- Veri mimarisi geliştirildi:
  - `src/data/dreams.ts`
  - `src/features/finance.ts`
  - `src/services/persistence.ts`
- Kalıcılık (persistence) düzeltildi:
  - premium, bildirimler, AI kullanım sayacı, son yedek zamanı, öğünler, harcamalar ve hedefler artık birlikte yükleniyor/kaydediliyor.
  - `Storage.clear()` yerine kapsamlı ama kontrollü reset akışı eklendi.
- Ürün geliştirmeleri eklendi:
  - Bütçe Takibi sekmesi
  - Harcama kayıtları
  - Tasarruf hedefleri
  - Ana ekranda bütçe özeti
- Yedekleme güçlendirildi:
  - export/import artık öğün, harcama ve hedef verilerini de kapsıyor.
  - kullanıcı metinlerinde “Cloud Sync” yerine daha doğru olan “Yerel Yedekleme / Geri Yükleme” dili kullanıldı.

# Fakirmetre Titan - 2. Tur Düzenleme

Bu turda ana hedef `App.tsx` dosyasını parçalamaya başlamak ve bakım kolaylığını artırmaktı.

## Yapılanlar

- `src/types.ts`
  - Ortak type tanımları ayrıldı.
- `src/config.ts`
  - sabitler, storage key'leri, varsayılan ayarlar ve tema accent tanımları ayrıldı.
- `src/theme.ts`
  - tema üretimi ve `Colors` tipi ayrıldı.
- `src/core.ts`
  - storage yardımcıları, analytics, veri setleri ve iş kuralları ayrıldı.
- `src/ui/FakirmettreIcon.tsx`
  - ikon bileşeni ayrı dosyaya taşındı.

## Sonuç

- `App.tsx` artık daha çok ekran akışı ve state yönetimine odaklanıyor.
- yardımcı veri ve iş kuralları merkezi modüllere taşındı.
- bir sonraki turda ekran bileşenleri (`AiAdvisor`, `CloudSync`, `Tournament`, `NotifCenter`, `ResultCard`) ayrı dosyalara taşınabilir.

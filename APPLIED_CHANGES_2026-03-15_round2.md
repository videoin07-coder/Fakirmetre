# Fakirmetre geliştirme turu — 2026-03-15

Bu turda yapılan ek geliştirmeler:

- Aylık bütçe limiti alanı eklendi
- Bu ay harcama / kalan bütçe / doluluk yüzdesi paneli eklendi
- Ana sayfa bütçe özeti aylık odaklı hale getirildi
- Harcama listesine arama eklendi
- Harcama listesine filtreler eklendi: Tümü / Bu Ay / kategori bazlı
- Harcama kayıtlarına tarih bilgisi eklendi
- Harcama kayıtlarına silme aksiyonu eklendi
- Harcamalar ve hedefler için dışa aktarma (paylaşım raporu) eklendi
- Hedef kartlarına +₺250 hızlı katkı eklendi
- Hedef kartlarına silme aksiyonu eklendi
- Kategori dağılımı için görsel mini bar içgörüsü eklendi
- Ayarlar ekranına aylık bütçe özeti kartı eklendi
- Aylık bütçe limiti kalıcı depolamaya dahil edildi

Kod tarafında:
- finans yardımcıları genişletildi (`isSameMonth`, `getMonthlyExpenseTotal`, `getCategoryDistribution`)
- persist katmanı yeni `monthlyBudgetLimit` alanını destekleyecek şekilde güncellendi

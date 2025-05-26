// quick-test.ts - Hızlı test için
import { kafkaProducerInit, sendMessage, createTopic } from '../kafka/producer';
import { kafkaConsumerInit } from '../kafka/consumer';

const quickTest = async (): Promise<void> => {
  console.log('🚀 Hızlı Kafka Testi Başlıyor...\n');

  try {
    // 1. Producer'ı başlat
    console.log('1️⃣ Producer başlatılıyor...');
    await kafkaProducerInit();
    console.log('✅ Producer hazır\n');

    // 2. Topic oluştur
    console.log('2️⃣ Topic oluşturuluyor...');
    await createTopic('test-topic');
    console.log('✅ Topic hazır\n');

    // 3. Consumer'ı başlat (background'da çalışsın)
    console.log('3️⃣ Consumer başlatılıyor...');
    kafkaConsumerInit().catch((error: unknown) => {
      console.error('Consumer hatası:', error);
    });
    
    // Consumer'ın hazır olması için bekle
    console.log('⏳ Consumer hazırlanıyor (3 saniye)...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Consumer hazır\n');

    // 4. Test mesajları gönder
    console.log('4️⃣ Test mesajları gönderiliyor...\n');
    
    const testMessages = [
      'Merhaba Kafka!',
      'Bu bir test mesajıdır',
      'TypeScript ile Kafka testi',
      `Zaman: ${new Date().toLocaleString('tr-TR')}`,
      'Son test mesajı'
    ];

    for (let i = 0; i < testMessages.length; i++) {
      const message = `${i + 1}. ${testMessages[i]}`;
      console.log(`📤 Gönderiliyor: ${message}`);
      
      await sendMessage('test-topic', message);
      console.log(`✅ Gönderildi!\n`);
      
      // Mesajlar arasında 1 saniye bekle
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('🎉 Test tamamlandı! Consumer loglarını kontrol edin.\n');
    console.log('💡 Test\'i durdurmak için Ctrl+C kullanın.');

  } catch (error: unknown) {
    console.error('❌ Test hatası:', error);
    process.exit(1);
  }
};

// Test'i çalıştır
quickTest();
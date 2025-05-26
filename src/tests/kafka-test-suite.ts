// test-kafka.ts
import { kafkaProducerInit, sendMessage, createTopic, kafkaProducerShutdown } from '../kafka/producer';
import { kafkaConsumerInit, kafkaConsumerShutdown } from '../kafka/consumer';

// Test 1: Basit mesaj gönderme ve alma testi
export const basicTest = async (): Promise<void> => {
  try {
    console.log('\n=== BASİT TEST BAŞLIYOR ===');
    
    // Producer'ı başlat
    await kafkaProducerInit();
    console.log('✅ Producer başlatıldı');
    
    // Topic oluştur
    await createTopic('test-topic', 3);
    console.log('✅ Topic hazır');
    
    // Consumer'ı başlat (non-blocking)
    const consumerPromise = kafkaConsumerInit();
    console.log('✅ Consumer başlatıldı');
    
    // Consumer'ın hazır olması için bekle
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test mesajları gönder
    for (let i = 1; i <= 3; i++) {
      const message = `Test mesajı ${i} - ${new Date().toISOString()}`;
      await sendMessage('test-topic', message);
      console.log(`✅ Mesaj ${i} gönderildi`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ Basit test tamamlandı\n');
    
  } catch (error: unknown) {
    console.error('❌ Basit test hatası:', error);
  }
};

// Test 2: Çoklu mesaj testi
export const bulkTest = async (): Promise<void> => {
  try {
    console.log('\n=== TOPLU MESAJ TESTİ BAŞLIYOR ===');
    
    const messages = Array.from({ length: 10 }, (_, i) => 
      `Toplu mesaj ${i + 1} - ${Date.now()}`
    );
    
    // Paralel gönderim
    const promises = messages.map((message, index) => 
      sendMessage('test-topic', message)
        .then(() => console.log(`✅ Toplu mesaj ${index + 1} gönderildi`))
        .catch((error: unknown) => console.error(`❌ Toplu mesaj ${index + 1} hatası:`, error))
    );
    
    await Promise.allSettled(promises);
    console.log('✅ Toplu mesaj testi tamamlandı\n');
    
  } catch (error: unknown) {
    console.error('❌ Toplu mesaj testi hatası:', error);
  }
};

// Test 3: Hata durumu testi
export const errorTest = async (): Promise<void> => {
  try {
    console.log('\n=== HATA DURUMU TESTİ BAŞLIYOR ===');
    
    // Var olmayan topic'e mesaj göndermeyi dene
    try {
      await sendMessage('nonexistent-topic', 'Bu mesaj hata vermeli');
      console.log('✅ Var olmayan topic testi geçti (topic otomatik oluşturuldu)');
    } catch (error: unknown) {
      console.log('✅ Beklenen hata yakalandı:', error instanceof Error ? error.message : error);
    }
    
    console.log('✅ Hata durumu testi tamamlandı\n');
    
  } catch (error: unknown) {
    console.error('❌ Hata durumu testi hatası:', error);
  }
};

// Test 4: Performance testi
export const performanceTest = async (): Promise<void> => {
  try {
    console.log('\n=== PERFORMANS TESTİ BAŞLIYOR ===');
    
    const messageCount = 100;
    const startTime = Date.now();
    
    // Sıralı gönderim
    for (let i = 1; i <= messageCount; i++) {
      await sendMessage('test-topic', `Perf mesaj ${i}`);
      if (i % 10 === 0) {
        console.log(`✅ ${i}/${messageCount} mesaj gönderildi`);
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const messagesPerSecond = (messageCount / duration) * 1000;
    
    console.log(`✅ Performans testi tamamlandı:`);
    console.log(`   - ${messageCount} mesaj`);
    console.log(`   - ${duration}ms süre`);
    console.log(`   - ${messagesPerSecond.toFixed(2)} mesaj/saniye\n`);
    
  } catch (error: unknown) {
    console.error('❌ Performans testi hatası:', error);
  }
};

// Ana test fonksiyonu
export const runAllTests = async (): Promise<void> => {
  console.log('🚀 KAFKA TEST SÜİTİ BAŞLIYOR...\n');
  
  try {
    await basicTest();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await bulkTest();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await errorTest();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await performanceTest();
    
    console.log('🎉 TÜM TESTLER TAMAMLANDI!');
    
  } catch (error: unknown) {
    console.error('❌ Test süiti hatası:', error);
  } finally {
    // Cleanup
    setTimeout(async () => {
      await kafkaProducerShutdown();
      await kafkaConsumerShutdown();
      console.log('🧹 Temizlik tamamlandı');
      process.exit(0);
    }, 5000);
  }
};

// Tek tek testleri çalıştırmak için
export const runSingleTest = async (testName: 'basic' | 'bulk' | 'error' | 'performance'): Promise<void> => {
  console.log(`🚀 ${testName.toUpperCase()} TEST BAŞLIYOR...\n`);
  
  try {
    // Producer'ı başlat
    await kafkaProducerInit();
    
    // Consumer'ı başlat (non-blocking)
    kafkaConsumerInit().catch(console.error);
    
    // Biraz bekle
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    switch (testName) {
      case 'basic':
        await basicTest();
        break;
      case 'bulk':
        await bulkTest();
        break;
      case 'error':
        await errorTest();
        break;
      case 'performance':
        await performanceTest();
        break;
    }
    
  } catch (error: unknown) {
    console.error(`❌ ${testName} test hatası:`, error);
  }
};

// Eğer bu dosya doğrudan çalıştırılırsa
if (require.main === module) {
  const testType = process.argv[2] as 'basic' | 'bulk' | 'error' | 'performance' | undefined;
  
  if (testType) {
    runSingleTest(testType);
  } else {
    runAllTests();
  }
}
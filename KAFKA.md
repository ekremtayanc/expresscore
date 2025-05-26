# Kafka Test Komutları

## 1. Hızlı Test (Önerilen)

```bash
# TypeScript dosyasını çalıştır
npx tsx quick-test.ts

# Veya JavaScript'e compile edip çalıştır
npx tsc quick-test.ts && node quick-test.js
```

## 2. Tam Test Süiti

```bash
# Tüm testleri çalıştır
npx tsx test-kafka.ts

# Tek bir test çalıştır
npx tsx test-kafka.ts basic
npx tsx test-kafka.ts bulk
npx tsx test-kafka.ts error
npx tsx test-kafka.ts performance
```

## 3. Manuel Kafka Komutları

### Kafka Container'ı Kontrol Et
```bash
# Container'ın çalışıp çalışmadığını kontrol et
docker ps | grep broker

# Kafka loglarını kontrol et
docker-compose logs -f kafka
```

### Topic İşlemleri
```bash
# Topic'leri listele
docker exec -it broker kafka-topics.sh --bootstrap-server localhost:9092 --list

# Topic detaylarını görüntüle
docker exec -it broker kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic test-topic

# Topic oluştur
docker exec -it broker kafka-topics.sh --bootstrap-server localhost:9092 --create --topic test-topic --partitions 3 --replication-factor 1

# Topic sil
docker exec -it broker kafka-topics.sh --bootstrap-server localhost:9092 --delete --topic test-topic
```

### Manuel Producer/Consumer Test
```bash
# Manuel producer başlat
docker exec -it broker kafka-console-producer.sh --bootstrap-server localhost:9092 --topic test-topic

# Manuel consumer başlat (başka terminal'de)
docker exec -it broker kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-topic --from-beginning
```

## 4. Container Yeniden Başlatma

```bash
# Container'ları durdur
docker-compose down

# Volume'ları da temizle (tüm data silinir)
docker-compose down -v

# Yeniden başlat
docker-compose up -d

# Kafka'nın hazır olmasını bekle
docker-compose logs -f kafka
```

## 5. Sorun Giderme

### Bağlantı Sorunları
```bash
# Network'ü kontrol et
docker network ls
docker network inspect <network_name>

# Container'ların aynı network'te olduğunu kontrol et
docker inspect broker | grep NetworkMode
docker inspect express-app | grep NetworkMode
```

### Port Kontrolü
```bash
# Port'un açık olduğunu kontrol et
telnet localhost 9092

# veya
nc -zv localhost 9092
```

### Debug Modunda Çalıştır
```bash
# Kafka'yı debug mode'da başlat
KAFKA_LOG4J_OPTS="-Dlog4j.configuration=file:log4j.properties -Dkafka.logs.dir=/opt/kafka/logs" docker-compose up kafka
```

## 6. Test Senaryoları

### Senaryo 1: Basit Test
1. Container'ları başlat
2. `quick-test.ts` çalıştır
3. Consumer loglarını gözlemle

### Senaryo 2: Yük Testi
1. `test-kafka.ts performance` çalıştır
2. CPU ve memory kullanımını gözlemle

### Senaryo 3: Hata Testi
1. Kafka'yı durdur: `docker-compose stop kafka`
2. Producer'dan mesaj göndermeyi dene
3. Hata yakalama mekanizmasını test et
4. Kafka'yı başlat: `docker-compose start kafka`

### Senaryo 4: Reconnection Testi
1. Consumer'ı başlat
2. Kafka'yı yeniden başlat
3. Consumer'ın otomatik olarak yeniden bağlanıp bağlanmadığını kontrol et

## 7. Beklenen Çıktılar

### Başarılı Test Çıktısı:
```
🚀 Hızlı Kafka Testi Başlıyor...

1️⃣ Producer başlatılıyor...
✅ Producer hazır

2️⃣ Topic oluşturuluyor...
✅ Topic hazır

3️⃣ Consumer başlatılıyor...
✅ Consumer hazır

4️⃣ Test mesajları gönderiliyor...

📤 Gönderiliyor: 1. Merhaba Kafka!
✅ Gönderildi!

Received: 1. Merhaba Kafka!
Topic: test-topic, Partition: 0, Offset: 0
```

Bu test komutlarını kullanarak Kafka kurulumunuzu doğrulayabilirsiniz.
const path = require('path');
// 루트 폴더의 .env 파일 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ .env 파일에 MONGODB_URI가 설정되어 있지 않습니다.');
    process.exit(1);
  }

  try {
    console.log('🔌 MongoDB Atlas에 연결하는 중...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ MongoDB 연결 성공!');

    const db = mongoose.connection.db;
    const collection = db.collection('companies');

    // 1. 전체 기업 수 확인
    const totalCount = await collection.countDocuments({});
    console.log(`📊 DB 내 전체 기업 수: ${totalCount.toLocaleString()}개`);

    // 2. 한국 기업 검색 쿼리 (대소문자 구분 없이 Korea, 한국, 대한민국 매칭)
    const koreaQuery = {
      $or: [
        { 'location.country': { $regex: /korea/i } },
        { 'location.country': { $regex: /한국/ } },
        { 'location.country': { $regex: /대한민국/ } }
      ]
    };

    const koreaCount = await collection.countDocuments(koreaQuery);
    console.log(`📊 대한민국(Korea) 소재 기업 수: ${koreaCount.toLocaleString()}개`);

    // 3. 한국 기업 샘플 5개 출력
    if (koreaCount > 0) {
      console.log('\n--- 📋 대한민국 기업 샘플 (5개) ---');
      const samples = await collection.find(koreaQuery).limit(5).toArray();
      samples.forEach((comp, index) => {
        const city = comp.location?.city || '미정';
        const country = comp.location?.country || '미정';
        console.log(`${index + 1}. [${comp.name}]`);
        console.log(`   - 업종: ${comp.industry || '미지정'}`);
        console.log(`   - 위치: ${city}, ${country}`);
        console.log(`   - 태그: ${comp.tags ? comp.tags.join(', ') : '없음'}\n`);
      });
    } else {
      console.log('⚠️ 한국 소재 기업 데이터가 없습니다.');
    }

  } catch (error) {
    console.error('❌ 스크립트 실행 중 에러 발생:', error.message);
  } finally {
    // 4. 안전하게 연결 끊기
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결이 성공적으로 해제되었습니다.');
  }
}

run();

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { PartnersService } = require('./dist/src/modules/partners/partners.service');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(PartnersService);
  
  console.log('--- Testing "칠레의 자동차부품 금형 수입업체" ---');
  const result = await service.search({ q: '칠레의 자동차부품 금형 수입업체' });
  console.log('Provider:', result.provider);
  console.log('AI Response:', result.aiResponse);
  console.log('Result Count:', result.data.length);
  if (result.data.length > 0) {
    console.log('First Company Name:', result.data[0].name);
    console.log('First Company Country:', result.data[0].location?.country);
    console.log('First Company Website:', result.data[0].website);
    console.log('Full First Company Data:', JSON.stringify(result.data[0], null, 2));
  }
  
  await app.close();
}

bootstrap().catch(err => {
  console.error('Test failed:', err);
});

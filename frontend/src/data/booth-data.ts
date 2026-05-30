// d:\k-statra-project\frontend\src\data\booth-data.ts

export interface BoothExhibitor {
  id: string;
  name: string;
  boothNumber: string;
  country: string;
  industry: string;
  item: string;
  logo: string;
}

const GLOBAL_B2B_NAMES = [
  'Global Sourcing Partners',
  'Mobility & Tooling Alliance',
  'Industrial Parts Importers',
  'Precision Systems Group',
  'Auto & Logistics Solutions',
  'Advanced Engineering Trading',
  'Apex Manufacturing Sourcing',
  'B2B Sourcing Ltd.',
  'Unified Components Group',
  'Horizon Trade Alliance',
  'Vanguard Industrial Imports',
  'Summit Mobility Distributors',
  'Pioneer Precision Parts',
  'Epic Auto & Mold Sourcing',
  'Nova Technical Trading',
  'Quantum Manufacturing Supply',
  'Legacy Automotive Importers',
  'Delta Engineering Logistics',
  'Alpha Smart Factory Sourcing',
  'Omega EV & Tooling Solutions'
];

const PRESETS = [
  { company: 'THACO Auto Parts', industry: 'Automotive / EV Parts', item: '자동차부품 금형' },
  { company: 'VinFast Sourcing Division', industry: 'Automotive / EV Parts', item: '전기차 배터리' },
  { company: 'Bosch Industrial Germany', industry: 'Mobility / Automation / Manufacturing', item: '스마트팩토리' },
  { company: 'Hyundai Mobis Europe', industry: 'Automotive / EV Parts', item: '차량용 샤시' },
  { company: 'Toyota Tsusho Japan', industry: 'Automotive / EV Parts', item: '자동차 조향시스템' },
  { company: 'Siemens Automation', industry: 'Mobility / Automation / Manufacturing', item: '기어박스' },
  { company: 'ZF Group Poland', industry: 'Automotive / EV Parts', item: '기어 펌프' },
  { company: 'Magna International', industry: 'Automotive / EV Parts', item: '자동차 브라켓' },
  { company: 'Denso Sourcing Asia', industry: 'Automotive / EV Parts', item: '차량용 전장부품' },
  { company: 'Continental Tech', industry: 'IT / AI / SaaS', item: 'LIDAR 자율주행' },
  { company: 'Valeo Mobility', industry: 'Automotive / EV Parts', item: '차량용 램프' },
  { company: 'LG Energy Solutions Poland', industry: 'Green Energy / Climate Tech / Smart City', item: '전기차 배터리' },
  { company: 'Samsung SDI Hungary', industry: 'Green Energy / Climate Tech / Smart City', item: '2차전지 설비' },
  { company: 'Panasonic Sourcing', industry: 'IT / AI / SaaS', item: '포터블 TV' },
  { company: 'CATL Europe Sourcing', industry: 'Green Energy / Climate Tech / Smart City', item: '전기차 배터리' },
  { company: 'Delphi Technologies', industry: 'Automotive / EV Parts', item: '차량용 전장부품' },
  { company: 'BorgWarner Propulsion', industry: 'Automotive / EV Parts', item: '기어박스' },
  { company: 'Lear Corporation', industry: 'Automotive / EV Parts', item: '자동차 시트' },
  { company: 'Adient Seating', industry: 'Automotive / EV Parts', item: '자동차 시트' },
  { company: 'Faurecia Automotive', industry: 'Automotive / EV Parts', item: '크래쉬 패드' }
];

const NATIONS = [
  'USA', 'Canada', 'Mexico', 'Brazil', 'Chile', 'Panama', 'Germany', 'France', 'Spain', 'Poland',
  'Hungary', 'Czech Republic', 'UK', 'Vietnam', 'Thailand', 'Indonesia', 'Japan', 'China', 'India',
  'Saudi Arabia', 'UAE', 'Oman', 'Uzbekistan', 'Kazakhstan', 'Kenya', 'Nigeria', 'Egypt', 'Morocco'
];

export function generate250Booths(): BoothExhibitor[] {
  const list: BoothExhibitor[] = [];
  
  // 1. 우선 핵심 실물 20개 프리셋으로 고품질 업체 추가
  PRESETS.forEach((p, idx) => {
    const country = NATIONS[idx % NATIONS.length];
    const letter = String.fromCharCode(65 + (idx % 8)); // A ~ H
    const num = 100 + idx + 1;
    list.push({
      id: `booth_preset_${idx}`,
      name: `${country} ${p.company}`,
      boothNumber: `Booth #${letter}${num}`,
      country,
      industry: p.industry,
      item: p.item,
      logo: country.substring(0, 2).toUpperCase()
    });
  });

  // 2. 250개 요건을 채우기 위해 무작위 조합으로 풍성한 리스트 자동 조립 (중복 배제)
  let count = list.length;
  let nameIndex = 0;
  let presetIndex = 0;
  
  while (count < 250) {
    const country = NATIONS[count % NATIONS.length];
    const baseName = GLOBAL_B2B_NAMES[nameIndex % GLOBAL_B2B_NAMES.length];
    const preset = PRESETS[presetIndex % PRESETS.length];
    
    const letter = String.fromCharCode(65 + (count % 8)); // A ~ H
    const num = 100 + count + 1;
    const companyName = `${country} ${baseName} (#${count})`;

    // 중복 방지
    if (!list.some(item => item.name === companyName)) {
      list.push({
        id: `booth_gen_${count}`,
        name: companyName,
        boothNumber: `Booth #${letter}${num}`,
        country,
        industry: preset.industry,
        item: preset.item,
        logo: country.substring(0, 2).toUpperCase()
      });
      count++;
    }
    
    nameIndex++;
    presetIndex++;
  }

  return list;
}

export const boothExhibitors = generate250Booths();

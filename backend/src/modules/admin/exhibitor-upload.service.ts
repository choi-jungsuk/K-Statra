import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as XLSX from 'xlsx';

// 표준 출력 컬럼
export interface ExhibitorRecord {
  company_name: string;
  company_name_en: string;
  country: string;
  industry: string;
  website: string;
  email: string;
  phone: string;
  contact_person: string;
  source_group: string;
  source_date: string;
  memo: string;
  has_email: boolean;
  type: string; // 'domestic' | 'overseas'
}

// 업로드 이력 저장용
interface UploadHistoryEntry {
  filename: string;
  source_group: string;
  total: number;
  inserted: number;
  skipped_duplicates: number;
  uploaded_at: Date;
  uploaded_by: string;
}

// 컬럼 매핑 후보 (한국어/영문 혼용)
const COLUMN_MAP: Record<string, keyof ExhibitorRecord> = {
  // company_name
  '업체명': 'company_name', '회사명': 'company_name', '기업명': 'company_name',
  '상호명': 'company_name', 'company': 'company_name', 'company_name': 'company_name',
  'name': 'company_name', '회사이름': 'company_name',
  // company_name_en
  '영문명': 'company_name_en', '영문회사명': 'company_name_en', 'company_name_en': 'company_name_en',
  'english_name': 'company_name_en',
  // country
  '국가': 'country', '국가명': 'country', 'country': 'country',
  // industry
  '업종': 'industry', '산업군': 'industry', '업태': 'industry', 'industry': 'industry',
  '품목': 'industry', '제품군': 'industry',
  // website
  '웹사이트': 'website', '홈페이지': 'website', 'website': 'website', 'url': 'website',
  'homepage': 'website',
  // email
  '이메일': 'email', '메일': 'email', 'email': 'email', 'e-mail': 'email',
  '담당자이메일': 'email',
  // phone
  '전화': 'phone', '전화번호': 'phone', '연락처': 'phone', 'phone': 'phone', 'tel': 'phone',
  // contact_person
  '담당자': 'contact_person', '담당자명': 'contact_person', 'contact': 'contact_person',
  'contact_person': 'contact_person', '대표자': 'contact_person',
  // type
  '구분': 'type', '유형': 'type', 'type': 'type',
  // memo
  '비고': 'memo', '메모': 'memo', 'memo': 'memo', 'note': 'memo', '기타': 'memo',
};

@Injectable()
export class ExhibitorUploadService {
  private readonly logger = new Logger(ExhibitorUploadService.name);
  private readonly COLLECTION = 'companies';
  private readonly HISTORY_COLLECTION = 'exhibitor_upload_history';

  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /**
   * 파일 버퍼에서 데이터 파싱 + 컬럼 자동 매핑
   */
  parseFile(buffer: Buffer, originalname: string): ExhibitorRecord[] {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (!rows.length) return [];

    // 헤더 키 정규화
    const headers = Object.keys(rows[0]);
    const fieldMap: Record<string, keyof ExhibitorRecord> = {};
    for (const h of headers) {
      const normalized = h.trim().toLowerCase().replace(/\s+/g, '');
      const mapped = COLUMN_MAP[h.trim()] || COLUMN_MAP[normalized];
      if (mapped) fieldMap[h] = mapped;
    }

    return rows.map((row) => {
      const rec: Record<string, any> = {};
      for (const [srcCol, destCol] of Object.entries(fieldMap)) {
        rec[destCol] = String(row[srcCol] ?? '').trim();
      }

      // type 자동 판단: country가 비어있거나 '한국'/'대한민국'이면 domestic
      const country = rec.country || '';
      if (!rec.type) {
        rec.type = (country === '' || country === '한국' || country === '대한민국' || country === 'Korea' || country === 'South Korea')
          ? 'domestic' : 'overseas';
      } else {
        // 한글 구분값 정규화
        if (rec.type === '국내') rec.type = 'domestic';
        if (rec.type === '해외') rec.type = 'overseas';
      }

      rec.has_email = !!(rec.email && rec.email.includes('@'));
      rec.source_date = rec.source_date || new Date().toISOString().split('T')[0];

      return rec as ExhibitorRecord;
    }).filter(r => r.company_name); // 업체명 없는 행 제거
  }

  /**
   * 중복 감지 프리뷰 (DB 저장 전)
   */
  async previewUpload(
    records: ExhibitorRecord[],
    sourceGroup: string,
  ): Promise<{
    total: number;
    new_records: number;
    duplicates: number;
    no_email: number;
    sample: ExhibitorRecord[];
    duplicate_names: string[];
  }> {
    const collection = this.connection.collection(this.COLLECTION);

    // 기존 DB에서 회사명 목록 가져오기 (정규화 비교)
    const existingDocs = await collection
      .find({}, { projection: { company_name: 1 } })
      .toArray();

    const existingNamesSet = new Set(
      existingDocs.map(d => this.normalizeName(d.company_name || '')),
    );

    const duplicateNames: string[] = [];
    let newCount = 0;

    for (const rec of records) {
      const normalized = this.normalizeName(rec.company_name);
      if (existingNamesSet.has(normalized)) {
        duplicateNames.push(rec.company_name);
      } else {
        newCount++;
      }
    }

    return {
      total: records.length,
      new_records: newCount,
      duplicates: duplicateNames.length,
      no_email: records.filter(r => !r.has_email).length,
      sample: records.slice(0, 10),
      duplicate_names: duplicateNames.slice(0, 20),
    };
  }

  /**
   * DB에 실제 저장 (중복 건너뜀)
   */
  async uploadToDb(
    records: ExhibitorRecord[],
    sourceGroup: string,
    filename: string,
    uploadedBy: string = 'admin',
  ): Promise<{
    inserted: number;
    skipped: number;
    total: number;
  }> {
    const collection = this.connection.collection(this.COLLECTION);

    const existingDocs = await collection
      .find({}, { projection: { company_name: 1 } })
      .toArray();
    const existingNamesSet = new Set(
      existingDocs.map(d => this.normalizeName(d.company_name || '')),
    );

    const toInsert: any[] = [];
    let skipped = 0;

    for (const rec of records) {
      const normalized = this.normalizeName(rec.company_name);
      if (existingNamesSet.has(normalized)) {
        skipped++;
        continue;
      }
      toInsert.push({
        ...rec,
        original_data: {
          source_group: sourceGroup,
          source_file: filename,
          uploaded_at: new Date(),
        },
        created_at: new Date(),
        updated_at: new Date(),
      });
      existingNamesSet.add(normalized); // 같은 배치 내 중복 방지
    }

    if (toInsert.length > 0) {
      await collection.insertMany(toInsert);
    }

    // 이력 기록
    const historyCollection = this.connection.collection(this.HISTORY_COLLECTION);
    await historyCollection.insertOne({
      filename,
      source_group: sourceGroup,
      total: records.length,
      inserted: toInsert.length,
      skipped_duplicates: skipped,
      uploaded_at: new Date(),
      uploaded_by: uploadedBy,
    } as UploadHistoryEntry);

    this.logger.log(`Upload complete: ${toInsert.length} inserted, ${skipped} skipped`);

    return {
      inserted: toInsert.length,
      skipped,
      total: records.length,
    };
  }

  /**
   * 업로드 이력 조회
   */
  async getUploadHistory(): Promise<any[]> {
    const historyCollection = this.connection.collection(this.HISTORY_COLLECTION);
    return historyCollection
      .find({})
      .sort({ uploaded_at: -1 })
      .limit(50)
      .toArray();
  }

  /**
   * 회사명 정규화 (공백·특수문자 제거, 소문자, 주식회사 제거)
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\(주\)|\(유\)|\(사\)|주식회사|유한회사|inc\.|co\.,?\s*ltd\.?|corp\.|llc\.?/gi, '')
      .replace(/[\s\-_.,()（）]/g, '')
      .trim();
  }
}

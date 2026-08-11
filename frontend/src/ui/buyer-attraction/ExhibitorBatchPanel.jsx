import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function ExhibitorBatchPanel({ campaign, onImportExhibitors, onImportFromDb, loading }) {
  const [exhibitors, setExhibitors] = useState(campaign?.exhibitorSnapshot || []);
  const [dragOver, setDragOver] = useState(false);
  const [msg, setMsg] = useState('');

  const parseExcelFile = (file) => {
    const reader = new window.FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const mapped = rows.map((r) => {
          const companyName = r['기업명'] || r['업체명'] || r['company_name'] || r['name'] || '';
          const products = r['주요품목'] || r['제품'] || r['products'] || r['offerings'] || '자동차부품';
          const industry = r['업종'] || r['industry'] || '자동차부품';
          const website = r['홈페이지'] || r['website'] || '';
          const email = r['이메일'] || r['email'] || '';
          const boothNumber = r['부스번호'] || r['booth'] || r['boothNumber'] || 'A-101';

          return { companyName, products, industry, website, email, boothNumber };
        }).filter((item) => item.companyName && item.companyName.trim().length > 0);

        if (mapped.length === 0) {
          setMsg('⚠️ 유효한 기업명 컬럼이 포함된 데이터를 찾지 못했습니다.');
          return;
        }

        setExhibitors(mapped);
        setMsg(`✅ 엑셀에서 ${mapped.length}개 참가업체를 성공적으로 파싱했습니다.`);
      } catch (err) {
        setMsg('❌ 엑셀 파싱 오류: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseExcelFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      parseExcelFile(e.target.files[0]);
    }
  };

  const handleSave = () => {
    if (exhibitors.length === 0) {
      alert('저장할 참가업체가 없습니다.');
      return;
    }
    onImportExhibitors(exhibitors);
  };

  // Stats calculation
  const totalCount = exhibitors.length;
  const verifiedProducts = exhibitors.filter((e) => e.products && e.products !== '자동차부품').length;
  const boothAssigned = exhibitors.filter((e) => e.boothNumber && e.boothNumber !== '').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div style={{ background: '#FFFFFF', padding: '20px 24px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              🏢 전시회 부스 참가업체 목록 등록
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
              전시회에 참가가 확정된 부스 업체의 제품·품목 정보를 등록하여 맞춤형 해외 바이어를 매칭합니다.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onImportFromDb}
              disabled={loading}
              style={{ padding: '9px 16px', background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
            >
              📥 DB 참가기업 자동 불러오기
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || exhibitors.length === 0}
              style={{ padding: '9px 18px', background: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: exhibitors.length === 0 ? 'not-allowed' : 'pointer' }}
            >
              💾 참가업체 배치 저장
            </button>
          </div>
        </div>

        {/* Upload Status Message */}
        {msg && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: '#F1F5F9', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
            {msg}
          </div>
        )}
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: dragOver ? '2px dashed #4F46E5' : '2px dashed #CBD5E1',
          background: dragOver ? '#EEF2FF' : '#F8FAFC',
          padding: '30px 20px',
          borderRadius: '14px',
          textAlign: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>
          전시회 참가업체 엑셀(XLSX) 파일을 여기에 놓으세요
        </div>
        <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px' }}>
          지원 컬럼명: 기업명(필수), 주요품목, 업종, 부스번호, 홈페이지, 이메일
        </div>
        <label style={{ display: 'inline-block', marginTop: '14px', padding: '8px 18px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
          내 컴퓨터에서 파일 선택
          <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>전체 참가업체</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{totalCount}개사</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>주요품목 정보 확인</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#166534', marginTop: '4px' }}>{verifiedProducts}개사</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>부스번호 배정 완료</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#3730A3', marginTop: '4px' }}>{boothAssigned}개사</div>
        </div>
      </div>

      {/* Exhibitor Preview Table */}
      {exhibitors.length > 0 && (
        <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
              📋 참가업체 미리보기 목록 ({exhibitors.length}건)
            </span>
            <button
              type="button"
              onClick={() => setExhibitors([])}
              style={{ padding: '4px 10px', background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              전체 비우기 ✕
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>#</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>기업명</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>주요품목</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>업종</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>부스번호</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>이메일</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {exhibitors.map((ex, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>{ex.companyName}</td>
                    <td style={{ padding: '10px 14px', color: '#334155' }}>{ex.products || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#64748B' }}>{ex.industry || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '12px' }}>
                        {ex.boothNumber || '미배정'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748B' }}>{ex.email || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        type="button"
                        onClick={() => setExhibitors((prev) => prev.filter((_, i) => i !== idx))}
                        style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? 'https://backend-production-601f2.up.railway.app' : 'http://localhost:4000');

const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || '';

// 단계 상수
const STEP = {
  IDLE: 'idle',
  PREVIEWING: 'previewing',
  PREVIEW_DONE: 'preview_done',
  UPLOADING: 'uploading',
  DONE: 'done',
};

export default function AdminDataUpload() {
  const [step, setStep] = useState(STEP.IDLE);
  const [file, setFile] = useState(null);
  const [sourceGroup, setSourceGroup] = useState('');
  const [uploadedBy, setUploadedBy] = useState('');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // ─── 파일 선택 핸들러
  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return;
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('xlsx, xls, csv 파일만 업로드 가능합니다.');
      return;
    }
    setFile(selectedFile);
    setError('');
    setPreview(null);
    setResult(null);
    setStep(STEP.IDLE);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }, [handleFileSelect]);

  // ─── 미리보기 (중복 감지)
  const handlePreview = async () => {
    if (!file || !sourceGroup.trim()) {
      setError('파일과 소스 그룹명을 모두 입력해 주세요.');
      return;
    }
    setError('');
    setStep(STEP.PREVIEWING);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_group', sourceGroup.trim());

    try {
      const res = await fetch(`${BASE_URL}/admin/exhibitor/preview`, {
        method: 'POST',
        headers: { 'x-admin-token': ADMIN_TOKEN },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '미리보기 오류');
      setPreview(data);
      setStep(STEP.PREVIEW_DONE);
    } catch (err) {
      setError(err.message);
      setStep(STEP.IDLE);
    }
  };

  // ─── DB 저장
  const handleUpload = async () => {
    if (!file || !sourceGroup.trim()) return;
    setStep(STEP.UPLOADING);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_group', sourceGroup.trim());
    formData.append('uploaded_by', uploadedBy.trim() || 'admin');

    try {
      const res = await fetch(`${BASE_URL}/admin/exhibitor/upload`, {
        method: 'POST',
        headers: { 'x-admin-token': ADMIN_TOKEN },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '업로드 오류');
      setResult(data);
      setStep(STEP.DONE);
    } catch (err) {
      setError(err.message);
      setStep(STEP.PREVIEW_DONE);
    }
  };

  // ─── 이력 조회
  const loadHistory = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/exhibitor/upload-history`, {
        headers: { 'x-admin-token': ADMIN_TOKEN },
      });
      const data = await res.json();
      setHistory(data.data || []);
      setHistoryLoaded(true);
    } catch {
      setError('이력 조회 실패');
    }
  };

  const reset = () => {
    setStep(STEP.IDLE);
    setFile(null);
    setSourceGroup('');
    setPreview(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ padding: '2.5rem 0', maxWidth: '960px', margin: '0 auto', fontFamily: "'Pretendard', 'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #EF4444, #DC2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
          }}>🔒</div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#EF4444', letterSpacing: '1px' }}>
            ADMIN ONLY — 내부 전용
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#1e293b', margin: '0 0 8px 0' }}>
          참가업체 DB 업로드 도구
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Gran Oso AI가 정제 완료한 엑셀 파일을 MongoDB에 적재합니다.
          이 도구는 외부에 공개되지 않습니다.
        </p>
      </div>

      {/* ── 경고 배너 ── */}
      <div style={{
        padding: '12px 16px', borderRadius: '10px', marginBottom: '2rem',
        background: '#FEF3C7', border: '1px solid #F59E0B',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ fontSize: '18px' }}>⚠️</span>
        <p style={{ margin: 0, fontSize: '13px', color: '#92400E', fontWeight: 600 }}>
          반드시 <strong>정제 완료된 파일</strong>만 업로드하세요.
          파일 통합·중복제거·이메일 발굴은 Gran Oso AI 내부 작업 후 진행됩니다.
        </p>
      </div>

      {/* ── 메인 카드 ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>

        {/* 파일 드롭존 */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? '#00A4EF' : file ? '#10B981' : '#d1d5db'}`,
            borderRadius: '12px',
            padding: '2.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragging ? 'rgba(79, 70, 229, 0.04)' : file ? 'rgba(16, 185, 129, 0.04)' : '#f9fafb',
            transition: 'all 0.2s',
            marginBottom: '1.5rem',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>
            {file ? '✅' : '📂'}
          </div>
          {file ? (
            <>
              <p style={{ fontWeight: 700, color: '#10B981', margin: '0 0 4px 0' }}>{file.name}</p>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
                {(file.size / 1024).toFixed(1)} KB — 다른 파일을 선택하려면 클릭
              </p>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 700, color: '#374151', margin: '0 0 4px 0' }}>
                엑셀/CSV 파일을 드래그하거나 클릭하여 선택
              </p>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                지원 형식: .xlsx, .xls, .csv
              </p>
            </>
          )}
        </div>

        {/* 입력 필드 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
              소스 그룹명 * <span style={{ fontWeight: 400, color: '#9ca3af' }}>(파일 출처 태그)</span>
            </label>
            <input
              type="text"
              value={sourceGroup}
              onChange={(e) => setSourceGroup(e.target.value)}
              placeholder="예: KAICA_2026Q3 / Detroit_GM벤더 / 부산항만공사"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box',
                outline: 'none', fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = '#00A4EF'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
              업로드 담당자
            </label>
            <input
              type="text"
              value={uploadedBy}
              onChange={(e) => setUploadedBy(e.target.value)}
              placeholder="예: 홍길동"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box',
                outline: 'none', fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = '#00A4EF'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', marginBottom: '1rem', color: '#DC2626', fontSize: '13px' }}>
            ❌ {error}
          </div>
        )}

        {/* 버튼 영역 */}
        {step !== STEP.DONE && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handlePreview}
              disabled={!file || !sourceGroup.trim() || step === STEP.PREVIEWING}
              style={{
                padding: '11px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '14px',
                border: 'none', cursor: !file || !sourceGroup.trim() || step === STEP.PREVIEWING ? 'not-allowed' : 'pointer',
                background: !file || !sourceGroup.trim() || step === STEP.PREVIEWING
                  ? '#e5e7eb' : 'linear-gradient(135deg, #66C5F5, #00A4EF)',
                color: !file || !sourceGroup.trim() || step === STEP.PREVIEWING ? '#9ca3af' : '#fff',
                transition: 'all 0.2s',
              }}
            >
              {step === STEP.PREVIEWING ? '⏳ 분석 중...' : '🔍 미리보기 (중복 감지)'}
            </button>

            {step === STEP.PREVIEW_DONE && (
              <button
                onClick={handleUpload}
                style={{
                  padding: '11px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '14px',
                  border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#fff',
                }}
              >
                ✅ MongoDB에 저장
              </button>
            )}

            {step === STEP.UPLOADING && (
              <button disabled style={{ padding: '11px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', border: 'none', background: '#e5e7eb', color: '#9ca3af' }}>
                ⏳ 저장 중...
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 미리보기 결과 ── */}
      {preview && step !== STEP.DONE && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '1.5rem', color: '#1e293b' }}>
            📊 파싱 결과 분석
          </h2>

          {/* 통계 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: '전체 파싱', value: preview.total, color: '#66C5F5', icon: '📋' },
              { label: '신규 (저장 예정)', value: preview.new_records, color: '#10B981', icon: '✅' },
              { label: '중복 감지', value: preview.duplicates, color: '#F59E0B', icon: '⚠️' },
              { label: '이메일 없음', value: preview.no_email, color: '#EF4444', icon: '📧' },
            ].map(stat => (
              <div key={stat.label} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '10px', textAlign: 'center', border: `1px solid ${stat.color}22` }}>
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>{stat.icon}</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 중복 업체명 */}
          {preview.duplicate_names && preview.duplicate_names.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#92400E', marginBottom: '8px' }}>
                ⚠️ 중복 감지된 업체 (기존 DB와 이름 일치, 건너뜀)
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {preview.duplicate_names.map((name, i) => (
                  <span key={i} style={{ padding: '3px 10px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '999px', fontSize: '12px', color: '#92400E' }}>
                    {name}
                  </span>
                ))}
                {preview.duplicates > 20 && (
                  <span style={{ padding: '3px 10px', color: '#9ca3af', fontSize: '12px' }}>
                    +{preview.duplicates - 20}건 더...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 샘플 미리보기 */}
          {preview.sample && preview.sample.length > 0 && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                📋 샘플 미리보기 (처음 10행)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      {['업체명', '국가', '업종', '이메일', '웹사이트', '구분'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 500, color: '#1e293b', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.company_name}</td>
                        <td style={{ padding: '8px 12px', color: '#6b7280' }}>{row.country || '-'}</td>
                        <td style={{ padding: '8px 12px', color: '#6b7280', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.industry || '-'}</td>
                        <td style={{ padding: '8px 12px', color: row.has_email ? '#3b82f6' : '#EF4444', fontSize: '12px' }}>
                          {row.email || '❌ 없음'}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: '12px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.website || '-'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: row.type === 'domestic' ? '#e0e7ff' : '#dcfce7', color: row.type === 'domestic' ? '#3730a3' : '#166534' }}>
                            {row.type === 'domestic' ? '국내' : '해외'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 저장 완료 결과 ── */}
      {step === STEP.DONE && result && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#166534', marginBottom: '8px' }}>
            DB 저장 완료!
          </h2>
          <p style={{ color: '#166534', marginBottom: '1.5rem' }}>{result.message}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            {[
              { label: '전체', value: result.total, color: '#66C5F5' },
              { label: '저장 완료', value: result.inserted, color: '#10B981' },
              { label: '중복 건너뜀', value: result.skipped, color: '#F59E0B' },
            ].map(s => (
              <div key={s.label} style={{ padding: '12px', background: '#fff', borderRadius: '10px', border: '1px solid #d1fae5' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={reset}
            style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
          >
            ➕ 다음 파일 업로드
          </button>
        </div>
      )}

      {/* ── 업로드 이력 ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>📜 업로드 이력</h2>
          <button
            onClick={loadHistory}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
          >
            🔄 새로고침
          </button>
        </div>
        {!historyLoaded ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>새로고침 버튼을 눌러 이력을 조회하세요.</p>
        ) : history.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>업로드 이력이 없습니다.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['파일명', '소스 그룹', '전체', '저장', '중복', '담당자', '업로드 일시'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', color: '#1e293b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.filename}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 8px', background: '#e0e7ff', borderRadius: '999px', fontSize: '11px', fontWeight: 700, color: '#3730a3' }}>{h.source_group}</span>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{h.total}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: '#10B981', fontWeight: 700 }}>{h.inserted}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: '#F59E0B', fontWeight: 700 }}>{h.skipped_duplicates}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>{h.uploaded_by}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {h.uploaded_at ? new Date(h.uploaded_at).toLocaleString('ko-KR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        input:focus { outline: 2px solid #00A4EF; outline-offset: 1px; }
      `}</style>
    </div>
  );
}

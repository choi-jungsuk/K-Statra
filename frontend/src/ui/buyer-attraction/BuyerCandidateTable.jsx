import React, { useState } from 'react';

export default function BuyerCandidateTable({ candidates, onReviewCandidate, onSelectCandidate, loading }) {
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const countries = Array.from(new Set(candidates.map((c) => c.country))).filter(Boolean);

  const filtered = candidates.filter((c) => {
    if (filterCountry !== 'all' && c.country !== filterCountry) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved_to_invite':
        return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '12px' }}>초청 승인</span>;
      case 'under_review':
        return <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '12px' }}>담당자 검토</span>;
      case 'rejected':
        return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '12px' }}>제외됨</span>;
      default:
        return <span style={{ background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '12px' }}>미검토</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
            🌐 해외 바이어 후보 발굴 목록 ({filtered.length}건 / 전체 {candidates.length}건)
          </span>
          <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '10px' }}>
            공개 출처 기반 1차 데이터이며, 참가업체 품목과 1차 매칭 검토를 수행합니다.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
            국가:
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFF' }}
            >
              <option value="all">전체 국가</option>
              {countries.map((ct) => (
                <option key={ct} value={ct}>{ct}</option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
            상태:
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFF' }}
            >
              <option value="all">전체 상태</option>
              <option value="under_review">담당자 검토</option>
              <option value="approved_to_invite">초청 승인</option>
              <option value="rejected">제외됨</option>
            </select>
          </label>
        </div>
      </div>

      {/* Candidates Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>바이어명</th>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>국가</th>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>바이어 유형</th>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>관심 조달 품목</th>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>부스 참가업체 매칭</th>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>정보 출처</th>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>검토 상태</th>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>심사 및 상세</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cand) => (
                <tr key={cand._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>
                    {cand.buyerName}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '12px' }}>
                      {cand.country}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>{cand.buyerType}</td>
                  <td style={{ padding: '12px 14px', color: '#1E293B' }}>
                    {cand.procurementInterests ? cand.procurementInterests.join(', ') : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#4F46E5', fontWeight: 700 }}>
                    {cand.matchedExhibitorNames && cand.matchedExhibitorNames.length > 0 ? cand.matchedExhibitorNames.join(', ') : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748B' }}>
                    {cand.sourceEvidence && cand.sourceEvidence[0]?.sourceName ? (
                      <a href={cand.sourceEvidence[0].url || '#'} target="_blank" rel="noreferrer" style={{ color: '#4F46E5', textDecoration: 'underline' }}>
                        🔗 {cand.sourceEvidence[0].sourceName}
                      </a>
                    ) : (
                      '공개 디렉토리'
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}>{getStatusBadge(cand.status)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {cand.status !== 'approved_to_invite' && (
                        <button
                          type="button"
                          onClick={() => onReviewCandidate(cand._id, 'approved_to_invite', '담당자 초청 승인')}
                          style={{ padding: '4px 10px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                        >
                          초청 승인
                        </button>
                      )}
                      {cand.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => onReviewCandidate(cand._id, 'rejected', '담당자 검토 후 제외')}
                          style={{ padding: '4px 10px', background: '#F1F5F9', color: '#EF4444', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                        >
                          제외
                        </button>
                      )}
                      {onSelectCandidate && (
                        <button
                          type="button"
                          onClick={() => onSelectCandidate(cand)}
                          style={{ padding: '4px 10px', background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', borderRadius: '6px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                        >
                          상세보기
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

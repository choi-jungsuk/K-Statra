import React from 'react';

export default function DualMatchPanel({ matches, onGenerateMatches, loading }) {
  const poolAExhibitorMatches = matches.filter((m) => m.companyParticipationType === 'exhibitor');
  const poolBNonExhibitorMatches = matches.filter((m) => m.companyParticipationType === 'non_exhibitor');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Explanation & Control Banner */}
      <div style={{ background: '#FFFFFF', padding: '20px 24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              🤝 부스 참가업체(Pool A) + 국내 비참가업체(Pool B) 이중 매칭
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
              • Pool A: 전시회 전시장 내 참가업체 개별 부스에서 매칭 상담을 진행합니다.<br />
              • Pool B: 초청 바이어의 추가 구매수요를 충족하는 국내 비참가 전문 제조기업을 발굴하여 전시장 내 <strong>글로벌 비즈니스 상담장</strong>으로 배정합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onGenerateMatches}
            disabled={loading}
            style={{ padding: '10px 20px', background: '#00A4EF', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
          >
            🔄 이중 매칭 생성 및 갱신
          </button>
        </div>
      </div>

      {/* Pool A Section */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: '#EEF2FF', borderBottom: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#3730A3' }}>
            🏢 Pool A: 전시회 부스 참가업체 매칭 ({poolAExhibitorMatches.length}건)
          </span>
          <span style={{ fontSize: '12px', color: '#00A4EF', background: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
            상담장소: 참가업체 전시장 부스
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>초청 바이어</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>매칭 부스 참가기업</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>부스 번호</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>추천 및 매칭 근거</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>상태</th>
              </tr>
            </thead>
            <tbody>
              {poolAExhibitorMatches.map((m) => (
                <tr key={m._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 800, color: '#0F172A' }}>{m.buyerName} ({m.buyerCountry})</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1E293B' }}>{m.companyName}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: '#EEF2FF', color: '#00A4EF', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '12px' }}>
                      📍 {m.boothNumber || 'Hall 1-A101'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748B' }}>{m.reasons ? m.reasons.join(', ') : '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '12px' }}>
                      매칭 검토완료
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pool B Section */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: '#F0FDF4', borderBottom: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#166534' }}>
            🤝 Pool B: 국내 비참가업체 추가 매칭 ({poolBNonExhibitorMatches.length}건)
          </span>
          <span style={{ fontSize: '12px', color: '#15803D', background: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
            상담장소: 글로벌 비즈니스 상담장
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>초청 바이어</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>추천 국내 비참가기업</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>배정 상담실</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>추천 및 매칭 근거</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0' }}>상태</th>
              </tr>
            </thead>
            <tbody>
              {poolBNonExhibitorMatches.map((m) => (
                <tr key={m._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 800, color: '#0F172A' }}>{m.buyerName} ({m.buyerCountry})</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1E293B' }}>{m.companyName}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: '#F0FDF4', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '12px' }}>
                      🏢 {m.consultationRoom || '상담실 Room-3B'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748B' }}>{m.reasons ? m.reasons.join(', ') : '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '12px' }}>
                      글로벌상담장 배정완료
                    </span>
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

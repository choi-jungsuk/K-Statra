import React, { useState } from 'react';

export default function ConsultationSchedulePanel({ appointments, loading }) {
  const [filterVenue, setFilterVenue] = useState('all');

  const filtered = appointments.filter((appt) => {
    if (filterVenue !== 'all' && appt.venueType !== filterVenue) return false;
    return true;
  });

  const boothCount = appointments.filter((a) => a.venueType === 'exhibitor_booth').length;
  const centerCount = appointments.filter((a) => a.venueType === 'global_business_center').length;
  const interpreterCount = appointments.filter((a) => a.interpreterRequired).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Schedule Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>📅 총 확정 상담 일정</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>{appointments.length}건</div>
          <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: 600 }}>• 전시회 3일간 상담</div>
        </div>
        <div style={{ background: '#EEF2FF', padding: '18px 20px', borderRadius: '14px', border: '1px solid #C7D2FE', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '13px', color: '#4F46E5', fontWeight: 700 }}>🏢 Pool A: 참가업체 부스 상담</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#312E81', marginTop: '6px' }}>{boothCount}건</div>
          <div style={{ fontSize: '12px', color: '#4338CA', marginTop: '4px', fontWeight: 600 }}>• 개별 전시장 부스 방문 매칭</div>
        </div>
        <div style={{ background: '#F0FDF4', padding: '18px 20px', borderRadius: '14px', border: '1px solid #BBF7D0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '13px', color: '#166534', fontWeight: 700 }}>🤝 Pool B: 글로벌 상담장 배정</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#14532D', marginTop: '6px' }}>{centerCount}건</div>
          <div style={{ fontSize: '12px', color: '#15803D', marginTop: '4px', fontWeight: 600 }}>• 국내 비참가 전문기업 상담장</div>
        </div>
        <div style={{ background: '#FFF7ED', padding: '18px 20px', borderRadius: '14px', border: '1px solid #FED7AA', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '13px', color: '#C2410C', fontWeight: 700 }}>🗣️ 전문 통역원 배정</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#9A3412', marginTop: '6px' }}>{interpreterCount}명</div>
          <div style={{ fontSize: '12px', color: '#EA580C', marginTop: '4px', fontWeight: 600 }}>• 영어 / 중국어 / 일본어 통역</div>
        </div>
      </div>

      {/* Filter & Schedule Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
            📅 상담 일정 테이블 및 상담장 배정 현황 ({filtered.length}건)
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setFilterVenue('all')}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', background: filterVenue === 'all' ? '#0F172A' : '#FFF', color: filterVenue === 'all' ? '#FFF' : '#334155', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
            >
              전체 장소
            </button>
            <button
              type="button"
              onClick={() => setFilterVenue('exhibitor_booth')}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', background: filterVenue === 'exhibitor_booth' ? '#4F46E5' : '#FFF', color: filterVenue === 'exhibitor_booth' ? '#FFF' : '#334155', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
            >
              🏢 부스 상담 (Pool A)
            </button>
            <button
              type="button"
              onClick={() => setFilterVenue('global_business_center')}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', background: filterVenue === 'global_business_center' ? '#166534' : '#FFF', color: filterVenue === 'global_business_center' ? '#FFF' : '#334155', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
            >
              🤝 글로벌 상담장 (Pool B)
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>상담 일시</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>상담 시간</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>초청 바이어명</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>매칭 국내기업</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>상담 장소 구분</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>배정 장소 (부스/룸)</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>통역 지원</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>상담 상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                    선택한 조건에 일치하는 상담 일정이 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((appt, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A' }}>{appt.date}</td>
                    <td style={{ padding: '12px 16px', color: '#4F46E5', fontWeight: 800 }}>{appt.startTime} ~ {appt.endTime}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#1E293B' }}>{appt.buyerName}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>{appt.companyName}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: appt.venueType === 'exhibitor_booth' ? '#EEF2FF' : '#F0FDF4', color: appt.venueType === 'exhibitor_booth' ? '#4F46E5' : '#166534', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '12px' }}>
                        {appt.venueType === 'exhibitor_booth' ? '전시회 부스 상담' : '글로벌 비즈니스 상담장'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>
                      {appt.venueType === 'exhibitor_booth' ? `📍 부스 ${appt.boothNumber}` : `🏢 ${appt.consultationRoom}`}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {appt.interpreterRequired ? `🗣️ ${appt.interpreterLanguage || '영어'}` : '미요청'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '12px' }}>
                        {appt.status === 'confirmed' ? '상담 확정' : appt.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

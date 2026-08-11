import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider.jsx';

export default function AftercarePage() {
  const { lang } = useI18n();
  const [activeTab, setActiveTab] = useState('tracking'); // 'tracking' | 'contracts' | 'feedback'
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const sampleTrackingList = [
    {
      id: 'rfq-01',
      exhibitor: '(주)에스엘 모빌리티',
      buyer: 'Continental Automotive (Germany)',
      item: 'EV 헤드램프 LED 드라이버 모듈',
      meetingDate: '2026-10-21',
      stage: 'RFQ 발송 (RFQ Sent)',
      status: '견적 검토중 (Under Review)',
      lastUpdate: '2026-10-22'
    },
    {
      id: 'rfq-02',
      exhibitor: '(주)모트렉스 EV',
      buyer: 'VinFast Purchasing (Vietnam)',
      item: 'IVI 인포테인먼트 전장 디스플레이',
      meetingDate: '2026-10-22',
      stage: '샘플 발송 준비 (Sample Prep)',
      status: '샘플 스펙 합의 완료 (Agreed)',
      lastUpdate: '2026-10-23'
    },
    {
      id: 'rfq-03',
      exhibitor: '만도 첨단제동시스템',
      buyer: 'Magna International (NA)',
      item: '지능형 ADAS 제동 센서 밸브',
      meetingDate: '2026-10-21',
      stage: '기술 사양 협의 (Tech Q&A)',
      status: '화상 미팅 예정 (Online Follow-up)',
      lastUpdate: '2026-10-22'
    }
  ];

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* 1. Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #431407 100%)',
        color: '#ffffff',
        borderRadius: '24px',
        padding: '36px 40px',
        marginBottom: '32px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span style={{
            background: 'rgba(249, 115, 22, 0.2)',
            color: '#fb923c',
            border: '1px solid rgba(251, 146, 60, 0.4)',
            padding: '5px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 800
          }}>
            🔄 전시회 PoC
          </span>
          <span style={{
            background: 'rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700
          }}>
            {lang === 'ko' ? '상담 완료 후속 추적 Agent' : 'Post-Meeting Deal Tracking Agent'}
          </span>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.5px' }}>
          {lang === 'ko' ? '사후관리 Agent' : 'Post-Event Aftercare Agent'}
        </h1>
        <p style={{ fontSize: '15px', lineHeight: 1.6, maxWidth: '800px', color: 'rgba(255, 255, 255, 0.88)', marginBottom: '20px' }}>
          {lang === 'ko'
            ? '상담 완료 이후의 견적서(RFQ) 및 샘플 발송, 기술 사양 협의 상황을 이어서 관리하고, 계약 체결 성과와 사후 피드백을 한곳에서 모니터링합니다.'
            : 'Tracks RFQ progress, sample dispatch, technical Q&A follow-ups, and manages post-show feedback and contract conversion over a 3-month window.'}
        </p>

        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '14px 18px',
          fontSize: '13.5px',
          color: '#fdba74'
        }}>
          📌 {lang === 'ko' 
            ? '행사 종료 후 최대 3개월간 바이어-참가기업 간 수출 상담 후속 진행을 전담 추적합니다.' 
            : 'Dedicated 3-month tracking window for buyer-exhibitor export deal negotiations.'}
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '28px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '12px'
      }}>
        {[
          { id: 'tracking', labelKo: '1. 견적·샘플·RFQ 진행 추적', labelEn: '1. RFQ & Sample Tracking' },
          { id: 'contracts', labelKo: '2. 수출 계약 및 성과 집계', labelEn: '2. Contracts & Performance' },
          { id: 'feedback', labelKo: '3. 사후 피드백 및 2027 전시회 연계', labelEn: '3. Feedback & 2027 Show Link' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '14px',
              transition: 'all 0.2s',
              background: activeTab === tab.id ? '#F97316' : '#f1f5f9',
              color: activeTab === tab.id ? '#ffffff' : '#334155',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(249, 115, 22, 0.25)' : 'none'
            }}
          >
            {lang === 'ko' ? tab.labelKo : tab.labelEn}
          </button>
        ))}
      </div>

      {/* 3. Tab Content */}
      {/* Tab 1: 견적·샘플·RFQ 진행 추적 */}
      {activeTab === 'tracking' && (
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {lang === 'ko' ? '상담 완료 건 후속 진행 (RFQ & 샘플 추적)' : 'Completed Meeting Follow-up (RFQ & Sample Tracking)'}
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>
                {lang === 'ko' ? '상담일정 관리 Agent의 미팅 완료 건에서 자동 연계된 후속 조치 단계입니다.' : 'Auto-linked from completed sessions in Consultation Schedule Management Agent.'}
              </p>
            </div>
            <Link
              to="/consultation-management"
              style={{
                padding: '10px 18px',
                background: '#EEF2FF',
                color: '#00A4EF',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '13px',
                textDecoration: 'none'
              }}
            >
              📅 {lang === 'ko' ? '상담일정 관리 Agent로 이동' : 'Open Schedule Agent'}
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', fontWeight: 800, borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '14px' }}>{lang === 'ko' ? '관리 ID' : 'Tracking ID'}</th>
                  <th style={{ padding: '14px' }}>{lang === 'ko' ? '참가기업' : 'Exhibitor'}</th>
                  <th style={{ padding: '14px' }}>{lang === 'ko' ? '바이어' : 'Buyer'}</th>
                  <th style={{ padding: '14px' }}>{lang === 'ko' ? '대상 품목' : 'Product'}</th>
                  <th style={{ padding: '14px' }}>{lang === 'ko' ? '현재 진행 단계' : 'Current Stage'}</th>
                  <th style={{ padding: '14px' }}>{lang === 'ko' ? '상세 상태' : 'Status'}</th>
                  <th style={{ padding: '14px' }}>{lang === 'ko' ? '최종 갱신일' : 'Last Updated'}</th>
                </tr>
              </thead>
              <tbody>
                {sampleTrackingList.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '14px', fontWeight: 800, color: '#EA580C' }}>{item.id}</td>
                    <td style={{ padding: '14px', fontWeight: 700 }}>{item.exhibitor}</td>
                    <td style={{ padding: '14px' }}>{item.buyer}</td>
                    <td style={{ padding: '14px' }}>{item.item}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        background: '#FFF7ED',
                        color: '#C2410C',
                        border: '1px solid #FFEDD5',
                        padding: '4px 10px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '12px'
                      }}>
                        {item.stage}
                      </span>
                    </td>
                    <td style={{ padding: '14px', fontWeight: 700, color: '#334155' }}>{item.status}</td>
                    <td style={{ padding: '14px', color: '#64748b' }}>{item.lastUpdate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: 수출 계약 및 성과 집계 (CRITICAL SECTION 10.3 HONEST EMPTY STATE) */}
      {activeTab === 'contracts' && (
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            {lang === 'ko' ? '수출 계약 체결 및 성과 통계 집계' : 'Export Contracts & Performance Aggregation'}
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '24px' }}>
            {lang === 'ko' ? '전시회 상담을 통해 체결된 계약, MOU 및 수출 실적을 투명하게 집계합니다.' : 'Transparently aggregates contracts, MOUs, and export performance results.'}
          </p>

          {/* CRITICAL MANDATORY SECTION 10.3 HONEST EMPTY STATE BOX */}
          <div style={{
            background: '#F8FAFC',
            border: '2px dashed #CBD5E1',
            borderRadius: '20px',
            padding: '48px 24px',
            textAlign: 'center',
            maxWidth: '680px',
            margin: '0 auto'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#334155', marginBottom: '12px' }}>
              {lang === 'ko' ? '진행 중인 계약 성과 데이터 집계 중' : 'Contract Performance Data In Progress'}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#475569',
              lineHeight: 1.6,
              maxWidth: '560px',
              margin: '0 auto',
              fontWeight: 700
            }}>
              {lang === 'ko'
                ? '현재 상담 완료 건을 기준으로 사후관리 대상이 집계됩니다. 행사 종료 후 3개월간 후속 계약 진행 상황을 지속 추적합니다.'
                : 'Post-event aftercare targets are gathered from completed consultations. We continue to track export deal progress for 3 months following the exhibition.'}
            </p>
            <div style={{ marginTop: '20px' }}>
              <span style={{
                display: 'inline-block',
                background: '#E2E8F0',
                color: '#475569',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: 700
              }}>
                ℹ️ {lang === 'ko' ? '실제 계약 실적이 확인될 경우에만 집계에 반영됩니다.' : 'Only verified contract closures are recorded.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: 사후 피드백 및 2027 전시회 연계 */}
      {activeTab === 'feedback' && (
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            {lang === 'ko' ? '참가기업·바이어 사후 피드백 및 2027 전시회 수요조사' : 'Post-Event Feedback & 전시회 2027 Pre-Registration'}
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '24px' }}>
            {lang === 'ko' ? '금년도 비즈니스 매칭 서비스 만족도를 평가하고, 차년도 전시회 2027 우선 신청 혜택을 받으세요.' : 'Rate your matching experience and pre-register for 전시회 2027 priority booth allocation.'}
          </p>

          {!feedbackSubmitted ? (
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', maxWidth: '640px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                  {lang === 'ko' ? '매칭 서비스 전반적 만족도' : 'Overall Matching Satisfaction'}:
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['⭐⭐⭐⭐⭐ (매우 만족)', '⭐⭐⭐⭐ (만족)', '⭐⭐⭐ (보통)'].map((opt, i) => (
                    <label key={i} style={{ fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>
                      <input type="radio" name="sat" defaultChecked={i === 0} style={{ marginRight: '6px' }} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                  {lang === 'ko' ? '전시회 2027 참가 관심도' : 'Interest in 전시회 2027'}:
                </label>
                <select style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', width: '100%', fontWeight: 700 }}>
                  <option>{lang === 'ko' ? '차년도 부스 우선 신청 희망 (Early Bird 혜택 안내 수신)' : 'Interested in Early Bird priority booking'}</option>
                  <option>{lang === 'ko' ? '행사 일정 안내 메일만 수신 희망' : 'Send event date notification only'}</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setFeedbackSubmitted(true)}
                style={{
                  padding: '12px 24px',
                  background: '#F97316',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                📝 {lang === 'ko' ? '피드백 제출 및 2027 사전등록' : 'Submit Feedback & Pre-Register'}
              </button>
            </div>
          ) : (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #10b981',
              color: '#047857',
              padding: '24px',
              borderRadius: '16px',
              textAlign: 'center',
              fontWeight: 700
            }}>
              🎉 {lang === 'ko' 
                ? '소중한 피드백이 접수되었습니다! 전시회 2027 사전 안내 메일이 등록된 주소로 발송될 예정입니다.' 
                : 'Thank you for your feedback! 전시회 2027 early notification has been registered.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

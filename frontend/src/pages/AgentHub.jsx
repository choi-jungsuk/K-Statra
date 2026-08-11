import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider.jsx';
import '../ui/OverviewBento.css';

const businessAgents = [
  {
    id: 'exhibitor',
    step: '1',
    icon: '🏢',
    titleKo: '참가기업 발굴 에이전트',
    titleEn: 'Exhibitor Discovery Agent',
    link: '/ax-data',
  },
  {
    id: 'market',
    step: '2',
    icon: '🌍',
    titleKo: '글로벌 시장정보 에이전트',
    titleEn: 'Global Market Info Agent',
    link: '/consultants',
  },
  {
    id: 'buyer',
    step: '3',
    icon: '🤝',
    titleKo: '바이어 발굴·B2B 매칭 에이전트',
    titleEn: 'Buyer Discovery & B2B Match Agent',
    link: '/',
  },
  {
    id: 'schedule',
    step: '4',
    icon: '📅',
    titleKo: '상담일정 관리 에이전트',
    titleEn: 'Schedule Management Agent',
    link: '/schedule',
  },
  {
    id: 'aftercare',
    step: '5',
    icon: '📋',
    titleKo: '사후관리 에이전트',
    titleEn: 'Aftercare Agent',
    link: '/aftercare',
  }
];

export default function AgentHub() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  // Mock function for UI effect only
  const handleRunOrchestrator = (customQuery) => {
    alert(lang === 'ko' ? '데모 시스템: 에이전트 오케스트라 시뮬레이션입니다.' : 'Demo System: Agent Orchestrator Simulation');
  };

  return (
    <div className="ain-home-bento">
      {/* ── 1단: 메인 브랜드 타이틀 헤더 ── */}
      <section className="home-bento-hero" aria-labelledby="home-bento-hero-title" style={{ padding: '26px 32px' }}>
        <div className="bento-hero-top" style={{ margin: 0, gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
            <span className="bento-hero-eyebrow" style={{ fontSize: '12.5px', padding: '4px 14px', margin: '0 0 12px 0', background: 'rgba(79, 70, 229, 0.15)', color: '#818CF8', borderColor: 'rgba(79, 70, 229, 0.35)' }}>
              ⚡ DEMO STATRA · AI BUSINESS SUPPORT PLATFORM
            </span>
            <h1 id="home-bento-hero-title" className="bento-hero-title" style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '-0.7px', margin: '6px 0 8px' }}>
              {lang === 'ko' ? (
                <>
                  전시회 주최사의 업무생산성 향상을 위한 <span className="bento-hero-title-highlight" style={{ background: 'linear-gradient(135deg, #818CF8 0%, #A78BFA 50%, #F472B6 100%)', WebkitBackgroundClip: 'text' }}>AI Transformation(AX) 플랫폼</span>
                </>
              ) : (
                <>
                  <span className="bento-hero-title-highlight" style={{ background: 'linear-gradient(135deg, #818CF8 0%, #A78BFA 50%, #F472B6 100%)', WebkitBackgroundClip: 'text' }}>AI Transformation (AX) Platform</span> for enhancing the productivity of exhibition organizers
                </>
              )}
            </h1>
            <p className="bento-hero-subtitle" style={{ fontSize: '15px', color: '#CBD5E1', margin: 0, lineHeight: 1.45 }}>
              {lang === 'ko'
                ? '국내 참가업체와 해외 바이어 후보를 발굴하고, B2B 매칭의 만족도를 높이는 AI 인텔리전스'
                : 'AI intelligence that discovers domestic exhibitors and global buyer candidates, elevating B2B matching satisfaction.'}
            </p>
          </div>
        </div>
      </section>

      {/* ── 2단: 오케스트라 에이전트 실행 흐름도 단일 통합 박스 ── */}
      <section className="orchestrator-unified-tier" style={{ marginTop: '5px' }}>
        <div
          className="orchestrator-unified-card"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.95) 100%)',
            borderRadius: '14px',
            border: '1px solid rgba(79, 70, 229, 0.35)',
            padding: '10px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#818CF8', fontWeight: 800, fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎼</span>
                <span>{lang === 'ko' ? '오케스트라 지휘소' : 'Orchestrator Center'}</span>
              </span>
              <span
                style={{
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.18) 0%, rgba(139, 92, 246, 0.18) 100%)',
                  color: '#A78BFA',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  borderRadius: '999px',
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.3px',
                  boxShadow: '0 0 12px rgba(139, 92, 246, 0.25)',
                }}
              >
                ⚡ MAS Engine
              </span>
            </div>

            <button
              type="button"
              className="orchestrator-main-launch-btn"
              onClick={() => handleRunOrchestrator()}
              style={{
                padding: '8px 24px',
                fontSize: '14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                color: '#FFFFFF',
                fontWeight: 900,
                boxShadow: '0 6px 20px rgba(79, 70, 229, 0.45)',
                cursor: 'pointer',
                border: 'none',
                letterSpacing: '-0.3px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.25s ease',
              }}
            >
              <span>▶</span>
              <span>{lang === 'ko' ? '오케스트라 에이전트 실행' : 'Run MAS Orchestrator'}</span>
            </button>
          </div>

          <div className="chain-steps-row" style={{ marginTop: '2px', gap: '6px' }}>
            {businessAgents.map((agent, i) => (
              <React.Fragment key={agent.id}>
                <div
                  className="chain-step-chip"
                  onClick={() => handleRunOrchestrator(`${agent.titleKo} 지휘 실행`)}
                  style={{ cursor: 'pointer', padding: '4px 10px', fontSize: '12px', background: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(79, 70, 229, 0.4)' }}
                >
                  <span>{agent.icon}</span>
                  <span>{agent.step}. {lang === 'ko' ? agent.titleKo : agent.titleEn}</span>
                </div>
                {i < businessAgents.length - 1 && (
                  <span className="chain-arrow" style={{ fontSize: '13px', color: '#818CF8', fontWeight: 800, margin: '0 2px' }} aria-hidden="true">⇄</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3단: 하단 5개 전문 에이전트 Bento Grid 대시보드 ── */}
      {/* bento-tone-indigo 클래스 하나로 모두 통일합니다. */}
      <section className="home-bento-grid" aria-label="Operational Bento Dashboard" style={{ marginTop: '5px' }}>
        
        {/* Card 1 */}
        <article
          className="bento-card bento-tone-indigo"
          onClick={() => navigate('/ax-data')}
          role="button"
          tabIndex={0}
        >
          <div className="bento-card-header">
            <span className="bento-step-pill pill-indigo">1. {lang === 'ko' ? '참가기업 발굴' : 'Exhibitor Agent'}</span>
          </div>
          <h3 className="bento-card-title">
            {lang === 'ko' ? '참가기업 발굴 에이전트' : 'Exhibitor Discovery Agent'}
          </h3>
          <p className="bento-card-copy">
            {lang === 'ko'
              ? '전시회·시장개척단 조건에 맞는 참가기업 후보 탐색과 정보 정리를 돕습니다.'
              : 'Find prospective exhibitors matching exhibition and market entry requirements.'}
          </p>
          <div className="bento-visual-box" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '3rem' }}>🏢</span>
          </div>
          <div className="bento-card-action">
            <span style={{ color: '#4F46E5' }}>{lang === 'ko' ? '이동하기' : 'Go'}</span>
            <span className="bento-arrow" aria-hidden="true" style={{ color: '#4F46E5' }}>→</span>
          </div>
        </article>

        {/* Card 2 */}
        <article
          className="bento-card bento-tone-indigo"
          onClick={() => navigate('/consultants')}
          role="button"
          tabIndex={0}
        >
          <div className="bento-card-header">
            <span className="bento-step-pill pill-indigo">2. {lang === 'ko' ? '시장정보' : 'Market Info'}</span>
          </div>
          <h3 className="bento-card-title">
            {lang === 'ko' ? '글로벌 시장정보 에이전트' : 'Global Market Info Agent'}
          </h3>
          <p className="bento-card-copy">
            {lang === 'ko'
              ? '국가·품목별 시장, 관세, 규제, 지역전문가 정보를 확인합니다.'
              : 'Check market, tariff, regulation, and local expert info by country and product.'}
          </p>
          <div className="bento-visual-box" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '3rem' }}>🌍</span>
          </div>
          <div className="bento-card-action">
            <span style={{ color: '#4F46E5' }}>{lang === 'ko' ? '이동하기' : 'Go'}</span>
            <span className="bento-arrow" aria-hidden="true" style={{ color: '#4F46E5' }}>→</span>
          </div>
        </article>

        {/* Card 3 */}
        <article
          className="bento-card bento-tone-indigo"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
        >
          <div className="bento-card-header">
            <span className="bento-step-pill pill-indigo">3. {lang === 'ko' ? '바이어 발굴' : 'Buyer Match'}</span>
          </div>
          <h3 className="bento-card-title">
            {lang === 'ko' ? '바이어 발굴·B2B 매칭 에이전트' : 'Buyer Discovery & B2B Match'}
          </h3>
          <p className="bento-card-copy">
            {lang === 'ko'
              ? '해외 바이어와 파트너 후보를 탐색하고 매칭 근거를 확인합니다.'
              : 'Search overseas buyers, partner candidates, and view matching insights.'}
          </p>
          <div className="bento-visual-box" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '3rem' }}>🤝</span>
          </div>
          <div className="bento-card-action">
            <span style={{ color: '#4F46E5' }}>{lang === 'ko' ? '이동하기' : 'Go'}</span>
            <span className="bento-arrow" aria-hidden="true" style={{ color: '#4F46E5' }}>→</span>
          </div>
        </article>

        {/* Card 4 */}
        <article
          className="bento-card bento-tone-indigo"
          onClick={() => navigate('/schedule')}
          role="button"
          tabIndex={0}
        >
          <div className="bento-card-header">
            <span className="bento-step-pill pill-indigo">4. {lang === 'ko' ? '일정관리' : 'Schedule'}</span>
          </div>
          <h3 className="bento-card-title">
            {lang === 'ko' ? '상담일정 관리 에이전트' : 'Schedule Management Agent'}
          </h3>
          <p className="bento-card-copy">
            {lang === 'ko'
              ? '온라인·현장 상담 일정과 승인 상태를 관리합니다.'
              : 'Manage online and onsite meeting schedules and approval statuses.'}
          </p>
          <div className="bento-visual-box" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '3rem' }}>📅</span>
          </div>
          <div className="bento-card-action">
            <span style={{ color: '#4F46E5' }}>{lang === 'ko' ? '이동하기' : 'Go'}</span>
            <span className="bento-arrow" aria-hidden="true" style={{ color: '#4F46E5' }}>→</span>
          </div>
        </article>

        {/* Card 5 */}
        <article
          className="bento-card bento-tone-indigo"
          onClick={() => navigate('/aftercare')}
          role="button"
          tabIndex={0}
        >
          <div className="bento-card-header">
            <span className="bento-step-pill pill-indigo">5. {lang === 'ko' ? '사후관리' : 'Aftercare'}</span>
          </div>
          <h3 className="bento-card-title">
            {lang === 'ko' ? '사후관리 에이전트' : 'Aftercare Agent'}
          </h3>
          <p className="bento-card-copy">
            {lang === 'ko'
              ? '상담 후 RFQ, 샘플, 후속 연락 등의 단계를 체계적으로 관리합니다.'
              : 'Systematically track post-meeting RFQs, samples, and follow-ups.'}
          </p>
          <div className="bento-visual-box" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '3rem' }}>📋</span>
          </div>
          <div className="bento-card-action">
            <span style={{ color: '#4F46E5' }}>{lang === 'ko' ? '이동하기' : 'Go'}</span>
            <span className="bento-arrow" aria-hidden="true" style={{ color: '#4F46E5' }}>→</span>
          </div>
        </article>

      </section>
    </div>
  );
}

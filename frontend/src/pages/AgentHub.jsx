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
                  전시회 주최사의 업무생산성 향상을 위한 <span className="bento-hero-title-highlight" style={{ background: 'linear-gradient(135deg, #818CF8 0%, #A78BFA 50%, #F472B6 100%)', WebkitBackgroundClip: 'text' }}>AX 플랫폼</span>
                </>
              ) : (
                <>
                  <span className="bento-hero-title-highlight" style={{ background: 'linear-gradient(135deg, #818CF8 0%, #A78BFA 50%, #F472B6 100%)', WebkitBackgroundClip: 'text' }}>AX Platform</span> for enhancing the productivity of exhibition organizers
                </>
              )}
            </h1>
            <p className="bento-hero-subtitle" style={{ fontSize: '15px', color: '#CBD5E1', margin: 0, lineHeight: 1.45 }}>
              {lang === 'ko'
                ? '전시회 참가업체와 해외바이어 발굴, B2B 미팅, 사후관리까지 원스톱으로 관리하는 AI 인텔리전스'
                : 'AI intelligence that comprehensively manages exhibitor & global buyer discovery, B2B meetings, and aftercare.'}
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
          <div className="bento-visual-box" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)', overflow: 'hidden', position: 'relative', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.4) 0%, transparent 60%)', filter: 'blur(15px)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transform: 'skewX(-8deg)' }}>
              <span style={{ fontSize: '4rem', fontWeight: 900, background: 'linear-gradient(180deg, #ffffff 0%, #93c5fd 40%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginRight: '-8px', filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))' }}>A</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', textShadow: '0 0 8px rgba(255,255,255,0.8), 0 0 16px rgba(147, 197, 253, 0.6)', zIndex: 1, transform: 'skewX(8deg)', letterSpacing: '1.5px', margin: '0 4px', background: 'linear-gradient(180deg, #ffffff 0%, #e0e7ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>2026</span>
              <span style={{ fontSize: '4rem', fontWeight: 900, background: 'linear-gradient(180deg, #ffffff 0%, #93c5fd 40%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginLeft: '-8px', filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))' }}>X</span>
            </div>
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
          <div className="bento-visual-box" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)', overflow: 'hidden', position: 'relative', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <div style={{ position: 'absolute', width: '200%', height: '200%', background: 'repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(99, 102, 241, 0.04) 15px, rgba(99, 102, 241, 0.04) 16px)', transform: 'rotate(-5deg)' }}></div>
            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '50%', background: 'linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, 0.15) 100%)' }}></div>
            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '2px', background: 'rgba(147, 197, 253, 0.4)', boxShadow: '0 0 10px #3b82f6' }}></div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative', width: '100%', height: '100%', paddingBottom: '30px', paddingRight: '20px' }}>
              <div style={{ width: '20px', height: '35px', background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, #93c5fd 100%)', border: '1px solid rgba(255,255,255,0.7)', borderRadius: '3px', transform: 'perspective(150px) rotateX(15deg) rotateY(-20deg)', boxShadow: '-4px 6px 12px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.8)', zIndex: 2 }}></div>
              <div style={{ width: '22px', height: '65px', background: 'linear-gradient(135deg, rgba(147,197,253,0.7) 0%, #3b82f6 100%)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '3px', transform: 'perspective(150px) rotateX(15deg) rotateY(-20deg) translateX(-8px)', boxShadow: '-4px 6px 12px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.4)', zIndex: 1, marginLeft: '10px' }}></div>
              <div style={{ width: '85px', height: '85px', borderRadius: '50%', background: 'conic-gradient(transparent 0% 25%, rgba(59, 130, 246, 0.85) 25% 100%)', transform: 'perspective(200px) rotateX(45deg) rotateY(-15deg) translateX(5px)', boxShadow: '-5px 15px 25px rgba(0,0,0,0.7), inset 2px -2px 10px rgba(255,255,255,0.2)', position: 'relative', border: '1px solid rgba(147, 197, 253, 0.4)', marginLeft: '15px', zIndex: 3 }}>
                <div style={{ position: 'absolute', bottom: '-4px', left: '-2px', width: '100%', height: '100%', borderRadius: '50%', borderBottom: '5px solid #1e3a8a', borderLeft: '2px solid #1e3a8a' }}></div>
                <div style={{ position: 'absolute', top: '-12px', right: '-12px', width: '100%', height: '100%', borderRadius: '50%', background: 'conic-gradient(rgba(255,255,255,0.95) 0% 25%, transparent 25% 100%)', filter: 'drop-shadow(-4px 10px 10px rgba(0,0,0,0.5))', zIndex: 4 }}>
                   <div style={{ position: 'absolute', top: '2px', right: '-2px', width: '100%', height: '100%', borderRadius: '50%', borderTop: '2px solid #fff', borderRight: '4px solid #93c5fd', clipPath: 'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)' }}></div>
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: '15px', right: '15px', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '20px', padding: '4px 14px', color: '#fff', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.5px', boxShadow: '0 6px 16px rgba(0,0,0,0.6)', zIndex: 5 }}>
                with AI
              </div>
            </div>
          </div>
          <div className="bento-card-action">
            <span style={{ color: '#4F46E5' }}>{lang === 'ko' ? '이동하기' : 'Go'}</span>
            <span className="bento-arrow" aria-hidden="true" style={{ color: '#4F46E5' }}>→</span>
          </div>
        </article>

        {/* Card 3 */}
        <article
          className="bento-card bento-tone-indigo"
          onClick={() => navigate('/partner-search')}
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
          <div className="bento-visual-box" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)', overflow: 'hidden', position: 'relative', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <div style={{ position: 'absolute', width: '200%', height: '200%', background: 'conic-gradient(from 0deg at 50% 50%, rgba(59, 130, 246, 0.1) 0deg, transparent 60deg, transparent 300deg, rgba(59, 130, 246, 0.1) 360deg)', animation: 'spin 10s linear infinite' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%', height: '100%' }}>
               <span style={{ position: 'absolute', fontSize: '7rem', color: 'rgba(147, 197, 253, 0.2)', filter: 'drop-shadow(0 0 12px #3b82f6)', zIndex: 1, fontWeight: 300, transform: 'scaleX(1.8)' }}>∞</span>
               <span style={{ fontSize: '3.8rem', fontWeight: 900, background: 'linear-gradient(180deg, #ffffff 0%, #93c5fd 50%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.9))', zIndex: 2, letterSpacing: '-2px' }}>AI</span>
            </div>
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
          <div className="bento-visual-box" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)', overflow: 'hidden', position: 'relative', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <div style={{ position: 'absolute', width: '100px', height: '100px', background: 'rgba(59, 130, 246, 0.2)', filter: 'blur(25px)' }}></div>
            <div style={{ width: '84px', height: '96px', background: 'linear-gradient(135deg, rgba(147,197,253,0.9), rgba(59,130,246,0.3))', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
               <div style={{ width: '78px', height: '90px', background: '#0f172a', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '16px', left: '16px', width: '14px', height: '22px', background: 'linear-gradient(180deg, #ffffff 0%, #93c5fd 100%)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', transform: 'rotate(-25deg)', zIndex: 1 }}></div>
                  <div style={{ position: 'absolute', top: '16px', right: '16px', width: '14px', height: '22px', background: 'linear-gradient(180deg, #ffffff 0%, #93c5fd 100%)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', transform: 'rotate(25deg)', zIndex: 1 }}></div>
                  <div style={{ width: '52px', height: '42px', background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)', borderRadius: '25px 25px 20px 20px', position: 'relative', boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.5)', zIndex: 2 }}>
                     <div style={{ position: 'absolute', top: '8px', left: '4px', width: '44px', height: '26px', background: '#020617', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 4px' }}>
                         <div style={{ width: '12px', height: '14px', background: '#60a5fa', borderRadius: '5px', boxShadow: '0 0 10px #60a5fa' }}></div>
                         <div style={{ width: '12px', height: '14px', background: '#60a5fa', borderRadius: '5px', boxShadow: '0 0 10px #60a5fa' }}></div>
                     </div>
                  </div>
                  <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '14px', background: '#93c5fd', borderRadius: '3px', zIndex: 1 }}></div>
               </div>
            </div>
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
          <div className="bento-visual-box" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)', overflow: 'hidden', position: 'relative', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <div style={{ position: 'absolute', top: '15px', left: '15px', color: '#93c5fd', fontSize: '1.2rem', filter: 'drop-shadow(0 0 5px #93c5fd)' }}>✦</div>
            <div style={{ position: 'absolute', top: '35px', left: '30px', color: '#ffffff', fontSize: '0.8rem', filter: 'drop-shadow(0 0 3px #ffffff)' }}>✦</div>
            <div style={{ position: 'absolute', top: '22px', left: '42px', color: '#93c5fd', fontSize: '1.1rem', fontWeight: 900, textShadow: '0 0 6px #60a5fa' }}>AI</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', paddingBottom: '15px', position: 'relative' }}>
               <div style={{ width: '65px', height: '75px', background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #cbd5e1 100%)', borderRadius: '35px 35px 20px 20px', position: 'relative', boxShadow: 'inset -5px -5px 12px rgba(0,0,0,0.15)', zIndex: 1 }}>
                  <div style={{ position: 'absolute', top: '-8px', left: '8px', width: '18px', height: '18px', background: '#ffffff', borderRadius: '50%', boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.1)' }}></div>
                  <div style={{ position: 'absolute', top: '-8px', right: '8px', width: '18px', height: '18px', background: '#ffffff', borderRadius: '50%', boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.1)' }}></div>
                  <div style={{ position: 'absolute', top: '15px', left: '-2px', width: '69px', height: '16px', background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', borderRadius: '2px' }}>
                     <div style={{ background: '#ffffff', color: '#1d4ed8', fontSize: '9px', fontWeight: 900, padding: '1px 5px', borderRadius: '3px' }}>AI</div>
                  </div>
                  <div style={{ position: 'absolute', top: '35px', left: '16px', width: '6px', height: '2px', background: '#1e293b', transform: 'rotate(15deg)' }}></div>
                  <div style={{ position: 'absolute', top: '35px', right: '16px', width: '6px', height: '2px', background: '#1e293b', transform: 'rotate(-15deg)' }}></div>
                  <div style={{ position: 'absolute', top: '40px', left: '20px', width: '4px', height: '5px', background: '#0f172a', borderRadius: '50%' }}></div>
                  <div style={{ position: 'absolute', top: '40px', right: '20px', width: '4px', height: '5px', background: '#0f172a', borderRadius: '50%' }}></div>
                  <div style={{ position: 'absolute', top: '43px', left: '26px', width: '13px', height: '9px', background: 'linear-gradient(180deg, #334155, #0f172a)', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      <div style={{ position: 'absolute', top: '1px', left: '3px', width: '5px', height: '2px', background: 'rgba(255,255,255,0.5)', borderRadius: '1px' }}></div>
                  </div>
                  <div style={{ position: 'absolute', bottom: '15px', left: '-5px', width: '22px', height: '26px', background: '#ffffff', borderRadius: '50%', boxShadow: 'inset -2px -2px 6px rgba(0,0,0,0.1)', zIndex: 3 }}></div>
                  <div style={{ position: 'absolute', bottom: '15px', right: '-5px', width: '22px', height: '26px', background: '#ffffff', borderRadius: '50%', boxShadow: 'inset 2px -2px 6px rgba(0,0,0,0.1)', zIndex: 3 }}></div>
               </div>
               <div style={{ width: '80px', height: '45px', background: 'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)', borderRadius: '6px 6px 0 0', position: 'absolute', bottom: '12px', zIndex: 2, transform: 'perspective(150px) rotateX(15deg)', boxShadow: '0 -3px 10px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '10px', height: '10px', background: 'rgba(255,255,255,0.7)', borderRadius: '50%', boxShadow: '0 0 6px rgba(255,255,255,0.5)' }}></div>
               </div>
               <div style={{ width: '90px', height: '6px', background: 'linear-gradient(90deg, #475569, #334155)', borderRadius: '3px', position: 'absolute', bottom: '6px', zIndex: 4, boxShadow: '0 6px 10px rgba(0,0,0,0.6)' }}></div>
            </div>
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

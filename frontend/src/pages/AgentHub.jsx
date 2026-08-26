import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider.jsx';
import '../ui/OverviewBento.css';

const businessAgents = [
  {
    id: 'exhibitor',
    step: '01',
    icon: 'search',
    titleKo: '참가기업 발굴',
    titleEn: 'Exhibitor Discovery',
    copyKo: '전시회·시장개척단 조건에 맞는 참가기업 후보를 탐색하고 정보를 정리합니다.',
    copyEn: 'Find and organize exhibitor candidates matching exhibition requirements.',
    link: '/ax-data',
  },
  {
    id: 'market',
    step: '02',
    icon: 'document',
    titleKo: '글로벌 시장정보',
    titleEn: 'Global Market Info',
    copyKo: '국가·품목별 시장, 규제, 관세, 지역전문가 정보를 확인합니다.',
    copyEn: 'Review market, tariff, regulation, and local expert information.',
    link: '/consultants',
  },
  {
    id: 'buyer',
    step: '03',
    icon: 'nodes',
    titleKo: '바이어 발굴·B2B 매칭',
    titleEn: 'Buyer Discovery & B2B Match',
    copyKo: '해외 바이어와 파트너 후보를 탐색하고 매칭 근거를 확인합니다.',
    copyEn: 'Search buyer and partner candidates with matching evidence.',
    link: '/partner-search',
  },
  {
    id: 'schedule',
    step: '04',
    icon: 'calendar',
    titleKo: '상담일정 관리',
    titleEn: 'Schedule Management',
    copyKo: '온라인·현장 상담 일정과 승인 상태를 관리합니다.',
    copyEn: 'Manage online and onsite meeting schedules and approvals.',
    link: '/schedule',
  },
  {
    id: 'aftercare',
    step: '05',
    icon: 'checklist',
    titleKo: '사후관리',
    titleEn: 'Aftercare',
    copyKo: '상담 결과와 후속 조치 상태를 체계적으로 관리합니다.',
    copyEn: 'Track meeting outcomes and follow-up actions systematically.',
    link: '/aftercare',
  },
];

function LineIcon({ name }) {
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="5.7" /><path d="m15.2 15.2 4.3 4.3" /></>,
    document: <><path d="M7 3.5h7l3 3v14H7z" /><path d="M14 3.5v3h3M9.5 11h5M9.5 14h5M9.5 17h3.5" /></>,
    nodes: <><circle cx="6" cy="12" r="2.3" /><circle cx="18" cy="6" r="2.3" /><circle cx="18" cy="18" r="2.3" /><path d="m8.1 10.9 7.8-3.8M8.1 13.1l7.8 3.8" /></>,
    calendar: <><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M8 3.5v4M16 3.5v4M4 9.5h16M8 13h2M14 13h2M8 16.5h2" /></>,
    checklist: <><rect x="5" y="4" width="14" height="16" rx="2" /><path d="m8 9 1.5 1.5L12 7.8M13.5 9h2M8 14l1.5 1.5 2.5-2.7M13.5 14h2" /></>,
  };
  return <svg className="demo-ops-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}


export default function AgentHub() {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const isKo = lang === 'ko';

  return (
    <div className="demo-ops-home">
      <section className="demo-ops-hero" aria-labelledby="demo-ops-hero-title">
        <div className="demo-ops-flow" aria-hidden="true"><i /><i /><i /><span /><span /></div>
        <p className="demo-ops-eyebrow">{isKo ? 'AI 기반 전시회 운영 AX 플랫폼' : 'EXHIBITION OPERATIONS WORKFLOW'}</p>
        <h1 id="demo-ops-hero-title">{isKo ? '전시회 운영 업무를 AI 기반 AX로 전환합니다.' : 'Organize every exhibition operation in one place.'}</h1>
        <p className="demo-ops-subtitle">{isKo ? <>참가기업 발굴부터 해외 바이어 관리, 상담일정, 사후관리까지<br className="demo-ops-desktop-br" />담당자 검토와 승인을 중심으로 연결합니다.</> : 'Manage exhibitor discovery, buyers, B2B meetings, and aftercare through clear review and approval workflows.'}</p>
        <button type="button" className="demo-ops-cta" onClick={() => navigate('/overview')}>
          {isKo ? '전시 운영 현황 보기' : 'View Operations Overview'} <span aria-hidden="true">→</span>
        </button>
      </section>

      <section className="demo-ops-workflow" aria-labelledby="demo-ops-workflow-title">
        <div className="demo-ops-section-heading"><div><p>{isKo ? '업무 흐름' : 'WORKFLOW'}</p><h2 id="demo-ops-workflow-title">{isKo ? '필요한 업무부터 확인하세요.' : 'Start with the task you need.'}</h2></div><span>{isKo ? '5개 운영 단계' : '5 operational stages'}</span></div>
        <div className="demo-ops-card-grid">
          {businessAgents.map((agent) => <button type="button" className="demo-ops-card" key={agent.id} onClick={() => navigate(agent.link)}>
            <span className="demo-ops-step">{agent.step}</span>
            <span className="demo-ops-icon-box"><LineIcon name={agent.icon} /></span>
            <strong>{isKo ? agent.titleKo : agent.titleEn}</strong>
            <small>{isKo ? agent.copyKo : agent.copyEn}</small>
            <span className="demo-ops-card-link">{isKo ? '업무 보기' : 'Open task'} <b aria-hidden="true">→</b></span>
          </button>)}
        </div>
      </section>
    </div>
  );
}

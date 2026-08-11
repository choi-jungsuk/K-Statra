import React from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { useNavigate } from 'react-router-dom';

export default function AgentHub() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  const agents = [
    {
      id: 'exhibitor',
      title: t('agent_exhibitor'),
      desc: t('agent_exhibitor_desc'),
      icon: '🏢',
      path: '/ax-data',
      color: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)'
    },
    {
      id: 'market',
      title: t('agent_market'),
      desc: t('agent_market_desc'),
      icon: '🌍',
      path: '/consultants',
      color: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)'
    },
    {
      id: 'buyer',
      title: t('agent_buyer'),
      desc: t('agent_buyer_desc'),
      icon: '🤝',
      path: '/partner-search',
      color: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)'
    },
    {
      id: 'schedule',
      title: t('agent_schedule'),
      desc: t('agent_schedule_desc'),
      icon: '📅',
      path: '/schedule',
      color: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)'
    },
    {
      id: 'aftercare',
      title: t('agent_aftercare'),
      desc: t('agent_aftercare_desc'),
      icon: '📋',
      path: '/aftercare',
      color: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'
    }
  ];

  return (
    <div className="agent-hub-container">
      <div className="agent-hub-header">
        <div className="agent-hub-badge">
          <span className="badge-pulse"></span>
          {lang === 'ko' ? '5대 업무 에이전트 허브' : '5-Core Agent Hub'}
        </div>
        <h1>{lang === 'ko' ? '전시 운영 지원 에이전트' : 'Exhibition Operations Agents'}</h1>
        <p className="subtitle">
          {lang === 'ko' 
            ? '참가기업 발굴부터 상담 후속관리까지, 전시 운영을 돕는 5개 AI 에이전트를 한 곳에서 만나보세요.'
            : 'Access 5 AI agents streamlining everything from exhibitor discovery to aftercare operations.'}
        </p>
      </div>

      <div className="agents-grid">
        {agents.map(agent => (
          <button
            key={agent.id}
            type="button"
            className="agent-card"
            aria-label={agent.title}
            onClick={() => navigate(agent.path)}
            style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <div className="agent-card-header">
              <div className="agent-avatar" style={{ background: agent.color }}>
                {agent.icon}
              </div>
              <div>
                <h3>{agent.title}</h3>
              </div>
            </div>
            <p className="agent-desc">{agent.desc}</p>
            <div style={{ marginTop: 'auto', textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)' }}>
                {lang === 'ko' ? '이동하기 →' : 'Launch →'}
              </span>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        .agent-hub-container {
          padding: 3rem 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
          color: var(--fg);
          font-family: 'Outfit', 'Inter', sans-serif;
        }

        .agent-hub-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .agent-hub-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(79, 70, 229, 0.08);
          color: var(--accent);
          padding: 0.5rem 1.25rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 700;
          border: 1px solid rgba(79, 70, 229, 0.15);
          margin-bottom: 1.5rem;
        }

        .badge-pulse {
          width: 8px;
          height: 8px;
          background-color: var(--accent);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .agent-hub-header h1 {
          font-size: 3rem;
          font-weight: 800;
          background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1rem;
          letter-spacing: -0.03em;
        }

        .agent-hub-header .subtitle {
          color: var(--fg-secondary);
          font-size: 1.15rem;
          max-width: 800px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
        }

        .agent-card {
          background: var(--card-glass, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: var(--radius-lg, 16px);
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
        }

        .agent-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: rgba(79, 70, 229, 0.4);
        }

        .agent-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .agent-avatar {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .agent-card-header h3 {
          font-size: 1.2rem;
          font-weight: 800;
          margin: 0;
          color: var(--fg, #1e293b);
          line-height: 1.3;
        }

        .agent-desc {
          font-size: 0.95rem;
          color: var(--fg-secondary, #64748b);
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(79, 70, 229, 0); }
          100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
      `}</style>
    </div>
  );
}

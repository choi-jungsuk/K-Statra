import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';
import Button from '../ui/Button.jsx';

export default function AftercarePage() {
  const { lang } = useI18n();

  // "등록된 후속관리 건이 없습니다"라는 빈 상태를 기본값으로 사용한다.
  const [hasData, setHasData] = useState(false);

  // 샘플 데이터 토글용
  const toggleDemo = () => setHasData(!hasData);

  const demoSamples = [
    {
      id: 1,
      company: lang === 'ko' ? '글로벌 유통사 A' : 'Global Distributor A',
      status: 'rfq',
      date: '2026-10-25',
      desc: lang === 'ko' ? '화장품 기초 세트 단가 견적 요청' : 'RFQ for skincare basic set unit price',
    },
    {
      id: 2,
      company: lang === 'ko' ? '현지 제조사 B' : 'Local Manufacturer B',
      status: 'sample',
      date: '2026-10-27',
      desc: lang === 'ko' ? '초기 테스트용 부품 샘플 발송 완료' : 'Initial test parts sample sent',
    },
    {
      id: 3,
      company: lang === 'ko' ? '바이어 C' : 'Buyer C',
      status: 'contract',
      date: '2026-11-02',
      desc: lang === 'ko' ? '연간 공급 계약서 검토 중' : 'Reviewing annual supply contract',
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'contact': return { label: lang === 'ko' ? '후속 연락' : 'Follow-up', color: '#3b82f6', bg: '#eff6ff' };
      case 'rfq': return { label: lang === 'ko' ? 'RFQ/견적' : 'RFQ/Quote', color: '#f59e0b', bg: '#fffbeb' };
      case 'sample': return { label: lang === 'ko' ? '샘플' : 'Sample', color: '#8b5cf6', bg: '#f5f3ff' };
      case 'contract': return { label: lang === 'ko' ? '계약 검토' : 'Contract', color: '#10b981', bg: '#ecfdf5' };
      default: return { label: lang === 'ko' ? '상담 완료' : 'Consulted', color: '#64748b', bg: '#f8fafc' };
    }
  };

  return (
    <div className="aftercare-container">
      <div className="page-agent-header">
        <div className="search-agent-avatar" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}>
          📋
        </div>
        <span className="page-agent-badge-text">
          {lang === 'ko' ? '사후관리 Agent' : 'Aftercare Agent'}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem', fontWeight: 800 }}>
            {lang === 'ko' ? '상담 후속 조치 및 사후관리' : 'Post-Meeting Aftercare'}
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', maxWidth: '800px', lineHeight: 1.5 }}>
            {lang === 'ko'
              ? '상담 완료 후 견적, 샘플, 계약 검토로 이어지는 후속 업무 흐름을 확인합니다.'
              : 'Review the post-meeting workflow for quotes, samples, and contract discussions.'}
          </p>
        </div>
        <Button onClick={toggleDemo} variant="secondary" style={{ fontSize: '0.8rem' }}>
          {lang === 'ko' ? '데모 샘플 토글' : 'Toggle Demo Samples'}
        </Button>
      </div>

      {!hasData ? (
        <div className="empty-state-box">
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📭</span>
          <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: '#1f2937' }}>
            {lang === 'ko' ? '등록된 후속관리 건이 없습니다' : 'No aftercare records found'}
          </h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            {lang === 'ko' ? '새로운 비즈니스 매칭 상담을 진행한 후 사후관리를 시작해보세요.' : 'Complete a business meeting to start aftercare tracking.'}
          </p>
        </div>
      ) : (
        <div>
          <div className="demo-notice">
            ⚠️ {lang === 'ko' ? '데모 샘플 화면입니다 (실제 데이터 아님)' : 'This is a demo sample view (Not real data)'}
          </div>

          <div className="aftercare-board">
            {demoSamples.map(item => {
              const badge = getStatusBadge(item.status);
              return (
                <div key={item.id} className="aftercare-card">
                  <div className="card-header-row">
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{item.company}</h4>
                    <span className="status-badge" style={{ color: badge.color, background: badge.bg }}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="card-desc">{item.desc}</p>
                  <div className="card-footer-row">
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>📅 {item.date}</span>
                    <Button variant="secondary" style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '4px' }}>
                      {lang === 'ko' ? '상세보기' : 'View'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .aftercare-container {
          padding: 2rem 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-agent-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .search-agent-avatar {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
        }

        .page-agent-badge-text {
          font-size: 12px;
          font-weight: 700;
          color: #6366F1;
          background: rgba(99, 102, 241, 0.1);
          padding: 2px 8px;
          border-radius: 999px;
        }

        .empty-state-box {
          padding: 5rem 2rem;
          text-align: center;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 16px;
        }

        .demo-notice {
          background: #fffbeb;
          color: #d97706;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 1.5rem;
          display: inline-block;
        }

        .aftercare-board {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .aftercare-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          transition: transform 0.2s;
        }

        .aftercare-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }

        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .status-badge {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 999px;
        }

        .card-desc {
          font-size: 13.5px;
          color: #475569;
          margin: 0 0 1.5rem 0;
          line-height: 1.5;
        }

        .card-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #f1f5f9;
          padding-top: 1rem;
        }
      `}</style>
    </div>
  );
}

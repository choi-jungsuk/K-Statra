import React from 'react';

export default function BuyerWorkflowTabs({ activeStep = 'exhibitors', onSelectStep }) {
  const steps = [
    { id: 'exhibitors', labelKo: '1. 참가업체 입력', icon: '🏢' },
    { id: 'buyers', labelKo: '2. 바이어 후보 발굴', icon: '🌐' },
    { id: 'invitations', labelKo: '3. 초청·호텔투숙료 지원', icon: '✉️' },
    { id: 'matching', labelKo: '4. 국내기업 추가 매칭', icon: '🤝' },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {steps.map((step) => {
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectStep(step.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isActive ? 800 : 600,
                border: isActive ? '1px solid #6366F1' : '1px solid #E2E8F0',
                background: isActive ? '#6366F1' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
                boxShadow: isActive ? '0 2px 4px rgba(99,102,241,0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{step.icon}</span>
              <span>{step.labelKo}</span>
            </button>
          );
        })}
      </div>

      <a
        href="/consultation-management"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12.5px',
          fontWeight: 800,
          border: '1px solid #C7D2FE',
          background: '#EEF2FF',
          color: '#4F46E5',
          textDecoration: 'none',
        }}
      >
        <span>📅</span>
        <span>상담일정 관리 Agent 인계 →</span>
      </a>
    </div>
  );
}

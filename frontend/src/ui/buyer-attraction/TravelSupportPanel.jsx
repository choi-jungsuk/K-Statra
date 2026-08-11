import React from 'react';

export default function TravelSupportPanel({ invitations, onUpdateInvitation, loading }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Policy Notice & Dry-run Banner */}
      <div style={{ background: '#FFFBEB', padding: '18px 24px', borderRadius: '14px', border: '1px solid #FCD34D' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#B45309', background: '#FEF3C7', padding: '3px 10px', borderRadius: '20px' }}>
              ⚠️ EMAIL & HOTEL POLICY
            </span>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#78350F', margin: '6px 0 2px 0' }}>
              호텔투숙료 100% 지원 심사 및 초청 이메일 관리 (개발·시연 전용 Dry-Run 모드)
            </h3>
            <p style={{ fontSize: '13px', color: '#92400E', margin: 0, lineHeight: 1.4 }}>
              • 호텔투숙료 지원 정책: 담당자 검토 및 투숙 증빙 승인 후 <strong>해당 호텔투숙료의 100% 지원 금액</strong>이 계산됩니다.<br />
              • 보안 수칙: 시연 및 테스트 진행 중 실제 외부 바이어에게 이메일을 발송하지 않으며, 실제 호텔투숙료 지급도 실행하지 않습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Invitations Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
            ✉️ 바이어 초청 및 호텔투숙료 지원 심사 현황 ({invitations.length}건)
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>바이어명</th>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>국가</th>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>수신 이메일</th>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>초청상태</th>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>호텔투숙료 지원상태</th>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>지원 대상 호텔투숙료</th>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>지원비율</th>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>예상 지원액 (100%)</th>
                <th style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>심사 처리</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => {
                const supportAmount = Math.round((inv.eligibleAirfare || 2000) * 1.0);
                return (
                  <tr key={inv._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>{inv.buyerName}</td>
                    <td style={{ padding: '12px 14px' }}>{inv.country}</td>
                    <td style={{ padding: '12px 14px', color: '#64748B' }}>{inv.recipientEmail || 'contact@buyer-demo.com'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '12px' }}>
                        {inv.invitationStatus === 'approved_to_invite' ? '초청 승인' : inv.invitationStatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: inv.travelSupportStatus === 'approved' ? '#D1FAE5' : '#FEF3C7', color: inv.travelSupportStatus === 'approved' ? '#065F46' : '#92400E', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '12px' }}>
                        {inv.travelSupportStatus === 'approved' ? '100% 지원 승인' : '지원 신청/검토중'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700 }}>${inv.eligibleAirfare || 2000} USD</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#4F46E5' }}>100%</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#166534' }}>${supportAmount} USD</td>
                    <td style={{ padding: '12px 14px' }}>
                      {inv.travelSupportStatus !== 'approved' ? (
                        <button
                          type="button"
                          onClick={() => onUpdateInvitation(inv._id, { travelSupportStatus: 'approved', eligibleAirfare: 2000 })}
                          style={{ padding: '4px 10px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                        >
                          100% 지원 승인
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#166534', fontWeight: 700 }}>✅ 승인 완료</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

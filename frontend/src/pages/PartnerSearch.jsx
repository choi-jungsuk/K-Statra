import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import BuyerWorkflowTabs from '../ui/buyer-attraction/BuyerWorkflowTabs.jsx';
import ExhibitorBatchPanel from '../ui/buyer-attraction/ExhibitorBatchPanel.jsx';
import BuyerCandidateTable from '../ui/buyer-attraction/BuyerCandidateTable.jsx';
import TravelSupportPanel from '../ui/buyer-attraction/TravelSupportPanel.jsx';
import DualMatchPanel from '../ui/buyer-attraction/DualMatchPanel.jsx';
import ConsultationSchedulePanel from '../ui/buyer-attraction/ConsultationSchedulePanel.jsx';

export default function PartnerSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentStep = searchParams.get('step') || 'exhibitors';

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [matches, setMatches] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');

  // Load campaign details on mount
  const loadCampaignData = async () => {
    setLoading(true);
    try {
      const list = await api.listBuyerAttractionCampaigns();
      if (list && list.length > 0) {
        const camp = list[0];
        setCampaign(camp);

        // Preload child data if exists
        const [cands, invs, mtchs, appts] = await Promise.all([
          api.listBuyerCandidates(camp._id).catch(() => []),
          api.listBuyerInvitations(camp._id).catch(() => []),
          api.listMatches(camp._id).catch(() => []),
          api.listAppointments(camp._id).catch(() => []),
        ]);
        setCandidates(cands || []);
        setInvitations(invs || []);
        setMatches(mtchs || []);
        setAppointments(appts || []);
      }
    } catch (err) {
      console.error('Failed to load campaign data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaignData();
  }, []);

  const handleSelectStep = (stepId) => {
    setSearchParams({ step: stepId });
  };

  // Stage 1 Handlers
  const handleImportExhibitors = async (exhibitors) => {
    if (!campaign?._id) return;
    setLoading(true);
    try {
      const updated = await api.importExhibitors(campaign._id, { exhibitors });
      setCampaign(updated);
      setStatusMsg('✅ 참가업체 배치가 성공적으로 저장되었습니다.');
    } catch (err) {
      setStatusMsg('❌ 참가업체 저장 오류: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromDb = async () => {
    if (!campaign?._id) return;
    setLoading(true);
    try {
      const updated = await api.importExhibitorsFromDb(campaign._id);
      setCampaign(updated);
      setStatusMsg('✅ DB에서 자동차/전시회 관련 참가업체를 성공적으로 불러왔습니다.');
    } catch (err) {
      setStatusMsg('❌ DB 불러오기 오류: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Stage 2 Handlers
  const handleSearchBuyers = async () => {
    if (!campaign?._id) return;
    setLoading(true);
    try {
      const cands = await api.searchBuyerCandidates(campaign._id);
      setCandidates(cands || []);
      setStatusMsg('✅ 참가업체 품목 맞춤 해외 바이어 후보를 발굴했습니다.');
    } catch (err) {
      setStatusMsg('❌ 바이어 검색 오류: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewCandidate = async (candidateId, status, reviewNote) => {
    try {
      await api.reviewCandidate(candidateId, status, reviewNote);
      if (campaign?._id) {
        const [cands, invs] = await Promise.all([
          api.listBuyerCandidates(campaign._id),
          api.listBuyerInvitations(campaign._id),
        ]);
        setCandidates(cands || []);
        setInvitations(invs || []);
      }
    } catch (err) {
      alert('검토 상태 변경 오류: ' + err.message);
    }
  };

  // Stage 3 Handler
  const handleUpdateInvitation = async (invitationId, updateDto) => {
    try {
      await api.updateBuyerInvitation(invitationId, updateDto);
      if (campaign?._id) {
        const invs = await api.listBuyerInvitations(campaign._id);
        setInvitations(invs || []);
      }
      setStatusMsg('✅ 호텔투숙료 100% 지원 심사 및 초청 상태가 업데이트되었습니다.');
    } catch (err) {
      alert('초청 정보 수정 오류: ' + err.message);
    }
  };

  // Stage 4 Handler
  const handleGenerateMatches = async () => {
    if (!campaign?._id) return;
    setLoading(true);
    try {
      const mtchs = await api.generateMatches(campaign._id);
      setMatches(mtchs || []);
      setStatusMsg('✅ 참가업체(부스) + 국내 비참가업체(글로벌 상담장) 이중 매칭이 생성되었습니다.');
    } catch (err) {
      setStatusMsg('❌ 이중 매칭 생성 오류: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1240, margin: '24px auto', padding: '0 20px 80px 20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top Professional Header (Pivoted to 전시회 Buyer Attraction Agent) */}
      <div style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)', color: '#FFFFFF', padding: '28px 32px', borderRadius: '18px', boxShadow: '0 10px 25px -5px rgba(15,23,42,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.2)', color: '#A5B4FC', border: '1px solid rgba(165,180,252,0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800 }}>
              <span>🏎️ 전시회</span>
              <span>•</span>
              <span>글로벌 바이어 유치 Agent</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '12px 0 6px 0', letterSpacing: '-0.5px' }}>
              전시회 글로벌 바이어 유치 Agent
            </h1>
            <p style={{ fontSize: '14px', color: '#CBD5E1', margin: 0, maxWidth: '800px', lineHeight: 1.5 }}>
              전시회 부스 참가기업과 해외 바이어 초청을 연계하고, 호텔투숙료 100% 지원 심사와 초청 바이어의 구매수요에 맞는 참가업체·비참가업체 이중 매칭을 수행합니다.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => navigate('/ax-data?mode=trade-mission')}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
            >
              🌏 해외시장개척단 바로가기
            </button>
          </div>
        </div>

        {/* Real Metrics Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 600 }}>부스 참가업체</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
              {campaign?.exhibitorSnapshot?.length || 0}개사
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 600 }}>바이어 후보</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
              {candidates.length}건
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 600 }}>초청 검토/발송</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#818CF8', marginTop: '2px' }}>
              {invitations.length}건
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 600 }}>호텔투숙료 100% 지원검토</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#FBBF24', marginTop: '2px' }}>
              {invitations.filter((i) => i.travelSupportStatus !== 'not_requested').length}건
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 600 }}>이중 매칭 건수</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
              {matches.length}건
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 600 }}>확정 상담 일정</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#F472B6', marginTop: '2px' }}>
              {appointments.length}건
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Workflow Tabs */}
      <div style={{ marginBottom: '24px' }}>
        <BuyerWorkflowTabs activeStep={currentStep} onSelectStep={handleSelectStep} />
      </div>

      {/* Status Alert Banner */}
      {statusMsg && (
        <div style={{ marginBottom: '20px', padding: '12px 18px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', color: '#1E40AF', fontSize: '13.5px', fontWeight: 700 }}>
          {statusMsg}
        </div>
      )}

      {/* Step Contents */}
      {currentStep === 'exhibitors' && (
        <ExhibitorBatchPanel
          campaign={campaign}
          onImportExhibitors={handleImportExhibitors}
          onImportFromDb={handleImportFromDb}
          loading={loading}
        />
      )}

      {currentStep === 'buyers' && (
        <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                🌐 해외 바이어 후보 발굴 및 검토
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                전시회 참가업체 품목 기반으로 해외 바이어 후보를 발굴하고 검토 상태를 부여합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSearchBuyers}
              disabled={loading}
              style={{ padding: '10px 20px', background: '#312E81', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
            >
              🔍 바이어 후보 발굴 실행
            </button>
          </div>

          {candidates.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', color: '#64748B', fontSize: '14px' }}>
              상단 [🔍 바이어 후보 발굴 실행] 버튼을 눌러 참가업체 제품에 일치하는 해외 바이어 후보를 탐색하세요.
            </div>
          ) : (
            <BuyerCandidateTable
              candidates={candidates}
              onReviewCandidate={handleReviewCandidate}
              loading={loading}
            />
          )}
        </div>
      )}

      {currentStep === 'invitations' && (
        <TravelSupportPanel
          invitations={invitations}
          onUpdateInvitation={handleUpdateInvitation}
          loading={loading}
        />
      )}

      {currentStep === 'matching' && (
        <DualMatchPanel
          matches={matches}
          onGenerateMatches={handleGenerateMatches}
          loading={loading}
        />
      )}

      {currentStep === 'schedule' && (
        <ConsultationSchedulePanel
          appointments={appointments}
          loading={loading}
        />
      )}
    </div>
  );
}

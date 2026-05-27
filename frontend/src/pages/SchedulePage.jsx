import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n/I18nProvider';
import Button from '../ui/Button';
import { useSearchParams } from 'react-router-dom';

export default function SchedulePage() {
  const { t, lang } = useI18n();
  const [searchParams] = useSearchParams();
  
  const presetCompany = searchParams.get('companyName') || '';
  const presetType = searchParams.get('type') || 'ONLINE'; // 'ONLINE' or 'OFFLINE'
  
  const [activeTab, setActiveTab] = useState(presetType === 'OFFLINE' ? 'OFFLINE' : 'ONLINE'); // 'ONLINE' or 'OFFLINE'
  
  const [consultations, setConsultations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hermes Agent status feedback simulation states
  const [agentStatus, setAgentStatus] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Form states
  const [onlineForm, setOnlineForm] = useState({ 
    companyName: presetType === 'ONLINE' ? presetCompany : '', 
    date: '', 
    timeSlot: '10:00 - 11:00', 
    agenda: presetType === 'ONLINE' ? '1차 수출 B2B 매칭 협의 및 기술 제안 설명' : '' 
  });
  const [offlineForm, setOfflineForm] = useState({ 
    companyName: presetType === 'OFFLINE' ? presetCompany : '', 
    exhibition: 'KOAA SHOW 2026', 
    date: '', 
    boothNumber: '', 
    purpose: presetType === 'OFFLINE' ? 'KOAA SHOW 2026 부스 비즈니스 매칭 계약 체결식 NDA 서명' : '' 
  });

  // 1. Fetch consultations & company list on mount
  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.listConsultations(),
      api.listCompanies({ limit: 20 })
    ])
      .then(([consultRes, compRes]) => {
        setConsultations(Array.isArray(consultRes) ? consultRes : []);
        setCompanies(Array.isArray(compRes?.data) ? compRes.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("SchedulePage initial load error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter consultations based on current tab
  const filteredConsultations = consultations.filter(c => c.reqType === activeTab);

  // 2. Handle Online Video Match booking
  const handleOnlineSubmit = async (e) => {
    e.preventDefault();
    if (!onlineForm.companyName || !onlineForm.date) {
      alert(lang === 'ko' ? '회사와 일자를 모두 선택해 주세요.' : 'Please select both company and date.');
      return;
    }

    setIsScheduling(true);
    setAgentStatus(lang === 'ko' ? 'Hermes 에이전트가 바이어의 스케줄러를 조회하는 중...' : 'Hermes agent looking up buyer schedule...');

    setTimeout(async () => {
      setAgentStatus(lang === 'ko' ? '비어있는 시간대를 예약하고 Zoom 가상 미팅룸 생성 중...' : 'Booking open slot and creating Zoom virtual meeting room...');
      
      setTimeout(async () => {
        const payload = {
          companyName: onlineForm.companyName,
          date: onlineForm.date,
          timeSlot: onlineForm.timeSlot,
          reqType: 'ONLINE',
          status: 'CONFIRMED',
          meetingLink: 'https://zoom.us/j/demo-k-statra-' + Math.random().toString(36).substring(7),
          agenda: onlineForm.agenda || '1차 비즈니스 매칭 검토 및 제안 설명'
        };

        try {
          await api.createConsultation(payload);
          setAgentStatus(lang === 'ko' ? '🎉 온라인 미팅 예약 및 화상 대화방 연결 성공!' : '🎉 Online meeting scheduled and meeting room connected successfully!');
          
          setTimeout(() => {
            setIsScheduling(false);
            setAgentStatus('');
            setOnlineForm({ companyName: '', date: '', timeSlot: '10:00 - 11:00', agenda: '' });
            loadData(); // Reload list
          }, 1500);
        } catch (err) {
          console.error(err);
          setIsScheduling(false);
          setAgentStatus('');
          alert('Scheduling failed. Please try again.');
        }
      }, 1500);
    }, 1500);
  };

  // 3. Handle Offline Exhibition Match booking
  const handleOfflineSubmit = async (e) => {
    e.preventDefault();
    if (!offlineForm.companyName || !offlineForm.date || !offlineForm.boothNumber) {
      alert(lang === 'ko' ? '회사, 일자, 부스 번호를 모두 작성해 주세요.' : 'Please fill in company, date, and booth number.');
      return;
    }

    setIsScheduling(true);
    setAgentStatus(lang === 'ko' ? `Hermes 에이전트가 "${offlineForm.exhibition}" 전시회 맵 확인 중...` : `Hermes agent mapping "${offlineForm.exhibition}" exhibition layout...`);

    setTimeout(async () => {
      setAgentStatus(lang === 'ko' ? `바이어 측 부스 번호 "${offlineForm.boothNumber}" 스케줄 및 동선 조율 중...` : `Coordinating booth schedule for "${offlineForm.boothNumber}"...`);
      
      setTimeout(async () => {
        const payload = {
          companyName: offlineForm.companyName,
          date: offlineForm.date,
          timeSlot: `${offlineForm.exhibition} - 부스 #${offlineForm.boothNumber}`,
          reqType: 'OFFLINE',
          status: 'CONFIRMED',
          boothNumber: offlineForm.boothNumber,
          meetingLink: '',
          agenda: `[${offlineForm.exhibition}] 현장 미팅 - ${offlineForm.purpose || '최종 파트너십 부스 미팅 및 계약 서명'}`
        };

        try {
          await api.createConsultation(payload);
          setAgentStatus(lang === 'ko' ? '🎉 오프라인 전시회 밋업 매칭 및 부스 일정 확정 성공!' : '🎉 Offline exhibition meetup scheduled and booth confirmed successfully!');
          
          setTimeout(() => {
            setIsScheduling(false);
            setAgentStatus('');
            setOfflineForm({ companyName: '', exhibition: 'KOAA SHOW 2026', date: '', boothNumber: '', purpose: '' });
            loadData(); // Reload list
          }, 1500);
        } catch (err) {
          console.error(err);
          setIsScheduling(false);
          setAgentStatus('');
          alert('Scheduling failed. Please try again.');
        }
      }, 1500);
    }, 1500);
  };

  // Exhibition Card presets
  const exhibitions = [
    { name: 'KOAA SHOW 2026', date: '2026.10.21 - 10.23', color: '#BE123C', desc: '국제 모빌리티 산업전 - 모빌리티를 위한 모든 솔루션 (한국 KINTEX - PoC 진행 중)' },
    { name: 'CES 2026 Las Vegas', date: '2026.01.06 - 01.09', color: '#4F46E5', desc: '세계 최대 가전 및 IT 정보기술 전시회 (미국 라스베이거스)' },
    { name: 'MWC 2026 Barcelona', date: '2026.03.02 - 03.05', color: '#10B981', desc: '글로벌 최대 모바일 및 커뮤니케이션 기술 박람회 (스페인 바르셀로나)' },
    { name: 'IFA 2026 Berlin', date: '2026.09.04 - 09.09', color: '#F59E0B', desc: '유럽 유서 깊은 글로벌 멀티미디어 및 가전 산업 박람회 (독일 베를린)' }
  ];

  return (
    <div className="inner" style={{ padding: '2rem 1rem' }}>
      {/* 전역 에이전트 배지 */}
      <div className="page-agent-header">
        <div className="search-agent-avatar" style={{ background: 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="search-agent-pulse"></span>
        </div>
        <span className="page-agent-badge-text">
          {lang === 'ko' ? '1:1 글로벌 밋업 조율 에이전트' : '1:1 Global Meetup Coordinator Agent'}
        </span>
      </div>

      {/* 헤더 및 설명 */}
      <h2 style={{ marginBottom: '0.5rem', fontWeight: 800 }}>
        {lang === 'ko' ? '1:1 비즈니스 밋업' : '1:1 Business Meetups'}
      </h2>
      <p style={{ marginBottom: '2rem', color: '#6b7280', fontSize: '14px', maxWidth: '800px', lineHeight: 1.5 }}>
        {lang === 'ko' 
          ? '장벽 없는 글로벌 바이어 탐색을 위한 온라인 화상 미팅부터, 대형 전시회 오프라인 부스에서의 최종 계약 컨펌까지 원스톱으로 조율합니다.' 
          : 'Coordinate online video meetings for quick screening, and meet in person at major exhibitions to finalize contracts.'}
      </p>

      {/* 2대 영역 분할 슬라이딩 탭 제어기 */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <div className="schedule-tabs-row">
          <button 
            className={`schedule-tab-btn ${activeTab === 'ONLINE' ? 'active' : ''}`}
            onClick={() => setActiveTab('ONLINE')}
            type="button"
          >
            <span>💻</span> {lang === 'ko' ? '온라인 비즈니스 미팅' : 'Online Video Meetup'}
          </button>
          <button 
            className={`schedule-tab-btn ${activeTab === 'OFFLINE' ? 'active' : ''}`}
            onClick={() => setActiveTab('OFFLINE')}
            type="button"
          >
            <span>🎪</span> {lang === 'ko' ? '글로벌 전시회 오프라인 미팅' : 'Offline Exhibition Booth'}
          </button>
        </div>
      </div>

      {/* 실시간 에이전트 작업 진행 피드백 바 */}
      {isScheduling && (
        <div className="hermes-status-msg" style={{ width: '100%', maxWidth: '800px', justifyContent: 'center', padding: '12px', borderRadius: '12px', marginBottom: '2rem', background: 'rgba(79, 70, 229, 0.08)', border: '1px solid rgba(79, 70, 229, 0.15)' }}>
          <span className="pulse-loader" style={{ scale: '0.8' }}>
            <span></span>
            <span></span>
            <span></span>
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-dark)' }}>{agentStatus}</span>
        </div>
      )}

      {/* Main split grid layout */}
      <div className="schedule-grid-layout">
        
        {/* Left: Schedule List */}
        <div>
          {activeTab === 'OFFLINE' && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--fg)' }}>
                {lang === 'ko' ? '조율 대상 글로벌 대형 전시회' : 'Target Global Exhibitions'}
              </h3>
              <div className="exhibitions-banner-row">
                {exhibitions.map((ex, idx) => (
                  <div key={idx} className="exhibition-banner-card">
                    <span className="exhibition-logo-banner" style={{ background: ex.color }}>
                      {ex.name.split(' ')[0]}
                    </span>
                    <h4>{ex.name}</h4>
                    <p style={{ fontWeight: 700, color: ex.color }}>{ex.date}</p>
                    <p>{ex.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--fg)' }}>
            {activeTab === 'ONLINE' 
              ? (lang === 'ko' ? '확정된 온라인 미팅 일정' : 'Confirmed Online Meetups')
              : (lang === 'ko' ? '확정된 글로벌 전시회 현장 미팅 일정' : 'Confirmed Booth Meetups')}
          </h3>

          {loading ? (
            <p>{lang === 'ko' ? '데이터 로딩 중...' : 'Loading schedules...'}</p>
          ) : filteredConsultations.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--card-glass)', backdropFilter: 'var(--glass-blur)', border: '1px solid rgba(226,232,240,0.6)', borderRadius: '20px' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>📅</span>
              <p className="muted" style={{ fontSize: '14px', margin: 0 }}>
                {activeTab === 'ONLINE'
                  ? (lang === 'ko' ? '등록된 온라인 화상 미팅 스케줄이 없습니다.' : 'No online meetups scheduled yet.')
                  : (lang === 'ko' ? '등록된 글로벌 전시회 오프라인 밋업 스케줄이 없습니다.' : 'No offline exhibition meetups scheduled yet.')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredConsultations.map(c => (
                <div 
                  key={c._id} 
                  style={{ 
                    padding: '1.5rem', 
                    border: '1px solid rgba(226, 232, 240, 0.8)', 
                    borderRadius: '16px', 
                    background: '#ffffff', 
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-light)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--fg)' }}>{c.companyName}</h4>
                    <span style={{ 
                      padding: '3px 10px', 
                      borderRadius: '999px', 
                      fontSize: '11px', 
                      fontWeight: 800,
                      background: c.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                      color: c.status === 'CONFIRMED' ? 'var(--success)' : '#475569'
                    }}>
                      {c.status}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 1.25rem 0', color: 'var(--fg-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
                    <strong>📅 {lang === 'ko' ? '일시:' : 'Date:'}</strong> {new Date(c.date).toLocaleDateString()} ({c.timeSlot})
                    <br />
                    <strong>🎯 {lang === 'ko' ? '미팅 목적:' : 'Agenda:'}</strong> {c.agenda}
                    {c.boothNumber && (
                      <>
                        <br />
                        <strong>🎪 {lang === 'ko' ? '전시회 부스:' : 'Exhibition Booth:'}</strong> <span style={{ color: 'var(--accent)', fontWeight: 800 }}># {c.boothNumber}</span>
                      </>
                    )}
                  </p>
                  
                  {/* Join buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {c.reqType === 'ONLINE' && c.meetingLink && (
                      <Button onClick={() => window.open(c.meetingLink, '_blank')} style={{ borderRadius: '999px', fontSize: '12px', padding: '6px 16px' }}>
                        🎥 {lang === 'ko' ? '화상 대화방 접속' : 'Join Video Call'}
                      </Button>
                    )}
                    {c.reqType === 'OFFLINE' && c.boothNumber && (
                      <Button 
                        variant="secondary" 
                        onClick={() => alert(`부스 번호: ${c.boothNumber}\n전시회: ${c.timeSlot.split(' - ')[0]}`)}
                        style={{ borderRadius: '999px', fontSize: '12px', padding: '6px 16px' }}
                      >
                        🎪 {lang === 'ko' ? '전시회 부스 맵 보기' : 'View Exhibition Map'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Booking Form (Glassmorphic) */}
        <div>
          {activeTab === 'ONLINE' ? (
            <form className="booking-form-wrapper glass" onSubmit={handleOnlineSubmit}>
              <h3>💻 {lang === 'ko' ? '온라인 미팅 신청' : 'Book Video Meetup'}</h3>
              <p>{lang === 'ko' ? 'AI 매칭 파트너를 선택하고 화상 미팅을 신청하세요.' : 'Schedule an online video screening with matched partners.'}</p>
              
              <div className="booking-form-field">
                <span>{lang === 'ko' ? '대상 파트너 기업 선택' : 'Select Partner Company'}</span>
                <select 
                  value={onlineForm.companyName}
                  onChange={(e) => setOnlineForm(prev => ({ ...prev, companyName: e.target.value }))}
                >
                  <option value="">{lang === 'ko' ? '-- 기업을 선택하세요 --' : '-- Choose a Company --'}</option>
                  {companies.map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                  {companies.length === 0 && (
                    <>
                      <option value="TechFlow Solutions">TechFlow Solutions</option>
                      <option value="Global Innovators">Global Innovators</option>
                      <option value="Smart Manufacturing Co.">Smart Manufacturing Co.</option>
                    </>
                  )}
                </select>
              </div>

              <div className="booking-form-field">
                <span>{lang === 'ko' ? '희망 일자 선택' : 'Select Date'}</span>
                <input 
                  type="date" 
                  value={onlineForm.date}
                  onChange={(e) => setOnlineForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="booking-form-field">
                <span>{lang === 'ko' ? '희망 시간대 선택' : 'Select Time Slot'}</span>
                <select 
                  value={onlineForm.timeSlot}
                  onChange={(e) => setOnlineForm(prev => ({ ...prev, timeSlot: e.target.value }))}
                >
                  <option value="09:00 - 10:00">09:00 - 10:00</option>
                  <option value="10:00 - 11:00">10:00 - 11:00</option>
                  <option value="13:00 - 14:00">13:00 - 14:00</option>
                  <option value="14:00 - 15:00">14:00 - 15:00</option>
                  <option value="16:00 - 17:00">16:00 - 17:00</option>
                </select>
              </div>

              <div className="booking-form-field">
                <span>{lang === 'ko' ? '회의 아젠다' : 'Meeting Agenda'}</span>
                <textarea 
                  rows="3"
                  value={onlineForm.agenda}
                  placeholder={lang === 'ko' ? '1차 수출 매칭 협의 및 기술 제안 설명' : 'Brief discussion on export match and capabilities.'}
                  onChange={(e) => setOnlineForm(prev => ({ ...prev, agenda: e.target.value }))}
                />
              </div>

              <Button type="submit" style={{ width: '100%', marginTop: '0.75rem', borderRadius: '999px' }} loading={isScheduling}>
                ⚡ {lang === 'ko' ? '온라인 미팅 예약 신청' : 'Request Video Meeting'}
              </Button>
            </form>
          ) : (
            <form className="booking-form-wrapper glass" onSubmit={handleOfflineSubmit}>
              <h3>🎪 {lang === 'ko' ? '전시회 현장 미팅 신청' : 'Book Booth Meetup'}</h3>
              <p>{lang === 'ko' ? '오프라인 전시회 현장에서 바이어를 직접 만나는 일정을 예약하세요.' : 'Schedule an in-person meeting at a global exhibition hall.'}</p>
              
              <div className="booking-form-field">
                <span>{lang === 'ko' ? '대상 파트너 기업 선택' : 'Select Partner Company'}</span>
                <select 
                  value={offlineForm.companyName}
                  onChange={(e) => setOfflineForm(prev => ({ ...prev, companyName: e.target.value }))}
                >
                  <option value="">{lang === 'ko' ? '-- 기업을 선택하세요 --' : '-- Choose a Company --'}</option>
                  {companies.map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                  {companies.length === 0 && (
                    <>
                      <option value="TechFlow Solutions">TechFlow Solutions</option>
                      <option value="Global Innovators">Global Innovators</option>
                      <option value="Smart Manufacturing Co.">Smart Manufacturing Co.</option>
                    </>
                  )}
                </select>
              </div>

              <div className="booking-form-field">
                <span>{lang === 'ko' ? '목표 글로벌 전시회 선택' : 'Select Exhibition'}</span>
                <select 
                  value={offlineForm.exhibition}
                  onChange={(e) => setOfflineForm(prev => ({ ...prev, exhibition: e.target.value }))}
                >
                  <option value="KOAA SHOW 2026">KOAA SHOW 2026 (한국)</option>
                  <option value="CES 2026 Las Vegas">CES 2026 Las Vegas (미국)</option>
                  <option value="MWC 2026 Barcelona">MWC 2026 Barcelona (스페인)</option>
                  <option value="IFA 2026 Berlin">IFA 2026 Berlin (독일)</option>
                </select>
              </div>

              <div className="booking-form-field">
                <span>{lang === 'ko' ? '희망 일자 선택' : 'Select Date'}</span>
                <input 
                  type="date" 
                  value={offlineForm.date}
                  onChange={(e) => setOfflineForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="booking-form-field">
                <span>{lang === 'ko' ? '바이어 부스 번호' : 'Buyer Booth Number'}</span>
                <input 
                  type="text" 
                  placeholder="예: LVCC West Hall #12345"
                  value={offlineForm.boothNumber}
                  onChange={(e) => setOfflineForm(prev => ({ ...prev, boothNumber: e.target.value }))}
                />
              </div>

              <div className="booking-form-field">
                <span>{lang === 'ko' ? '상담 목적' : 'Consultation Purpose'}</span>
                <textarea 
                  rows="3"
                  value={offlineForm.purpose}
                  placeholder={lang === 'ko' ? '최종 매칭 계약 확인 및 NDA 서명식 진행' : 'Final contract confirmation and NDA signing ceremony.'}
                  onChange={(e) => setOfflineForm(prev => ({ ...prev, purpose: e.target.value }))}
                />
              </div>

              <Button type="submit" style={{ width: '100%', marginTop: '0.75rem', borderRadius: '999px' }} loading={isScheduling}>
                ⚡ {lang === 'ko' ? '전시회 미팅 일정 확정 신청' : 'Request In-Person Meeting'}
              </Button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

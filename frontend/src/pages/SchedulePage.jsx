import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n/I18nProvider';
import Button from '../ui/Button';
import { useSearchParams } from 'react-router-dom';
import { boothExhibitors } from '../data/booth-data';

export default function SchedulePage() {
  const { t, lang } = useI18n();
  const [searchParams] = useSearchParams();
  
  const presetCompany = searchParams.get('companyName') || '';
  const presetType = searchParams.get('type') || 'OFFLINE'; // Default to 'OFFLINE'
  
  const [activeTab, setActiveTab] = useState(presetType === 'ONLINE' ? 'ONLINE' : 'OFFLINE');
  const [consultations, setConsultations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hermes Agent status feedback states
  const [agentStatus, setAgentStatus] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // 250-booth scheduling states
  const [selectedExhibitor, setSelectedExhibitor] = useState(null);
  const [exhibitorSearch, setExhibitorSearch] = useState('');
  const [exhibitorFilter, setExhibitorFilter] = useState({ industry: '', country: '' });
  const [schedulerMap, setSchedulerMap] = useState({});

  // Form states (Online only)
  const [onlineForm, setOnlineForm] = useState({ 
    companyName: presetType === 'ONLINE' ? presetCompany : '', 
    date: '', 
    timeSlot: '10:00 - 11:00', 
    agenda: presetType === 'ONLINE' ? '1차 수출 B2B 매칭 협의 및 기술 제안 설명' : '' 
  });

  // Calculate distinct industries & countries for sidebar presets in scheduler
  const distinctFilters = useMemo(() => {
    const inds = new Set();
    const cnts = new Set();
    boothExhibitors.forEach(ex => {
      inds.add(ex.industry);
      cnts.add(ex.country);
    });
    return {
      industries: Array.from(inds).sort(),
      countries: Array.from(cnts).sort()
    };
  }, []);

  // Filter 250 exhibitors based on search term & distinct filters
  const filteredExhibitors = useMemo(() => {
    return boothExhibitors.filter(ex => {
      const matchSearch = ex.name.toLowerCase().includes(exhibitorSearch.toLowerCase()) || 
                          ex.boothNumber.toLowerCase().includes(exhibitorSearch.toLowerCase()) ||
                          ex.item.toLowerCase().includes(exhibitorSearch.toLowerCase());
      const matchInd = !exhibitorFilter.industry || ex.industry === exhibitorFilter.industry;
      const matchCnt = !exhibitorFilter.country || ex.country === exhibitorFilter.country;
      return matchSearch && matchInd && matchCnt;
    });
  }, [exhibitorSearch, exhibitorFilter]);

  // Generate realistic seed-based booked/available schedule for an exhibitor to ensure visual realism
  const getExhibitorSchedule = (exId) => {
    const slots = {};
    const days = ['2026-10-21', '2026-10-22', '2026-10-23'];
    const times = [
      '10:00 - 11:00', 
      '11:00 - 12:00', 
      '12:00 - 13:00', // Lunch
      '13:00 - 14:00', 
      '14:00 - 15:00', 
      '15:00 - 16:00', 
      '16:00 - 17:00'
    ];
    
    days.forEach((day, dIdx) => {
      slots[day] = {};
      times.forEach((time, tIdx) => {
        if (time === '12:00 - 13:00') {
          slots[day][time] = 'LUNCH';
          return;
        }
        
        // Simple hash seed generator based on exhibitor ID, day, and time
        const seed = (exId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + dIdx * 3 + tIdx * 7) % 10;
        if (seed < 3) {
          slots[day][time] = 'BOOKED';
        } else {
          slots[day][time] = 'AVAILABLE';
        }
      });
    });
    return slots;
  };

  // Watch for selected exhibitor to map their time table
  useEffect(() => {
    if (selectedExhibitor) {
      setSchedulerMap(getExhibitorSchedule(selectedExhibitor.id));
    }
  }, [selectedExhibitor]);

  // Load consultations & MongoDB companies on mount
  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.listConsultations(),
      api.listCompanies({ limit: 50 })
    ])
      .then(([consultRes, compRes]) => {
        setConsultations(Array.isArray(consultRes) ? consultRes : []);
        setCompanies(Array.isArray(compRes?.data) ? compRes.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("SchedulePage load error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredConsultations = consultations.filter(c => c.reqType === activeTab);

  // Online video submit handler
  const handleOnlineSubmit = async (e) => {
    e.preventDefault();
    if (!onlineForm.companyName || !onlineForm.date) {
      alert(lang === 'ko' ? '회사와 일자를 모두 선택해 주세요.' : 'Please select both company and date.');
      return;
    }

    setIsScheduling(true);
    setAgentStatus(lang === 'ko' ? 'Hermes 에이전트가 바이어의 스케줄러를 조회하는 중...' : 'Hermes agent looking up buyer schedule...');

    setTimeout(async () => {
      setAgentStatus(lang === 'ko' ? '비어있는 시간대를 예약하고 Zoom 화상방 생성 중...' : 'Booking open slot and creating Zoom virtual meeting room...');
      
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
            loadData();
          }, 1500);
        } catch (err) {
          console.error(err);
          setIsScheduling(false);
          setAgentStatus('');
          alert('Scheduling failed.');
        }
      }, 1500);
    }, 1500);
  };

  // Offline interactive booth scheduler grid submit handler
  const handleOfflineSlotClick = async (day, time) => {
    if (!selectedExhibitor) return;
    
    const confirmMsg = lang === 'ko' 
      ? `"${selectedExhibitor.name}" (${selectedExhibitor.boothNumber})과 ${day}일자 [${time}]에 B2B 미팅 스케줄 조율을 신청하시겠습니까?\n\n*상대방이 일정을 수락하면 최종 확정(CONFIRMED) 상태로 전환됩니다.`
      : `Request B2B meeting with "${selectedExhibitor.name}" (${selectedExhibitor.boothNumber}) on ${day} [${time}]?\n\n*Confirmed upon recipient acceptance.`;
      
    if (!window.confirm(confirmMsg)) return;

    setIsScheduling(true);
    setAgentStatus(lang === 'ko' 
      ? `Hermes 에이전트가 상대방 "${selectedExhibitor.boothNumber}" 전시장 맵 위치 조회 중...` 
      : `Hermes mapping path to "${selectedExhibitor.boothNumber}"...`);

    setTimeout(async () => {
      setAgentStatus(lang === 'ko' 
        ? `부스 담당자에게 실시간 스케줄 수락(Approve) 알림을 전송하는 중...` 
        : `Sending real-time schedule approval request to exhibitor team...`);
      
      setTimeout(async () => {
        const payload = {
          companyName: selectedExhibitor.name,
          date: day,
          timeSlot: `KOAA SHOW 2026 - 부스 #${selectedExhibitor.boothNumber.replace('Booth #', '')}`,
          reqType: 'OFFLINE',
          status: 'PENDING', // PENDING status represents buyer requesting & exhibitor needing to approve
          boothNumber: selectedExhibitor.boothNumber.replace('Booth #', ''),
          meetingLink: '',
          agenda: `[KOAA SHOW 2026] B2B 현장 미팅 신청 - ${selectedExhibitor.item} 공급 및 바이어 수입 조율 상담`
        };

        try {
          await api.createConsultation(payload);
          setAgentStatus(lang === 'ko' 
            ? '🎉 오프라인 전시장 밋업 접수 완료! 수락 대기(PENDING) 상태로 등록되었습니다.' 
            : '🎉 Exhibition meetup requested! Pending approval.');
          
          // Mask slot as booked in the UI client-side temporarily
          setSchedulerMap(prev => ({
            ...prev,
            [day]: {
              ...prev[day],
              [time]: 'BOOKED'
            }
          }));

          setTimeout(() => {
            setIsScheduling(false);
            setAgentStatus('');
            loadData(); // Refresh list
          }, 1800);
        } catch (err) {
          console.error(err);
          setIsScheduling(false);
          setAgentStatus('');
          alert('Failed to request appointment.');
        }
      }, 1500);
    }, 1500);
  };

  const days = ['2026-10-21', '2026-10-22', '2026-10-23'];
  const times = [
    '10:00 - 11:00', 
    '11:00 - 12:00', 
    '12:00 - 13:00', // Lunch
    '13:00 - 14:00', 
    '14:00 - 15:00', 
    '15:00 - 16:00', 
    '16:00 - 17:00'
  ];

  return (
    <div className="inner" style={{ padding: '2rem 1rem' }}>
      {/* Dynamic CSS Stylesheet injection */}
      <style>{`
        .schedule-tabs-row {
          display: flex;
          background: rgba(241, 245, 249, 0.9);
          padding: 5px;
          border-radius: 16px;
          margin-bottom: 2rem;
          border: 1px solid rgba(226, 232, 240, 0.8);
          gap: 4px;
        }
        .schedule-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border: none;
          background: none;
          font-size: 13.5px;
          font-weight: 700;
          color: #64748b;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .schedule-tab-btn.active {
          background: #ffffff;
          color: var(--accent-dark);
          box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.15), 0 8px 10px -6px rgba(79, 70, 229, 0.15);
        }
        .exhibitor-list-card {
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .exhibitor-list-card:hover {
          background: #ffffff !important;
          border-color: rgba(79, 70, 229, 0.4) !important;
          box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.08) !important;
          transform: translateY(-2px);
        }
        .exhibitor-scroll-container::-webkit-scrollbar {
          width: 6px;
        }
        .exhibitor-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .exhibitor-scroll-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .exhibitor-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .scheduler-interactive-slot {
          position: relative;
        }
        .scheduler-interactive-slot:hover {
          background: rgba(79, 70, 229, 0.12) !important;
          box-shadow: inset 0 0 0 2px rgba(79, 70, 229, 0.25);
          transform: translateY(-1px);
        }
        .scheduler-interactive-slot:active {
          transform: translateY(0px);
        }
      `}</style>

      {/* Hermes coordinator agent badge */}
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

      <h2 style={{ marginBottom: '0.5rem', fontWeight: 800 }}>
        {lang === 'ko' ? '1:1 비즈니스 밋업' : '1:1 Business Meetups'}
      </h2>
      <p style={{ marginBottom: '2rem', color: '#6b7280', fontSize: '14px', maxWidth: '800px', lineHeight: 1.5 }}>
        {lang === 'ko' 
          ? '장벽 없는 글로벌 바이어 탐색을 위한 온라인 화상 미팅부터, 대형 전시회 오프라인 부스에서의 1:1 현장 계약 조율까지 원스톱으로 매칭합니다.' 
          : 'Coordinate online video meetings for quick screening, and schedule 1:1 in-person meetings at major exhibition booths.'}
      </p>

      {/* sliding tabs row */}
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
            onClick={() => {
              setActiveTab('OFFLINE');
              setSelectedExhibitor(null); // Clear active exhibitor selection to browse list
            }}
            type="button"
          >
            <span>🎪</span> {lang === 'ko' ? '글로벌 전시회 오프라인 미팅' : 'Offline Exhibition Booth'}
          </button>
        </div>
      </div>

      {/* scheduling status info */}
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

      {/* split layout wrapper */}
      <div className="schedule-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '2rem', marginTop: '1rem' }}>
        
        {/* Left Side: Confirmed/Pending Appointments Lists */}
        <div>
          {activeTab === 'OFFLINE' && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--fg)' }}>
                {lang === 'ko' ? '오프라인 상담 주선 (글로벌 전시장 매칭)' : 'Offline Matchmaking Services'}
              </h3>
              <div className="exhibitions-banner-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="exhibition-banner-card" style={{ padding: '1.25rem', border: '1px solid rgba(226, 232, 240, 0.8)', background: '#fff', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="exhibition-logo-banner" style={{ background: '#BE123C', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>KOAA SHOW</span>
                    <span style={{ fontSize: '12px', color: '#BE123C', fontWeight: 800 }}>2026.10.21 - 10.23</span>
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800 }}>KOAA SHOW 2026</h4>
                  <p className="muted" style={{ margin: 0, fontSize: '11.5px', lineHeight: 1.4 }}>
                    국제 모빌리티 산업전 - 모빌리티 솔루션 파트너 상담 (킨텍스 KINTEX 제1전시장)
                  </p>
                </div>
              </div>
            </div>
          )}

          <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--fg)' }}>
            {activeTab === 'ONLINE' 
              ? (lang === 'ko' ? '확정된 온라인 미팅 일정' : 'Confirmed Online Meetups')
              : (lang === 'ko' ? '확정 및 승인대기 미팅 일정' : 'Offline Appointment Schedules')}
          </h3>

          {loading ? (
            <p>{lang === 'ko' ? '일정을 로드 중...' : 'Loading schedules...'}</p>
          ) : filteredConsultations.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--card-glass)', border: '1px solid rgba(226,232,240,0.6)', borderRadius: '20px' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>📅</span>
              <p className="muted" style={{ fontSize: '14px', margin: 0 }}>
                {activeTab === 'ONLINE'
                  ? (lang === 'ko' ? '등록된 온라인 화상 미팅 스케줄이 없습니다.' : 'No online meetups scheduled yet.')
                  : (lang === 'ko' ? '등록된 글로벌 전시 부스 미팅 스케줄이 없습니다.' : 'No offline exhibition meetups scheduled yet.')}
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
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--fg)' }}>{c.companyName}</h4>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '999px', 
                      fontSize: '10px', 
                      fontWeight: 800,
                      background: c.status === 'CONFIRMED' 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : c.status === 'PENDING'
                          ? 'rgba(245, 158, 11, 0.1)'
                          : 'rgba(100, 116, 139, 0.1)',
                      color: c.status === 'CONFIRMED' 
                        ? 'var(--success)' 
                        : c.status === 'PENDING'
                          ? 'var(--warning)'
                          : '#475569'
                    }}>
                      {c.status === 'CONFIRMED' 
                        ? (lang === 'ko' ? '수락완료 (CONFIRMED)' : 'CONFIRMED')
                        : c.status === 'PENDING'
                          ? (lang === 'ko' ? '수락대기 (PENDING)' : 'PENDING')
                          : c.status}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 1.25rem 0', color: 'var(--fg-secondary)', fontSize: '12.5px', lineHeight: 1.5 }}>
                    <strong>📅 {lang === 'ko' ? '일시:' : 'Date:'}</strong> {new Date(c.date).toLocaleDateString()}
                    <br />
                    <strong>🎪 {lang === 'ko' ? '상담 슬롯:' : 'Slot Info:'}</strong> {c.timeSlot}
                    <br />
                    <strong>🎯 {lang === 'ko' ? '상담 목적:' : 'Agenda:'}</strong> {c.agenda}
                    {c.boothNumber && (
                      <>
                        <br />
                        <strong>🎪 {lang === 'ko' ? '부스 위치:' : 'Exhibitor Booth:'}</strong> <span style={{ color: 'var(--accent)', fontWeight: 800 }}># {c.boothNumber}</span>
                      </>
                    )}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {c.reqType === 'ONLINE' && c.meetingLink && (
                      <Button onClick={() => window.open(c.meetingLink, '_blank')} style={{ borderRadius: '999px', fontSize: '11px', padding: '5px 14px' }}>
                        🎥 {lang === 'ko' ? '화상 대화방 접속' : 'Join Video Call'}
                      </Button>
                    )}
                    {c.reqType === 'OFFLINE' && c.boothNumber && (
                      <Button 
                        variant="secondary" 
                        onClick={() => alert(`해당 업체의 부스 번호는 [${c.boothNumber}] 입니다.\n전시회: KOAA SHOW 2026\n\n상대방의 수락 대기(PENDING) 승인이 완료되면 상담표가 최종 락업됩니다.`)}
                        style={{ borderRadius: '999px', fontSize: '11px', padding: '5px 14px' }}
                      >
                        🎪 {lang === 'ko' ? '부스 정보 및 맵 안내' : 'Exhibitor Map Info'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Tabular Scheduler or Booking Form */}
        <div>
          {activeTab === 'ONLINE' ? (
            <form className="booking-form-wrapper glass" onSubmit={handleOnlineSubmit} style={{ padding: '1.75rem', borderRadius: '20px', border: '1px solid rgba(226, 232, 240, 0.8)', background: '#fff' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0' }}>💻 {lang === 'ko' ? '온라인 미팅 예약' : 'Book Video Meetup'}</h3>
              <p className="muted" style={{ fontSize: '12.5px', marginBottom: '1.25rem' }}>AI 매칭 파트너를 선택하고 화상 미팅 일정을 조율해 보십시오.</p>
              
              <div className="booking-form-field" style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>{lang === 'ko' ? '대상 파트너 기업 선택' : 'Select Partner Company'}</span>
                <select 
                  value={onlineForm.companyName}
                  onChange={(e) => setOnlineForm(prev => ({ ...prev, companyName: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                >
                  <option value="">{lang === 'ko' ? '-- 기업을 선택하세요 --' : '-- Choose a Company --'}</option>
                  {companies.map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="booking-form-field" style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>{lang === 'ko' ? '희망 일자 선택' : 'Select Date'}</span>
                <input 
                  type="date" 
                  value={onlineForm.date}
                  onChange={(e) => setOnlineForm(prev => ({ ...prev, date: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
              </div>

              <div className="booking-form-field" style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>{lang === 'ko' ? '희망 시간대 선택' : 'Select Time Slot'}</span>
                <select 
                  value={onlineForm.timeSlot}
                  onChange={(e) => setOnlineForm(prev => ({ ...prev, timeSlot: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                >
                  <option value="09:00 - 10:00">09:00 - 10:00</option>
                  <option value="10:00 - 11:00">10:00 - 11:00</option>
                  <option value="13:00 - 14:00">13:00 - 14:00</option>
                  <option value="14:00 - 15:00">14:00 - 15:00</option>
                  <option value="16:00 - 17:00">16:00 - 17:00</option>
                </select>
              </div>

              <div className="booking-form-field" style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>{lang === 'ko' ? '회의 아젠다' : 'Meeting Agenda'}</span>
                <textarea 
                  rows="3"
                  value={onlineForm.agenda}
                  placeholder={lang === 'ko' ? '1차 수출 매칭 협의 및 기술 제안 설명' : 'Brief discussion on export match and capabilities.'}
                  onChange={(e) => setOnlineForm(prev => ({ ...prev, agenda: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}
                />
              </div>

              <Button type="submit" style={{ width: '100%', marginTop: '0.75rem', borderRadius: '999px' }} loading={isScheduling}>
                ⚡ {lang === 'ko' ? '온라인 미팅 예약 신청' : 'Book Online Video Meeting'}
              </Button>
            </form>
          ) : (
            /* OFFLINE Interactive 250-booth scheduler */
            <div className="offline-scheduler-wrapper glass" style={{ padding: '1.75rem', borderRadius: '20px', border: '1px solid rgba(226, 232, 240, 0.8)', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
              
              {!selectedExhibitor ? (
                /* STEP 1: Search and Select Booth Exhibitor */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                      🔍 {lang === 'ko' ? '1단계: 부스 참가업체 선택' : 'Step 1: Select Exhibitor'}
                    </h3>
                    <span style={{ fontSize: '11px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--accent-dark)', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
                      Total {filteredExhibitors.length}
                    </span>
                  </div>
                  <p className="muted" style={{ fontSize: '12.5px', marginBottom: '1.25rem' }}>
                    {lang === 'ko' ? '약 250개의 글로벌 참가 부스 중, 1:1 상담 예약을 조율할 바이어/공급사를 검색해 보십시오.' : 'Search through 250+ global exhibitors to request a B2B meetup.'}
                  </p>

                  {/* Search and Filters Row */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text"
                        placeholder={lang === 'ko' ? '기업명, 부스번호 (#A101 등), 품목 검색...' : 'Search by name, booth (#A101), item...'}
                        value={exhibitorSearch}
                        onChange={(e) => setExhibitorSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}
                      />
                      <span style={{ position: 'absolute', left: '12px', top: '11px', color: '#9ca3af' }}>🔍</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <select 
                        value={exhibitorFilter.industry}
                        onChange={(e) => setExhibitorFilter(prev => ({ ...prev, industry: e.target.value }))}
                        style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}
                      >
                        <option value="">{lang === 'ko' ? '모든 산업군' : 'All Industries'}</option>
                        {distinctFilters.industries.map(ind => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>

                      <select 
                        value={exhibitorFilter.country}
                        onChange={(e) => setExhibitorFilter(prev => ({ ...prev, country: e.target.value }))}
                        style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}
                      >
                        <option value="">{lang === 'ko' ? '모든 국가' : 'All Countries'}</option>
                        {distinctFilters.countries.map(cnt => (
                          <option key={cnt} value={cnt}>{cnt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Exhibitor List Grid */}
                  <div className="exhibitor-scroll-container" style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                    {filteredExhibitors.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', padding: '2rem 0' }}>
                        {lang === 'ko' ? '검색 조건에 맞는 부스 참가업체가 없습니다.' : 'No exhibitors match the search criteria.'}
                      </p>
                    ) : (
                      filteredExhibitors.map(ex => (
                        <div 
                          key={ex.id}
                          className="exhibitor-list-card"
                          onClick={() => setSelectedExhibitor(ex)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 14px',
                            borderRadius: '12px',
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                            background: '#fafafa',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div className="exhibitor-flag-avatar" style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '11px',
                            color: '#475569'
                          }}>
                            {ex.logo}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 800 }}>{ex.boothNumber}</span>
                              <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: '4px' }}>{ex.country}</span>
                            </div>
                            <h4 style={{ margin: '2px 0', fontSize: '13px', fontWeight: 800, color: 'var(--fg)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {ex.name}
                            </h4>
                            <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              <strong>{lang === 'ko' ? '품목:' : 'Item:'}</strong> {ex.item}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* STEP 2: Interactive Scheduler Grid */
                <div>
                  {/* Selected exhibitor badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                    <button 
                      onClick={() => setSelectedExhibitor(null)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                      type="button"
                    >
                      ⬅️ {lang === 'ko' ? '업체 다시 고르기' : 'Choose Another'}
                    </button>
                    <span style={{ fontSize: '11px', background: '#BE123C', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                      {selectedExhibitor.boothNumber}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0' }}>
                    🎪 {lang === 'ko' ? '2단계: B2B 상담 일정표 매칭' : 'Step 2: Time Schedule Grid'}
                  </h3>
                  <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--fg)' }}>{selectedExhibitor.name}</div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      <strong>{lang === 'ko' ? '매칭 품목:' : 'Matching Item:'}</strong> {selectedExhibitor.item} ({selectedExhibitor.industry})
                    </div>
                  </div>

                  <p className="muted" style={{ fontSize: '12px', marginBottom: '1rem', lineHeight: 1.4 }}>
                    {lang === 'ko' 
                      ? '⏱️ 10월 21일~23일 오전 10시~오후 5시 사이의 빈 슬롯을 클릭하십시오. (12:00 ~ 13:00은 🍽️ 점심시간으로 고정 비활성화되어 안전하게 보호됩니다)' 
                      : '⏱️ Click an available slot between Oct 21-23. Lunch hours (12:00-13:00) are reserved.'}
                  </p>

                  {/* Scheduler Table Grid */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '400px' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '8px', background: '#f1f5f9', border: '1px solid #e2e8f0', width: '25%', fontWeight: 800 }}>Time</th>
                          {days.map(d => (
                            <th key={d} style={{ padding: '8px', background: '#f1f5f9', border: '1px solid #e2e8f0', width: '25%', fontWeight: 800 }}>
                              {d.substring(5)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {times.map(t => (
                          <tr key={t}>
                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>
                              {t}
                            </td>
                            {days.map(d => {
                              const status = schedulerMap[d]?.[t] || 'AVAILABLE';
                              const isLunch = t === '12:00 - 13:00';
                              const isBooked = status === 'BOOKED';
                              
                              let cellBg = 'rgba(79, 70, 229, 0.04)';
                              let cellColor = 'var(--accent-dark)';
                              let cellBorder = '1px solid rgba(79, 70, 229, 0.15)';
                              let cellText = lang === 'ko' ? '예약 가능' : 'Available';
                              let cursorType = 'pointer';
                              
                              if (isLunch) {
                                cellBg = '#f1f5f9';
                                cellColor = '#94a3b8';
                                cellBorder = '1px solid #e2e8f0';
                                cellText = '🍽️ Lunch';
                                cursorType = 'not-allowed';
                              } else if (isBooked) {
                                cellBg = 'rgba(239, 68, 68, 0.08)';
                                cellColor = '#dc2626';
                                cellBorder = '1px solid rgba(239, 68, 68, 0.15)';
                                cellText = '🔴 Booked';
                                cursorType = 'not-allowed';
                              }

                              return (
                                <td 
                                  key={d + t}
                                  onClick={() => {
                                    if (!isLunch && !isBooked) {
                                      handleOfflineSlotClick(d, t);
                                    }
                                  }}
                                  className={!isLunch && !isBooked ? 'scheduler-interactive-slot' : ''}
                                  style={{
                                    padding: '10px 6px',
                                    border: '1px solid #e2e8f0',
                                    background: cellBg,
                                    color: cellColor,
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    cursor: cursorType,
                                    transition: 'all 0.2s',
                                    borderLeft: cellBorder,
                                    borderRight: cellBorder
                                  }}
                                >
                                  <div style={{ fontSize: '11px' }}>{cellText}</div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Legend */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center', fontSize: '11.5px', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '10px', height: '10px', background: 'rgba(79, 70, 229, 0.08)', border: '1px solid rgba(79, 70, 229, 0.2)', borderRadius: '2px' }}></span>
                      <span>{lang === 'ko' ? '예약 가능' : 'Available'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '10px', height: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '2px' }}></span>
                      <span>{lang === 'ko' ? '예약 완료' : 'Booked'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '10px', height: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '2px' }}></span>
                      <span>{lang === 'ko' ? '점심 시간' : 'Lunch'}</span>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}


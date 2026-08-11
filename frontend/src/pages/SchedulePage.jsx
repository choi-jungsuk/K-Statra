import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n/I18nProvider';
import Button from '../ui/Button';
import { useSearchParams } from 'react-router-dom';

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
  const [selectedDate, setSelectedDate] = useState('');
  const [schedulerMap, setSchedulerMap] = useState({});
  const [selectedExhibition, setSelectedExhibition] = useState('Global Tech Exhibition 2026');

  // Form states (Online only)
  const [onlineForm, setOnlineForm] = useState({ 
    companyName: presetType === 'ONLINE' ? presetCompany : '', 
    date: '', 
    timeSlot: '10:00 - 11:00', 
    agenda: presetType === 'ONLINE' ? '1차 B2B 매칭 협의 및 기술 제안 설명' : '' 
  });

  // Generate 250 custom booth companies in format: "1번 부스업체" to "250번 부스업체"
  const customExhibitors = useMemo(() => {
    return Array.from({ length: 250 }, (_, i) => {
      const num = i + 1;
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const letter = letters[i % letters.length];
      const numPart = 100 + Math.floor(i / letters.length) + 1;
      const boothNumber = `${letter}-${numPart}`;
      return {
        id: `booth_custom_${num}`,
        name: `${num}번 부스업체`,
        boothNumber: boothNumber,
        country: '한국',
        industry: 'Automotive / Mobility',
        item: '부품 상담',
      };
    });
  }, []);

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
    setAgentStatus(lang === 'ko' ? 'Hermes Agent가 바이어의 스케줄러를 조회하는 중...' : 'Hermes agent looking up buyer schedule...');

    setTimeout(async () => {
      setAgentStatus(lang === 'ko' ? '비어있는 시간대를 예약하고 Zoom 화상방 생성 중...' : 'Booking open slot and creating Zoom virtual meeting room...');
      
      setTimeout(async () => {
        const payload = {
          companyName: onlineForm.companyName,
          date: onlineForm.date,
          timeSlot: onlineForm.timeSlot,
          reqType: 'ONLINE',
          status: 'CONFIRMED',
          meetingLink: 'https://zoom.us/j/demo-demostatra-' + Math.random().toString(36).substring(7),
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
      ? `Hermes Agent가 상대방 "${selectedExhibitor.boothNumber}" 전시장 맵 위치 조회 중...` 
      : `Hermes mapping path to "${selectedExhibitor.boothNumber}"...`);

    setTimeout(async () => {
      setAgentStatus(lang === 'ko' 
        ? `부스 담당자에게 실시간 스케줄 수락(Approve) 알림을 전송하는 중...` 
        : `Sending real-time schedule approval request to exhibitor team...`);
      
      setTimeout(async () => {
        const payload = {
          companyName: selectedExhibitor.name,
          date: day,
          timeSlot: `Exhibition - 부스 #${selectedExhibitor.boothNumber}`,
          reqType: 'OFFLINE',
          status: 'PENDING', // PENDING status represents buyer requesting & exhibitor needing to approve
          boothNumber: selectedExhibitor.boothNumber,
          meetingLink: '',
          agenda: `[현장 미팅 신청] - ${selectedExhibitor.item} 공급 및 바이어 수입 조율 상담`
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
        .exhibitor-dropdown-item:hover {
          background: rgba(79, 70, 229, 0.06) !important;
        }
      `}</style>

      {/* Hermes coordinator agent badge */}
      <div className="page-agent-header">
        <div className="search-agent-avatar" style={{ background: 'linear-gradient(135deg, #99DDF8 0%, #00A4EF 100%)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="search-agent-pulse"></span>
        </div>
        <span className="page-agent-badge-text">
          {lang === 'ko' ? '상담일정 관리 에이전트' : 'Schedule Management Agent'}
        </span>
      </div>

      <h2 style={{ marginBottom: '0.5rem', fontWeight: 800 }}>
        {lang === 'ko' ? '비즈니스 매칭 상담일정 관리' : 'Business Match Schedule Management'}
      </h2>
      <p style={{ marginBottom: '2rem', color: '#6b7280', fontSize: '14px', maxWidth: '800px', lineHeight: 1.5 }}>
        {lang === 'ko'
          ? '온라인 화상 미팅과 오프라인 전시회 현장 부스 방문 일정을 체계적으로 관리하고 조율합니다.'
          : 'Systematically manage and coordinate online video meetings and offline exhibition booth visits.'}
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
            <span>🎪</span> {lang === 'ko' ? '전시회 현장미팅 신청' : 'Exhibition Onsite Meeting Request'}
          </button>
        </div>
      </div>

      {/* scheduling status info */}
      {isScheduling && (
        <div className="hermes-status-msg" style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', borderRadius: '12px', marginBottom: '2rem', background: 'rgba(79, 70, 229, 0.08)', border: '1px solid rgba(79, 70, 229, 0.15)', gap: '10px' }}>
          <span className="pulse-loader" style={{ transform: 'scale(0.8)' }}>
            <span></span>
            <span></span>
            <span></span>
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-dark)' }}>{agentStatus}</span>
        </div>
      )}

      <div className="schedule-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', marginTop: '1rem' }}>
        
        {/* Left Side: Confirmed/Pending Appointments Lists & Target Exhibition Cards */}
        <div>
          {activeTab === 'OFFLINE' && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--fg)' }}>
                {lang === 'ko' ? '🎪 조율 대상 글로벌 무역 전시회' : '🎪 Target Global Exhibitions'}
              </h3>
              <div className="exhibitions-banner-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { name: 'CES 2026', date: '2026.01.06 - 01.09', color: '#0284c7', desc: '세계 최대 IT·가전 전시회 - 글로벌 파트너 상담' },
                  { name: 'K-뷰티 엑스포 2026', date: '2026.10.15 - 10.17', color: '#ec4899', desc: '대한민국 뷰티 박람회 - 글로벌 바이어 매칭' },
                  { name: '세계 보안 엑스포 2026', date: '2026.03.18 - 03.20', color: '#16a34a', desc: '아시아 최대 통합보안 전시회 - 솔루션 파트너 상담' }
                ].map((ex, idx) => {
                  const isSelected = selectedExhibition === ex.name;
                  return (
                    <div 
                      key={idx} 
                      className="exhibition-banner-card" 
                      style={{ 
                        padding: '1.25rem', 
                        border: '2.5px solid var(--accent)', 
                        background: 'rgba(79, 70, 229, 0.02)', 
                        borderRadius: '16px',
                        boxShadow: '0 10px 20px rgba(79, 70, 229, 0.06)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span className="exhibition-logo-banner" style={{ background: ex.color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>
                          {ex.name.split(' ')[0]}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', color: ex.color, fontWeight: 800 }}>{ex.date}</span>
                        </div>
                      </div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800 }}>{ex.name}</h4>
                      <p className="muted" style={{ margin: 0, fontSize: '11.5px', lineHeight: 1.4 }}>{ex.desc}</p>
                    </div>
                  );
                })}
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
                        onClick={() => alert(`해당 업체의 부스 번호는 [${c.boothNumber}] 입니다.\n\n상대방의 수락 대기(PENDING) 승인이 완료되면 상담표가 최종 락업됩니다.`)}
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
                  placeholder={lang === 'ko' ? '1차 수출 B2B 매칭 협의 및 기술 제안 설명' : 'Brief discussion on export match and capabilities.'}
                  onChange={(e) => setOnlineForm(prev => ({ ...prev, agenda: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}
                />
              </div>

              <Button type="submit" style={{ width: '100%', marginTop: '0.75rem', borderRadius: '999px' }} loading={isScheduling}>
                ⚡ {lang === 'ko' ? '온라인 미팅 예약 신청' : 'Book Online Video Meeting'}
              </Button>
            </form>
          ) : (
            /* OFFLINE Interactive 250-booth scheduler bound into form dropdown */
            <div className="offline-scheduler-wrapper glass" style={{ padding: '1.75rem', borderRadius: '20px', border: '1px solid rgba(226, 232, 240, 0.8)', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                  🎪 {lang === 'ko' ? '전시회 현장미팅 신청' : 'Exhibition Onsite Meeting Request'}
                </h3>
                <span style={{ fontSize: '11px', background: 'rgba(190, 18, 60, 0.1)', color: '#BE123C', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
                  {selectedExhibition}
                </span>
              </div>
              <p className="muted" style={{ fontSize: '12.5px', marginBottom: '1.5rem' }}>
                {lang === 'ko' ? '오프라인 전시회 현장에서 바이어를 직접 만나는 일정을 예약하세요.' : 'Schedule an in-person meeting at a global exhibition hall.'}
              </p>

              {/* Form inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* 250-Company selection select drop-down */}
                <div className="booking-form-field">
                  <span style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#374151' }}>
                    {lang === 'ko' ? '대상 파트너 기업 선택' : 'Select Partner Company'}
                  </span>
                  <select 
                    value={selectedExhibitor ? selectedExhibitor.id : ''}
                    onChange={(e) => {
                      const ex = customExhibitors.find(item => item.id === e.target.value);
                      setSelectedExhibitor(ex || null);
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13.5px', fontWeight: 600, background: '#fafafa', cursor: 'pointer' }}
                  >
                    <option value="">{lang === 'ko' ? '-- 업체를 선택하세요 --' : '-- Choose a Company --'}</option>
                    {customExhibitors.map((ex, index) => (
                      <option key={ex.id} value={ex.id}>
                        {index + 1}. {ex.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Buyer Booth Number input (Automatically auto-filled when company is selected) */}
                <div className="booking-form-field">
                  <span style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#374151' }}>
                    {lang === 'ko' ? '바이어 부스 번호' : 'Buyer Booth Number'}
                  </span>
                  <input 
                    type="text" 
                    value={selectedExhibitor ? selectedExhibitor.boothNumber : ''}
                    readOnly
                    placeholder={lang === 'ko' ? '상단 업체 선택 시 자동 입력' : 'Auto-filled upon company selection'}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13.5px', fontWeight: 600, background: '#f1f5f9', color: '#475569', cursor: 'not-allowed' }}
                  />
                </div>

                {/* Preferred Date Select (only 3 days) */}
                <div className="booking-form-field">
                  <span style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#374151' }}>
                    {lang === 'ko' ? '희망 일자 선택' : 'Select Preferred Date'}
                  </span>
                  <select 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13.5px', fontWeight: 600, background: '#fff', cursor: 'pointer' }}
                  >
                    <option value="">{lang === 'ko' ? '-- 희망 일자를 선택하세요 --' : '-- Choose a Date --'}</option>
                    <option value="2026-10-21">2026-10-21 (1일차)</option>
                    <option value="2026-10-22">2026-10-22 (2일차)</option>
                    <option value="2026-10-23">2026-10-23 (3일차)</option>
                  </select>
                </div>

                {/* Sub-renderer: Displays scheduler grid once company and date are selected */}
                {selectedExhibitor && selectedDate ? (
                  <div style={{ marginTop: '0.75rem', animation: 'fadeIn 0.3s ease-in-out' }}>
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--accent)' }}>{selectedExhibitor.name}</span>
                        <span style={{ fontSize: '11px', background: '#3b82f6', color: 'white', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          {selectedExhibitor.boothNumber}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                        <strong>{lang === 'ko' ? '주요 상담 품목:' : 'Consulting Item:'}</strong> {selectedExhibitor.item} ({selectedExhibitor.industry})
                      </div>
                    </div>

                    <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 6px 0', color: '#1f2937' }}>
                      📅 {selectedDate} {lang === 'ko' ? '시간대별 상담진행표' : 'Hourly Progress Table'}
                    </h4>
                    <p className="muted" style={{ fontSize: '11.5px', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                      {lang === 'ko' 
                        ? '빈 슬롯을 클릭하시면 Hermes Agent가 상대방 전시장 맵 위치 조회 후 수락 대기(PENDING) 예약을 자동 신청합니다. (12~1시는 점심시간 보호 잠금)'
                        : 'Click an available slot to schedule a PENDING meetup request.'}
                    </p>

                    {/* Table Scheduler Grid */}
                    <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '8px 10px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', width: '40%', fontWeight: 800, textAlign: 'center' }}>
                              {lang === 'ko' ? '상담 시간대' : 'Time Slot'}
                            </th>
                            <th style={{ padding: '8px 10px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', width: '60%', fontWeight: 800, textAlign: 'center' }}>
                              {lang === 'ko' ? '예약 상태 및 행동' : 'Status & Action'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {times.map(t => {
                            const status = schedulerMap[selectedDate]?.[t] || 'AVAILABLE';
                            const isLunch = t === '12:00 - 13:00';
                            const isBooked = status === 'BOOKED';
                            
                            let cellBg = 'rgba(79, 70, 229, 0.04)';
                            let cellColor = 'var(--accent-dark)';
                            let cellBorder = '1px solid rgba(79, 70, 229, 0.12)';
                            let cellText = lang === 'ko' ? '📅 미팅 신청하기 (예약 가능)' : '📅 Request Meeting (Available)';
                            let cursorType = 'pointer';
                            
                            if (isLunch) {
                              cellBg = '#f1f5f9';
                              cellColor = '#94a3b8';
                              cellBorder = '1px solid #e2e8f0';
                              cellText = '🍽️ Lunch Time (점심 시간)';
                              cursorType = 'not-allowed';
                            } else if (isBooked) {
                              cellBg = 'rgba(239, 68, 68, 0.07)';
                              cellColor = '#dc2626';
                              cellBorder = '1px solid rgba(239, 68, 68, 0.12)';
                              cellText = '🔴 Booked (상담 진행중/예약 완료)';
                              cursorType = 'not-allowed';
                            }

                            return (
                              <tr key={t} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '10px', background: '#f8fafc', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', borderRight: '1px solid #e2e8f0' }}>
                                  {t}
                                </td>
                                <td 
                                  onClick={() => {
                                    if (!isLunch && !isBooked) {
                                      handleOfflineSlotClick(selectedDate, t);
                                    }
                                  }}
                                  className={!isLunch && !isBooked ? 'scheduler-interactive-slot' : ''}
                                  style={{
                                    padding: '10px',
                                    background: cellBg,
                                    color: cellColor,
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    cursor: cursorType,
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <div style={{ fontSize: '12px' }}>{cellText}</div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Legend */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', justifyContent: 'center', fontSize: '11px', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', background: 'rgba(79, 70, 229, 0.08)', border: '1px solid rgba(79, 70, 229, 0.2)', borderRadius: '2px' }}></span>
                        <span>{lang === 'ko' ? '예약 가능' : 'Available'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '2px' }}></span>
                        <span>{lang === 'ko' ? '예약 완료' : 'Booked'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '2px' }}></span>
                        <span>{lang === 'ko' ? '점심 시간' : 'Lunch'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13px' }}>
                    📅 {lang === 'ko' ? '상단에서 업체와 희망 일자를 선택하시면 시간대별 상담진행표가 표시됩니다.' : 'Select both company and date above to view the hourly schedule.'}
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

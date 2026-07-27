import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

const CATEGORY_BOOTH = 'booth';
const CATEGORY_MARKET = 'market';

// 저장 검색 슬롯 로컬스토리지 키
const SAVED_SLOTS_KEY = 'axdata_saved_slots';

function loadSavedSlots() {
  try { return JSON.parse(localStorage.getItem(SAVED_SLOTS_KEY) || '[]'); }
  catch { return []; }
}

function saveSlotsToStorage(slots) {
  localStorage.setItem(SAVED_SLOTS_KEY, JSON.stringify(slots));
}

export default function AXData() {
  const [activeCategory, setActiveCategory] = useState(null); // null | 'booth' | 'market'

  const [messages, setMessages] = useState([
    {
      role: 'agent',
      text: '안녕하세요! 참가업체 유치 Agent입니다. DB에 구축된 업체 데이터를 찾아드릴게요. 원하시는 조건을 자유롭게 말씀해 주세요.',
    }
  ]);
  const [marketMessages, setMarketMessages] = useState([
    {
      role: 'agent',
      text: '안녕하세요! 시장개척단 참가업체 유치 Agent입니다. 해외 시장개척단에 참가할 업체를 발굴해 드립니다. 원하시는 조건을 말씀해 주세요.',
    }
  ]);
  const [input, setInput] = useState('');
  const [marketInput, setMarketInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMarketLoading, setIsMarketLoading] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [currentMarketData, setCurrentMarketData] = useState(null);
  const [savedSlots, setSavedSlots] = useState(loadSavedSlots);
  const chatEndRef = useRef(null);
  const marketChatEndRef = useRef(null);

  const BASE_URL = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-production-601f2.up.railway.app' : 'http://localhost:4000');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentData]);

  useEffect(() => {
    marketChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [marketMessages, currentMarketData]);

  const handleSend = async (e, targetCategory) => {
    e?.preventDefault();
    const currentInput = targetCategory === CATEGORY_MARKET ? marketInput : input;
    if (!currentInput.trim()) return;

    const userMessage = currentInput.trim();

    if (targetCategory === CATEGORY_MARKET) {
      setMarketMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
      setMarketInput('');
      setIsMarketLoading(true);
      setCurrentMarketData(null);
    } else {
      setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
      setInput('');
      setIsLoading(true);
      setCurrentData(null);
    }

    try {
      let response;
      try {
        response = await fetch(`${BASE_URL}/agent/data-engineer-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userMessage }),
        });
      } catch (localErr) {
        // 로컬 백엔드가 실행되지 않았을 경우 클라우드 서버(Railway)로 자동 재시도
        const CLOUD_URL = 'https://backend-production-601f2.up.railway.app';
        response = await fetch(`${CLOUD_URL}/agent/data-engineer-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userMessage }),
        });
      }

      const result = await response.json();

      if (response.ok) {
        if (targetCategory === CATEGORY_MARKET) {
          setMarketMessages((prev) => [...prev, { role: 'agent', text: result.message }]);
          if (result.data && result.data.length > 0) setCurrentMarketData(result.data);
        } else {
          setMessages((prev) => [...prev, { role: 'agent', text: result.message }]);
          if (result.data && result.data.length > 0) setCurrentData(result.data);
        }
      } else {
        const errText = result.error || '데이터 조회 중 오류가 발생했습니다.';
        if (targetCategory === CATEGORY_MARKET) {
          setMarketMessages((prev) => [...prev, { role: 'agent', text: errText }]);
        } else {
          setMessages((prev) => [...prev, { role: 'agent', text: errText }]);
        }
      }
    } catch (err) {
      const errText = '서버 통신에 실패했습니다. 백엔드 서버 상태를 확인해 주세요.';
      if (targetCategory === CATEGORY_MARKET) {
        setMarketMessages((prev) => [...prev, { role: 'agent', text: errText }]);
      } else {
        setMessages((prev) => [...prev, { role: 'agent', text: errText }]);
      }
    } finally {
      if (targetCategory === CATEGORY_MARKET) setIsMarketLoading(false);
      else setIsLoading(false);
    }
  };

  const handleExportExcel = (data, prefix) => {
    if (!data || data.length === 0) return;
    const fileName = window.prompt('다운로드할 엑셀 파일명을 입력하세요 (확장자 제외):', `${prefix}_Companies_List`);
    if (!fileName) return;

    const worksheet = XLSX.utils.json_to_sheet(
      data.map((c) => ({
        '업체명 (Company)': c.company_name,
        '이메일 (Email)': c.email || '',
        '이메일 유무': c.email ? '있음' : '없음',
        '국가 (Country)': c.country,
        '분류 (Type)': c.type === 'domestic' ? '국내' : '해외',
        '산업군 (Industry)': c.industry,
        '웹사이트 (Website)': c.website,
        '소스 그룹': c.original_data?.source_group || '',
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  // PDF 출력 (프린트 다이얼로그 이용)
  const handleExportPDF = (data, title) => {
    if (!data || data.length === 0) return;
    const rows = data.map((c, i) => `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:6px 8px;color:#6b7280;font-size:12px">${i + 1}</td>
        <td style="padding:6px 8px;font-weight:600;font-size:13px">${c.company_name || '-'}</td>
        <td style="padding:6px 8px;font-size:12px;color:${c.email ? '#2563eb' : '#ef4444'}">${c.email || '없음'}</td>
        <td style="padding:6px 8px;font-size:12px">${c.country || '-'}</td>
        <td style="padding:6px 8px;font-size:12px">${c.industry || '-'}</td>
        <td style="padding:6px 8px;font-size:12px;color:#6b7280">${c.website || '-'}</td>
      </tr>`).join('');
    const html = `
      <html><head><title>${title}</title>
      <style>body{font-family:'Malgun Gothic',sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th{background:#f1f5f9;padding:8px;text-align:left;font-size:12px;border-bottom:2px solid #e2e8f0}@media print{.no-print{display:none}}</style>
      </head><body>
        <h2 style="font-size:18px;margin-bottom:4px">${title}</h2>
        <p style="color:#6b7280;font-size:13px;margin-bottom:16px">총 ${data.length}건 · 출력일: ${new Date().toLocaleDateString('ko-KR')}</p>
        <table><thead><tr><th>#</th><th>업체명</th><th>이메일</th><th>국가</th><th>산업군</th><th>웹사이트</th></tr></thead>
        <tbody>${rows}</tbody></table>
      </body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  // 검색 슬롯 저장
  const handleSaveSlot = (queryText, category) => {
    if (!queryText.trim()) return;
    const label = window.prompt('이 검색 조건의 이름을 입력하세요:', queryText.slice(0, 30));
    if (!label) return;
    const newSlot = { id: Date.now(), label, query: queryText, category };
    const updated = [newSlot, ...savedSlots].slice(0, 8);
    setSavedSlots(updated);
    saveSlotsToStorage(updated);
  };

  const handleDeleteSlot = (id) => {
    const updated = savedSlots.filter(s => s.id !== id);
    setSavedSlots(updated);
    saveSlotsToStorage(updated);
  };

  const handleKeyDown = (e, category) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(null, category);
    }
  };

  const categories = [
    {
      id: CATEGORY_BOOTH,
      icon: '🏢',
      subtitle: 'BOOTH EXHIBITOR',
      titleKo: '부스 참가업체 유치',
      titleEn: 'Booth Exhibitor Recruiting',
      descKo: '전시회 부스 참가 유치를 위해 유망 제조사 데이터베이스(DB)와 마케팅용 검증 이메일을 즉시 수집하고 엑셀로 추출합니다.',
      descEn: 'Collects prospective exhibitor DB and verified marketing emails for exhibition booth recruitment, exportable to Excel.',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      accentColor: '#F59E0B',
      accentBg: 'rgba(245, 158, 11, 0.08)',
      accentBorder: 'rgba(245, 158, 11, 0.25)',
      placeholder: '예시: 2026 서울 뷰티·모빌리티 전시회 부스 참가기업 모집을 위한 타겟 제조사 및 마케팅 이메일 리스트를 추출해 줘',
      agentLabel: '부스 참가업체 유치 Agent',
      agentLabelEn: 'Booth Exhibitor Agent',
    },
    {
      id: CATEGORY_MARKET,
      icon: '🌏',
      subtitle: 'MARKET PIONEER',
      titleKo: '시장개척단 참가업체 유치',
      titleEn: 'Market Pioneer Recruiting',
      descKo: '해외 시장개척단에 참가할 국내 유망 기업을 발굴하고, 대상 업체의 DB 및 담당자 이메일을 즉시 추출합니다.',
      descEn: 'Discovers promising domestic companies for overseas market pioneer programs and extracts their contact DB and emails.',
      gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      accentColor: '#6366F1',
      accentBg: 'rgba(99, 102, 241, 0.08)',
      accentBorder: 'rgba(99, 102, 241, 0.25)',
      placeholder: '예시: 미국 라스베이거스 시장개척단 참가 가능한 K-뷰티 화장품 제조사 리스트와 이메일을 추출해 줘',
      agentLabel: '시장개척단 참가업체 유치 Agent',
      agentLabelEn: 'Market Pioneer Agent',
    },
  ];

  return (
    <div style={{ padding: '2.5rem 0', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Pretendard', 'Inter', sans-serif" }}>

      {/* ── Header Banner ── */}
      <section style={{
        padding: '3rem 2.5rem',
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
        color: '#ffffff',
        borderRadius: '20px',
        marginBottom: '2.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative blur blobs */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '220px', height: '220px',
          background: 'rgba(245, 158, 11, 0.15)',
          borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '30%',
          width: '180px', height: '180px',
          background: 'rgba(99, 102, 241, 0.15)',
          borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M4 4h16v16H4z" /><path d="M8 8h8" /><path d="M8 12h8" /><path d="M8 16h5" />
                  </svg>
                </div>
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#FCD34D', letterSpacing: '0.5px' }}>
                  참가업체 유치 Agent
                </span>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '1rem', color: '#ffffff', margin: '0 0 1rem 0' }}>
                참가업체 유치 Agent 전문 지원 서비스
              </h1>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0, maxWidth: '640px' }}>
                전시회 부스 참가업체 및 해외 시장개척단 참가기업 유치를 위해 유망 제조사 DB와 마케팅용 검증 이메일을 즉시 수집하고 엑셀로 추출합니다.
              </p>
            </div>

            {/* 바로가기 버튼 */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Link
                to="/apply/koaa-2026-booth"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 16px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#fff', fontSize: '13px', fontWeight: 700,
                  textDecoration: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                📋 온라인 참가 신청서 (예시)
              </Link>
              <Link
                to="/admin/applications"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 16px', borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#fff', fontSize: '13px', fontWeight: 600,
                  textDecoration: 'none', backdropFilter: 'blur(8px)',
                }}
              >
                ⚙️ 신청서 접수 현황 (Admin)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Selection Heading ── */}
      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '1.5rem', color: '#1e293b' }}>
        유치 대상 유형을 선택하세요
      </h2>

      {/* ── Category Cards (if none selected) ── */}
      {!activeCategory && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                background: '#ffffff',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                borderRadius: '16px',
                padding: '2rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
              }}
            >
              <div>
                <div style={{ fontSize: '36px', marginBottom: '1rem' }}>{cat.icon}</div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: cat.accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {cat.subtitle}
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0.5rem 0 1rem 0', color: '#1e293b' }}>
                  {cat.titleKo}
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  {cat.descKo}
                </p>
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: cat.accentColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
                Agent 시작하기 <span>➔</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Active Category Chat Interface ── */}
      {activeCategory && (() => {
        const cat = categories.find(c => c.id === activeCategory);
        const msgs = activeCategory === CATEGORY_MARKET ? marketMessages : messages;
        const currInput = activeCategory === CATEGORY_MARKET ? marketInput : input;
        const setInput_ = activeCategory === CATEGORY_MARKET ? setMarketInput : setInput;
        const loading = activeCategory === CATEGORY_MARKET ? isMarketLoading : isLoading;
        const data = activeCategory === CATEGORY_MARKET ? currentMarketData : currentData;
        const endRef = activeCategory === CATEGORY_MARKET ? marketChatEndRef : chatEndRef;
        const prefix = activeCategory === CATEGORY_MARKET ? 'Market_Pioneer' : 'Booth_Exhibitor';

        return (
          <div>
            {/* Back + Category Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setActiveCategory(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', border: '1px solid #e5e7eb',
                  borderRadius: '8px', background: '#fff', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600, color: '#6b7280',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                ← 목록으로
              </button>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '6px 14px',
                background: cat.accentBg,
                border: `1px solid ${cat.accentBorder}`,
                borderRadius: '8px',
              }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  background: cat.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px',
                }}>
                  {cat.icon}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: cat.accentColor }}>
                  {cat.titleKo}
                </span>
              </div>
            </div>

            {/* Chat + Data Preview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: data ? '1fr 1fr' : '1fr', gap: '2rem', transition: 'all 0.3s ease' }}>

              {/* Chat Panel */}
              <div style={{
                display: 'flex', flexDirection: 'column', height: '600px',
                background: '#fff', borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb', overflow: 'hidden',
              }}>
                <div style={{
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid #e5e7eb',
                  background: cat.accentBg,
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: cat.accentColor,
                    boxShadow: `0 0 6px ${cat.accentColor}`,
                    animation: 'axPulse 2s ease-in-out infinite',
                  }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: cat.accentColor }}>
                    {cat.agentLabel}
                  </span>
                </div>

                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f9fafb' }}>
                  {msgs.map((msg, idx) => (
                    <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                      {msg.role === 'agent' && (
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: cat.accentColor, marginBottom: '0.2rem' }}>
                          {cat.agentLabel}
                        </div>
                      )}
                      <div style={{
                        background: msg.role === 'user' ? cat.gradient : '#fff',
                        color: msg.role === 'user' ? '#fff' : '#374151',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: msg.role === 'agent' ? '1px solid #e5e7eb' : 'none',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5,
                      }}>
                        {msg.text}
                      </div>
                      {msg.role === 'agent' && idx === msgs.length - 1 && data && data.length > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '8px',
                          padding: '8px 12px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          flexWrap: 'wrap',
                        }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginRight: '4px' }}>
                            💡 검색 결과({data.length}건) 내보내기:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleExportExcel(data, prefix)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '6px 12px', background: '#10b981', color: '#fff',
                              border: 'none', borderRadius: '6px', fontSize: '12px',
                              fontWeight: 700, cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(16,185,129,0.3)',
                            }}
                          >
                            📊 엑셀 다운로드
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportPDF(data, `${cat.titleKo} - 업체 리스트`)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '6px 12px', background: '#ef4444', color: '#fff',
                              border: 'none', borderRadius: '6px', fontSize: '12px',
                              fontWeight: 700, cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(239,68,68,0.3)',
                            }}
                          >
                            📄 PDF 다운로드
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '16px', height: '16px', border: `2px solid #e5e7eb`, borderTopColor: cat.accentColor, borderRadius: '50%', display: 'inline-block', animation: 'axSpin 1s linear infinite' }} />
                      <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>데이터를 검색하고 있습니다...</span>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                <div style={{ padding: '1rem', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <textarea
                      value={currInput}
                      onChange={(e) => setInput_(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, activeCategory)}
                      placeholder={cat.placeholder}
                      style={{
                        flex: 1, padding: '1rem', borderRadius: '8px',
                        border: '1px solid #d1d5db', resize: 'none', outline: 'none',
                        height: '80px', fontFamily: 'inherit', fontSize: '14px',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = cat.accentColor}
                      onBlur={e => e.target.style.borderColor = '#d1d5db'}
                    />
                    <button
                      onClick={() => handleSend(null, activeCategory)}
                      disabled={loading || !currInput.trim()}
                      style={{
                        padding: '0 1.5rem',
                        background: loading || !currInput.trim() ? '#e5e7eb' : cat.gradient,
                        color: loading || !currInput.trim() ? '#9ca3af' : '#fff',
                        border: 'none', borderRadius: '8px',
                        fontWeight: 600, cursor: loading || !currInput.trim() ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s', fontSize: '14px',
                      }}
                    >
                      전송
                    </button>
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                    💡 {cat.placeholder.split(':')[1]?.trim().slice(0, 50) || '조건을 자연어로 입력하세요'}...
                  </p>
                  {/* 저장 슬롯 */}
                  {savedSlots.filter(s => s.category === activeCategory).length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af', alignSelf: 'center', fontWeight: 600 }}>📌 저장된 검색:</span>
                      {savedSlots.filter(s => s.category === activeCategory).map(slot => (
                        <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <button
                            onClick={() => setInput_(slot.query)}
                            style={{
                              padding: '3px 10px', borderRadius: '999px', border: `1px solid ${cat.accentColor}44`,
                              background: cat.accentBg, color: cat.accentColor, fontSize: '11px', fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >{slot.label}</button>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '11px', padding: '0 2px' }}
                            title="삭제"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {currInput.trim() && (
                    <button
                      onClick={() => handleSaveSlot(currInput, activeCategory)}
                      style={{ marginTop: '6px', padding: '3px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '11px', color: '#6b7280', cursor: 'pointer', fontWeight: 600 }}
                    >
                      📌 이 검색 조건 저장
                    </button>
                  )}
                </div>
              </div>

              {/* Data Preview Panel */}
              {data && (
                <div style={{
                  display: 'flex', flexDirection: 'column', height: '600px',
                  background: '#fff', borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb', overflow: 'hidden',
                  animation: 'axFadeIn 0.3s ease-out',
                }}>
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', fontWeight: 700 }}>데이터 미리보기</h3>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>총 {data.length}건 검색됨 (이메일 있음: {data.filter(d => d.email).length}건)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleExportPDF(data, cat.titleKo + ' 업체 목록')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.5rem 1rem', background: '#EF4444',
                          color: '#fff', border: 'none', borderRadius: '6px',
                          fontWeight: 600, cursor: 'pointer', fontSize: '13px',
                        }}
                      >
                        📄 PDF
                      </button>
                      <button
                        onClick={() => handleExportExcel(data, prefix)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.5rem 1rem', background: '#10B981',
                          color: '#fff', border: 'none', borderRadius: '6px',
                          fontWeight: 600, cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)', fontSize: '13px',
                        }}
                      >
                        📊 엑셀
                      </button>
                    </div>
                  </div>
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 1 }}>
                        <tr>
                          <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>구분</th>
                          <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>업체명</th>
                          <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>이메일</th>
                          <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>국가</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                              <span style={{
                                padding: '0.2rem 0.5rem', borderRadius: '4px',
                                background: item.type === 'domestic' ? '#e0e7ff' : '#dcfce7',
                                color: item.type === 'domestic' ? '#3730a3' : '#166534',
                                fontSize: '0.8rem', fontWeight: 600,
                              }}>
                                {item.type === 'domestic' ? '국내' : '해외'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#1e293b', fontWeight: 500 }}>{item.company_name}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#3b82f6' }}>{item.email || '-'}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{item.country || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes axSpin { 100% { transform: rotate(360deg); } }
        @keyframes axFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes axPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}

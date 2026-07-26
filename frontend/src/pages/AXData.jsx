import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function AXData() {
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      text: '안녕하세요! AX 데이터 엔지니어입니다. DB에 구축된 업체 데이터를 찾아드릴게요. 원하시는 조건을 자유롭게 말씀해 주세요.',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState(null); // the queried data for preview
  const chatEndRef = useRef(null);

  const BASE_URL = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-production-601f2.up.railway.app' : 'http://localhost:4000');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentData]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);
    setCurrentData(null); // Clear previous preview

    try {
      const response = await fetch(`${BASE_URL}/agent/data-engineer-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'agent', text: result.message }
        ]);
        if (result.data && result.data.length > 0) {
          setCurrentData(result.data);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'agent', text: result.error || '데이터 조회 중 오류가 발생했습니다.' }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'agent', text: '서버와 통신할 수 없습니다.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!currentData || currentData.length === 0) return;

    const fileName = window.prompt("다운로드할 엑셀 파일명을 입력하세요 (확장자 제외):", "AX_Companies_List");
    if (!fileName) return;

    const worksheet = XLSX.utils.json_to_sheet(
      currentData.map((c) => ({
        '업체명 (Company)': c.company_name,
        '이메일 (Email)': c.email,
        '국가 (Country)': c.country,
        '분류 (Type)': c.type === 'domestic' ? '국내' : '해외',
        '산업군 (Industry)': c.industry,
        '웹사이트 (Website)': c.website
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ax-data-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Pretendard', sans-serif" }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937' }}>부스 참가업체 유치 에이전트</h1>
        <p style={{ color: '#6b7280' }}>전시회 부스 참가 유치를 위한 잠재 기업 DB 및 마케팅용 검증 이메일을 자연어로 즉시 추출합니다.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: currentData ? '1fr 1fr' : '1fr', gap: '2rem', transition: 'all 0.3s ease' }}>
        
        {/* Chat Section */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '600px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f9fafb' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                {msg.role === 'agent' && (
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4F46E5', marginBottom: '0.2rem' }}>Exhibitor Recruiting Agent</div>
                )}
                <div style={{
                  background: msg.role === 'user' ? '#4F46E5' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#374151',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: msg.role === 'agent' ? '1px solid #e5e7eb' : 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #e5e7eb', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>데이터를 검색하고 있습니다...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '1rem', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="미 디트로이트 현대기아 벤더사의 국내업체명과 이메일을 추출해서 엑셀파일로 만들어 줘"
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  resize: 'none',
                  outline: 'none',
                  height: '80px',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                style={{
                  padding: '0 1.5rem',
                  background: '#4F46E5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !input.trim() ? 0.7 : 1,
                  transition: 'background 0.2s'
                }}
              >
                전송
              </button>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
              💡 예시: 미 디트로이트 현대기아 벤더사의 국내업체명과 이메일을 추출해서 엑셀파일로 만들어 줘
            </p>
          </div>
        </div>

        {/* Data Preview Section */}
        {currentData && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '600px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', overflow: 'hidden', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>데이터 미리보기</h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>총 {currentData.length}건 검색됨</span>
              </div>
              <button
                onClick={handleExportExcel}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#10B981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                }}
              >
                📊 엑셀 다운로드
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
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
                  {currentData.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: item.type === 'domestic' ? '#e0e7ff' : '#dcfce7', color: item.type === 'domestic' ? '#3730a3' : '#166534', fontSize: '0.8rem', fontWeight: 600 }}>
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
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

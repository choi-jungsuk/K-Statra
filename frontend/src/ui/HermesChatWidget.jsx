import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { Link } from 'react-router-dom';

export default function HermesChatWidget() {
  const { t, lang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [statusText, setStatusText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);

  // API base endpoint configuration
  const BASE_URL = import.meta.env.VITE_API_BASE || (import.meta.env.PROD
    ? 'https://backend-production-601f2.up.railway.app'
    : 'http://localhost:4000');

  // 1. 컴포넌트 마운트 시 대화 내역 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('hermes_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    } else {
      // 웰컴 메시지 기본 설정
      const welcomeMsg = {
        id: 'welcome',
        role: 'assistant',
        content: lang === 'ko'
          ? '안녕하세요! DemoStatra의 공식 AI 매칭 비서 **Hermes(헤르메스)**입니다. 🤖✨\n원하시는 비즈니스 파트너나 협업하고 싶은 업종을 알려주시면, 실시간으로 데이터베이스를 검색해 최적의 파트너를 매칭해 드립니다!\n\n예: *"전기차 부품 제조업체 추천해줘"*, *"바이오 헬스케어 관련 기업 찾아줘"*'
          : 'Hello! I am **Hermes**, the official AI matching assistant of DemoStatra. 🤖✨\nTell me what kind of business partner or industry you are looking for, and I will search our database in real time to find the perfect match for you!\n\nTry: *"Recommend electric vehicle parts manufacturers"*, *"Find bio-healthcare companies"*',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMsg]);
    }
  }, [lang]);

  // MAS Orchestrator Simulation Listener
  useEffect(() => {
    const handleSimulation = (e) => {
      setIsOpen(true);
      
      const addMsg = (role, name, content, delay) => {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `sim-${Date.now()}-${Math.random()}`,
            role: role,
            content: `**[${name}]**\n${content}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }, delay);
      };

      if (lang === 'ko') {
        addMsg('user', 'User', '전체 오케스트라 에이전트 파이프라인 가동해줘.', 0);
        addMsg('assistant', 'MAS Orchestrator', '네, 전시회 준비를 위한 5단계 전문 에이전트 파이프라인을 가동합니다.\n\n1. 참가기업 발굴 에이전트 호출 중...', 1000);
        addMsg('assistant', '1. 참가기업 발굴 Agent', 'K-뷰티 및 의료기기 관련 타겟 기업 120개사 리스트업 완료. (DB 적재 완료)', 2500);
        addMsg('assistant', '2. 글로벌 시장정보 Agent', '해당 품목의 북미/유럽 시장 규제 및 관세 정보 추출 완료. 타겟 마켓 리포트 생성.', 4000);
        addMsg('assistant', '3. 바이어 발굴 Agent', '발굴된 참가기업의 품목을 기반으로 매칭 가능한 글로벌 바이어 50개사 추천 리스트 생성 완료.', 5500);
        addMsg('assistant', '4. 상담일정 관리 Agent', '추천 바이어 50개사와 참가기업 간의 가상 B2B 미팅 스케줄 초안 20건 생성 및 승인 대기 상태로 등록 완료.', 7000);
        addMsg('assistant', 'MAS Orchestrator', '🎉 모든 에이전트의 초기 작업이 완료되었습니다. 각 에이전트 메뉴에서 상세 결과와 데이터를 확인하시고 승인/조율 작업을 진행해 주세요.', 8500);
      } else {
        addMsg('user', 'User', 'Start the full orchestrator agent pipeline.', 0);
        addMsg('assistant', 'MAS Orchestrator', 'Yes, starting the 5-stage expert agent pipeline for exhibition preparation.\n\n1. Calling Exhibitor Agent...', 1000);
        addMsg('assistant', '1. Exhibitor Agent', 'Target companies list (120) related to K-Beauty & Medical Devices generated and stored in DB.', 2500);
        addMsg('assistant', '2. Market Info Agent', 'Extracted North American/European market regulations and tariffs. Market report generated.', 4000);
        addMsg('assistant', '3. Buyer Match Agent', 'Generated a recommended list of 50 global buyers matchable with the exhibitors.', 5500);
        addMsg('assistant', '4. Schedule Agent', 'Created 20 draft B2B virtual meeting schedules between the recommended buyers and exhibitors. Pending approval.', 7000);
        addMsg('assistant', 'MAS Orchestrator', '🎉 All agents have completed their initial tasks. Please check the detailed results in each agent menu to proceed with approvals.', 8500);
      }
    };

    window.addEventListener('trigger-orchestrator', handleSimulation);
    return () => window.removeEventListener('trigger-orchestrator', handleSimulation);
  }, [lang]);

  // 2. 메시지가 추가되거나 변경될 때 자동 스크롤
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, statusText]);

  // 3. 대화창을 열 때 안 읽은 메시지 뱃지 초기화
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // 4. 대화 내역 로컬 저장
  const saveHistory = (newMessages) => {
    setMessages(newMessages);
    localStorage.setItem('hermes_chat_history', JSON.stringify(newMessages));
  };

  // 5. 대화 내역 삭제 (초기화)
  const clearHistory = () => {
    if (window.confirm(lang === 'ko' ? '대화 내역을 초기화하시겠습니까?' : 'Do you want to clear your chat history?')) {
      const welcomeMsg = {
        id: 'welcome',
        role: 'assistant',
        content: lang === 'ko'
          ? '안녕하세요! DemoStatra의 공식 AI 매칭 비서 **Hermes(헤르메스)**입니다. 🤖✨\n원하시는 비즈니스 파트너나 협업하고 싶은 업종을 알려주시면, 실시간으로 데이터베이스를 검색해 최적의 파트너를 매칭해 드립니다!'
          : 'Hello! I am **Hermes**, the official AI matching assistant of DemoStatra. 🤖✨\nTell me what kind of business partner or industry you are looking for, and I will search our database in real time to find the perfect match for you!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      saveHistory([welcomeMsg]);
    }
  };

  // 6. 실시간 스트리밍 답변 요청 실행
  const sendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    if (!textToSend) {
      setInputValue('');
    }

    // 6-1. 유저 메시지 추가
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedWithUser = [...messages, userMsg];
    saveHistory(updatedWithUser);

    setIsThinking(true);
    setStatusText(lang === 'ko' ? 'Hermes Agent 호출 중...' : 'Calling Hermes agent...');

    // 6-2. 스트리밍 처리를 위한 어시스턴트 메시지 사전 추가
    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMsg = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      companies: [],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 대화 이력 압축 전송 준비
    const streamHistory = updatedWithUser.slice(-8).map(m => ({
      role: m.role,
      content: m.content
    }));

    // SSE(EventSource) 엔드포인트 URL 구성
    const sseUrl = `${BASE_URL}/agent/chat-stream?message=${encodeURIComponent(text)}&history=${encodeURIComponent(JSON.stringify(streamHistory))}`;
    
    let eventSource = null;

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        let data = {};
        try {
          data = JSON.parse(event.data);
        } catch (e) {
          console.error('Failed to parse SSE event data', e);
          return;
        }

        if (data.type === 'status') {
          setStatusText(data.text);
        } else if (data.type === 'text') {
          setIsThinking(false);
          setStatusText('');
          
          setMessages(prev => {
            const index = prev.findIndex(m => m.id === assistantMsgId);
            if (index === -1) {
              const updated = [...prev, { ...assistantMsg, content: data.text }];
              localStorage.setItem('hermes_chat_history', JSON.stringify(updated));
              return updated;
            } else {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                content: updated[index].content + data.text
              };
              localStorage.setItem('hermes_chat_history', JSON.stringify(updated));
              return updated;
            }
          });
        } else if (data.type === 'companies') {
          setMessages(prev => {
            const index = prev.findIndex(m => m.id === assistantMsgId);
            if (index === -1) {
              const updated = [...prev, { ...assistantMsg, companies: data.companies }];
              localStorage.setItem('hermes_chat_history', JSON.stringify(updated));
              return updated;
            } else {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                companies: data.companies
              };
              localStorage.setItem('hermes_chat_history', JSON.stringify(updated));
              return updated;
            }
          });
        } else if (data.type === 'error') {
          setIsThinking(false);
          setStatusText('');
          setMessages(prev => {
            const errorMsg = {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: `⚠️ ${data.text}`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            const updated = [...prev, errorMsg];
            localStorage.setItem('hermes_chat_history', JSON.stringify(updated));
            return updated;
          });
          eventSource.close();
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Error:', err);
        setIsThinking(false);
        setStatusText('');
        if (eventSource) {
          eventSource.close();
        }
      };

      // 스트림 연결 완료를 감지하여 닫는 처리
      eventSource.addEventListener('close', () => {
        setIsThinking(false);
        setStatusText('');
        if (eventSource) {
          eventSource.close();
        }
      });

    } catch (e) {
      console.error(e);
      setIsThinking(false);
      setStatusText('');
      if (eventSource) {
        eventSource.close();
      }
    }
  };

  // 마크다운 형식의 굵은 글씨(**텍스트**)와 개행(\n)을 간단히 파싱하여 JSX로 렌더링
  const renderMarkdown = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // 굵은 글씨 파싱
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const parsedLine = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return <p key={i}>{parsedLine}</p>;
    });
  };

  // 퀵 프롬프트 목록 설정
  const quickPrompts = lang === 'ko'
    ? [
        { label: '🚗 자동차 부품 수출', value: '자동차 부품 수출업체 추천해줘' },
        { label: '🔬 바이오/메디컬 기업', value: '바이오 헬스케어 메디컬 분야 관련 기업 추천해줘' },
        { label: '💻 IT/AI/SaaS 벤처', value: 'IT 및 AI 기술력을 가진 신생 벤처기업 찾아줘' },
        { label: '🤝 매칭 신청 방법', value: 'DemoStatra 플랫폼에서 파트너 매칭 신청 절차를 알려줘' }
      ]
    : [
        { label: '🚗 Auto Parts Export', value: 'Recommend automotive parts exporters' },
        { label: '🔬 Bio/Medical Firms', value: 'Find biotechnology and medical companies' },
        { label: '💻 IT/AI/SaaS Startup', value: 'Show me startup software tech businesses' },
        { label: '🤝 How to Start Match', value: 'Explain how to start a business match request' }
      ];

  return (
    <div className="hermes-widget-container">
      {/* 1. 플로팅 트리거 버튼 */}
      {!isOpen && (
        <div className="hermes-trigger-wrapper">
          <div className="hermes-trigger-badge">
            <span className="trigger-badge-dot"></span>
            {lang === 'ko' ? 'AI 안내 데스크' : 'AI Info Desk'}
          </div>
          <button
            className="hermes-trigger"
            onClick={() => {
              setIsOpen(true);
              // 대화창 열릴 때 가벼운 알림 수 증가
              if (messages.length === 1) {
                setUnreadCount(0);
              }
            }}
            title={lang === 'ko' ? 'Hermes AI 비서와 대화하기' : 'Chat with Hermes AI'}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            {unreadCount > 0 && <span className="trigger-badge">{unreadCount}</span>}
          </button>
        </div>
      )}

      {/* 2. 대화 창 */}
      {isOpen && (
        <div className="hermes-chat-window">
          {/* 헤더 영역 */}
          <div className="hermes-header">
            <div className="hermes-header-info">
              <div className="hermes-avatar-container">
                <div className="hermes-avatar">H</div>
                <span className="status-dot online"></span>
              </div>
              <div>
                <h4 className="hermes-title">Hermes AI</h4>
                <p className="hermes-subtitle">DemoStatra 스마트 매칭 비서</p>
              </div>
            </div>
            <div className="hermes-actions">
              <button
                className="hermes-action-btn"
                onClick={clearHistory}
                title={lang === 'ko' ? '대화 내역 지우기' : 'Clear Chat'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
              <button
                className="hermes-action-btn"
                onClick={() => setIsOpen(false)}
                title={lang === 'ko' ? '창 닫기' : 'Minimize'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* 대화 내역 스크롤 */}
          <div className="hermes-messages">
            {messages.map((msg) => (
              <div key={msg.id} className="hermes-msg-block" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className={`hermes-msg-row ${msg.role}`}>
                  <div className="hermes-bubble">
                    {renderMarkdown(msg.content)}
                  </div>
                  <span className="hermes-msg-time">{msg.time}</span>
                </div>

                {/* 파트너 기업 카드 가로 스크롤 (도구 결과 렌더링) */}
                {msg.companies && msg.companies.length > 0 && (
                  <div className="hermes-carousel-container">
                    {msg.companies.map((comp, idx) => (
                      <div key={idx} className="hermes-company-mini-card">
                        <div>
                          <h5>{comp.name}</h5>
                          <span className="industry-badge">{comp.industry}</span>
                          <p>{comp.description}</p>
                          <div className="hermes-card-tags">
                            {comp.tags.slice(0, 2).map((tag, tIdx) => (
                              <span key={tIdx} className="hermes-card-tag">#{tag}</span>
                            ))}
                          </div>
                        </div>
                        <Link
                          to={`/partners?search=${encodeURIComponent(comp.name)}`}
                          className="hermes-card-action"
                          onClick={() => setIsOpen(false)}
                        >
                          상세 정보 보기
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* 생각 중 / 상태 표시 */}
            {isThinking && (
              <div className="hermes-msg-row assistant">
                <div className="hermes-bubble" style={{ display: 'flex', alignItems: 'center', padding: '12px 20px' }}>
                  <div className="pulse-loader">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            {/* 백엔드 작업 진행 상태 설명 */}
            {statusText && (
              <div className="hermes-status-msg">
                <span className="pulse-loader" style={{ scale: '0.8' }}>
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                <span>{statusText}</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 퀵 프롬프트 (빠른 질문 버튼) */}
          <div className="hermes-quick-prompts">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                className="hermes-prompt-btn"
                onClick={() => sendMessage(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* 푸터 입력 폼 */}
          <form
            className="hermes-footer"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <div className="hermes-input-wrapper">
              <input
                type="text"
                className="hermes-input"
                placeholder={lang === 'ko' ? '비즈니스 파트너 검색 질문하기...' : 'Ask for a business partner...'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <button type="submit" className="hermes-send-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

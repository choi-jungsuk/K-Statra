import React, { useState } from 'react'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { api } from '../api.js'
import { track } from '../utils/analytics.js'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'

export default function ConsultantPage() {
  const { lang } = useI18n()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState('regional-consulting')
  const [consultForm, setConsultForm] = useState({ name: '', email: '', details: '', serviceType: 'regional-consulting' })
  const [status, setStatus] = useState({ submitting: false, success: false, error: '' })

  const BASE_URL = import.meta.env.VITE_API_BASE || (import.meta.env.PROD
    ? 'https://backend-production-601f2.up.railway.app'
    : 'http://localhost:4000')

  // AI 실시간 지역전문가 + GTA MCP 관세·무역 규제 대화창 State
  const [aiHsCode, setAiHsCode] = useState('8507.60')
  const [aiCountry, setAiCountry] = useState('미국')
  const [aiQuery, setAiQuery] = useState('미국 수출 시 HS 8507.60 리튬이온배터리의 실시간 MFN/FTA 관세율과 반덤핑/IRA 등 비관세 장벽 조치를 분석해 줘.')
  const [aiRunning, setAiRunning] = useState(false)
  const [aiStatusText, setAiStatusText] = useState('')
  const [aiToolLogs, setAiToolLogs] = useState([])
  const [aiReport, setAiReport] = useState('')
  const [aiError, setAiError] = useState('')

  const quickHsPresets = [
    { code: '8507.60', label: '🔋 8507.60 (리튬이온배터리)', country: '미국', prompt: '미국 수출 시 HS 8507.60 리튬이온배터리의 실시간 MFN/FTA 관세율과 반덤핑/IRA 등 비관세 규제 조치를 분석해 줘.' },
    { code: '7208', label: '🏗️ 7208 (철강 열간압연)', country: 'EU', prompt: 'EU 유럽 수출 시 HS 7208 철강 제품의 탄소국경조정제도(CBAM) 및 반덤핑 관세율 조치를 확인해 줘.' },
    { code: '3304', label: '💄 3304 (K-뷰티 화장품)', country: '미국', prompt: '미국 수출 시 HS 3304 기초/색조 화장품의 MoCRA 법 규제와 성분 규제 및 관세율 정보를 분석해 줘.' },
    { code: '8471', label: '💻 8471 (컴퓨팅 서버/데이터처리)', country: '동남아시아', prompt: '베트남/동남아시아로 HS 8471 데이터 처리 장치 수출 시 관세율과 기술 표준 인증 요건을 알려줘.' },
    { code: '8708', label: '🚗 8708 (자동차 부품/액세서리)', country: '미국', prompt: '미국 디트로이트 자동차 완성차 업체에 HS 8708 자동차 부품 수출 시 적용되는 관세율과 USMCA/IRA 규정 주의사항을 설명해 줘.' },
  ]

  const applyPreset = (preset) => {
    setAiHsCode(preset.code)
    setAiCountry(preset.country)
    setAiQuery(preset.prompt)
    setAiError('')
  }

  const startAiConsulting = (e) => {
    if (e) e.preventDefault()
    if (!aiQuery.trim()) return

    setAiRunning(true)
    setAiReport('')
    setAiToolLogs([])
    setAiError('')
    setAiStatusText(lang === 'ko' ? '⚡ 지역전문가 Agent 및 GTA 무역 정책 MCP 서버 연결 중...' : '⚡ Connecting to Regional Expert Agent & GTA Trade MCP...')

    const sseUrl = `${BASE_URL}/agent/regional-consultant-stream?query=${encodeURIComponent(aiQuery)}&region=${encodeURIComponent(aiCountry)}&industry=${encodeURIComponent(aiHsCode)}`

    try {
      const eventSource = new EventSource(sseUrl)
      let accumulatedText = ''

      eventSource.onmessage = (ev) => {
        let data = {}
        try {
          data = JSON.parse(ev.data)
        } catch {
          data = { type: 'text', text: ev.data }
        }

        if (data.type === 'status') {
          setAiStatusText(data.text)
          setAiToolLogs((prev) => [...prev.slice(-6), { time: new Date().toLocaleTimeString(), text: data.text }])
        } else if (data.type === 'tool_result') {
          setAiToolLogs((prev) => [...prev.slice(-6), { time: new Date().toLocaleTimeString(), text: `✅ [도구 응답] ${data.tool}: ${data.result_preview || '결과 로드 완료'}` }])
        } else if (data.type === 'text') {
          accumulatedText += data.text
          setAiReport(accumulatedText)
        } else if (data.type === 'error') {
          setAiError(data.text)
          setAiRunning(false)
          eventSource.close()
        } else if (data.type === 'done') {
          setAiStatusText(lang === 'ko' ? '✅ 실시간 무역 규제 및 관세 분석 리포트 완료' : '✅ Trade & Tariff Analysis Report Completed')
          setAiRunning(false)
          eventSource.close()
        }
      }

      eventSource.onerror = () => {
        setAiRunning(false)
        if (eventSource) eventSource.close()
      }
    } catch (err) {
      setAiError(err.message || 'SSE Stream execution error')
      setAiRunning(false)
    }
  }

  const downloadMarkdownReport = () => {
    if (!aiReport) return
    const filename = `DemoStatra_GTA_Trade_Report_${aiHsCode}_${aiCountry}.md`
    const blob = new Blob([`# DemoStatra AI 지역전문가 & GTA 관세·무역 규제 분석 리포트\n\n- **HS 코드**: ${aiHsCode}\n- **대상 국가**: ${aiCountry}\n- **생성 일시**: ${new Date().toLocaleString()}\n\n---\n\n${aiReport}`], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const openModal = (serviceType) => {
    setSelectedService(serviceType)
    setConsultForm((prev) => ({ ...prev, serviceType }))
    setStatus({ submitting: false, success: false, error: '' })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!consultForm.name.trim() || !consultForm.email.trim()) {
      setStatus({ submitting: false, success: false, error: lang === 'ko' ? '이름과 이메일을 입력해주세요.' : 'Please enter your name and email.' })
      return
    }
    setStatus({ submitting: true, success: false, error: '' })
    try {
      await api.createConsultantRequest({
        name: consultForm.name.trim(),
        email: consultForm.email.trim(),
        details: consultForm.details.trim(),
        serviceType: consultForm.serviceType,
        locale: lang,
        source: 'consultants-page'
      })
      track('consultant_help_submit', { serviceType: consultForm.serviceType })
      setStatus({ submitting: false, success: true, error: '' })
    } catch (err) {
      setStatus({ submitting: false, success: false, error: err.message || 'Error occurred while submitting request.' })
    }
  }

  const services = [
    {
      id: 'youtube-video',
      icon: '🎬',
      titleKo: '유튜브 홍보 동영상 제작 지원',
      titleEn: 'YouTube Promo Video Production',
      subtitle: 'Video Marketing',
      descKo: '해외 바이어의 시선을 사로잡는 참가업체 및 전시회 공식 홍보 동영상을 AI 영상 기법과 마케팅 팀이 제작 지원합니다.',
      descEn: 'AI-assisted promotional video production to captivate overseas buyers for exhibitors and exhibitions.'
    },
    {
      id: 'buyer-research',
      icon: '📊',
      titleKo: '해외 시장 및 바이어 조사 리포트',
      titleEn: 'Overseas Market & Buyer Research',
      subtitle: 'Market Research',
      descKo: '타겟 국가 및 품목별 진입 가능성과 맞춤형 바이어 리스트를 심층 조사하여 전문 컨설팅 리포트로 제공합니다.',
      descEn: 'In-depth market research reports on entry feasibility and verified buyer shortlists by target country.'
    },
    {
      id: 'global-consulting',
      icon: '🌍',
      titleKo: '지역전문가 1:1 맞춤 컨설팅',
      titleEn: '1:1 Regional Expert Consulting',
      subtitle: 'Regional Consulting',
      descKo: '해외 전시 참가 기업의 성공적인 시장 안착을 위해 수출 실무 및 현지 규제 분석 1:1 맞춤 컨설팅을 제공합니다.',
      descEn: '1:1 tailored consulting on export regulations and local market entry for exhibition participants.'
    }
  ]

  return (
    <div className="page" style={{ padding: '2.5rem 0' }}>
      {/* Header Banner */}
      <section className="card" style={{
        padding: '3rem 2.5rem',
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
        color: '#ffffff',
        borderRadius: '20px',
        marginBottom: '2.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(30, 27, 75, 0.25)'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '850px' }}>
          <div className="page-agent-header" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="search-agent-avatar" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: '13px', color: '#FCD34D', letterSpacing: '0.5px' }}>
              {lang === 'ko' ? '글로벌마케팅 Agent & GTA 무역 규제 MCP' : 'GLOBAL MARKETING AGENT & GTA TRADE MCP'}
            </span>
          </div>

          <h1 style={{ fontSize: '30px', fontWeight: 900, marginBottom: '1rem', color: '#ffffff', lineHeight: 1.3 }}>
            {lang === 'ko' ? 'AI 지역전문가 & 실시간 글로벌 관세·무역 규제 컨설팅' : 'AI Regional Expert & Live Global Trade Tariff Consulting'}
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.88)', lineHeight: 1.6, margin: 0 }}>
            {lang === 'ko'
              ? 'Global Trade Alert(GTA) 7만 건 이상의 검증된 글로벌 무역 정책 데이터와 지역전문가 Agent가 결합하여 수출 대상국의 관세율, 비관세 장벽 및 공식 법령 정보를 실시간 리포트로 제공합니다.'
              : 'Combining Global Trade Alert (GTA) verified trade policies with Regional Expert Agent to provide real-time tariffs, non-tariff barriers, and official legal citations.'}
          </p>
        </div>
      </section>

      {/* Interactive AI Regional Consultant & GTA MCP Chatbot Card */}
      <section className="card" style={{
        padding: '2.5rem',
        borderRadius: '20px',
        background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        marginBottom: '3rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ background: '#EEF2FF', color: '#00A4EF', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>
                GTA MCP Live Engine
              </span>
              <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>
                ⚡ 3-MCP Servers Integrated
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              {lang === 'ko' ? '🌐 실시간 HS 코드별 관세·무역 장벽 AI 대화창' : '🌐 Real-time HS Code Trade & Tariff AI Chatbox'}
            </h2>
          </div>
          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
            {lang === 'ko' ? '자연어로 HS 코드 및 대상 국가의 수출입 규제를 질문하세요.' : 'Ask export regulations by HS Code & Country in natural language.'}
          </span>
        </div>

        {/* Quick HS Code Presets */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>
            {lang === 'ko' ? '⚡ 주요 품목 HS 코드 퀵 선택:' : '⚡ Quick HS Code Presets:'}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {quickHsPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                style={{
                  background: aiHsCode === preset.code ? '#00A4EF' : '#FFFFFF',
                  color: aiHsCode === preset.code ? '#FFFFFF' : '#334155',
                  border: aiHsCode === preset.code ? '1px solid #00A4EF' : '1px solid #CBD5E1',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
              >
                {preset.label} · {preset.country}
              </button>
            ))}
          </div>
        </div>

        {/* AI Chat Input Form */}
        <form onSubmit={startAiConsulting} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: '0 0 160px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                {lang === 'ko' ? 'HS 코드 (품목)' : 'HS Code'}
              </label>
              <input
                type="text"
                className="input"
                style={{ fontWeight: 700, color: '#00A4EF' }}
                value={aiHsCode}
                onChange={(e) => setAiHsCode(e.target.value)}
                placeholder="예: 8507.60"
                required
              />
            </div>

            <div style={{ flex: '0 0 180px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                {lang === 'ko' ? '진출 대상 국가' : 'Target Country'}
              </label>
              <input
                type="text"
                className="input"
                style={{ fontWeight: 700 }}
                value={aiCountry}
                onChange={(e) => setAiCountry(e.target.value)}
                placeholder="예: 미국, EU, 동남아시아"
                required
              />
            </div>

            <div style={{ flex: '1 1 300px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                {lang === 'ko' ? '컨설팅 질문 내용 (관세율 / 반덤핑 / 규제 인증)' : 'Consulting Query'}
              </label>
              <input
                type="text"
                className="input"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="해당 HS 코드의 미국 MFN/FTA 관세율과 반덤핑/IRA 규제를 분석해 줘."
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button
                type="submit"
                variant="primary"
                disabled={aiRunning}
                style={{
                  height: '42px',
                  padding: '0 24px',
                  fontWeight: 800,
                  fontSize: '14px',
                  background: aiRunning ? '#64748B' : 'linear-gradient(135deg, #00A4EF 0%, #4338CA 100%)',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                  whiteSpace: 'nowrap'
                }}
              >
                {aiRunning ? (lang === 'ko' ? '⚡ AI 실시간 분석 중...' : '⚡ Analyzing...') : (lang === 'ko' ? '⚡ AI 실시간 관세/규제 분석 시작' : '⚡ Start AI Analysis')}
              </Button>
            </div>
          </div>
        </form>

        {/* Real-time MCP Tool Activity Logs */}
        {(aiRunning || aiToolLogs.length > 0 || aiStatusText) && (
          <div style={{ marginTop: '1.5rem', background: '#0F172A', color: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '12px', fontSize: '13px', fontFamily: 'monospace' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span style={{ color: '#38BDF8', fontWeight: 700 }}>
                🤖 MCP AGENT WORKSPACE · {aiStatusText || '대기 중'}
              </span>
              {aiRunning && (
                <span style={{ color: '#FBBF24', fontSize: '12px', fontWeight: 700 }}>
                  ● LIVE STREAMING
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
              {aiToolLogs.map((log, index) => (
                <div key={index} style={{ color: log.text.includes('도구') ? '#A7F3D0' : '#CBD5E1', fontSize: '12px' }}>
                  <span style={{ color: '#64748B', marginRight: '8px' }}>[{log.time}]</span>
                  {log.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {aiError && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#DC2626', fontWeight: 700, fontSize: '14px' }}>
            ⚠️ {aiError}
          </div>
        )}

        {/* AI Consulting Report Render Area */}
        {aiReport && (
          <div style={{ marginTop: '2rem', padding: '2rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '2px solid #F1F5F9', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#00A4EF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  DemoStatra Grounded Report
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '4px 0 0 0', color: '#0F172A' }}>
                  {lang === 'ko' ? `📋 HS ${aiHsCode} (${aiCountry}) 실시간 관세 및 무역 규제 컨설팅 리포트` : `📋 HS ${aiHsCode} (${aiCountry}) Trade & Tariff Report`}
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={downloadMarkdownReport}
                  style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  📄 {lang === 'ko' ? '마크다운(.md)으로 다운로드' : 'Download .md'}
                </Button>
              </div>
            </div>

            {/* Markdown Content Display */}
            <div
              className="consultant-report-content"
              style={{
                lineHeight: 1.75,
                color: '#1E293B',
                fontSize: '15px',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit'
              }}
            >
              {aiReport}
            </div>

            {/* Grounding Citation Box */}
            <div style={{ marginTop: '2rem', padding: '1.25rem', background: '#F8FAFC', borderLeft: '4px solid #00A4EF', borderRadius: '8px' }}>
              <div style={{ fontWeight: 800, color: '#334155', fontSize: '13px', marginBottom: '4px' }}>
                📚 {lang === 'ko' ? '공식 데이터 근거 및 인용 (Verified Citations)' : 'Verified Citations'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>
                {lang === 'ko'
                  ? '본 리포트는 Global Trade Alert (GTA) 및 각국 세관(USITC, EU TARIC) 공식 고시 문서의 시행일자 및 관세율 수치를 기반으로 작성되었습니다.'
                  : 'This report is grounded in Global Trade Alert (GTA) records and official customs publications (USITC, EU TARIC).'}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Static Services Grid */}
      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--fg)' }}>
        {lang === 'ko' ? '기타 맞춤형 지원 서비스 (1:1 전문가 상담 요청)' : 'Other Custom Assistance Services'}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {services.map((svc) => (
          <div
            key={svc.id}
            className="card consultant-service-card"
            style={{
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: '16px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              background: '#ffffff'
            }}
            onClick={() => openModal(svc.id)}
          >
            <div>
              <div style={{ fontSize: '32px', marginBottom: '1rem' }}>{svc.icon}</div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#66C5F5', textTransform: 'uppercase' }}>
                {svc.subtitle}
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0.5rem 0 1rem 0', color: 'var(--fg)' }}>
                {lang === 'ko' ? svc.titleKo : svc.titleEn}
              </h3>
              <p className="muted" style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                {lang === 'ko' ? svc.descKo : svc.descEn}
              </p>
            </div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#00A4EF', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {lang === 'ko' ? '상담 및 지원 요청하기' : 'Request Assistance'}
              <span>➔</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={lang === 'ko' ? '글로벌 비즈 컨설턴트 상담 요청' : 'Request Global Biz Consultant'}
      >
        {status.success ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>
              {lang === 'ko' ? '요청이 정상적으로 접수되었습니다!' : 'Request Submitted Successfully!'}
            </h3>
            <p className="muted" style={{ marginBottom: '1.5rem' }}>
              {lang === 'ko'
                ? '담당 컨설턴트 및 AI Agent가 검토 후 입력해주신 이메일로 빠르게 안내해 드리겠습니다.'
                : 'Our consultant team will review your request and reach out to your email shortly.'}
            </p>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              {lang === 'ko' ? '확인' : 'OK'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label" style={{ fontWeight: 700, fontSize: '13px' }}>
                {lang === 'ko' ? '이름 / 회사명' : 'Name / Company'} *
              </label>
              <input
                type="text"
                className="input"
                required
                value={consultForm.name}
                onChange={(e) => setConsultForm({ ...consultForm, name: e.target.value })}
                placeholder={lang === 'ko' ? '홍길동 / (주)데모스트라' : 'John Doe / DemoStatra Inc.'}
              />
            </div>

            <div>
              <label className="label" style={{ fontWeight: 700, fontSize: '13px' }}>
                {lang === 'ko' ? '이메일 주소' : 'Email Address'} *
              </label>
              <input
                type="email"
                className="input"
                required
                value={consultForm.email}
                onChange={(e) => setConsultForm({ ...consultForm, email: e.target.value })}
                placeholder="contact@example.com"
              />
            </div>

            <div>
              <label className="label" style={{ fontWeight: 700, fontSize: '13px' }}>
                {lang === 'ko' ? '요청 내용 및 문의 사항' : 'Inquiry Details'}
              </label>
              <textarea
                className="input"
                rows={4}
                value={consultForm.details}
                onChange={(e) => setConsultForm({ ...consultForm, details: e.target.value })}
                placeholder={lang === 'ko' ? '진출하고자 하는 국가, 타겟 바이어 혹은 필요하신 무역 서류에 대해 상세히 적어주세요.' : 'Please describe your target country, industry, or specific trade document assistance needed.'}
              />
            </div>

            {status.error && (
              <div style={{ color: '#EF4444', fontSize: '13px', fontWeight: 600 }}>{status.error}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                {lang === 'ko' ? '취소' : 'Cancel'}
              </Button>
              <Button type="submit" variant="primary" disabled={status.submitting}>
                {status.submitting ? (lang === 'ko' ? '제출 중...' : 'Submitting...') : (lang === 'ko' ? '상담 요청 제출' : 'Submit Request')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

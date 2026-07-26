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
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          <div className="page-agent-header" style={{ marginBottom: '16px' }}>
            <div className="search-agent-avatar" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', width: '32px', height: '32px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: '13px', color: '#FCD34D', letterSpacing: '0.5px' }}>
              {lang === 'ko' ? '글로벌마케팅 에이전트' : 'GLOBAL MARKETING AGENT'}
            </span>
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '1rem', color: '#ffffff' }}>
            {lang === 'ko' ? '글로벌마케팅 에이전트 전문 지원 서비스' : 'Global Marketing Agent Solution Center'}
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0 }}>
            {lang === 'ko'
              ? '전시회 부스 참가업체의 마케팅 역량 강화를 위해 유튜브 홍보 동영상 제작 지원 및 해외 시장/바이어 조사 리포트를 제공합니다.'
              : 'Enhancing exhibitor marketing capabilities with YouTube promotional videos and custom overseas buyer research reports.'}
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--fg)' }}>
        {lang === 'ko' ? '지원이 필요한 컨설팅 영역을 선택하세요' : 'Select a Consulting Service Area'}
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
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#6366F1', textTransform: 'uppercase' }}>
                {svc.subtitle}
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0.5rem 0 1rem 0', color: 'var(--fg)' }}>
                {lang === 'ko' ? svc.titleKo : svc.titleEn}
              </h3>
              <p className="muted" style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                {lang === 'ko' ? svc.descKo : svc.descEn}
              </p>
            </div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '6px' }}>
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

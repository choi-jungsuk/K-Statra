import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import Button from '../ui/Button.jsx'
import { useI18n } from '../i18n/I18nProvider.jsx'
import CompanyResultCard from '../ui/CompanyResultCard.jsx'
import Modal from '../ui/Modal.jsx'
import { track } from '../utils/analytics.js'
import { useNavigate } from 'react-router-dom'

const sidebarPresets = {
  partnership: [
    { value: '', label: 'All partnership types' },
    { value: 'Buyer', label: 'Buyer / Distributor' },
    { value: 'Supplier', label: 'Supplier / Vendor' },
    { value: 'Manufacturer', label: 'Manufacturer' },
    { value: 'Technology', label: 'Technology Partner' },
  ],
  industry: [
    { value: '', label: 'All industries' },
    { value: 'Automotive / EV Parts', label: 'Automotive / EV Parts (PoC)' },
    { value: 'IT / AI / SaaS', label: 'IT / AI / SaaS' },
    { value: 'Healthcare / Bio / Medical', label: 'Healthcare / Bio / Medical' },
    { value: 'Green Energy / Climate Tech / Smart City', label: 'Green Energy / Climate Tech / Smart City' },
    { value: 'Mobility / Automation / Manufacturing', label: 'Mobility / Automation / Manufacturing' },
    { value: 'Beauty / Consumer Goods / Food', label: 'Beauty / Consumer Goods / Food' },
    { value: 'Content / Culture / Edutech', label: 'Content / Culture / Edutech' },
    { value: 'Fintech / Smart Finance', label: 'Fintech / Smart Finance' },
    { value: 'Other', label: 'Other' },
  ],
  country: [
    { value: '', label: 'All countries' },
    { value: 'United States', label: 'United States' },
    { value: 'China', label: 'China' },
    { value: 'South Korea', label: 'South Korea' },
    { value: 'Japan', label: 'Japan' },
    { value: 'Germany', label: 'Germany' },
    { value: 'Singapore', label: 'Singapore' },
    { value: 'Vietnam', label: 'Vietnam' },
    { value: 'South Africa', label: 'South Africa' },
    { value: 'Other', label: 'Other' },
  ],
  size: [
    { value: '', label: 'Any size' },
    { value: '1-10', label: '1-10' },
    { value: '11-50', label: '11-50' },
    { value: '51-200', label: '51-200' },
    { value: '200+', label: '200+' },
  ],
}

const consultantServices = {
  'matching-assistant': 'Matching assistant',
  'regional-consulting': 'Regional expert consulting',
  'origin-support': 'Certificate of origin support',
  aftercare: 'Deal aftercare',
}

const consultantOptions = [
  { value: 'regional-consulting', label: '지역전문가 컨설팅 (Regional Expert)' },
  { value: 'trade-document', label: '무역서류 지원 (Trade Documents)' },
]

const PROD_API = 'https://backend-production-601f2.up.railway.app';
const API_BASE = import.meta?.env?.VITE_API_BASE || (import.meta.env.PROD ? PROD_API : 'http://localhost:4000');

const SEARCH_PROVIDER = 'antigravity'
const ANTIGRAVITY_BASE = API_BASE
const ANTIGRAVITY_KEY = import.meta.env.VITE_ANTIGRAVITY_KEY || ''

function formatCompanyLocation(company = {}) {
  const parts = []
  const loc = company.location

  if (company.city) parts.push(company.city)
  if (company.state) parts.push(company.state)
  if (company.country) parts.push(company.country)

  if (loc && typeof loc === 'object') {
    if (loc.city && !parts.includes(loc.city)) parts.push(loc.city)
    if (loc.state && !parts.includes(loc.state)) parts.push(loc.state)
    if (loc.country && !parts.includes(loc.country)) parts.push(loc.country)
    // Avoid pushing the entire object or undefined labels
    if (typeof loc.label === 'string') parts.push(loc.label)
  } else if (typeof loc === 'string') {
    parts.push(loc)
  }

  return parts.filter(Boolean).join(', ')
}

function extractWebsite(company = {}) {
  return company.website || company.url || company.site || company.domain || ''
}

function getAccuracyScore(company = {}) {
  const candidates = [
    company.matchAccuracy,
    company.accuracyScore,
    company.confidence,
    company.confidenceScore,
    company.score,
    company.matchScore,
    company.matchingScore,
    company.overallScore,
  ]
  const firstDefined = candidates.find((value) => value !== undefined && value !== null)
  const raw = Number(firstDefined)
  if (!Number.isFinite(raw)) return 82
  if (raw > 1) return Math.max(0, Math.min(100, Math.round(raw)))
  return Math.max(0, Math.min(100, Math.round(raw * 100)))
}

function buildMatchAnalysis(company = {}, t) {
  const sourceList = company.matchAnalysis || company.analysis || []
  if (Array.isArray(sourceList) && sourceList.length > 0) {
    return sourceList.map((item, index) => ({
      label: item.label || `${t('detail_analysis_generic')} ${index + 1}`,
      score:
        typeof item.score === 'number'
          ? item.score > 1
            ? Math.min(100, Math.max(0, Math.round(item.score)))
            : Math.min(100, Math.max(0, Math.round(item.score * 100)))
          : null,
      description: item.description || '',
    }))
  }
  const reasons = company.matchReasons || company.reasons || []
  if (Array.isArray(reasons) && reasons.length > 0) {
    return reasons.map((reason, index) => ({
      label: `${t('detail_analysis_generic')} ${index + 1}`,
      score: null,
      description: reason,
    }))
  }
  return []
}

function getMatchRecommendation(company = {}) {
  return company.matchRecommendation || company.aiRecommendation || company.recommendation || ''
}

function normalizeAntigravityCompany(item = {}) {
  const loc = item.location || {}
  const tags = item.tags || item.capabilities || item.offerings || []
  const reasons = item.analysis || item.reasons || item.matchAnalysis || []
  const rec = item.recommendation || item.summary || item.matchRecommendation || ''
  return {
    _id: item._id || item.id || item.companyId || item.externalId,
    name: item.name || item.companyName || '',
    industry: item.industry || item.vertical || '',
    country: item.country || loc.country || '',
    city: item.city || loc.city || '',
    state: item.state || loc.state || '',
    location: loc,
    tags,
    offerings: item.offerings,
    matchAccuracy:
      item.matchAccuracy || item.accuracyScore || item.score || item.matchScore || item.confidenceScore,
    matchAnalysis: Array.isArray(reasons) ? reasons : [],
    matchRecommendation: rec,
    website: item.website || item.url || item.site || '',
    sizeBucket: item.size || item.employeeCountRange || item.companySize,
    images: item.images || [],
    ai_reasoning: item.ai_reasoning || '',
    dart: item.dart, // Pass DART data through
  }
}

async function searchCodex(payload) {
  const res = await api.listCompanies(payload)
  return { provider: 'codex', data: res?.data || [] }
}

async function searchAntigravity(payload) {
  if (!ANTIGRAVITY_BASE) throw new Error('Antigravity base URL not configured')
  const base = ANTIGRAVITY_BASE.replace(/\/$/, '')

  // Pass q parameter correctly
  const qs = new URLSearchParams({ limit: '50', ...payload })
  if (payload.q) qs.set('q', payload.q);
  const headers = {};
  if (ANTIGRAVITY_KEY) headers['Authorization'] = `Bearer ${ANTIGRAVITY_KEY}`;
  headers['Bypass-Tunnel-Reminder'] = 'true';

  const response = await fetch(`${base}/partners/search?${qs.toString()}`, {
    headers,
  })
  if (!response.ok) {
    const message = response.statusText || 'Antigravity search failed'
    throw new Error(message)
  }
  const json = await response.json()
  console.log('[PartnerSearch] searchAntigravity raw json:', json);
  const raw = Array.isArray(json?.data) ? json.data : Array.isArray(json?.results) ? json.results : []
  const mapped = raw.map(normalizeAntigravityCompany).filter((c) => c._id && c.name)
  console.log('[PartnerSearch] mapped data:', mapped);
  return { provider: 'antigravity', data: mapped, aiResponse: json.aiResponse }
}

function mergeHybrid(codexResult = [], agResult = []) {
  const combined = []
  const seen = new Set()
  const pushUnique = (item) => {
    const key = item?._id || item?.name
    if (!key || seen.has(key)) return
    seen.add(key)
    combined.push(item)
  }
  agResult.forEach(pushUnique)
  codexResult.forEach(pushUnique)
  return combined
}

async function searchPartners(payload) {
  if (SEARCH_PROVIDER === 'antigravity') {
    return searchAntigravity(payload)
  }
  if (SEARCH_PROVIDER === 'hybrid') {
    try {
      const ag = await searchAntigravity(payload)
      const cx = await searchCodex(payload)
      return { provider: 'hybrid', data: mergeHybrid(cx.data, ag.data) }
    } catch (err) {
      const cx = await searchCodex(payload)
      return { provider: 'codex', data: cx.data, fallback: 'antigravity' }
    }
  }
  return searchCodex(payload)
}

function getCountryFlag(country) {
  if (!country) return '🌐'
  const c = country.toLowerCase()
  if (c.includes('vietnam') || c.includes('베트남')) return '🇻🇳'
  if (c.includes('chile') || c.includes('칠레')) return '🇨🇱'
  if (c.includes('panama') || c.includes('파나마')) return '🇵🇦'
  if (c.includes('poland') || c.includes('폴란드')) return '🇵🇱'
  if (c.includes('uae') || c.includes('아랍')) return '🇦🇪'
  if (c.includes('usa') || c.includes('미국') || c.includes('states')) return '🇺🇸'
  if (c.includes('germany') || c.includes('독일')) return '🇩🇪'
  if (c.includes('france') || c.includes('프랑스')) return '🇫🇷'
  if (c.includes('spain') || c.includes('스페인')) return '🇪🇸'
  if (c.includes('indonesia') || c.includes('인니')) return '🇮🇩'
  if (c.includes('thailand') || c.includes('태국')) return '🇹🇭'
  if (c.includes('korea') || c.includes('한국')) return '🇰🇷'
  if (c.includes('china') || c.includes('중국')) return '🇨🇳'
  if (c.includes('japan') || c.includes('일본')) return '🇯🇵'
  if (c.includes('brazil') || c.includes('브라질')) return '🇧🇷'
  if (c.includes('mexico') || c.includes('멕시코')) return '🇲🇽'
  if (c.includes('canada') || c.includes('캐나다')) return '🇨🇦'
  if (c.includes('oman') || c.includes('오만')) return '🇴🇲'
  if (c.includes('uzbekistan') || c.includes('우즈벡')) return '🇺🇿'
  if (c.includes('kazakhstan') || c.includes('카자흐')) return '🇰🇿'
  if (c.includes('kenya') || c.includes('케냐')) return '🇰🇪'
  if (c.includes('nigeria') || c.includes('나이지리아')) return '🇳🇬'
  if (c.includes('egypt') || c.includes('이집트')) return '🇪🇬'
  if (c.includes('morocco') || c.includes('모로코')) return '🇲🇦'
  if (c.includes('hungary') || c.includes('헝가리')) return '🇭🇺'
  if (c.includes('czech') || c.includes('체코')) return '🇨🇿'
  return '🌐'
}

export default function PartnerSearch() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [companyError, setCompanyError] = useState('')
  const [searchProviderUsed, setSearchProviderUsed] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 5

  const [filters, setFilters] = useState({ industry: '', country: '', size: '', partnership: '' })
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [feedback, setFeedback] = useState({ rating: 0, comments: '' })
  const [feedbackStatus, setFeedbackStatus] = useState({ submitting: false, submitted: false, error: '' })
  const [consultModal, setConsultModal] = useState(false)
  const [consultForm, setConsultForm] = useState({ name: '', email: '', details: '', serviceType: 'regional-consulting' })
  const [consultStatus, setConsultStatus] = useState({ submitting: false, success: false, error: '' })
  const [selectedService, setSelectedService] = useState(consultantOptions[0].value)

  const { t, lang } = useI18n()
  const hasRealResults = preview.length > 0
  const handleCompanyDetails = (company) => {
    setSelectedCompany(company)
    setFeedback({ rating: 0, comments: '' })
    setFeedbackStatus({ submitting: false, submitted: false, error: '' })
    track('partner_detail_opened', { companyId: company?._id, name: company?.name })
  }

  const closeCompanyDetails = () => {
    setSelectedCompany(null)
    setFeedback({ rating: 0, comments: '' })
    setFeedbackStatus({ submitting: false, submitted: false, error: '' })
  }
  const openConsultModal = (serviceType = 'matching-assistant') => {
    setConsultForm((prev) => ({ ...prev, serviceType }))
    setConsultStatus({ submitting: false, success: false, error: '' })
    setConsultModal(true)
  }
  const detailWebsite = selectedCompany ? extractWebsite(selectedCompany) : ''
  const detailLocation = selectedCompany ? formatCompanyLocation(selectedCompany) : ''
  const detailTags = selectedCompany ? selectedCompany.tags || selectedCompany.offerings || [] : []
  const overallConfidence = selectedCompany ? getAccuracyScore(selectedCompany) : null
  const analysisEntries = selectedCompany ? buildMatchAnalysis(selectedCompany, t) : []
  const recommendationText = selectedCompany ? getMatchRecommendation(selectedCompany) : ''
  const recommendationDisplay =
    selectedCompany && (recommendationText || t('detail_recommendation_placeholder'))
  const highlightCards = useMemo(() => {
    if (!selectedCompany) return []
    const fallback = t('detail_not_provided')
    const partnershipValue = (selectedCompany.tags || []).slice(0, 3).join(', ')
    const countryValue = selectedCompany.country || selectedCompany.location?.country || ''
    return [
      { id: 'industry', label: t('filter_industry'), value: selectedCompany.industry || fallback },
      { id: 'partnership', label: t('filter_partnership_type'), value: partnershipValue || fallback },
      { id: 'country', label: t('filter_country'), value: countryValue || fallback },
    ]
  }, [selectedCompany, t])
  const onSubmitFeedback = async (event) => {
    event.preventDefault()
    if (!selectedCompany || !feedback.rating) return
    setFeedbackStatus({ submitting: true, submitted: false, error: '' })
    try {
      await api.submitMatchFeedback(selectedCompany._id, {
        rating: feedback.rating,
        comments: feedback.comments.trim(),
        locale: lang,
        source: 'partner-search',
      })
      track('feedback_submitted', {
        companyId: selectedCompany?._id,
        rating: feedback.rating,
        hasComments: Boolean(feedback.comments?.trim()),
      })
      setFeedbackStatus({ submitting: false, submitted: true, error: '' })
    } catch (err) {
      setFeedbackStatus({
        submitting: false,
        submitted: false,
        error: err?.message || 'Failed to submit feedback',
      })
    }
  }

  async function loadPreview({ term = '', filters: filterValues = {} } = {}) {
    setLoadingCompanies(true)
    setCompanyError('')
    try {
      const sanitizedFilters = Object.fromEntries(
        Object.entries(filterValues || {}).filter(([, value]) => Boolean(value))
      )
      // Fetch more to handle client-side pagination for now, or implement server pagination later
      const payload = { q: term.trim(), limit: 50, ...sanitizedFilters }
      const { data, provider, fallback, aiResponse: aiMsg } = await searchPartners(payload)
      console.log('[PartnerSearch] searchPartners result:', { dataLength: data?.length, provider, fallback });
      setPreview(data || [])
      setAiResponse(aiMsg || '')
      setSearchProviderUsed(provider || SEARCH_PROVIDER)
      track('search_results_loaded', {
        provider: provider || SEARCH_PROVIDER,
        fallbackProvider: fallback,
        term: term.trim(),
        filters: sanitizedFilters,
        result_count: Array.isArray(data) ? data.length : 0,
      })
    } catch (err) {
      setCompanyError(err.message || 'Failed to load companies')
      setPreview([])
      setPage(1)
    } finally {
      setLoadingCompanies(false)
    }
  }

  useEffect(() => {
    // loadPreview() - Disabled auto-load to prevent 114s hang on initial access
  }, [])

  const filterConfig = useMemo(
    () => [
      { key: 'partnership', label: t('filter_partnership_type'), options: sidebarPresets.partnership },
      { key: 'industry', label: t('filter_industry'), options: sidebarPresets.industry },
      { key: 'country', label: t('filter_country'), options: sidebarPresets.country },
      { key: 'size', label: t('filter_company_size'), options: sidebarPresets.size },
    ],
    [t]
  )

  const activeFilters = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value))),
    [filters]
  )

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function resetFilters() {
    setFilters({ industry: '', country: '', size: '', partnership: '' })
  }

  function runSearch() {
    loadPreview({ term: search, filters })
    track('search_submitted', {
      term: search.trim(),
      filters: activeFilters,
      provider: searchProviderUsed || SEARCH_PROVIDER,
    })
  }

  async function handleConsultSubmit(event) {
    event.preventDefault()
    if (!consultForm.name.trim() || !consultForm.email.trim()) {
      setConsultStatus((prev) => ({ ...prev, error: 'Please enter your name and email.' }))
      return
    }
    setConsultStatus({ submitting: true, success: false, error: '' })
    const payload = {
      name: consultForm.name.trim(),
      email: consultForm.email.trim(),
      details: consultForm.details.trim(),
      serviceType: consultForm.serviceType || 'matching-assistant',
      locale: lang,
      source: 'partner-search',
      searchTerm: search.trim(),
      filters: activeFilters,
    }
    try {
      await api.createConsultantRequest(payload)
      track('consultant_help_submit', {
        serviceType: payload.serviceType,
        hasDetails: Boolean(payload.details),
      })
      setConsultStatus({ submitting: false, success: true, error: '' })
    } catch (error) {
      const detailMessage =
        Array.isArray(error?.details) && error.details.length > 0
          ? error.details.map((detail) => detail.message).join(', ')
          : ''
      setConsultStatus({
        submitting: false,
        success: false,
        error: detailMessage || error.message || 'Could not submit the request. Please try again.',
      })
    }
  }

  const displayCompanies = preview.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const totalPages = Math.ceil(preview.length / ITEMS_PER_PAGE)

  return (
    <div className="partner-layout">
      <aside className="search-sidebar" aria-label="Search filters">
        <div>
          <h2
            className="sidebar-title"
            style={lang === 'ko' ? { fontSize: '1.05rem', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden' } : undefined}
            title={t('sidebar_title')}
          >
            {t('sidebar_title')}
          </h2>
          <p className="muted small">{t('sidebar_description')}</p>
        </div>

        <div className="filter-stack">
          {filterConfig.map((filter) => (
            <label className="filter-group" key={filter.key}>
              <span>{filter.label}</span>
              <select value={filters[filter.key]} onChange={(e) => handleFilterChange(filter.key, e.target.value)}>
                {filter.options.map((option) => (
                  <option value={option.value} key={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="sidebar-actions">
          <Button onClick={runSearch} loading={loadingCompanies}>
            {t('apply_filters')}
          </Button>
          <button type="button" className="link-btn" onClick={resetFilters}>
            {t('reset_filters')}
          </button>
        </div>
      </aside>

      <section className="search-content">
        <section className="card hero" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h1 style={lang === 'ko' ? { fontSize: '1.6rem', lineHeight: 1.3, marginBottom: '1rem', wordBreak: 'keep-all' } : { fontSize: '2rem', marginBottom: '1rem' }}>
            {t('dashboard_title')}
          </h1>
          <p style={lang === 'ko' ? { fontSize: '0.9rem', lineHeight: 1.4, marginBottom: '2rem', color: '#FFFFFF', wordBreak: 'keep-all' } : { fontSize: '0.9rem', marginBottom: '2rem', color: '#FFFFFF' }}>
            {t('dashboard_subtitle')}
          </p>
          <div className="search-bar-container" style={{ display: 'flex', alignItems: 'center' }}>
            <div className="search-agent-pill">
              <div className="search-agent-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                  <rect width="16" height="12" x="4" y="8" rx="2" />
                  <path d="M12 8V4H8" />
                  <path d="M9 13h.01" />
                  <path d="M15 13h.01" />
                  <path d="M10 17h4" />
                </svg>
                <span className="search-agent-pulse"></span>
              </div>
              <span className="search-agent-text">
                {lang === 'ko' ? '비즈 파트너 발굴 Agent' : 'B2B Matching Agent'}
              </span>
            </div>
            <textarea
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${e.target.scrollHeight}px`
              }}
              placeholder={
                t('search_placeholder') ||
                '예시 : K-뷰티 상품을 베트남으로 수출하고 싶어. 베트남의 뷰티상품 수입업체 또는 디스트리뷰터를 추천해 줘'
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  runSearch()
                }
              }}
              className="search-textarea"
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            />
            <button
              onClick={runSearch}
              className="search-submit-btn"
            >
              {t('search_button')}
            </button>
          </div>
        </section>

        <section className="card agent-status-board glass" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1.5rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
          <div className="board-header" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(226, 232, 240, 0.6)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🤖</span>
              <strong style={{ fontSize: '15px', color: 'var(--fg)', fontWeight: 800 }}>
                {lang === 'ko' ? 'K-Statra 실시간 AI Agent 작동 현황' : 'K-Statra Real-time AI Agent Status'}
              </strong>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 800, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="search-agent-pulse" style={{ position: 'static', display: 'inline-block', width: '6px', height: '6px' }}></span>
              SYSTEM ONLINE
            </span>
          </div>

          {/* 에이전트 1: AX 데이터 수집 */}
          <div 
            className="board-agent-card" 
            onClick={() => navigate('/companies')}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div className="search-agent-avatar" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', width: '32px', height: '32px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'block' }}>
                  <path d="M4 4h16v16H4z" />
                  <path d="M8 8h8" />
                  <path d="M8 12h8" />
                  <path d="M8 16h5" />
                </svg>
                <span className="search-agent-pulse"></span>
              </div>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--fg)' }}>
                {lang === 'ko' ? 'AX 데이터 수집 Agent' : 'AX Data Collection Agent'}
              </h4>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: '11px', lineHeight: 1.4 }}>
              {lang === 'ko' 
                ? '전시회 참가기업의 브로셔·웹사이트·디렉토리 정보를 수집해 AX 기업 프로필 기초 데이터를 준비합니다.'
                : 'Collects exhibitor brochures, websites, and directory data to prepare AX company profiles.'}
            </p>
          </div>

          {/* 에이전트 2: 파트너 발굴 */}
          <div 
            className="board-agent-card" 
            onClick={() => {
              const textarea = document.querySelector('.search-textarea');
              if (textarea) {
                textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                textarea.focus();
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div className="search-agent-avatar" style={{ background: 'var(--accent-gradient)', width: '32px', height: '32px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'block' }}>
                  <rect width="16" height="12" x="4" y="8" rx="2" />
                  <path d="M12 8V4H8" />
                  <path d="M9 13h.01" />
                  <path d="M15 13h.01" />
                  <path d="M10 17h4" />
                </svg>
                <span className="search-agent-pulse"></span>
              </div>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--fg)' }}>
                {lang === 'ko' ? '비즈 파트너 발굴 Agent' : 'Partner Discovery Agent'}
              </h4>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: '11px', lineHeight: 1.4 }}>
              {lang === 'ko' 
                ? '사용자의 비즈니스 니즈를 정밀 분석하여 적합한 글로벌 바이어/공급망 파트너를 실시간 탐색합니다.'
                : 'Analyzes business needs to discover optimal global buyers and supply-chain partners in real time.'}
            </p>
          </div>

          {/* 에이전트 3: 밋업 조율 */}
          <div 
            className="board-agent-card" 
            onClick={() => navigate('/schedule')}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div className="search-agent-avatar" style={{ background: 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)', width: '32px', height: '32px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'block' }}>
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="search-agent-pulse"></span>
              </div>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--fg)' }}>
                {lang === 'ko' ? '1:1 글로벌 밋업 조율 Agent' : 'Meetup Coordinator Agent'}
              </h4>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: '11px', lineHeight: 1.4 }}>
              {lang === 'ko' 
                ? '매칭된 기업들과의 온라인 영상 미팅 스케줄링 및 글로벌 오프라인 전시회 부스 조율을 대행합니다.'
                : 'Coordinates online video meetings and offline global exhibition booth schedules with matched partners.'}
            </p>
          </div>

          {/* 에이전트 4: 스마트 결제 */}
          <div 
            className="board-agent-card" 
            onClick={() => navigate('/payments')}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div className="search-agent-avatar" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', width: '32px', height: '32px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'block' }}>
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                <span className="search-agent-pulse"></span>
              </div>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--fg)' }}>
                {lang === 'ko' ? '스마트계약 결제 Agent' : 'Smart Payment Agent'}
              </h4>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: '11px', lineHeight: 1.4 }}>
              {lang === 'ko' 
                ? '국경 없는 신속하고 안전한 원스톱 무역대금 송금 및 스마트 지갑 간편 결제를 관리합니다.'
                : 'Manages seamless and secure cross-border trade payments and smart contract settlements.'}
            </p>
          </div>
        </section>

        <section className="card results-panel">
          <div className="results-header">
            <div>
              <p className="muted small">{t('search_results_title')}</p>
              <div className="results-count" aria-live="polite">
                <span className="results-count-number">{displayCompanies.length}</span>
                <span className="results-count-label">{t('search_results_label')}</span>
              </div>
            </div>
          </div>
          {companyError && (
            <div className="error mt-2" role="alert">
              {companyError}
            </div>
          )}
          {!companyError && !loadingCompanies && displayCompanies.length === 0 && (
            <div className="muted mt-3" role="status">
              {t('quick_lookup_empty')}
            </div>
          )}
          {aiResponse && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#166534', fontWeight: 'bold' }}>
                <span>✨</span> AI Insight
              </div>
              <div style={{ color: '#166534', lineHeight: '1.6' }}>
                {aiResponse}
              </div>
            </div>
          )}

          <div className="results-grid">
            {displayCompanies.map((company) => (
              <div 
                key={company._id} 
                className="result-card"
                onClick={() => setSelectedCompany(company)}
                style={{ cursor: 'pointer' }}
              >
                <div className="result-hero" style={{ 
                  height: '52px', 
                  background: 'var(--accent-gradient)', 
                  color: 'white', 
                  display: 'flex', 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '0 20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '800', letterSpacing: '0.05em', opacity: 0.95 }}>
                    <span style={{ fontSize: '17px' }}>{getCountryFlag(company.country)}</span>
                    <span>{company.country?.toUpperCase() || 'GLOBAL'}</span>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '700', opacity: 0.85, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{company.industry?.substring(0, 20) || 'PARTNER'}</div>
                </div>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--fg)', lineHeight: 1.3, fontWeight: 700 }}>{company.name}</h3>
                    {company.dart && company.dart.corpCode && (
                      <span className="badge" style={{ background: '#e8f5e9', color: '#2e7d32', borderColor: '#c8e6c9', fontWeight: 600 }}>DART</span>
                    )}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--fg-secondary)', lineHeight: 1.5, minHeight: '42px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {company.profileText || company.description || formatCompanyLocation(company) || t('no_info')}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>MATCH</span> {getAccuracyScore(company)}%
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--fg-secondary)', fontWeight: 600 }}>{t('view_details') || 'VIEW'} &rarr;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {preview.length > ITEMS_PER_PAGE && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: page === 1 ? '#f3f4f6' : 'white', color: page === 1 ? '#9ca3af' : '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                ← Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: page === totalPages ? '#f3f4f6' : 'white', color: page === totalPages ? '#9ca3af' : '#374151', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next →
              </button>
            </div>
          )}
        </section>





        <section className="card consultant-card" style={{ marginTop: '2rem', padding: '2.5rem 2rem' }}>
          {/* Header area */}
          <div className="page-agent-header" style={{ marginBottom: '12px' }}>
            <div className="search-agent-avatar" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', width: '28px', height: '28px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <span className="search-agent-pulse"></span>
            </div>
            <span className="page-agent-badge-text">
              {lang === 'ko' ? '글로벌 비즈니스 컨설턴트 Agent' : 'Global Biz Consultant Agent'}
            </span>
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '0.5rem', marginTop: 0 }}>
            {lang === 'ko' ? 'Global Biz Consultant의 도움이 필요하신가요?' : 'Need help from a Global Biz Consultant?'}
          </h3>
          <p className="muted" style={{ fontSize: '13.5px', marginBottom: '1.75rem', maxWidth: '800px', lineHeight: 1.5 }}>
            {lang === 'ko'
              ? '원하시는 무역 솔루션 서비스를 클릭하여 K-Statra의 현지 전문가 및 인공지능 컨설턴트에게 실시간 도움을 요청하세요.'
              : 'Click on the trade solution service you need to request real-time help from K-Statra\'s local experts and AI consultants.'}
          </p>

          {/* Premium Service Cards Grid */}
          <div className="consultant-services-grid">
            
            {/* Card 1: Regional Expert */}
            <div 
              className="consultant-service-card"
              onClick={() => {
                track('consultant_service_click', { service: 'regional-consulting' })
                openConsultModal('regional-consulting')
              }}
            >
              <div className="consultant-service-icon">🌍</div>
              <div className="consultant-service-body">
                <h4>{lang === 'ko' ? '지역전문가 컨설팅' : 'Regional Expert Consulting'}</h4>
                <span className="consultant-service-subtitle">Regional Expert</span>
                <p>
                  {lang === 'ko'
                    ? '글로벌 무역 전문가가 타겟 국가(미국, 유럽, 아시아 등)의 현지 시장 규제와 진입 장벽 분석을 맞춤 지원합니다.'
                    : 'Get custom support from global trade experts analyzing local market regulations and entry barriers for target countries.'}
                </p>
                <span className="consultant-service-action">
                  {lang === 'ko' ? '상담 신청하기 ➔' : 'Request Consultation ➔'}
                </span>
              </div>
            </div>

            {/* Card 2: Trade Documents */}
            <div 
              className="consultant-service-card"
              onClick={() => {
                track('consultant_service_click', { service: 'trade-document' })
                openConsultModal('trade-document')
              }}
            >
              <div className="consultant-service-icon">📄</div>
              <div className="consultant-service-body">
                <h4>{lang === 'ko' ? '무역서류 지원' : 'Trade Documents Helper'}</h4>
                <span className="consultant-service-subtitle">Trade Documents</span>
                <p>
                  {lang === 'ko'
                    ? 'FTA 원산지 증명서(C/O), 관세 혜택 증빙 및 NDA 등 복잡한 무역 실무 서류 작성을 AI Agent와 전문가가 완벽히 보조합니다.'
                    : 'AI agents and experts assist in preparing complex trade documentation such as FTA Certificate of Origin (C/O), tariff benefits, and NDAs.'}
                </p>
                <span className="consultant-service-action">
                  {lang === 'ko' ? '도움 요청하기 ➔' : 'Request Assistance ➔'}
                </span>
              </div>
            </div>

          </div>
        </section>

        <Modal
          open={!!selectedCompany}
          onClose={closeCompanyDetails}
          title={selectedCompany?.name || t('company_placeholder_name')}
          footer={
            <Button variant="secondary" onClick={closeCompanyDetails}>
              {t('close')}
            </Button>
          }
        >
          {selectedCompany && (
            <div className="company-detail">
              <div className="muted small" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span>{selectedCompany.industry || t('detail_industry_placeholder')}</span>

                {/* DART Badge */}
                {selectedCompany.dart && selectedCompany.dart.corpCode && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.2rem 0.5rem',
                    backgroundColor: '#f0fdf4', // green-50
                    color: '#15803d', // green-700
                    border: '1px solid #bbf7d0', // green-200
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    gap: '0.25rem'
                  }} title={t('dart_verified_desc') || 'Listed in Korean DART System'}>
                    <span>✓</span> {t('dart_listed') || 'DART 공시기업'}
                  </span>
                )}

                {/* AI Badge */}
                {(selectedCompany.ai_reasoning || (selectedCompany.matchRecommendation && !selectedCompany.matchRecommendation.includes('No specific'))) && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.2rem 0.5rem',
                    backgroundColor: '#eef2ff', // indigo-50
                    color: '#4338ca', // indigo-700
                    border: '1px solid #c7d2fe', // indigo-200
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    gap: '0.25rem'
                  }}>
                    <span>✨</span> {t('ai_pick') || 'AI Pick'}
                  </span>
                )}
              </div>
              <section className="detail-section">
                <h4>{t('detail_company_info')}</h4>
                <div className="detail-line">
                  <strong>{t('detail_location')}</strong>
                  <span>{detailLocation || t('detail_not_provided')}</span>
                </div>
                {selectedCompany.sizeBucket && (
                  <div className="detail-line">
                    <strong>{t('filter_company_size')}</strong>
                    <span>{selectedCompany.sizeBucket}</span>
                  </div>
                )}
                {detailWebsite && (
                  <div className="detail-line">
                    <strong>{t('detail_website')}</strong>
                    <a className="result-link" href={detailWebsite} target="_blank" rel="noreferrer">
                      {detailWebsite}
                    </a>
                  </div>
                )}
              </section>

              {highlightCards.length > 0 && (
                <section className="detail-section">
                  <h4>{t('detail_recommendation')}</h4>
                  <p className="muted small" style={{ marginBottom: '0.5rem' }}>
                    {lang === 'ko'
                      ? 'AI가 중요하게 본 상위 속성입니다.'
                      : 'Top attributes surfaced by the AI scoring model.'}
                  </p>
                  <div className="highlight-grid">
                    {highlightCards.map((item) => (
                      <div key={item.id} className="highlight-card">
                        <div className="muted small">{item.label}</div>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {detailTags.length > 0 && (
                <section className="detail-section">
                  <h4>{t('detail_products_services')}</h4>
                  <div className="detail-tags">
                    {detailTags.map((tag) => (
                      <span key={tag} className="result-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}
              {/* --- New Sections Start --- */}
              {selectedCompany.dart && (
                <section className="detail-section">
                  <h4>{t('detail_financials') || '재무 정보 (Financials)'}</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                          <th style={{ padding: '0.5rem' }}>Category</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Consolidated (연결)</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Separate (별도)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.5rem' }}>Revenue (매출액)</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>{selectedCompany.dart.revenueConsolidated?.toLocaleString() || '-'}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>{selectedCompany.dart.revenueSeparate?.toLocaleString() || '-'}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.5rem' }}>Op. Profit (영업이익)</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', color: selectedCompany.dart.operatingProfitConsolidated > 0 ? '#059669' : '#dc2626' }}>
                            {selectedCompany.dart.operatingProfitConsolidated?.toLocaleString() || '-'}
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', color: selectedCompany.dart.operatingProfitSeparate > 0 ? '#059669' : '#dc2626' }}>
                            {selectedCompany.dart.operatingProfitSeparate?.toLocaleString() || '-'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.5rem' }}>Net Income (당기순이익)</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{selectedCompany.dart.netIncomeConsolidated?.toLocaleString() || '-'}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{selectedCompany.dart.netIncomeSeparate?.toLocaleString() || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', textAlign: 'right' }}>
                    Source: {selectedCompany.dart.source} ({selectedCompany.dart.fiscalYear})
                  </div>
                </section>
              )}

              {selectedCompany.activities && selectedCompany.activities.length > 0 && (
                <section className="detail-section">
                  <h4>{t('detail_activities') || '주요 활동 (Activities)'}</h4>
                  <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                    {selectedCompany.activities.map((act, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                        <strong>[{act.type.toUpperCase()}]</strong> {act.description}
                        {act.date && <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>({new Date(act.date).toLocaleDateString()})</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {selectedCompany.products && selectedCompany.products.length > 0 && (
                <section className="detail-section">
                  <h4>{t('detail_products') || '제품 정보 (Products)'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                    {selectedCompany.products.map((prod, idx) => (
                      <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem' }}>
                        {prod.imageUrl && <img src={prod.imageUrl} alt={prod.name} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.25rem' }} />}
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{prod.name}</div>
                        {prod.description && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{prod.description}</div>}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {/* --- New Sections End --- */}

              {analysisEntries.length > 0 && (
                <section className="detail-section matching-analysis">
                  <h4>{t('detail_matching_analysis')}</h4>
                  {overallConfidence !== null && (
                    <div className="analysis-row overall">
                      <div className="row space">
                        <strong>{t('detail_overall_score')}</strong>
                        <span>{overallConfidence}%</span>
                      </div>
                      <div className="analysis-meter" aria-hidden="true">
                        <span className="analysis-meter-fill" style={{ width: `${overallConfidence}%` }} />
                      </div>
                    </div>
                  )}
                  <ul
                    className="detail-list"
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: 0, listStyle: 'none' }}
                  >
                    {analysisEntries.map((entry, index) => (
                      <li
                        key={index}
                        className="analysis-item"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          padding: '0.85rem 1rem',
                          borderRadius: '12px',
                          border: '1px solid #e5e7eb',
                          background: '#fff',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <strong style={{ display: 'block', marginBottom: entry.description ? '0.25rem' : 0 }}>
                            {entry.label}
                          </strong>
                          {entry.description && <p className="muted small">{entry.description}</p>}
                        </div>
                        {entry.score !== null && (
                          <span
                            className="analysis-score-pill"
                            style={{
                              minWidth: 58,
                              textAlign: 'center',
                              fontWeight: 600,
                              color: '#1d4ed8',
                              background: '#e0e7ff',
                              borderRadius: '999px',
                              padding: '0.35rem 0.75rem',
                            }}
                          >
                            {entry.score}%
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {recommendationDisplay && (
                <section className="recommendation-card">
                  <h4>{t('detail_recommendation')}</h4>
                  <p>{recommendationDisplay}</p>
                </section>
              )}

              {selectedCompany && (
                <section className="detail-section">
                  <h4>{t('detail_feedback_title')}</h4>
                  <div className="rating-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        className="rating-star"
                        onClick={() => {
                          setFeedback((prev) => ({ ...prev, rating: score }))
                          setFeedbackStatus((prev) => ({ ...prev, submitted: false, error: '' }))
                        }}
                        aria-label={`${score} ${t('detail_feedback_rating_star')}`}
                        style={{
                          fontSize: '1.4rem',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: score <= feedback.rating ? '#fbbf24' : '#d1d5db',
                        }}
                      >
                        <span aria-hidden="true">{'\u2605'}</span>
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="feedback-textarea"
                    placeholder={t('detail_feedback_placeholder')}
                    value={feedback.comments}
                    onChange={(event) => {
                      setFeedback((prev) => ({ ...prev, comments: event.target.value }))
                      setFeedbackStatus((prev) => ({ ...prev, submitted: false, error: '' }))
                    }}
                    rows={3}
                    disabled={feedbackStatus.submitting}
                  />
                  {feedbackStatus.error && (
                    <div className="error" role="alert" style={{ marginTop: '0.5rem' }}>
                      {feedbackStatus.error}
                    </div>
                  )}
                  <div className="row space" style={{ marginTop: '8px' }}>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onSubmitFeedback}
                      disabled={!feedback.rating}
                      loading={feedbackStatus.submitting}
                    >
                      {t('detail_feedback_submit')}
                    </Button>
                    {feedbackStatus.submitted && (
                      <span className="muted small">{t('detail_feedback_prompt')}</span>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </Modal>
      </section>

      <Modal
        open={consultModal}
        onClose={() => {
          setConsultModal(false)
          setConsultStatus({ submitting: false, success: false, error: '' })
        }}
        title={
          consultantOptions.find((opt) => opt.value === consultForm.serviceType)?.label ||
          t('assistant_modal_title')
        }
        footer={
          <Button
            variant="secondary"
            onClick={() => {
              setConsultModal(false)
              setConsultStatus({ submitting: false, success: false, error: '' })
            }}
          >
            {t('assistant_modal_close')}
          </Button>
        }
      >
        <form className="consultant-form" onSubmit={handleConsultSubmit}>
          <label className="filter-group">
            <span>{t('assistant_modal_name')}</span>
            <input
              value={consultForm.name}
              onChange={(event) => setConsultForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={t('assistant_modal_name')}
              disabled={consultStatus.submitting}
            />
          </label>
          <label className="filter-group">
            <span>{t('assistant_modal_email')}</span>
            <input
              type="email"
              value={consultForm.email}
              onChange={(event) => setConsultForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder={t('assistant_modal_email')}
              disabled={consultStatus.submitting}
            />
          </label>
          <label className="filter-group">
            <span>{t('assistant_modal_details')}</span>
            <textarea
              value={consultForm.details}
              placeholder={t('assistant_modal_details_placeholder')}
              onChange={(event) => setConsultForm((prev) => ({ ...prev, details: event.target.value }))}
              disabled={consultStatus.submitting}
            />
          </label>
          {consultStatus.error && (
            <div className="error" role="alert">
              {consultStatus.error}
            </div>
          )}
          {consultStatus.success && <p className="success small">{t('assistant_modal_success')}</p>}
          <Button type="submit" loading={consultStatus.submitting}>
            {t('assistant_modal_submit')}
          </Button>
        </form>
      </Modal>
    </div>
  )
}

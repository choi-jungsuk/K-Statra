import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { api } from '../api.js'
import { track } from '../utils/analytics.js'

const statSeed = [
    { id: 'totalPartners', labelKey: 'analytics_total_partners', value: '24', change: '+12%', icon: '👥', tone: 'primary' },
    { id: 'activeDeals', labelKey: 'analytics_active_deals', value: '12', change: '+8%', icon: '🎯', tone: 'warning' },
    { id: 'pendingPayments', labelKey: 'payments_pending', value: '8', change: '-2%', icon: '⏳', tone: 'info' },
    { id: 'completedDeals', labelKey: 'payments_completed', value: '37', change: '+5%', icon: '📈', tone: 'success' },
]

const recentRequestsSeed = [
    { id: 1, company: 'TechFlow Solutions', type: 'Joint Venture', time: '2 hours ago', status: 'Pending' },
    { id: 2, company: 'Global Innovators', type: 'Supplier', time: '5 hours ago', status: 'Under Review' },
    { id: 3, company: 'Smart Manufacturing Co.', type: 'Distributor', time: '1 day ago', status: 'Approved' },
]

const industriesSeed = [
    { rank: 1, name: 'K-Beauty', partners: 8, revenue: '$3,200,000', change: '+15%' },
    { rank: 2, name: 'Robotics', partners: 5, revenue: '$2,800,000', change: '+22%' },
    { rank: 3, name: 'Bio Medical', partners: 4, revenue: '$2,100,000', change: '+8%' },
]

const activitiesSeed = [
    { id: 1, text: 'New partnership established', detail: 'EcoMobility Partners • 2 hours ago', status: 'success' },
    { id: 2, text: 'Contract renewal completed', detail: 'BeautyTech Korea • 1 day ago', status: 'neutral' },
    { id: 3, text: 'Negotiation in progress', detail: 'TechFlow Solutions • 2 days ago', status: 'warning' },
]

export default function Overview() {
    const { t, lang } = useI18n()
    const navigate = useNavigate()
    const [stats, setStats] = useState(statSeed)
    const [industries, setIndustries] = useState(industriesSeed)
    const [transactions, setTransactions] = useState([])
    const [requests, setRequests] = useState(recentRequestsSeed)

    useEffect(() => {
        let mounted = true

        // Fetch Dashboard Stats
        api.analyticsDashboard().then((data) => {
            if (!mounted || !data) return
            setStats((prev) =>
                prev.map((card) => ({
                    ...card,
                    value: String(data[card.id] ?? card.value),
                }))
            )
        })

        // Fetch Top Industries
        api.analyticsTopIndustries().then((data) => {
            if (!mounted || !Array.isArray(data) || data.length === 0) return
            setIndustries(
                data.slice(0, 4).map((item, index) => ({
                    rank: index + 1,
                    name: item.name,
                    partners: item.partners,
                    revenue: item.revenue ? `$${Number(item.revenue).toLocaleString()}` : '$-',
                    change: '',
                }))
            )
        })

        // Fetch Recent Transactions
        api.analyticsRecentTransactions().then((data) => {
            if (!mounted || !Array.isArray(data)) return
            setTransactions(
                data.slice(0, 5).map((item) => ({
                    id: item._id || item.id,
                    company: item.companyId?.name || item.company || 'Unknown Partner',
                    description: item.memo || item.description || 'XRP Escrow Settlement',
                    date: item.createdAt ? new Date(item.createdAt).toLocaleString() : '',
                    amount: `${item.amount >= 0 ? '+' : '-'}$${Math.abs(item.amount || 0).toLocaleString()}`,
                    xrpl: `${(item.amount * 1.7 || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP`,
                    status: item.status?.toLowerCase() === 'paid' ? 'completed' : item.status?.toLowerCase() || 'completed',
                }))
            )
        })

        return () => {
            mounted = false
        }
    }, [])

    // Compute relative progress bar percentage based on partner count
    const maxPartnerCount = Math.max(...industries.map(ind => ind.partners || 1), 1)

    // Map industry color themes
    const getIndustryClass = (name = '') => {
        const lower = name.toLowerCase()
        if (lower.includes('beauty')) return 'kbeauty'
        if (lower.includes('robot')) return 'robotics'
        if (lower.includes('bio') || lower.includes('medi')) return 'biomedical'
        return 'general'
    }

    return (
        <div className="overview container" style={{ padding: '2rem 1rem' }}>
            
            {/* 1. Header with dynamic actions */}
            <div className="dashboard-header row space" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontWeight: 900, fontSize: '32px', letterSpacing: '-0.5px' }}>
                        {t('overview_title_heading')}
                    </h1>
                    <p className="muted" style={{ fontSize: '14.5px', marginTop: '4px' }}>
                        {t('overview_subheading')}
                    </p>
                </div>
                <div className="row gap-2">
                    <Button variant="secondary" onClick={() => navigate('/search')} style={{ borderRadius: '999px', fontSize: '13px' }}>
                        🔍 {lang === 'ko' ? '바이어 검색' : 'Search Buyers'}
                    </Button>
                    <Button onClick={() => track('overview_generate_report')} style={{ borderRadius: '999px', fontSize: '13px' }}>
                        📊 {t('dashboard_generate_report')}
                    </Button>
                </div>
            </div>

            {/* 2. LIVE AI AGENT COMMAND CENTER BANNER */}
            <div className="command-center-banner">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div className="page-agent-header" style={{ marginBottom: '6px' }}>
                            <div className="search-agent-avatar" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)', width: '26px', height: '26px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                                    <path d="M12 2a10 10 0 0 0-10 10v7a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-7a10 10 0 0 0-10-10Z" />
                                    <circle cx="12" cy="13" r="3" />
                                </svg>
                                <span className="search-agent-pulse"></span>
                            </div>
                            <span className="page-agent-badge-text">
                                {lang === 'ko' ? 'DemoStatra AI Agent 지휘 본부' : 'DemoStatra AI Command Center'}
                            </span>
                        </div>
                        <h4 style={{ margin: '6px 0 0 0', fontWeight: 800, fontSize: '15px' }}>
                            {lang === 'ko' ? '5대 특화 AI Agent 실시간 작동 정보' : '5 Specialized AI Agents Live Status'}
                        </h4>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '999px' }}>
                        ONLINE 🟢
                    </span>
                </div>

                <div className="command-center-grid">
                    
                    <div className="command-center-card">
                        <div className="command-center-card-header">
                            <h5>{lang === 'ko' ? 'AX 데이터 수집 Agent' : 'AX Data Collector'}</h5>
                            <span className="command-center-status" style={{ color: '#F59E0B' }}>READY 🟡</span>
                        </div>
                        <p>{lang === 'ko' ? '전시회 참가기업 브로셔·웹사이트·디렉토리 수집 준비 중' : 'Collecting exhibitor brochures, websites, and directories'}</p>
                    </div>

                    <div className="command-center-card">
                        <div className="command-center-card-header">
                            <h5>{lang === 'ko' ? '바이어 발굴 Agent' : 'Buyer Discovery'}</h5>
                            <span className="command-center-status">STANDBY 🟢</span>
                        </div>
                        <p>{lang === 'ko' ? '26,347개 무역 기업 원장 분석 완료' : '26,347 global companies indexed'}</p>
                    </div>

                    <div className="command-center-card">
                        <div className="command-center-card-header">
                            <h5>{lang === 'ko' ? '1:1 밋업 조율 Agent' : 'Meetup Coordinator'}</h5>
                            <span className="command-center-status" style={{ color: '#4F46E5' }}>ACTIVE 🔵</span>
                        </div>
                        <p>{lang === 'ko' ? 'KOAA SHOW 2026 PoC 매핑 중' : 'KOAA SHOW 2026 PoC Live'}</p>
                    </div>

                    <div className="command-center-card">
                        <div className="command-center-card-header">
                            <h5>{lang === 'ko' ? '스마트계약 결제 Agent' : 'XRP Escrow Agent'}</h5>
                            <span className="command-center-status">READY 🟢</span>
                        </div>
                        <p>{lang === 'ko' ? 'XRPL 공식 테스트넷 조회 성공' : 'XRPL Testnet connected'}</p>
                    </div>

                    <div className="command-center-card">
                        <div className="command-center-card-header">
                            <h5>{lang === 'ko' ? '비즈 컨설턴트 Agent' : 'Biz Consultant'}</h5>
                            <span className="command-center-status">READY 🟢</span>
                        </div>
                        <p>{lang === 'ko' ? '2대 전문 비즈 서비스 대기 중' : '2 Core services standing by'}</p>
                    </div>

                </div>
            </div>

            {/* 3. Top HSL Glassmorphic Stats Grid */}
            <section className="stat-grid">
                {stats.map((card) => (
                    <article key={card.id} className={`stat-card ${card.tone}`}>
                        <div className="stat-icon" aria-hidden="true" style={{ fontSize: '20px' }}>
                            {card.icon}
                        </div>
                        <div className="stat-content">
                            <p className="muted small" style={{ fontWeight: 700, margin: 0 }}>{t(card.labelKey)}</p>
                            <strong style={{ fontSize: '24px', display: 'block', margin: '4px 0', color: 'var(--fg)' }}>
                                {card.value}
                            </strong>
                            <span className="muted tiny" style={{ fontSize: '11px', fontWeight: 800 }}>{card.change}</span>
                        </div>
                    </article>
                ))}
            </section>

            {/* 4. Middle Section: Split View Panels */}
            <section className="dashboard-panels" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                
                {/* Left: Market Insights with horizontal bar chart */}
                <div className="booking-form-wrapper glass" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '0.25rem', marginTop: 0 }}>
                        {t('analytics_top_industries')}
                    </h3>
                    <p style={{ margin: '0 0 1.5rem 0', fontSize: '12px', color: 'var(--fg-secondary)' }}>
                        {lang === 'ko' ? 'DemoStatra 글로벌 기업들의 거래 실적 상위 업종 통계입니다.' : 'Top industrial sectors by global partnership volume.'}
                    </p>
                    
                    <ul className="industry-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: 0, listStyle: 'none' }}>
                        {industries.map((industry) => {
                            const pct = Math.max((industry.partners / maxPartnerCount) * 100, 15)
                            const fillClass = getIndustryClass(industry.name)
                            return (
                                <li key={industry.rank} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        background: '#f1f5f9',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifycontent: 'center',
                                        fontWeight: 800,
                                        fontSize: '12px',
                                        color: 'var(--fg-secondary)',
                                        flexShrink: 0
                                    }}>
                                        {industry.rank}
                                    </div>
                                    
                                    <div className="industry-bar-wrapper">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                            <strong style={{ color: 'var(--fg)' }}>{industry.name}</strong>
                                            <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{industry.revenue}</span>
                                        </div>
                                        
                                        <div className="industry-bar-track">
                                            <div 
                                                className={`industry-bar-fill ${fillClass}`} 
                                                style={{ width: `${pct}%` }}
                                            ></div>
                                        </div>
                                        
                                        <div className="muted tiny" style={{ fontSize: '11px', textAlign: 'left', marginTop: '2px' }}>
                                            {industry.partners} {t('analytics_partners')}
                                        </div>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </div>

                {/* Right: My Business Matching Request list */}
                <div className="booking-form-wrapper glass" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '0.25rem', marginTop: 0 }}>
                        {t('dashboard_recent_requests')}
                    </h3>
                    <p style={{ margin: '0 0 1.5rem 0', fontSize: '12px', color: 'var(--fg-secondary)' }}>
                        {lang === 'ko' ? '바이어 매칭 요청 및 스케줄 확정 실시간 진행 상황입니다.' : 'Live request timeline for B2B matchmaking.'}
                    </p>
                    
                    <ul className="request-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: 0, listStyle: 'none' }}>
                        {requests.map((item) => (
                            <li key={item.id} className="request-timeline-item">
                                <div>
                                    <strong style={{ fontSize: '13.5px', color: 'var(--fg)' }}>{item.company}</strong>
                                    <div className="muted tiny" style={{ fontSize: '11px', marginTop: '2px' }}>
                                        {item.type} • {item.time}
                                    </div>
                                </div>
                                <span className={`request-status-badge ${
                                    item.status.toLowerCase() === 'approved' ? 'approved' : 
                                    item.status.toLowerCase() === 'pending' ? 'pending' : 'review'
                                }`}>
                                    {item.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

            </section>

            {/* 5. Bottom Section: Recent Ledger Transactions */}
            <section className="panel" style={{ marginTop: '2.5rem' }}>
                <h3 style={{ fontWeight: 800, marginBottom: '0.25rem', marginTop: 0 }}>
                    🧾 {t('payments_recent_transactions')}
                </h3>
                <p className="muted small" style={{ margin: '0 0 1.5rem 0', fontSize: '12px' }}>
                    {lang === 'ko' ? 'XRPL 에스크로 원장 결제 내역 및 플랫폼 거래 정보입니다.' : 'List of payments settled on the XRPL escrow ledger.'}
                </p>
                
                <ul className="activity-list" style={{ display: 'grid', gap: '0.75rem', padding: 0, listStyle: 'none' }}>
                    {transactions.length === 0
                        ? activitiesSeed.map((activity) => (
                            <li key={activity.id} className={`activity ${activity.status}`} style={{ 
                                background: '#ffffff', 
                                padding: '1.25rem', 
                                border: '1px solid rgba(226, 232, 240, 0.8)', 
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <div className="activity-indicator" style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: activity.status === 'success' ? '#10b981' : activity.status === 'warning' ? '#f59e0b' : '#94a3b8'
                                }} />
                                <div>
                                    <strong style={{ fontSize: '13.5px', color: 'var(--fg)' }}>{activity.text}</strong>
                                    <div className="muted tiny" style={{ fontSize: '11px', marginTop: '2px' }}>{activity.detail}</div>
                                </div>
                            </li>
                        ))
                        : transactions.map((tx) => (
                            <li key={tx.id} className="activity transaction completed" style={{ 
                                background: '#ffffff', 
                                padding: '1.25rem', 
                                border: '1px solid rgba(226, 232, 240, 0.8)', 
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <strong style={{ fontSize: '14px', color: 'var(--fg)' }}>{tx.company}</strong>
                                    <div className="muted tiny" style={{ fontSize: '11px', marginTop: '4px' }}>{tx.description}</div>
                                    <div className="muted tiny" style={{ fontSize: '11px', color: '#94a3b8' }}>{tx.date}</div>
                                </div>
                                <div className="transaction-amount" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <strong style={{ color: tx.amount.startsWith('+') ? '#10b981' : '#ef4444', fontSize: '14px' }}>
                                        {tx.amount}
                                    </strong>
                                    <span className="muted tiny" style={{ fontSize: '11px', color: 'var(--accent)' }}>{tx.xrpl}</span>
                                </div>
                            </li>
                        ))}
                </ul>
            </section>
        </div>
    )
}

import Button from '../ui/Button.jsx'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { track } from '../utils/analytics.js'

const milestones = [
  {
    year: '2026',
    titleKey: 'about_milestone_2026_title',
  },
  {
    year: '2025',
    titleKey: 'about_milestone_2025_title',
  },
]

const leadership = [
  { name: 'Minseo Park', role: 'CEO & Co-founder', bio: 'Driving global expansion with 15+ years in B2B B2B exports.' },
  { name: 'David Kim', role: 'Head of Partnerships', bio: 'Leads partner operations across APAC, EMEA, and the US.' },
  { name: 'Soojin Lee', role: 'Product Lead', bio: 'Builds AI-powered workflows for sourcing and payments.' },
]

const services = [
  { titleKey: 'about_service_matchmaking_title', copyKey: 'about_service_matchmaking_copy', icon: '🤖' },
  { titleKey: 'about_service_intelligence_title', copyKey: 'about_service_intelligence_copy', icon: '📊' },
  { titleKey: 'about_service_support_title', copyKey: 'about_service_support_copy', icon: '🤝' },
]

const technologies = [
  {
    id: 'tech-1',
    titleKey: 'about_tech_1_title',
    descKey: 'about_tech_1_desc',
    renderVisual: () => (
      <svg className="tech-svg" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00A4EF" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        {/* Supplier Node */}
        <g className="node-animate">
          <circle cx="50" cy="100" r="28" fill="url(#grad1)" opacity="0.95" />
          <text x="50" y="103" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">Supplier</text>
        </g>
        
        {/* Buyer Node */}
        <g className="node-animate-delay">
          <circle cx="150" cy="100" r="28" fill="#10B981" opacity="0.95" />
          <text x="150" y="103" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">Buyer</text>
        </g>

        {/* Bidirectional flow links */}
        <path d="M 82 90 Q 100 70 118 90" fill="none" stroke="#00A4EF" strokeWidth="2.5" strokeDasharray="4 4" className="pulse-line" />
        <path d="M 118 110 Q 100 130 82 110" fill="none" stroke="#10B981" strokeWidth="2.5" strokeDasharray="4 4" className="pulse-line-rev" />

        {/* Match Circle */}
        <circle cx="100" cy="100" r="18" fill="#fff" stroke="#00A4EF" strokeWidth="2" className="match-center" />
        <text x="100" y="103" textAnchor="middle" fill="#00A4EF" fontSize="10" fontWeight="bold">98%</text>
      </svg>
    )
  },
  {
    id: 'tech-2',
    titleKey: 'about_tech_2_title',
    descKey: 'about_tech_2_desc',
    renderVisual: () => (
      <svg className="tech-svg" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>
        {/* Calendar (Online) */}
        <g className="calendar-pulse">
          <rect x="35" y="45" width="46" height="46" rx="6" fill="url(#grad2)" opacity="0.9" />
          <rect x="35" y="45" width="46" height="12" fill="#2563EB" rx="3" />
          <circle cx="44" cy="51" r="1.5" fill="#fff" />
          <circle cx="72" cy="51" r="1.5" fill="#fff" />
          <text x="58" y="78" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="bold">AI</text>
        </g>

        {/* O2O Sync Line */}
        <path d="M 85 70 Q 105 70 120 90" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeDasharray="4 4" className="dash-flow" />

        {/* Booth (Offline) */}
        <g className="booth-pop">
          <rect x="110" y="105" width="60" height="45" rx="4" fill="#1E293B" />
          <path d="M 110 118 L 170 118" stroke="#334155" strokeWidth="2" />
          <rect x="125" y="128" width="30" height="22" fill="#475467" rx="2" />
          <text x="140" y="113" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">MEETUP</text>
          <circle cx="140" cy="139" r="3.5" fill="#10B981" className="ping-dot" />
        </g>
      </svg>
    )
  },
  {
    id: 'tech-3',
    titleKey: 'about_tech_3_title',
    descKey: 'about_tech_3_desc',
    renderVisual: () => (
      <svg className="tech-svg" viewBox="0 0 200 200" aria-hidden="true">
        {/* Connection Network */}
        <g className="graph-links">
          <line x1="100" y1="100" x2="60" y2="60" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="100" y1="100" x2="140" y2="60" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="100" y1="100" x2="145" y2="135" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="100" y1="100" x2="55" y2="135" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="60" y1="60" x2="100" y2="35" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="140" y1="60" x2="100" y2="35" stroke="#cbd5e1" strokeWidth="1" />
        </g>

        {/* Shortest Matching Path */}
        <line x1="100" y1="100" x2="140" y2="60" stroke="#10B981" strokeWidth="3" className="highlight-link" />
        <line x1="100" y1="100" x2="60" y2="60" stroke="#00A4EF" strokeWidth="3" className="highlight-link" />

        {/* Nodes */}
        <circle cx="100" cy="100" r="14" fill="#00A4EF" className="graph-node-center" />
        <circle cx="60" cy="60" r="9" fill="#3B82F6" className="graph-node-pulse" />
        <circle cx="140" cy="60" r="9" fill="#10B981" className="graph-node-pulse" />
        <circle cx="145" cy="135" r="9" fill="#F59E0B" />
        <circle cx="55" cy="135" r="9" fill="#EC4899" />
        <circle cx="100" cy="35" r="7" fill="#6B7280" />
      </svg>
    )
  },
  {
    id: 'tech-4',
    titleKey: 'about_tech_4_title',
    descKey: 'about_tech_4_desc',
    renderVisual: () => (
      <svg className="tech-svg" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>
        {/* Block 1 */}
        <g className="ledger-block-1">
          <rect x="25" y="75" width="42" height="42" rx="8" fill="url(#grad4)" stroke="#00A4EF" strokeWidth="2" />
          <text x="46" y="100" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">XRPL</text>
        </g>

        {/* Transfer flow */}
        <path d="M 67 96 L 133 96" fill="none" stroke="#00A4EF" strokeWidth="2.5" strokeDasharray="4 4" className="flow-dash" />

        {/* Block 2 */}
        <g className="ledger-block-2">
          <rect x="133" y="75" width="42" height="42" rx="8" fill="url(#grad4)" stroke="#10B981" strokeWidth="2" />
          <text x="154" y="100" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">Settled</text>
        </g>

        {/* Lock center */}
        <circle cx="100" cy="96" r="14" fill="#10B981" className="lock-pulse" />
        <text x="100" y="100" textAnchor="middle" fill="#fff" fontSize="10">🔒</text>
      </svg>
    )
  }
]

export default function About() {
  const { t } = useI18n()
  return (
    <div className="about container">
      {/* Sleek Hero Header */}
      <header className="about-hero">
        <div className="hero-content">
          <h1>{t('about_title_heading')}</h1>
          <p className="hero-subtitle">{t('about_subheading')}</p>
        </div>
        <Button
          onClick={() => {
            track('about_contact_click')
          }}
          className="btn"
        >
          {t('about_contact_button')}
        </Button>
      </header>

      {/* Styled Mission Banner */}
      <section className="mission-banner">
        <div className="mission-tag">{t('about_mission_title')}</div>
        <h2 className="mission-text">
          {t('about_mission_copy')}
        </h2>
      </section>

      {/* Value Proposition Cards */}
      <section className="services-section">
        <div className="section-header">
          <h3>{t('about_services_title')}</h3>
          <p className="section-subtitle">{t('about_services_description')}</p>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <article key={service.titleKey} className="service-card glass">
              <div className="service-icon">{service.icon}</div>
              <h4 className="service-title">{t(service.titleKey)}</h4>
              <p className="service-desc muted">{t(service.copyKey)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Core Technologies Section (Alternating Layout) */}
      <section className="tech-section">
        <div className="section-header">
          <h3>{t('about_tech_title')}</h3>
          <p className="section-subtitle">{t('about_tech_subtitle')}</p>
        </div>
        <div className="tech-rows">
          {technologies.map((tech, index) => (
            <div key={tech.id} className={`tech-row ${index % 2 === 1 ? 'reverse' : ''}`}>
              <div className="tech-visual">
                <div className="visual-container">
                  {tech.renderVisual()}
                </div>
              </div>
              <div className="tech-text">
                <div className="tech-number">0{index + 1}</div>
                <h4 className="tech-title">{t(tech.titleKey)}</h4>
                <p className="tech-desc muted">{t(tech.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats & Timeline Row */}
      <section className="panel stats-timeline-section">
        <div className="stats-col">
          <h3>{t('about_stats_title')}</h3>
          <ul className="about-stats-list">
            <li>
              <strong className="stat-number">500+</strong>
              <span className="stat-label">{t('about_stats_partners')}</span>
            </li>
            <li>
              <strong className="stat-number">35</strong>
              <span className="stat-label">{t('about_stats_countries')}</span>
            </li>
            <li>
              <strong className="stat-number">$120M</strong>
              <span className="stat-label">{t('about_stats_volume')}</span>
            </li>
          </ul>
        </div>
        <div className="timeline-col">
          <h3>{t('about_milestones_title')}</h3>
          <div className="timeline-container">
            {milestones.map((item, index) => (
              <div key={item.year} className={`timeline-item ${index === 0 ? 'active' : ''}`}>
                <div className="timeline-year">{item.year}</div>
                <div className="timeline-dot-wrapper">
                  <div className="timeline-dot"></div>
                </div>
                <div className="timeline-content">
                  <span className="timeline-title-text">{t(item.titleKey)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="leadership-section">
        <div className="section-header">
          <h3>{t('about_leadership_title')}</h3>
        </div>
        <div className="leadership-grid">
          {leadership.map((member) => (
            <article key={member.name} className="leader-card">
              <div className="leader-avatar">👤</div>
              <div className="leader-info">
                <strong className="leader-name">{member.name}</strong>
                <div className="leader-role">{member.role}</div>
                <p className="leader-bio muted">{member.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="section-header">
          <h3>{t('about_contact_title')}</h3>
          <p className="section-subtitle">{t('about_contact_copy')}</p>
        </div>
        <div className="contact-cards">
          <div className="contact-card-item">
            <span className="contact-icon">📧</span>
            <div className="contact-info">
              <strong>{t('about_contact_sales')}</strong>
              <p>sales@demostatra.com</p>
            </div>
          </div>
          <div className="contact-card-item">
            <span className="contact-icon">🔧</span>
            <div className="contact-info">
              <strong>{t('about_contact_support')}</strong>
              <p>support@demostatra.com</p>
            </div>
          </div>
          <div className="contact-card-item">
            <span className="contact-icon">📍</span>
            <div className="contact-info">
              <strong>{t('about_contact_address')}</strong>
              <p>220 Samseong-ro, Seoul, Korea</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

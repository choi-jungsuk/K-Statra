import { useEffect, useState } from 'react'
import { api } from './api.js'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Overview from './pages/Overview.jsx'
import PartnerSearch from './pages/PartnerSearch.jsx'
import Partners from './pages/Partners.jsx'
import CompanyList from './pages/CompanyList.jsx'
import BuyerForm from './pages/BuyerForm.jsx'
import CompanyInputForm from './pages/CompanyInputForm.jsx'
import Matches from './pages/Matches.jsx'
import PaymentsPage from './pages/PaymentsPage.jsx'
import SchedulePage from './pages/SchedulePage.jsx'
import PaymentCheckout from './pages/PaymentCheckout2.jsx'
import PaymentStatus from './pages/PaymentStatus.jsx'
import AdminPayments from './pages/AdminPayments.jsx'
import AdminMatches from './pages/AdminMatches.jsx'
import AdminStats from './pages/AdminStats.jsx'
import ContactPage from './pages/ContactPage.jsx'
import About from './pages/About.jsx'
import LanguageSwitcher from './ui/LanguageSwitcher.jsx'
import FeedbackButton from './ui/FeedbackButton.jsx'
import Button from './ui/Button.jsx'
import Modal from './ui/Modal.jsx'
import Footer from './ui/Footer.jsx'
import HermesChatWidget from './ui/HermesChatWidget.jsx'
import { useI18n } from './i18n/I18nProvider.jsx'
import { track } from './utils/analytics.js'

const navItems = [
  { to: '/overview', key: 'nav_overview' },
  { to: '/partners', key: 'nav_my_partners' },
  { to: '/schedule', key: 'nav_schedule' },
  { to: '/payments', key: 'nav_payments' },
  { to: '/about', key: 'nav_about' },
]

const notificationCount = 3

function NotFound() {
  const location = useLocation()
  return (
    <div>
      <h2>404</h2>
      <p>Page not found: {location.pathname}</p>
    </div>
  )
}

export default function App() {
  console.log('K-Statra v1.0.2 - Production Build (Env Check)');
  const { t, lang } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()

  const [loginOpen, setLoginOpen] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '', remember: true })
  const [ipSecure, setIpSecure] = useState(false)
  const [loginStatus, setLoginStatus] = useState({ submitting: false, success: false, error: '' })
  const [notifOpen, setNotifOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)

  // JWT Auth States
  const [currentUser, setCurrentUser] = useState(null)
  const [signupForm, setSignupForm] = useState({
    step: 'choice', // 'choice' | 'form'
    role: 'buyer',
    email: '',
    password: '',
    name: '',
    country: 'South Korea',
    industry: 'K-Beauty',
  })
  const [signupStatus, setSignupStatus] = useState({ submitting: false, success: false, error: '' })

  // Auto-restore JWT session
  useEffect(() => {
    api.getMe()
      .then((user) => {
        if (user) {
          setCurrentUser(user)
          if (user.buyerId) {
            localStorage.setItem('kstatra_buyer_id', user.buyerId)
            localStorage.setItem('kstatra_buyer_name', user.name)
          } else if (user.companyId) {
            localStorage.setItem('kstatra_buyer_id', user.companyId)
            localStorage.setItem('kstatra_buyer_name', user.name)
          }
        }
      })
      .catch(() => {
        // Safe to ignore if not logged in
      })
  }, [])

  useEffect(() => {
    track('page_view', { path: location.pathname })
  }, [location])

  const loginTabs =
    lang === 'ko'
      ? [
        { id: 'id', label: 'ID/전화번호' },
        { id: 'one-time', label: '일회용 번호' },
        { id: 'qr', label: 'QR코드' },
      ]
      : [
        { id: 'id', label: 'ID / Phone' },
        { id: 'one-time', label: 'One-time number' },
        { id: 'qr', label: 'QR code' },
      ]
  const loginLabel = lang === 'ko' ? '로그인' : 'Log In'
  const signupLabel = lang === 'ko' ? '회원가입' : 'Sign Up'
  const personalSignupLabel = lang === 'ko' ? '개인 회원가입' : 'Personal Sign-up'
  const companySignupLabel = lang === 'ko' ? '기업 회원가입' : 'Company Sign-up'
  const signupDescription = lang === 'ko' ? '가입 유형을 선택해 주세요.' : 'Choose the option that fits you best.'
  const usernameLabel = lang === 'ko' ? '아이디 또는 전화번호' : 'ID or phone number'
  const passwordLabel = lang === 'ko' ? '비밀번호' : 'Password'
  const rememberLabel = lang === 'ko' ? '로그인 상태 유지' : 'Stay signed in'
  const ipLabel = lang === 'ko' ? 'IP보안' : 'IP security'
  const loginErrorMessage = lang === 'ko' ? '아이디와 비밀번호를 모두 입력해 주세요.' : 'Enter both ID and password.'
  const loginSuccessMessage = lang === 'ko' ? '로그인 성공! 대시보드를 확인하세요.' : 'Login success! Welcome back.'
  const notifications =
    lang === 'ko'
      ? [
        { id: 1, title: '새 매칭 제안', body: '3개의 신규 제안이 도착했습니다.' },
        { id: 2, title: '결제 알림', body: '어제 생성한 결제 건을 확인하세요.' },
      ]
      : [
        { id: 1, title: 'New matches', body: 'You have 3 fresh recommendations.' },
        { id: 2, title: 'Payment reminder', body: "Review yesterday's invoice." },
      ]

  const openLoginModal = () => {
    setLoginStatus({ submitting: false, success: false, error: '' })
    setIpSecure(false)
    setNotifOpen(false)
    setLoginOpen(true)
    track('login_modal_open')
  }

  const openSignupModal = () => {
    setSignupForm({
      step: 'choice',
      role: 'buyer',
      email: '',
      password: '',
      name: '',
      country: 'South Korea',
      industry: 'K-Beauty',
    })
    setSignupStatus({ submitting: false, success: false, error: '' })
    setSignupOpen(true)
    setNotifOpen(false)
    track('signup_modal_open')
  }

  const handlePersonalSignup = () => {
    setSignupForm({
      step: 'form',
      role: 'buyer',
      email: '',
      password: '',
      name: '',
      country: 'South Korea',
      industry: 'K-Beauty',
    })
    setSignupStatus({ submitting: false, success: false, error: '' })
    track('signup_choice', { type: 'personal' })
  }

  const handleCompanySignup = () => {
    setSignupForm({
      step: 'form',
      role: 'company',
      email: '',
      password: '',
      name: '',
      country: 'South Korea',
      industry: 'K-Beauty',
    })
    setSignupStatus({ submitting: false, success: false, error: '' })
    track('signup_choice', { type: 'company' })
  }

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch (err) {
      console.error('Logout failed', err)
    }
    setCurrentUser(null)
    localStorage.removeItem('kstatra_buyer_id')
    localStorage.removeItem('kstatra_buyer_name')
    track('logout')
  }

  const handleSignupSubmit = async (event) => {
    event.preventDefault()
    if (!signupForm.email.trim() || !signupForm.password.trim() || !signupForm.name.trim()) {
      setSignupStatus({ submitting: false, success: false, error: lang === 'ko' ? '모든 필수 항목을 입력해 주세요.' : 'Please fill in all required fields.' })
      return
    }
    setSignupStatus({ submitting: true, success: false, error: '' })
    track('signup_submit')

    try {
      const res = await api.register({
        email: signupForm.email.trim(),
        password: signupForm.password.trim(),
        name: signupForm.name.trim(),
        role: signupForm.role,
        country: signupForm.country.trim(),
        industries: [signupForm.industry],
      })
      if (res && res.user) {
        setCurrentUser(res.user)
        if (res.user.buyerId) {
          localStorage.setItem('kstatra_buyer_id', res.user.buyerId)
          localStorage.setItem('kstatra_buyer_name', res.user.name)
        } else if (res.user.companyId) {
          localStorage.setItem('kstatra_buyer_id', res.user.companyId)
          localStorage.setItem('kstatra_buyer_name', res.user.name)
        }
        setSignupStatus({ submitting: false, success: true, error: '' })
        setTimeout(() => {
          setSignupOpen(false)
        }, 1500)
      }
    } catch (err) {
      setSignupStatus({ submitting: false, success: false, error: err.message || '회원가입 실패' })
    }
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setLoginStatus({ submitting: false, success: false, error: loginErrorMessage })
      return
    }
    setLoginStatus({ submitting: true, success: false, error: '' })
    track('login_modal_submit')

    try {
      // 1. Try real JWT Login via backend
      const res = await api.login({ email: loginForm.username.trim(), password: loginForm.password.trim() })
      if (res && res.user) {
        setCurrentUser(res.user)
        if (res.user.buyerId) {
          localStorage.setItem('kstatra_buyer_id', res.user.buyerId)
          localStorage.setItem('kstatra_buyer_name', res.user.name)
        } else if (res.user.companyId) {
          localStorage.setItem('kstatra_buyer_id', res.user.companyId)
          localStorage.setItem('kstatra_buyer_name', res.user.name)
        }
        setLoginStatus({ submitting: false, success: true, error: '' })
        setTimeout(() => {
          setLoginOpen(false)
        }, 1000)
        return
      }
    } catch (err) {
      console.warn('Real JWT Login failed, attempting Demo automatic login fallback...', err)
      // 2. Demo fallback if user entered anything else
      try {
        const res = await api.listBuyers({ limit: 1 })
        const buyer = res.data?.[0]

        if (buyer) {
          localStorage.setItem('kstatra_buyer_id', buyer._id)
          localStorage.setItem('kstatra_buyer_name', buyer.name)
          setCurrentUser({
            id: buyer._id,
            email: 'demo@kstatra.com',
            name: buyer.name,
            role: 'buyer',
            buyerId: buyer._id,
          })
          setLoginStatus({ submitting: false, success: true, error: '' })
          setTimeout(() => {
            setLoginOpen(false)
          }, 1000)
        } else {
          setLoginStatus({ submitting: false, success: false, error: lang === 'ko' ? '로그인 실패: 등록된 바이어가 없습니다.' : 'Login failed: No buyers found.' })
        }
      } catch (fallbackErr) {
        setLoginStatus({ submitting: false, success: false, error: 'Login failed: ' + (err.message || '인증 서버가 응답하지 않습니다.') })
      }
    }
  }

  return (
    <div>
      <a className="skip-link" href="#main-content">
        {t('skip_to_content')}
      </a>
      <header className="header">
        <div className="inner">
          <div className="brand">
            <span className="logo-box" aria-hidden="true">
              K
            </span>
            <Link to="/" className="brand-link">
              K-Statra
            </Link>
          </div>
          <div className="header-right-col">
            <nav className="nav" aria-label="Primary">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => (isActive ? 'active' : undefined)}
                  onClick={() => track('nav_click', { target: item.to })}
                >
                  {t(item.key)}
                </NavLink>
              ))}
            </nav>
            <div className="controls-row">
              <div className="control-group" aria-label="Language selector">
                <span className="control-icon" aria-hidden="true">
                  🌐
                </span>
                <LanguageSwitcher />
              </div>
              <div className="notif-wrapper" style={{ position: 'relative' }}>
                <button
                  className="icon-btn"
                  type="button"
                  aria-label="Notifications"
                  onClick={() => setNotifOpen((prev) => !prev)}
                  style={{ borderRadius: '12px', border: '1px solid #eceff3' }}
                >
                  <span className="bell-icon" aria-hidden="true">
                    🔔
                  </span>
                  <span className="notif-badge" aria-hidden={notificationCount === 0}>
                    {notificationCount}
                  </span>
                </button>
                {notifOpen && (
                  <div
                    className="notif-dropdown"
                    style={{
                      position: 'absolute',
                      top: '120%',
                      right: 0,
                      width: 220,
                      padding: '0.75rem',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                      background: '#fff',
                      zIndex: 60,
                    }}
                  >
                    {notifications.map((item) => (
                      <div key={item.id} style={{ marginBottom: '0.5rem' }}>
                        <strong style={{ display: 'block', marginBottom: '0.15rem' }}>{item.title}</strong>
                        <span className="muted small">{item.body}</span>
                      </div>
                    ))}
                    <button type="button" className="link-btn" style={{ padding: 0 }} onClick={() => setNotifOpen(false)}>
                      {lang === 'ko' ? '닫기' : 'Close'}
                    </button>
                  </div>
                )}
              </div>
              {currentUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4F46E5', background: 'rgba(79, 70, 229, 0.08)', padding: '0.35rem 0.8rem', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.15)' }}>
                    👤 {currentUser.name} ({currentUser.role === 'buyer' ? (lang === 'ko' ? '바이어' : 'Buyer') : (lang === 'ko' ? '공급사' : 'Supplier')})
                  </span>
                  <button
                    className="avatar-btn"
                    type="button"
                    onClick={handleLogout}
                    style={{
                      borderRadius: '999px',
                      padding: '0.2rem 0.8rem',
                      minWidth: 64,
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      fontWeight: 600,
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    {lang === 'ko' ? '로그아웃' : 'Log Out'}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className="avatar-btn"
                    type="button"
                    aria-label={signupLabel}
                    onClick={openSignupModal}
                    style={{
                      borderRadius: '999px',
                      padding: '0.2rem 0.6rem',
                      minWidth: lang === 'ko' ? 64 : 76,
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      fontWeight: 600,
                      background: '#fff',
                      color: '#111',
                      border: '1px solid #d5dae0',
                    }}
                  >
                    <span style={{ display: 'inline-block', minWidth: lang === 'ko' ? '4em' : '4.5em', textAlign: 'center' }}>
                      {signupLabel}
                    </span>
                  </button>
                  <button
                    className="avatar-btn"
                    type="button"
                    aria-label={loginLabel}
                    onClick={openLoginModal}
                    style={{
                      borderRadius: '999px',
                      padding: '0.2rem 0.8rem',
                      minWidth: lang === 'ko' ? 64 : 76,
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      fontWeight: 600,
                      background: '#0066CC',
                      color: '#fff',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0, 102, 204, 0.2)'
                    }}
                  >
                    <span style={{ display: 'inline-block', minWidth: lang === 'ko' ? '3.5em' : '4em', textAlign: 'center' }}>{loginLabel}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container">
        <Routes>
          <Route path="/" element={<PartnerSearch />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/dashboard" element={<Overview />} /> {/* Redirect or alias */}
          <Route path="/analytics" element={<Overview />} /> {/* Redirect or alias */}
          <Route path="/partners" element={<Partners />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/companies" element={<CompanyList />} />
          <Route path="/companies/new" element={<CompanyInputForm />} />
          <Route path="/buyers/new" element={<BuyerForm />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/matches/detail" element={<ContactPage />} />
          <Route path="/payments/checkout/:id" element={<PaymentCheckout />} />
          <Route path="/payments/:id" element={<PaymentStatus />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/matches" element={<AdminMatches />} />
          <Route path="/admin/stats" element={<AdminStats />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <HermesChatWidget />

      <Modal
        open={loginOpen}
        onClose={() => {
          setLoginOpen(false)
          setIpSecure(false)
          setLoginStatus({ submitting: false, success: false, error: '' })
        }}
        title={loginLabel}
        footer={
          <Button
            variant="secondary"
            onClick={() => {
              setLoginOpen(false)
              setIpSecure(false)
              setLoginStatus({ submitting: false, success: false, error: '' })
            }}
          >
            Close
          </Button>
        }
      >
        <div className="login-modal" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
          <div className="login-logo" style={{ fontSize: '28px', fontWeight: 700, textAlign: 'center' }}>{loginLabel}</div>
          <div className="login-tabs" role="tablist" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', background: '#f3f4f6', borderRadius: '8px' }}>
            {loginTabs.map((tab, index) => (
              <button
                key={tab.id}
                type="button"
                className={`login-tab ${index === 0 ? 'active' : ''}`}
                aria-selected={index === 0}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: index === 0 ? '1px solid #03c75a' : '1px solid transparent',
                  background: index === 0 ? '#fff' : 'transparent',
                  fontWeight: index === 0 ? 600 : 500,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form className="login-form" onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label className="filter-group">
              <span>{usernameLabel}</span>
              <input value={loginForm.username} placeholder="" autoComplete="username" onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))} />
            </label>
            <label className="filter-group">
              <span>{passwordLabel}</span>
              <input type="password" value={loginForm.password} placeholder="" autoComplete="current-password" onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))} />
            </label>

            <div className="login-options row space" style={{ fontSize: '0.9rem', alignItems: 'center' }}>
              <label className="checkbox">
                <input type="checkbox" checked={loginForm.remember} onChange={(event) => setLoginForm((prev) => ({ ...prev, remember: event.target.checked }))} />
                <span>{rememberLabel}</span>
              </label>
              <div className="ip-sec">
                <span>{ipLabel}</span>
                <button
                  type="button"
                  className={`ip-toggle ${ipSecure ? 'on' : 'off'}`}
                  style={{ marginLeft: '0.5rem', borderRadius: '999px', padding: '0.15rem 0.75rem', border: '1px solid #d1d5db', background: ipSecure ? '#03c75a' : '#f9fafb', color: ipSecure ? '#fff' : '#374151' }}
                  onClick={() => setIpSecure((prev) => !prev)}
                >
                  {ipSecure ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {loginStatus.error && (
              <div className="error" role="alert">
                {loginStatus.error}
              </div>
            )}
            {loginStatus.success && <p className="success small">{loginSuccessMessage}</p>}
            <Button type="submit" loading={loginStatus.submitting} style={{ width: '100%' }}>
              {loginLabel}
            </Button>
          </form>
        </div>
      </Modal>
      <Modal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        title={signupLabel}
        footer={
          <Button variant="secondary" onClick={() => setSignupOpen(false)}>
            {lang === 'ko' ? '닫기' : 'Close'}
          </Button>
        }
      >
        {signupForm.step === 'choice' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p className="muted">{signupDescription}</p>
            <div className="signup-options" style={{ display: 'grid', gap: '0.75rem' }}>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  background: '#fafafa',
                }}
              >
                <h4 style={{ marginBottom: '0.25rem' }}>{personalSignupLabel}</h4>
                <p className="muted small" style={{ marginBottom: '0.75rem' }}>
                  {lang === 'ko'
                    ? '매칭 피드를 받아보고 싶다면 개인 회원으로 가입해 주세요.'
                    : 'Sign up as an individual to get curated partner recommendations.'}
                </p>
                <Button style={{ width: '100%' }} onClick={handlePersonalSignup}>
                  {personalSignupLabel}
                </Button>
              </div>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid #c7d2fe',
                  background: '#eef2ff',
                }}
              >
                <h4 style={{ marginBottom: '0.25rem' }}>{companySignupLabel}</h4>
                <p className="muted small" style={{ marginBottom: '0.75rem' }}>
                  {lang === 'ko'
                    ? '회사 정보를 등록하면 AI 추천 카드에 노출됩니다.'
                    : 'Add your company details to appear in AI recommendations.'}
                </p>
                <Button style={{ width: '100%' }} onClick={handleCompanySignup}>
                  {companySignupLabel}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ marginBottom: '0.25rem', padding: '0.5rem', background: '#eef2ff', color: '#4F46E5', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>
              📝 {signupForm.role === 'buyer' ? (lang === 'ko' ? '바이어(개인) 회원가입 진행 중' : 'Buyer Registration') : (lang === 'ko' ? '공급사(기업) 회원가입 진행 중' : 'Supplier Registration')}
            </div>

            <label className="filter-group">
              <span>{lang === 'ko' ? '이메일 주소' : 'Email Address'}</span>
              <input
                type="email"
                required
                value={signupForm.email}
                placeholder="user@kstatra.com"
                onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </label>

            <label className="filter-group">
              <span>{lang === 'ko' ? '비밀번호' : 'Password'}</span>
              <input
                type="password"
                required
                value={signupForm.password}
                placeholder="••••••"
                onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </label>

            <label className="filter-group">
              <span>{lang === 'ko' ? '이름 / 회사명' : 'Name / Company Name'}</span>
              <input
                type="text"
                required
                value={signupForm.name}
                placeholder={signupForm.role === 'buyer' ? '배성민' : '테크플로우 솔루션스'}
                onChange={(e) => setSignupForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </label>

            <label className="filter-group">
              <span>{lang === 'ko' ? '국가' : 'Country'}</span>
              <input
                type="text"
                value={signupForm.country}
                placeholder="South Korea"
                onChange={(e) => setSignupForm(prev => ({ ...prev, country: e.target.value }))}
              />
            </label>

            <label className="filter-group">
              <span>{lang === 'ko' ? '주요 산업 분야' : 'Primary Industry'}</span>
              <select
                value={signupForm.industry}
                onChange={(e) => setSignupForm(prev => ({ ...prev, industry: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: '#fff'
                }}
              >
                <option value="K-Beauty">K-Beauty</option>
                <option value="Robotics">Robotics</option>
                <option value="Bio Medical">Bio Medical</option>
                <option value="IT Services">IT Services</option>
                <option value="Agriculture">Agriculture</option>
              </select>
            </label>

            {signupStatus.error && (
              <div className="error" role="alert">
                {signupStatus.error}
              </div>
            )}
            {signupStatus.success && (
              <div style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', margin: '0.5rem 0' }}>
                🎉 {lang === 'ko' ? '회원가입에 성공했습니다! 대시보드로 이동합니다...' : 'Registration success! Entering Dashboard...'}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Button
                variant="secondary"
                type="button"
                style={{ flex: 1 }}
                onClick={() => setSignupForm(prev => ({ ...prev, step: 'choice' }))}
              >
                {lang === 'ko' ? '이전' : 'Back'}
              </Button>
              <Button
                type="submit"
                loading={signupStatus.submitting}
                style={{ flex: 2 }}
              >
                {lang === 'ko' ? '가입 완료' : 'Complete Register'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

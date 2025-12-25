import React from 'react'
import { Link } from 'react-router-dom'
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  CreditCard, 
  FileText,
  ArrowRight,
  CheckCircle2,
  Globe,
  Lock,
  Users,
  Sparkles
} from 'lucide-react'
import Logo from '../components/Logo'
import './Home.css'

const Home = () => {
  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Real-Time Analytics',
      description: 'Get instant insights into your business performance with live dashboards and reports.'
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Smart Banking',
      description: 'Connect all your accounts and manage finances from one unified platform.'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Invoice Management',
      description: 'Create, send, and track invoices effortlessly.'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Cash Flow Forecasting',
      description: 'Predict future cash positions with AI-powered forecasting tools.'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure Platform',
      description: 'Your data is protected with enterprise-grade encryption.'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Sync',
      description: 'Automatic transaction syncing across all your connected accounts.'
    }
  ]

  const benefits = [
    'Connect unlimited bank accounts',
    'AI-powered financial insights',
    'Automated expense categorization',
    'Tax-ready reports',
    'Smart cash flow forecasting',
    'Invoice tracking'
  ]

  const stats = [
    { value: 'AI-Powered', label: 'Smart Categorization' },
    { value: 'Real-Time', label: 'Transaction Sync' },
    { value: 'Automated', label: 'Forecasting' },
    { value: 'Secure', label: 'Platform' }
  ]

  return (
    <div className="home-container">
      {/* Navigation */}
      <nav className="home-nav">
        <div className="nav-content">
          <div className="nav-logo">
            <Logo size="md" />
            <span className="logo-text">FlowFinance</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <Link to="/pricing" className="nav-link">Pricing</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-btn">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles className="w-4 h-4" />
            <span>Modern Financial Management Platform</span>
          </div>
          <h1 className="hero-title">
            Financial Management
            <span className="gradient-text"> Simplified</span>
          </h1>
          <p className="hero-description">
            Take control of your business finances with intelligent automation, 
            real-time insights, and seamless banking integration. Everything you need 
            to manage cash flow, invoices, and expenses in one place.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-primary">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="btn-secondary">
              Sign In
            </Link>
          </div>
          <div className="hero-features">
            <div className="hero-feature">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="hero-feature">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>7-day free trial</span>
            </div>
            <div className="hero-feature">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="dashboard-preview">
            <div className="preview-header">
              <div className="preview-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className="preview-content">
              <div className="preview-card card-1">
                <div className="card-icon">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div className="card-info">
                  <span className="card-label">Revenue</span>
                  <span className="card-value">$124,500</span>
                </div>
              </div>
              <div className="preview-card card-2">
                <div className="card-icon">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
                <div className="card-info">
                  <span className="card-label">Cash Flow</span>
                  <span className="card-value">$45,200</span>
                </div>
              </div>
              <div className="preview-chart"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Everything you need to succeed</h2>
          <p className="section-description">
            Powerful features designed to help you manage your business finances with confidence
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-content">
          <div className="benefits-text">
            <h2 className="benefits-title">
              Built for modern businesses
            </h2>
            <p className="benefits-description">
              Experience the future of financial management with FlowFinance - 
              designed to help your business grow efficiently and securely.
            </p>
            <div className="benefits-list">
              {benefits.map((benefit, index) => (
                <div key={index} className="benefit-item">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            <Link to="/register" className="benefits-cta">
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="benefits-visual">
            <div className="visual-card">
              <Globe className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="visual-title">Global Reach</h3>
              <p className="visual-text">Support for multiple currencies and international banking</p>
            </div>
            <div className="visual-card">
              <Lock className="w-12 h-12 text-green-400 mb-4" />
              <h3 className="visual-title">Secure Platform</h3>
              <p className="visual-text">Enterprise-grade encryption keeps your data safe</p>
            </div>
            <div className="visual-card">
              <TrendingUp className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="visual-title">Smart Insights</h3>
              <p className="visual-text">AI-powered analytics for better financial decisions</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to transform your finances?</h2>
          <p className="cta-description">
            Start managing your business finances smarter with FlowFinance
          </p>
          <Link to="/register" className="cta-button">
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <Logo size="sm" />
              <span>FlowFinance</span>
            </div>
            <p className="footer-tagline">
              Modern financial management for growing businesses
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <Link to="/features">Features</Link>
              <Link to="/pricing">Pricing</Link>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 FlowFinance. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Home

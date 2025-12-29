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
  DollarSign,
  PieChart,
  Bell,
  Lock,
  Cloud,
  Smartphone,
  RefreshCw,
  Users,
  Calendar,
  Target
} from 'lucide-react'
import Logo from '../components/Logo'
import './Features.css'

const Features = () => {
  const mainFeatures = [
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Real-Time Analytics',
      description: 'Get instant insights into your business performance with live dashboards and comprehensive reports. Track revenue, expenses, and profitability in real-time.',
      benefits: [
        'Live dashboard updates',
        'Customizable reports',
        'Performance metrics',
        'Trend analysis'
      ]
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: 'Real-Time Transaction Sync using Plaid',
      description: 'Connect all your bank accounts and credit cards in one place. Automatic transaction syncing keeps your financial data always up-to-date.',
      benefits: [
        'Unlimited account connections',
        'Automatic transaction sync',
        'Multi-bank support'
      ]
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Invoice Management',
      description: 'Create professional invoices, send them to clients, and track payment status effortlessly.',
      benefits: [
        'Professional templates',
        'Payment tracking'
      ]
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Cash Flow Forecasting',
      description: 'Predict future cash positions with AI-powered forecasting tools. Make informed decisions based on projected income and expenses.',
      benefits: [
        'AI-powered predictions',
        'Scenario planning',
        'Cash flow projections',
        'Trend forecasting'
      ]
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Expense Tracking',
      description: 'Automatically categorize and track all your business expenses. Never miss a deduction with smart expense management.',
      benefits: [
        'Auto-categorization',
        'Expense reports',
        'Tax-ready tracking'
      ]
    },
    {
      icon: <PieChart className="w-8 h-8" />,
      title: 'Financial Reports',
      description: 'Generate comprehensive financial reports including P&L statements, and cash flow statements with one click.',
      benefits: [
        'P&L statements',
        'Cash flow reports',
        'Custom date ranges'
      ]
    }
  ]

  const additionalFeatures = [
    {
      icon: <Cloud className="w-6 h-6" />,
      title: 'Cloud-Based',
      description: 'Access your finances anywhere, anytime from any device'
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: 'Auto-Sync',
      description: 'Transactions sync automatically across all connected accounts'
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Tax Planning',
      description: 'Stay tax-ready with automated categorization and reports'
    }
  ]

  return (
    <div className="features-page">
      {/* Navigation */}
      <nav className="features-nav">
        <div className="nav-content">
          <Link to="/" className="nav-logo">
            <Logo size="md" />
            <span className="logo-text">FlowFinance</span>
          </Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/pricing" className="nav-link">Pricing</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-btn">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="features-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Powerful Features for
            <span className="gradient-text"> Modern Businesses</span>
          </h1>
          <p className="hero-description">
            Everything you need to manage your business finances efficiently, 
            all in one comprehensive platform
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="main-features-section">
        <div className="features-container">
          {mainFeatures.map((feature, index) => (
            <div key={index} className="main-feature-card">
              <div className="feature-icon-large">
                {feature.icon}
              </div>
              <h3 className="feature-title-large">{feature.title}</h3>
              <p className="feature-description-large">{feature.description}</p>
              <ul className="feature-benefits">
                {feature.benefits.map((benefit, idx) => (
                  <li key={idx}>
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Additional Features */}
      <section className="additional-features-section">
        <div className="section-header">
          <h2 className="section-title">And Much More</h2>
          <p className="section-description">
            Additional features to help you succeed
          </p>
        </div>
        <div className="additional-features-grid">
          {additionalFeatures.map((feature, index) => (
            <div key={index} className="additional-feature-card">
              <div className="feature-icon-small">
                {feature.icon}
              </div>
              <h4 className="feature-title-small">{feature.title}</h4>
              <p className="feature-description-small">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="features-cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p className="cta-description">
            Start your 7-day free trial today and experience all features
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-button-primary">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/pricing" className="cta-button-secondary">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="features-footer">
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

export default Features

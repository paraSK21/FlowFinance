import React from 'react'
import { Link } from 'react-router-dom'
import { Check, ArrowRight, Zap } from 'lucide-react'
import Logo from '../components/Logo'
import './Pricing.css'

const Pricing = () => {
  const features = [
    'Unlimited bank account connections',
    'Real-Time Transaction Sync using Plaid',
    'AI-powered expense categorization',
    'Invoice management & tracking',
    'Cash flow forecasting',
    'Financial reports & analytics',
    'Tax-ready reports'
  ]

  return (
    <div className="pricing-page">
      {/* Navigation */}
      <nav className="pricing-nav">
        <div className="nav-content">
          <Link to="/" className="nav-logo">
            <Logo size="md" />
            <span className="logo-text">FlowFinance</span>
          </Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/features" className="nav-link">Features</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-btn">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pricing-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Simple, Transparent
            <span className="gradient-text"> Pricing</span>
          </h1>
          <p className="hero-description">
            Start with a 7-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="pricing-section">
        <div className="pricing-container">
          <div className="pricing-card">
            <div className="pricing-badge">
              <Zap className="w-4 h-4" />
              <span>Most Popular</span>
            </div>
            
            <h2 className="plan-name">Professional Plan</h2>
            <p className="plan-description">
              Everything you need to manage your business finances
            </p>

            <div className="pricing-details">
              <div className="trial-info">
                <div className="trial-badge">7-Day Free Trial</div>
                <p className="trial-text">No credit card required</p>
              </div>

              <div className="price-info">
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">49</span>
                  <span className="period">/month</span>
                </div>
                <p className="price-note">After trial period</p>
              </div>
            </div>

            <Link to="/register" className="pricing-cta">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>

            <div className="features-list">
              <h3 className="features-title">Everything included:</h3>
              <div className="features-grid-layout">
                {features.map((feature, index) => (
                  <div key={index} className="feature-item-card">
                    <Check className="w-5 h-5 text-green-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="guarantee">
              <p className="guarantee-text">
                Cancel anytime. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="faq-container">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          
          <div className="faq-grid">
            <div className="faq-item">
              <h3 className="faq-question">How does the free trial work?</h3>
              <p className="faq-answer">
                Start your 7-day free trial with full access to all features. 
                No credit card required. After the trial, you'll be charged $49/month 
                unless you cancel.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">Can I cancel anytime?</h3>
              <p className="faq-answer">
                Yes! You can cancel your subscription at any time with no penalties 
                or cancellation fees. Your access will continue until the end of your 
                billing period.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">Is there a setup fee?</h3>
              <p className="faq-answer">
                No setup fees, no hidden charges. Just $49/month after your free trial. 
                What you see is what you pay.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">Can I upgrade or downgrade my plan?</h3>
              <p className="faq-answer">
                Currently, we offer one comprehensive plan that includes all features. 
                This ensures you have access to everything you need to manage your finances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pricing-cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Take Control of Your Finances?</h2>
          <p className="cta-description">
            Join thousands of businesses managing their finances smarter
          </p>
          <Link to="/register" className="cta-button">
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="pricing-footer">
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

export default Pricing

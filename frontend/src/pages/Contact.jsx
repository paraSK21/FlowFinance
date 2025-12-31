import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Mail, 
  MessageCircle,
  Clock,
  MapPin,
  Send
} from 'lucide-react'
import Logo from '../components/Logo'
import './Contact.css'

const Contact = () => {
  return (
    <div className="contact-page">
      {/* Navigation */}
      <nav className="contact-nav">
        <div className="nav-content">
          <Link to="/" className="nav-logo">
            <Logo size="md" />
            <span className="logo-text">FlowFinance</span>
          </Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/features" className="nav-link">Features</Link>
            <Link to="/pricing" className="nav-link">Pricing</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-btn">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="contact-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Get in
            <span className="gradient-text"> Touch</span>
          </h1>
          <p className="hero-description">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="contact-container">
          <div className="contact-info">
            <h2 className="info-title">Contact Information</h2>
            <p className="info-description">
              Reach out to us through email
            </p>

            <div className="contact-methods">
              <div className="contact-method">
                <div className="method-icon">
                  <Mail className="w-6 h-6 text-blue-400" />
                </div>
                <div className="method-content">
                  <h3 className="method-title">Email</h3>
                  <a href="mailto:flowfinance2106@gmail.com" className="method-link">
                    flowfinance2106@gmail.com
                  </a>
                  <p className="method-description">
                    Send us an email anytime
                  </p>
                </div>
              </div>
            </div>

            <div className="info-card">
              <MapPin className="info-card-icon" />
              <h3 className="card-title">We're Here to Help</h3>
              <p className="card-text">
                Whether you have a question about features, pricing, or anything else, 
                our team is ready to answer all your questions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="faq-container">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <p className="faq-description">
            Quick answers to common questions
          </p>

          <div className="faq-grid">
            <div className="faq-item">
              <h3 className="faq-question">How quickly will I get a response?</h3>
              <p className="faq-answer">
                We typically respond to all inquiries within 48 hours during business days. 
                For urgent matters, please mention it in your message subject line.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">Can I schedule a demo?</h3>
              <p className="faq-answer">
                Yes! Email us at flowfinance2106@gmail.com with "Demo Request" in the subject line, 
                and we'll arrange a personalized demo of FlowFinance.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">What if I need technical support?</h3>
              <p className="faq-answer">
                For technical issues, email us with details about the problem you're experiencing. 
                Include screenshots if possible, and we'll help resolve it quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="contact-footer">
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

export default Contact

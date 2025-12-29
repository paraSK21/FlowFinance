import React from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  Target, 
  Heart, 
  Zap,
  Shield,
  TrendingUp,
  Users
} from 'lucide-react'
import Logo from '../components/Logo'
import './About.css'

const About = () => {
  const values = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Customer Focused',
      description: 'We build features based on what our customers need, not what we think they want.'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Innovation',
      description: 'We leverage the latest technology to provide cutting-edge financial management tools.'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Transparency',
      description: 'Clear pricing, honest communication, and no hidden fees. What you see is what you get.'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Growth Mindset',
      description: 'We continuously improve and evolve to help your business succeed and grow.'
    }
  ]

  return (
    <div className="about-page">
      {/* Navigation */}
      <nav className="about-nav">
        <div className="nav-content">
          <Link to="/" className="nav-logo">
            <Logo size="md" />
            <span className="logo-text">FlowFinance</span>
          </Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/features" className="nav-link">Features</Link>
            <Link to="/pricing" className="nav-link">Pricing</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-btn">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            About
            <span className="gradient-text"> FlowFinance</span>
          </h1>
          <p className="hero-description">
            We're on a mission to simplify financial management for businesses of all sizes
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="mission-container">
          <div className="mission-content">
            <div className="mission-icon">
              <Target className="w-12 h-12 text-blue-400" />
            </div>
            <h2 className="mission-title">Our Mission</h2>
            <p className="mission-text">
              At FlowFinance, we believe that managing business finances shouldn't be complicated. 
              Our mission is to empower entrepreneurs and business owners with intelligent, 
              easy-to-use financial tools that help them make better decisions and grow their businesses.
            </p>
            <p className="mission-text">
              We combine cutting-edge technology with intuitive design to create a platform that 
              simplifies cash flow management, expense tracking, invoicing, and financial forecasting. 
              Whether you're a freelancer, small business owner, or growing enterprise, FlowFinance 
              provides the insights and tools you need to succeed.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="story-section">
        <div className="story-container">
          <div className="story-content">
            <h2 className="story-title">Our Story</h2>
            <p className="story-text">
              FlowFinance was born from a simple observation: business owners spend too much time 
              managing their finances and not enough time growing their businesses. Traditional 
              accounting software is either too complex or too limited, leaving a gap in the market 
              for a modern, intelligent solution.
            </p>
            <p className="story-text">
              We set out to build a platform that combines the power of AI with beautiful, 
              intuitive design. A platform with Real-Time Transaction Sync using Plaid, 
              automatically categorizes transactions, and provides real-time insights into your 
              financial health.
            </p>
          </div>
          <div className="story-visual">
            <div className="visual-card">
              <TrendingUp className="w-16 h-16 text-blue-400 mb-4" />
              <h3 className="visual-title">Always Improving</h3>
              <p className="visual-text">
                We continuously innovate and add new features to help you succeed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="values-container">
          <h2 className="values-title">Our Values</h2>
          <p className="values-description">
            The principles that guide everything we do
          </p>
          <div className="values-grid">
            {values.map((value, index) => (
              <div key={index} className="value-card">
                <div className="value-icon">
                  {value.icon}
                </div>
                <h3 className="value-title">{value.title}</h3>
                <p className="value-description">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Join Us Today</h2>
          <p className="cta-description">
            Start managing your finances smarter with FlowFinance
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-button-primary">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/contact" className="cta-button-secondary">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
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

export default About

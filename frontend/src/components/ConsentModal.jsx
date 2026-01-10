import React, { useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'

function ConsentModal({ isOpen, onClose, onAccept }) {
  const [agreed, setAgreed] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)

  const handleScroll = (e) => {
    const element = e.target
    const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10
    if (isAtBottom) {
      setScrolledToBottom(true)
    }
  }

  const handleAccept = () => {
    if (agreed) {
      onAccept()
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#1a1f2e',
        borderRadius: '16px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#ffffff',
              margin: '0 0 4px 0'
            }}>
              Terms of Service & Privacy Policy
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#9ca3af',
              margin: 0
            }}>
              Please review and accept to continue
            </p>
          </div>
        </div>

        {/* Content */}
        <div
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px',
            fontSize: '14px',
            lineHeight: '1.7',
            color: '#d1d5db'
          }}
        >
          {/* Consent Notice */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#3b82f6',
              margin: '0 0 16px 0'
            }}>
              WEBSITE PRE-LOGIN CONSENT NOTICE (MANDATORY)
            </h3>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#ffffff',
              margin: '0 0 12px 0'
            }}>
              Data Access & Consent Notice
            </h4>
            <p style={{ margin: '0 0 12px 0' }}>
              By continuing, you acknowledge and agree that:
            </p>
            <ul style={{ margin: '0 0 0 20px', padding: 0 }}>
              <li style={{ marginBottom: '8px' }}>
                You authorize FlowFinance to access your bank account transactions and account balances through Plaid Inc.
              </li>
              <li style={{ marginBottom: '8px' }}>
                Your email address will be obtained via Google OAuth for account creation, identification, and communication.
              </li>
              <li style={{ marginBottom: '8px' }}>
                You may optionally provide a phone number after logging in.
              </li>
              <li style={{ marginBottom: '8px' }}>
                Your data will be securely stored using Supabase and encrypted at rest and in transit.
              </li>
              <li style={{ marginBottom: '8px' }}>
                Your data will not be sold, rented, or shared with advertisers or third parties for commercial purposes.
              </li>
              <li style={{ marginBottom: '8px' }}>
                Some features use algorithms and artificial intelligence, and results may be estimates or inaccurate.
              </li>
              <li style={{ marginBottom: '8px' }}>
                You may revoke access or request deletion of your data at any time.
              </li>
            </ul>
          </div>

          {/* Privacy Policy */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#ffffff',
              margin: '0 0 20px 0',
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '12px'
            }}>
              PRIVACY POLICY (US & CANADA)
            </h3>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                1. Who We Are
              </h4>
              <p style={{ margin: 0 }}>
                FlowFinance is a technology service provider registered in India under MSME and GST regulations. 
                We operate an online software platform available to users in the United States and Canada.
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#9ca3af' }}>
                Contact Email: flowfinance06@gmail.com
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                2. Information We Collect
              </h4>
              <p style={{ margin: '0 0 12px 0', fontWeight: '600', color: '#e5e7eb' }}>
                a) Financial Data (via Plaid)
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                With your explicit consent, we collect the following financial information through Plaid:
              </p>
              <ul style={{ margin: '0 0 12px 20px', padding: 0 }}>
                <li>Bank account balances</li>
                <li>Transaction history</li>
              </ul>
              <p style={{ margin: '0 0 12px 0' }}>
                We never access your bank directly and do not store banking credentials.
              </p>

              <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#e5e7eb' }}>
                b) Account Information
              </p>
              <ul style={{ margin: '0 0 12px 20px', padding: 0 }}>
                <li>Email address (via Google OAuth)</li>
                <li>Optional phone number (entered by you after login)</li>
              </ul>

              <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#e5e7eb' }}>
                c) Usage & Technical Information
              </p>
              <ul style={{ margin: '0 0 0 20px', padding: 0 }}>
                <li>Device and browser type</li>
                <li>IP address</li>
                <li>Login timestamps</li>
                <li>Feature usage logs (for security and performance)</li>
              </ul>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                3. How We Use Your Information
              </h4>
              <p style={{ margin: '0 0 8px 0' }}>We use your data only to:</p>
              <ul style={{ margin: '0 0 12px 20px', padding: 0 }}>
                <li>Categorize transactions using algorithms and AI</li>
                <li>Generate cashflow forecasts (up to 90 days)</li>
                <li>Identify potential tax-deductible transactions (informational only)</li>
                <li>Track invoices and send notifications via email</li>
                <li>Generate financial reports including Profit & Loss (P&L)</li>
                <li>Enable Profit First allocation tools based on user-defined percentages</li>
                <li>Maintain account security and service functionality</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#ef4444' }}>We do NOT:</p>
              <ul style={{ margin: '0 0 0 20px', padding: 0 }}>
                <li>Sell personal or financial data</li>
                <li>Share data with advertisers</li>
                <li>Use data for marketing without consent</li>
              </ul>
            </div>

            <div style={{
              marginBottom: '24px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ef4444', margin: '0 0 12px 0' }}>
                4. Important Accuracy Disclaimer
              </h4>
              <p style={{ margin: '0 0 8px 0' }}>
                Some features of FlowFinance rely on algorithms and artificial intelligence, including:
              </p>
              <ul style={{ margin: '0 0 12px 20px', padding: 0 }}>
                <li>Transaction categorization</li>
                <li>Cashflow forecasting</li>
                <li>Tax deduction scanning</li>
              </ul>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>These outputs:</p>
              <ul style={{ margin: '0 0 8px 20px', padding: 0 }}>
                <li>May be incorrect, incomplete, or inaccurate</li>
                <li>Are provided for informational purposes only</li>
                <li>Should not be considered final, authoritative, or professional advice</li>
              </ul>
              <p style={{ margin: 0, fontWeight: '600', color: '#fbbf24' }}>
                Users are responsible for verifying all financial and tax-related information independently.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                5. Data Storage & Security
              </h4>
              <ul style={{ margin: '0 0 0 20px', padding: 0 }}>
                <li>Data is stored using Supabase</li>
                <li>Sensitive data is encrypted at rest and in transit</li>
                <li>Access is limited to authorized systems only</li>
                <li>Industry-standard security practices are followed</li>
                <li>Audit logs and monitoring are maintained</li>
              </ul>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                6. Data Sharing
              </h4>
              <p style={{ margin: '0 0 8px 0' }}>We share data only when necessary with:</p>
              <ul style={{ margin: '0 0 12px 20px', padding: 0 }}>
                <li>Plaid Inc. – to access financial data with your consent</li>
                <li>Google OAuth – for authentication</li>
                <li>SendGrid – for sending transactional emails (e.g., invoice alerts)</li>
                <li>Essential infrastructure providers required to operate the service</li>
              </ul>
              <p style={{ margin: 0, fontWeight: '600' }}>
                We never share data for advertising or resale.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                7. International Data Transfers
              </h4>
              <p style={{ margin: 0 }}>
                Your data may be processed or stored outside your country of residence, including India and the United States, 
                in compliance with applicable data protection laws.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                8. Your Rights (US & Canada)
              </h4>
              <p style={{ margin: '0 0 8px 0' }}>You have the right to:</p>
              <ul style={{ margin: '0 0 8px 20px', padding: 0 }}>
                <li>Access your personal data</li>
                <li>Request correction or deletion</li>
                <li>Withdraw consent</li>
                <li>Revoke Plaid access at any time</li>
              </ul>
              <p style={{ margin: 0 }}>
                Contact us at flowfinance06@gmail.com
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                9. Data Retention
              </h4>
              <p style={{ margin: '0 0 8px 0' }}>We retain data only:</p>
              <ul style={{ margin: '0 0 8px 20px', padding: 0 }}>
                <li>While your account is active, or</li>
                <li>As required by law or for security purposes</li>
              </ul>
              <p style={{ margin: 0 }}>You may request deletion at any time.</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                10. Changes to This Policy
              </h4>
              <p style={{ margin: 0 }}>
                We may update this Privacy Policy periodically. Continued use of the service means acceptance of the updated policy.
              </p>
            </div>
          </div>

          {/* Terms of Service */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#ffffff',
              margin: '0 0 20px 0',
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '12px'
            }}>
              TERMS OF SERVICE
            </h3>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                1. Acceptance
              </h4>
              <p style={{ margin: 0 }}>
                By accessing or using FlowFinance, you agree to these Terms and our Privacy Policy.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                2. Service Description
              </h4>
              <p style={{ margin: '0 0 8px 0' }}>FlowFinance provides financial data tools including:</p>
              <ul style={{ margin: '0 0 8px 20px', padding: 0 }}>
                <li>Automated transaction categorization</li>
                <li>Cashflow forecasting (up to 90 days)</li>
                <li>Tax deduction scanning (informational only)</li>
                <li>Invoice tracking and email notifications</li>
                <li>Financial report generation (including P&L)</li>
                <li>Profit First allocation tools based on user-defined percentages</li>
              </ul>
              <p style={{ margin: 0 }}>
                All services rely on user-authorized data access via Plaid.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                3. User Responsibilities
              </h4>
              <p style={{ margin: '0 0 8px 0' }}>You agree that:</p>
              <ul style={{ margin: '0 0 0 20px', padding: 0 }}>
                <li>You are authorized to connect the bank accounts you link</li>
                <li>All information you provide is accurate</li>
                <li>You will use the service for lawful purposes only</li>
                <li>You understand outputs may be estimates or inaccurate</li>
              </ul>
            </div>

            <div style={{
              marginBottom: '24px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ef4444', margin: '0 0 12px 0' }}>
                4. No Financial, Tax, or Legal Advice
              </h4>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>FlowFinance does not provide:</p>
              <ul style={{ margin: '0 0 8px 20px', padding: 0 }}>
                <li>Financial advice</li>
                <li>Tax advice</li>
                <li>Accounting advice</li>
                <li>Legal advice</li>
              </ul>
              <p style={{ margin: 0 }}>
                All insights, forecasts, categorizations, and reports are informational only. 
                You are solely responsible for consulting qualified professionals before making decisions.
              </p>
            </div>

            <div style={{
              marginBottom: '24px',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#fbbf24', margin: '0 0 12px 0' }}>
                5. Tax Deduction Disclaimer
              </h4>
              <p style={{ margin: '0 0 8px 0' }}>The Tax Deduction Scanner:</p>
              <ul style={{ margin: '0 0 8px 20px', padding: 0 }}>
                <li>Identifies potentially deductible transactions only</li>
                <li>Does not confirm eligibility or compliance</li>
                <li>Does not replace professional tax advice</li>
              </ul>
              <p style={{ margin: 0, fontWeight: '600' }}>
                Final responsibility lies with the user.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                6. Data Access & Revocation
              </h4>
              <p style={{ margin: 0 }}>
                You may revoke Plaid access at any time through your account or by contacting us.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                7. Limitation of Liability
              </h4>
              <p style={{ margin: '0 0 8px 0' }}>
                To the maximum extent permitted by law, FlowFinance is not liable for:
              </p>
              <ul style={{ margin: '0 0 0 20px', padding: 0 }}>
                <li>Incorrect categorizations or forecasts</li>
                <li>Banking or data provider errors</li>
                <li>Third-party service outages</li>
                <li>Financial or tax decisions made using the platform</li>
              </ul>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                8. Account Termination
              </h4>
              <p style={{ margin: 0 }}>
                We may suspend or terminate accounts that violate these Terms or applicable laws.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                9. Governing Law
              </h4>
              <p style={{ margin: 0 }}>
                These Terms are governed by the laws of India, without regard to conflict-of-law principles.
              </p>
            </div>
          </div>

          {/* Scroll indicator */}
          {!scrolledToBottom && (
            <div style={{
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px',
              background: 'linear-gradient(to top, #1a1f2e 50%, transparent)',
              textAlign: 'center',
              fontSize: '13px',
              color: '#fbbf24',
              fontWeight: '600'
            }}>
              ↓ Please scroll to the bottom to continue ↓
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px 32px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(15, 20, 25, 0.5)'
        }}>
          {/* Checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            cursor: 'pointer',
            marginBottom: '20px',
            opacity: scrolledToBottom ? 1 : 0.5,
            pointerEvents: scrolledToBottom ? 'auto' : 'none'
          }}>
            <div style={{ position: 'relative', marginTop: '2px' }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={!scrolledToBottom}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: scrolledToBottom ? 'pointer' : 'not-allowed'
                }}
              />
            </div>
            <span style={{
              fontSize: '14px',
              color: '#d1d5db',
              lineHeight: '1.5'
            }}>
              I have read and agree to the Terms of Service and Privacy Policy. I understand that AI-generated results may be inaccurate 
              and that I am responsible for verifying all financial and tax information independently.
            </span>
          </label>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#d1d5db',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent'
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              }}
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={!agreed}
              style={{
                padding: '12px 32px',
                background: agreed ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#ffffff',
                cursor: agreed ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: agreed ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (agreed) e.target.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
              }}
            >
              <CheckCircle2 size={18} />
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsentModal

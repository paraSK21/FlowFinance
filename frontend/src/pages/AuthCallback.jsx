import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from '../store/slices/authSlice'
import LoadingScreen from '../components/LoadingScreen'
import toast from 'react-hot-toast'

function AuthCallback() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token')
      const error = searchParams.get('error')

      if (error) {
        toast.error('Authentication failed. Please try again.')
        navigate('/login', { replace: true })
        return
      }

      if (token) {
        // Store token in localStorage first
        localStorage.setItem('token', token)
        
        // Update Redux state
        dispatch(setCredentials({ token }))
        
        // Sync consent from database to localStorage
        // This ensures consent works across devices/browsers
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const userData = await response.json()
            
            // If user has accepted consent in database, sync to localStorage
            if (userData.consentAccepted) {
              localStorage.setItem('flowfinance_consent_accepted', 'true')
              localStorage.setItem('flowfinance_consent_version', userData.consentVersion || '1.0')
              localStorage.setItem('flowfinance_consent_date', userData.consentAcceptedAt || new Date().toISOString())
              console.log('✓ Consent synced from database to localStorage')
            }
          }
        } catch (err) {
          console.log('Could not sync consent, will check on next login:', err.message)
        }
        
        toast.success('Successfully logged in!')
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          navigate('/app', { replace: true })
        }, 100)
      } else {
        toast.error('No authentication token received')
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [searchParams, navigate, dispatch])

  return <LoadingScreen message="Completing authentication..." />
}

export default AuthCallback

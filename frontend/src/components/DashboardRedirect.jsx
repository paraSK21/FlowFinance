import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchAccounts } from '../store/slices/accountSlice'
import LoadingScreen from './LoadingScreen'

function DashboardRedirect() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { accounts, loading } = useSelector(state => state.accounts)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAccounts = async () => {
      try {
        await dispatch(fetchAccounts()).unwrap()
      } catch (error) {
        console.error('Error fetching accounts:', error)
      } finally {
        setChecking(false)
      }
    }

    checkAccounts()
  }, [dispatch])

  useEffect(() => {
    if (!checking && !loading) {
      if (!accounts || accounts.length === 0) {
        // No bank accounts - redirect to accounts page
        navigate('/accounts', { replace: true })
      } else {
        // Has bank accounts - redirect to dashboard
        navigate('/dashboard', { replace: true })
      }
    }
  }, [checking, loading, accounts, navigate])

  return <LoadingScreen message="Loading your workspace..." />
}

export default DashboardRedirect

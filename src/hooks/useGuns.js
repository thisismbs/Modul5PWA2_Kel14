import { useState, useEffect, useCallback, useRef } from 'react'
import gunService from '../services/gunService'

// Simple in-memory cache store
const queryCache = new Map()
const CACHE_TTL_MS = 60 * 1000 // Cache valid selama 60 detik

export function useGuns(params = {}) {
  const [guns, setGuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)

  const paramKey = JSON.stringify(params)

  const fetchGuns = useCallback(async (forceRefresh = false) => {
    // 1. Cek Caching terlebih dahulu jika tidak dipaksa refresh
    const cached = queryCache.get(paramKey)
    const now = Date.now()

    if (!forceRefresh && cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      setGuns(cached.data)
      setPagination(cached.pagination)
      setLoading(false)
      return
    }

    // 2. Fetch fresh data dari API / Supabase
    try {
      setLoading(true)
      setError(null)
      const response = await gunService.getGuns(params)
      if (response.success) {
        const fetchedData = response.data || []
        const fetchedPagination = response.pagination || null

        // Simpan hasil ke cache memory
        queryCache.set(paramKey, {
          data: fetchedData,
          pagination: fetchedPagination,
          timestamp: Date.now()
        })

        setGuns(fetchedData)
        setPagination(fetchedPagination)
      } else {
        setError(response.message || 'Failed to fetch products.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching products.')
      setGuns([])
    } finally {
      setLoading(false)
    }
  }, [paramKey])

  useEffect(() => {
    fetchGuns()
  }, [fetchGuns])

  return { guns, loading, error, pagination, refetch: () => fetchGuns(true) }
}
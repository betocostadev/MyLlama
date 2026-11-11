import { useMemo } from 'react'

export function useApiUrl() {
    return useMemo(() => {
        if (typeof window !== 'undefined') {
            return (
                (window as unknown as { __VITE_API_URL?: string }).__VITE_API_URL ||
                'http://localhost:4000'
            )
        }
        return 'http://localhost:4000'
    }, [])
}
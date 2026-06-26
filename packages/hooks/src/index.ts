import { useEffect, useState } from 'react';

/** Returns true after the component has mounted (client-side). */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

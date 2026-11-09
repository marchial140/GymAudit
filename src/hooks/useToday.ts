import {useEffect,useMemo,useState} from 'react';
export function useToday() {
  const [timestamp,setTimestamp]=useState(()=>Date.now());
  useEffect(()=>{const refresh=()=>setTimestamp(old=>new Date(old).toDateString()===new Date().toDateString()?old:Date.now());
    window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
    const timer=window.setInterval(refresh,60_000);return ()=>{window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);window.clearInterval(timer);};
  },[]);
  return useMemo(()=>new Date(timestamp),[timestamp]);
}

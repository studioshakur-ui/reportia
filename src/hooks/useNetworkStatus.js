import { useEffect, useState } from 'react';
export function useNetworkStatus(){
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(()=>{
    const up=()=>setOnline(true), down=()=>setOnline(false);
    window.addEventListener('online', up); window.addEventListener('offline', down);
    return ()=>{ window.removeEventListener('online', up); window.removeEventListener('offline', down); }
  },[]);
  return online;
}

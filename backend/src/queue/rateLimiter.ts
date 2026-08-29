import { redis } from '../redis/client';
export async function checkAndReserve(senderId:string,hourlyLimit:number){ const hour=new Date().toISOString().slice(0,13); const key=`rate:${senderId}:${hour}`; const count=await redis.incr(key); if(count===1) await redis.expire(key,3600); return count<=hourlyLimit; }
export function msToNextHour(){ const now=Date.now(); return 3600000-(now%3600000); }

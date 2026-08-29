const api=process.env.NEXT_PUBLIC_API_URL??'http://localhost:4000';
export async function request<T>(path:string,init?:RequestInit):Promise<T>{const r=await fetch(`${api}${path}`,{...init,credentials:'include',headers:{'Content-Type':'application/json',...(init?.headers??{})}});if(!r.ok)throw new Error((await r.json().catch(()=>({}))).error??'Request failed');return r.status===204?undefined as T:r.json();}
export { api };

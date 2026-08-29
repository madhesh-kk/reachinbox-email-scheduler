import jwt from 'jsonwebtoken'; import { env } from '../config/env';
export type Session = { id:string; email:string };
export const signSession=(user:Session)=>jwt.sign(user,env.JWT_SECRET,{expiresIn:'7d'});
export const verifySession=(token:string)=>jwt.verify(token,env.JWT_SECRET) as Session;

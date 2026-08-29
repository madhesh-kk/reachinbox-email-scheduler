import { NextFunction, Request, Response } from 'express'; import { verifySession, Session } from '../auth/jwt';
declare global { namespace Express { interface User extends Session {} } }
export function requireAuth(req:Request,res:Response,next:NextFunction) { try { const token=req.cookies?.reachinbox_session; if(!token) return res.status(401).json({error:'Unauthorized'}); req.user=verifySession(token); next(); } catch { res.status(401).json({error:'Unauthorized'}); } }

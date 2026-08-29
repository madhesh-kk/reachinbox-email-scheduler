import { Router } from 'express';
import nodemailer from 'nodemailer';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';

export const senderRouter = Router();
senderRouter.use(requireAuth);

senderRouter.get('/', async (req, res) =>
  res.json(
    await prisma.sender.findMany({
      where: { userId: req.user!.id },
      select: { id: true, fromEmail: true },
    })
  )
);

senderRouter.post('/', async (req, res, next) => {
  try {
    // Use provided Ethereal credentials as default
    const defaultEthereal = {
      user: 'ernestine.hessel@ethereal.email',
      pass: 'adWscWgeVA6A3zAfQv'
    };
    
    // Try to create new account, fallback to default if fails
    let account;
    try {
      account = await nodemailer.createTestAccount();
    } catch (error) {
      console.log('⚠️  Using default Ethereal credentials');
      account = defaultEthereal;
    }
    
    const sender = await prisma.sender.create({
      data: {
        userId: req.user!.id,
        fromEmail: req.user!.email, // Use user's real email as fromEmail
        smtpUser: account.user,      // Ethereal SMTP username
        smtpPass: account.pass,       // Ethereal SMTP password
      },
    });

    console.log(`✅ Created Ethereal sender for ${req.user!.email} | SMTP: ${account.user}`);
    res.status(201).json({ id: sender.id, fromEmail: sender.fromEmail });
  } catch (e) {
    next(e);
  }
});

import { Router } from 'express'; import { z } from 'zod'; import multer from 'multer'; import { prisma } from '../db/prisma'; import { enqueueEmailJob } from '../queue/emailQueue'; import { requireAuth } from '../middleware/auth';
export const emailRouter=Router(); const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024}}); // 10MB limit

const scheduleSchema=z.object({senderId:z.string(),recipients:z.array(z.string().email()).min(1),subject:z.string().min(1),body:z.string(),startTime:z.coerce.date(),delayMs:z.coerce.number().int().nonnegative(),hourlyLimit:z.coerce.number().int().positive(),useEthereal:z.boolean().optional()});

emailRouter.use(requireAuth);

emailRouter.post('/schedule',upload.array('attachments',10),async(req,res,next)=>{try{
  // Parse JSON data from form field
  const data=scheduleSchema.parse(JSON.parse(req.body.data || '{}'));
  const sender=await prisma.sender.findFirst({where:{id:data.senderId,userId:req.user!.id}}); 
  if(!sender)return res.status(404).json({error:'Sender not found'}); 
  
  // Process attachments
  const files = req.files as Express.Multer.File[] || [];
  const attachmentsData = files.map(f => ({
    filename: f.originalname,
    content: f.buffer.toString('base64'),
    contentType: f.mimetype
  }));
  
  const created=await prisma.$transaction(data.recipients.map((toEmail,i)=>prisma.emailJob.create({data:{userId:req.user!.id,senderId:data.senderId,toEmail,subject:data.subject,body:data.body,attachments:attachmentsData.length > 0 ? JSON.stringify(attachmentsData) : null,useEthereal:data.useEthereal ?? false,scheduledAt:new Date(data.startTime.getTime()+i*data.delayMs),delayMs:data.delayMs,hourlyLimit:data.hourlyLimit}}))); 
  
  for(const email of created)await enqueueEmailJob(email); 
  res.status(201).json(created);
}catch(e){next(e);}});
emailRouter.get('/',async(req,res)=>{
  const statusParam=typeof req.query.status==='string'?req.query.status:undefined; 
  const page=Math.max(1,Number(req.query.page??1));
  const pageSize=Math.min(100,Math.max(1,Number(req.query.pageSize??25))); 
  
  // Handle multiple statuses (comma-separated)
  let statusFilter = {};
  if (statusParam) {
    const statuses = statusParam.split(',');
    if (statuses.length > 1) {
      statusFilter = { status: { in: statuses as any } };
    } else {
      statusFilter = { status: statusParam as any };
    }
  }
  
  const where={userId:req.user!.id,...statusFilter}; 
  const [items,total]=await Promise.all([
    prisma.emailJob.findMany({where,orderBy:{scheduledAt:'desc'},skip:(page-1)*pageSize,take:pageSize,include:{sender:true}}),
    prisma.emailJob.count({where})
  ]);
  res.json({items,total,page,pageSize});
});
emailRouter.get('/:id',async(req,res)=>{const item=await prisma.emailJob.findFirst({where:{id:req.params.id,userId:req.user!.id},include:{sender:true}});if(!item)return res.status(404).json({error:'Not found'});res.json(item);});
emailRouter.post('/upload-list',upload.single('file'),(req,res)=>{const csv=req.file?.buffer.toString('utf8')??''; const emails=[...new Set((csv.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)??[]).map(v=>v.toLowerCase()))];res.json({count:emails.length,emails});});

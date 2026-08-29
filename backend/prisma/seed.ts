import { prisma } from '../src/db/prisma';
async function main() { await prisma.user.upsert({ where:{googleId:'demo'}, update:{}, create:{googleId:'demo',email:'demo@reachinbox.local',name:'Demo User'} }); }
main().finally(() => prisma.$disconnect());

import fs from 'node:fs';
import path from 'node:path';
import {load,render,qaHTML} from './core.mjs';
try {
  const args=process.argv.slice(2).filter(a=>a!=='--preview');const preview=process.argv.includes('--preview');
  if(!args[0])throw new Error('用法：node scripts/render.mjs report.json [output-directory] [--preview]');
  const {data,base}=load(args[0]);const html=render(data,base,{preview});const e=qaHTML(html);if(e.length)throw new Error(e.join('\n'));
  const out=path.resolve(args[1]??'output');fs.mkdirSync(out,{recursive:true});
  const file=path.join(out,`${preview?'preview_':''}${data.company_slug}_business_sense_${data.role_slug}_interview_${data.cutoff_date.replaceAll('-','')}.html`);
  if(fs.existsSync(file))throw new Error(`文件已存在，请选择新输出目录：${file}`);
  fs.writeFileSync(file,html);console.log(file);
}catch(e){console.error(e.message);process.exitCode=1;}

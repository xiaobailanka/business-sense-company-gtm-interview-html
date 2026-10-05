import fs from 'node:fs';
import {qaHTML} from './core.mjs';
try {if(!process.argv[2])throw new Error('用法：node scripts/qa.mjs report.html');const html=fs.readFileSync(process.argv[2],'utf8');const e=qaHTML(html);if(html.includes('data-review-preview="true"'))e.push('预览草稿不能通过最终 QA');if(e.length)throw new Error(e.join('\n'));console.log('HTML structural QA passed; evidence and visual review are separate requirements.');}catch(e){console.error(e.message);process.exitCode=1;}

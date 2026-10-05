import fs from 'node:fs';
import path from 'node:path';
import {root} from './core.mjs';
const fail = m=>{throw new Error(m);};
try {
  const skill=fs.readFileSync(path.join(root,'SKILL.md'),'utf8');
  const front=skill.match(/^---\r?\n([\s\S]*?)\r?\n---/);if(!front)fail('缺少 YAML frontmatter');
  const name=front[1].match(/^name: (.+)$/m)?.[1];if(!/^[a-z0-9-]{1,63}$/.test(name??''))fail('Skill 名称无效');
  if(!/^description: \S.+$/m.test(front[1]))fail('缺少 description');
  if(/\bTODO\b|\bTBD\b|\[INSERT|\[REPLACE/.test(skill))fail('入口存在未完成占位');
  for(const m of skill.matchAll(/\]\(([^)]+)\)/g))if(!fs.existsSync(path.join(root,m[1])))fail(`入口引用文件缺失：${m[1]}`);
  const schema=JSON.parse(fs.readFileSync(path.join(root,'config/report_schema.json'),'utf8'));if(!schema.$schema||!schema.required?.includes('jd'))fail('数据 Schema 不完整');
  const meta=fs.readFileSync(path.join(root,'agents/openai.yaml'),'utf8');if(!meta.includes(`$${name}`)||!meta.includes('allow_implicit_invocation: true'))fail('调用元数据不一致');
  for(const file of ['intake','validate','render','qa'])if(!fs.existsSync(path.join(root,`scripts/${file}.mjs`)))fail(`缺少 ${file} 工具`);
  const template=fs.readFileSync(path.join(root,'templates/report_template.html'),'utf8');const golden=fs.readFileSync(path.join(root,'references/anker_business_sense_gtm_reference.html'),'utf8');
  if(template.match(/<style>([\s\S]*?)<\/style>/)?.[1]!==golden.match(/<style>([\s\S]*?)<\/style>/)?.[1])fail('模板 CSS 与 Golden Reference 不一致');
  console.log('Skill package: frontmatter, routing, metadata, schema, tools and Golden CSS passed.');
}catch(e){console.error(e.message);process.exitCode=1;}

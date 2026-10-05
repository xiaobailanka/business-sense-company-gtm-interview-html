import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const sections = ['summary', 'layer1', 'layer2', 'layer3', 'layer4'];
export const reviewKeys = ['evidence', 'jd', 'content', 'consistency', 'desktop', 'mobile', 'tablet', 'print'];
export const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const load = filename => ({ data: JSON.parse(fs.readFileSync(filename, 'utf8')), base: path.dirname(path.resolve(filename)) });
const text = v => typeof v === 'string' && v.trim().length > 0;
const date = v => /^\d{4}-\d{2}-\d{2}$/.test(v ?? '') && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
const url = v => { try { return ['http:', 'https:'].includes(new URL(v).protocol); } catch { return false; } };

export function image(file, base) {
  const bytes = fs.readFileSync(path.resolve(base, file));
  const mime = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png'
    : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'image/jpeg'
    : bytes.subarray(0,6).toString().match(/^GIF8[79]a$/) ? 'image/gif'
    : bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP' ? 'image/webp' : null;
  if (!mime) throw new Error(`不是受支持的 JD 图片：${file}`);
  return `data:${mime};base64,${bytes.toString('base64')}`;
}

export function intake(data, base) {
  const errors = [];
  for (const k of ['company_full_name','role_full_name']) if (!text(data[k])) errors.push(`缺少 ${k}`);
  const jd = data.jd ?? {};
  if (!Array.isArray(jd.screenshots) || !jd.screenshots.length) errors.push('请提供完整岗位 JD 截图，包含岗位名称、职责和任职资格');
  else for (const f of jd.screenshots) { try { image(f, base); } catch(e) { errors.push(e.message); } }
  if (!text(jd.role_title) || jd.role_title !== data.role_full_name) errors.push('JD 岗位名称必须与本次岗位一致');
  if (!Array.isArray(jd.duties) || !jd.duties.length || jd.duties.some(d => !/^J\d+$/.test(d.id) || !text(d.text))) errors.push('缺少带 J-ID 的 JD 职责原文');
  else if (new Set(jd.duties.map(d=>d.id)).size !== jd.duties.length) errors.push('JD 职责 ID 重复');
  if (!Array.isArray(jd.qualifications) || !jd.qualifications.length || jd.qualifications.some(q=>!text(q))) errors.push('缺少 JD 任职资格原文');
  if (jd.complete !== true || jd.reviewed !== true) errors.push('JD 完整性与图片转录尚未复核');
  return errors;
}

export function validate(data, base, {preview=false}={}) {
  const errors = intake(data, base);
  const requireText = (o, keys, label) => keys.forEach(k => {if (!text(o?.[k])) errors.push(`${label}.${k} 缺失`);});
  if (!date(data.cutoff_date)) errors.push('cutoff_date 必须为真实 YYYY-MM-DD');
  for (const k of ['company_slug','role_slug']) if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data[k] ?? '')) errors.push(`${k} 必须为小写英文/数字/连字符`);
  const sources = Array.isArray(data.sources) ? data.sources : [];
  const facts = Array.isArray(data.facts) ? data.facts : [];
  if (!sources.length || !facts.length) errors.push('缺少 source map 或 fact table');
  const sourceIds = new Set(sources.map(s=>s.id)), factIds = new Set(facts.map(f=>f.id));
  const jdIds = new Set((data.jd?.duties ?? []).map(d=>d.id));
  if (sourceIds.size !== sources.length || factIds.size !== facts.length) errors.push('来源或事实 ID 重复');
  const refs = (ids, valid, label) => { if (!Array.isArray(ids) || !ids.length || ids.some(id=>!valid.has(id))) errors.push(`${label} 引用缺失或断链`); };
  for (const s of sources) {
    requireText(s,['title','type','locator'],'source');
    if (!/^S\d+$/.test(s.id)) errors.push('Source ID 必须是 S+数字');
    if (!date(s.accessed_at) || s.accessed_at > data.cutoff_date) errors.push(`${s.id} 访问日期无效或晚于截止日`);
    if (s.published_at !== null && (!date(s.published_at) || s.published_at > data.cutoff_date)) errors.push(`${s.id} 发布日期无效或晚于截止日`);
    if (s.type === 'user-jd' ? !jdIds.has((s.url ?? '').replace(/^jd:\/\//,'')) : !url(s.url)) errors.push(`${s.id} 来源地址无效`);
  }
  for (const f of facts) {
    if (!/^F\d+$/.test(f.id)) errors.push('Fact ID 必须是 F+数字');
    requireText(f,['statement','period','scope'],'fact'); refs(f.source_ids,sourceIds,f.id);
    if (f.value !== undefined && f.value !== null && (!Number.isFinite(f.value) || !text(f.unit))) errors.push(`${f.id} 数值或单位无效`);
    if (f.value === null && !text(f.unavailable_reason)) errors.push(`${f.id} null 需要不可得原因`);
  }
  if (!Array.isArray(data.kpis) || !data.kpis.length) errors.push('缺少 KPI');
  for (const k of data.kpis ?? []) {requireText(k,['label'],'kpi');refs([k.fact_id],factIds,'KPI');}
  for (const key of sections) {
    const s = data.sections?.[key]; requireText(s,['title'],key);
    if (!Array.isArray(s?.blocks) || !s.blocks.length) errors.push(`${key} 内容为空`);
    for (const b of s?.blocks ?? []) {
      if (!['fact','judgement','warning','table','products','competitors','flow','bars'].includes(b.type)) errors.push(`未知组件 ${b.type}`);
      if (['fact','judgement','warning'].includes(b.type)) {
        requireText(b,['text'],'block'); if (b.type !== 'warning') refs(b.fact_ids,factIds,'block');
      } else if (b.type === 'bars') {
        if (!Array.isArray(b.items) || !b.items.length) errors.push('bars 为空');
        const barFacts = (b.items??[]).map(i=>facts.find(f=>f.id===i.fact_id));
        for (const i of b.items??[]) {requireText(i,['label'],'bar');refs([i.fact_id],factIds,'bar');}
        if (barFacts.some(f=>!f || !Number.isFinite(f.value) || f.value<0)) errors.push('条形图需要真实非负数值');
        if (new Set(barFacts.map(f=>`${f?.period}|${f?.unit}|${f?.scope}`)).size>1) errors.push('条形图时间/单位/口径不一致');
      } else if (b.type === 'table') {
        if (!Array.isArray(b.columns) || !b.columns.length || !Array.isArray(b.rows) || !b.rows.length) errors.push('table 缺列或行');
        for (const r of b.rows??[]) {if(!Array.isArray(r.cells)||r.cells.length!==b.columns?.length||r.cells.some(c=>!text(c)))errors.push('table 行列不匹配');refs(r.fact_ids,factIds,'table');}
      } else {
        if (!Array.isArray(b.items) || !b.items.length) errors.push(`${b.type} 内容为空`);
        for (const i of b.items??[]) {requireText(i,['title','text'],'component');refs(i.fact_ids,factIds,b.type);}
      }
    }
  }
  const strategies = data.strategies ?? [];
  if (strategies.length<4 || strategies.length>6 || new Set(strategies.map(s=>s.dimension)).size<4) errors.push('需要 4–6 条战略判断，至少四个维度');
  for (const s of strategies) {requireText(s,['direction','dimension','why','action','metric'],'strategy');refs(s.fact_ids,factIds,'strategy');}
  const role = data.role ?? {};
  requireText(role,['essence','boundaries','self_intro_one_liner','self_intro_explanation','self_intro_bridge'],'role');
  if (!Array.isArray(role.roles) || role.roles.length<3 || role.roles.length>5) errors.push('需要 3–5 个 JD 角色');
  for (const r of role.roles??[]) {requireText(r,['name','translation','responsibility'],'JD role');refs(r.jd_ids,jdIds,'JD role');}
  if (!Array.isArray(role.capabilities) || role.capabilities.length<5 || role.capabilities.length>7) errors.push('需要 5–7 项 JD 支撑能力');
  for (const c of role.capabilities??[]) {requireText(c,['name','meaning'],'capability');refs(c.jd_ids,jdIds,'capability');}
  const chains = data.interview?.logic_chains ?? [];
  const topics = ['company','product','region','channel','competition','strategy','innovation','jd'];
  if (chains.length!==8 || new Set(chains.map(c=>c.topic)).size!==8 || chains.some(c=>!topics.includes(c.topic))) errors.push('需要八条逻辑链，覆盖八种指定主题');
  for (const c of chains) {requireText(c,['judgement','action','metric'],'chain');refs(c.fact_ids,factIds,'chain');if(c.topic==='jd')refs(c.jd_ids,jdIds,'JD chain');}
  for (const [key,max] of [['q1',90],['q2',75],['q3',90]]) {
    const a = data.interview?.[key];requireText(a,['script','structure','timing_method'],key);refs(a?.fact_ids,factIds,key);
    if (!Number.isFinite(a?.seconds) || a.seconds<60 || a.seconds>max) errors.push(`${key} 时长需要 60–${max} 秒`);
    if (key==='q3')refs(a?.jd_ids,jdIds,key);
  }
  if (!Array.isArray(data.quick_memo_cards) || !data.quick_memo_cards.length) errors.push('缺少速记卡');
  for (const m of data.quick_memo_cards??[]) {requireText(m,['title','text'],'memo');refs(m.fact_ids,factIds,'memo');}
  for (const key of preview ? [] : reviewKeys) {
    const q=data.qa?.[key];
    if (q?.passed!==true || !text(q.by) || !date(q.checked_at) || !text(q.note)) errors.push(`QA ${key} 尚未实际核验或无记录`);
  }
  return errors;
}

export function assertValid(data,base,options) {const e=validate(data,base,options);if(e.length)throw new Error(e.join('\n'));}
const factValue = f => f.value===null ? `暂无可验证数据（${f.unavailable_reason}）` : f.value!==undefined ? `${f.value.toLocaleString('zh-CN')} ${f.unit}` : f.statement;

export function render(data,base,{preview=false}={}) {
  assertValid(data,base,{preview});
  const fmap = new Map(data.facts.map(f=>[f.id,f]));
  const citations = ids => [...new Set(ids.flatMap(id=>fmap.get(id).source_ids))].map(id=>` <a href="#${id}">[${escape(id)}]</a>`).join('');
  const factText = ids => ids.map(id=>{const f=fmap.get(id);return `<p>${escape(f.statement)} <span class="source-note">${escape(f.period)} · ${escape(f.scope)}</span>${citations([id])}</p>`;}).join('');
  const heading = t=>`<div class="section-title"><h2>${escape(t)}</h2></div>`;
  const block = b => {
    const title = b.title ? `<h3>${escape(b.title)}</h3>`:'';
    if(['fact','judgement','warning'].includes(b.type))return `<div class="${b.type}">${title}<span class="tag ${b.type==='fact'?'fact-tag':b.type==='judgement'?'judge-tag':'risk-tag'}">${b.type==='fact'?'事实':b.type==='judgement'?'判断':'风险/注意'}</span>${escape(b.text)}${b.fact_ids?factText(b.fact_ids):''}</div>`;
    if(b.type==='table')return `<div class="card">${title}<table><thead><tr>${b.columns.map(c=>`<th>${escape(c)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r=>`<tr>${r.cells.map((c,i)=>`<td>${escape(c)}${i===r.cells.length-1?citations(r.fact_ids):''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    if(b.type==='bars') {const max=Math.max(...b.items.map(i=>fmap.get(i.fact_id).value),1);return `<div class="card">${title}<div class="barbox">${b.items.map(i=>`<div class="barrow"><div class="name">${escape(i.label)}${citations([i.fact_id])}</div><div class="track"><div class="fill" style="width:${fmap.get(i.fact_id).value/max*100}%"></div></div><div class="pct">${escape(factValue(fmap.get(i.fact_id)))}</div></div>`).join('')}</div><p class="source-note">${escape(fmap.get(b.items[0].fact_id).period)} · ${escape(fmap.get(b.items[0].fact_id).scope)}；相对最大值展示，不代表市场份额</p></div>`;}
    const classes={products:['matrix','cell'],competitors:['grid grid-2','competitor'],flow:['flow','step']}[b.type];
    return `${title}<div class="${classes[0]}">${b.items.map((i,n)=>`<div class="${classes[1]}">${b.type==='flow'?`<div class="n">${n+1}</div>`:''}<h4>${escape(i.title)}</h4><p>${escape(i.text)}</p>${i.judgement?`<div class="judgement">判断：${escape(i.judgement)}</div>`:''}${citations(i.fact_ids)}</div>`).join('')}</div>`;
  };
  const jdQuote = ids=>ids.map(id=>`<p class="source-note">${escape(id)}：${escape(data.jd.duties.find(d=>d.id===id).text)}</p>`).join('');
  const roleHtml=heading('岗位：按完整 JD 拆解')+`<div class="input-gate"><h3>输入门槛已满足</h3><p>公司：${escape(data.company_full_name)}；岗位：${escape(data.role_full_name)}。完整 JD 截图、职责和任职资格已由 ${escape(data.qa?.jd?.by ?? '预览待核验')} 复核。</p></div><div class="jd-layout"><div class="card">${data.role.roles.map(r=>`<div class="role-card"><h4>${escape(r.name)}</h4>${jdQuote(r.jd_ids)}<p>业务翻译：${escape(r.translation)}</p><p>结果责任：${escape(r.responsibility)}</p></div>`).join('')}<div class="judgement">岗位本质：${escape(data.role.essence)}</div><p>职能边界：${escape(data.role.boundaries)}</p>${data.role.capabilities.map(c=>`<h4>${escape(c.name)}</h4><p>${escape(c.meaning)}</p>${jdQuote(c.jd_ids)}`).join('')}</div><div class="card"><h3>原始 JD 截图</h3>${data.jd.screenshots.map((p,i)=>`<img class="jd-shot" src="${image(p,base)}" alt="${escape(data.role_full_name)} JD 第 ${i+1} 张" />`).join('')}<h4>任职资格原文</h4><ul>${data.jd.qualifications.map(q=>`<li>${escape(q)}</li>`).join('')}</ul></div></div>`;
  const replace={COMPANY_NAME:escape(data.company_full_name),ROLE_NAME:escape(data.role_full_name),RESEARCH_CUTOFF:escape(data.cutoff_date),KPI_CARDS_HTML:`<div class="kpis grid grid-4">${data.kpis.map(k=>{const f=fmap.get(k.fact_id);return `<div class="kpi"><div class="v">${escape(factValue(f))}</div><div class="l">${escape(k.label)}</div><div class="source-note">${escape(f.period)} · ${escape(f.scope)}${citations([k.fact_id])}</div></div>`;}).join('')}</div>`,ROLE_JD_HTML:roleHtml,
    LOGIC_CHAINS_HTML:heading('8 条面试逻辑链')+`<div class="card">${data.interview.logic_chains.map((c,i)=>`<div class="logic"><div class="num">${i+1}. ${escape(c.topic)}</div><div class="chain"><b>事实</b>${factText(c.fact_ids)}<p><b>判断：</b>${escape(c.judgement)}</p><p><b>行动建议：</b>${escape(c.action)}</p><p><b>验证指标：</b>${escape(c.metric)}</p>${c.jd_ids?jdQuote(c.jd_ids):''}</div></div>`).join('')}</div>`,
    SELFINTRO_HTML:heading('自我介绍中的岗位一句话')+`<div class="selfintro-line">我对这个岗位的理解是：${escape(data.role.self_intro_one_liner)}</div><div class="card"><p>${escape(data.role.self_intro_explanation)}</p><p>${escape(data.role.self_intro_bridge)}</p></div>`,
    INTERVIEW_ANSWERS_HTML:heading('三道核心面试题')+`<div class="grid">${[['q1','你对我们公司有什么了解？'],['q2','你为什么选择我们公司？'],['q3','你对这个岗位的理解是什么？']].map(([k,title])=>{const a=data.interview[k];return `<div class="answer"><div class="q">${k.toUpperCase()} · ${a.seconds} 秒（${escape(a.timing_method)}）</div><h3>${title}</h3><p class="script">${escape(a.script)}</p><div class="structure">${escape(a.structure)}${citations(a.fact_ids)}${a.jd_ids?jdQuote(a.jd_ids):''}</div></div>`;}).join('')}</div>`,
    QUICK_MEMO_HTML:heading('面试前 3 分钟速记卡')+`<div class="grid grid-3">${data.quick_memo_cards.map(m=>`<div class="quick"><strong>${escape(m.title)}</strong><p>${escape(m.text)}</p>${factText(m.fact_ids)}</div>`).join('')}</div>`,
    SOURCES_HTML:heading('来源与口径')+`<ol class="refs">${data.sources.map(s=>`<li id="${escape(s.id)}"><strong>${escape(s.id)}</strong> ${s.type==='user-jd'?escape(s.title):`<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)}</a>`} · ${escape(s.type)} · 发布 ${escape(s.published_at??'未标注')} · 访问 ${escape(s.accessed_at)} · ${escape(s.locator)}</li>`).join('')}</ol>`};
  for(const [key,token] of [['summary','SUMMARY_HTML'],['layer1','LAYER1_HTML'],['layer2','LAYER2_HTML'],['layer3','LAYER3_HTML'],['layer4','LAYER4_HTML']])replace[token]=heading(data.sections[key].title)+data.sections[key].blocks.map(block).join('')+(key==='layer4'?`<div class="grid grid-2">${data.strategies.map(s=>`<div class="card"><h3>${escape(s.direction)}</h3><span class="tag judge-tag">判断/建议 · ${escape(s.dimension)}</span><p>为什么：${escape(s.why)}</p>${factText(s.fact_ids)}<p>动作建议：${escape(s.action)}</p><p>验证指标：${escape(s.metric)}</p></div>`).join('')}</div>`:'');
  let html=fs.readFileSync(path.join(root,'templates/report_template.html'),'utf8').replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>{if(!(key in replace))throw new Error(`未映射模板字段 ${key}`);return replace[key];});
  html=html.replace('</style>', 'body{overflow-wrap:anywhere}section{scroll-margin-top:60px}.barrow{grid-template-columns:148px minmax(0,1fr) 105px}.jd-shot+.jd-shot{margin-top:18px}.answer a{color:#9fc5ff}@media(max-width:620px){.barrow{grid-template-columns:85px minmax(0,1fr) 90px}.card,.answer{padding:18px}}@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}.hero{padding:24px 0}.kpis{margin-top:18px}.card,.answer,.quick,.role-card{break-inside:avoid}}\n</style>');
  if(preview)html=html.replace('<body>','<body><div data-review-preview="true" class="warning">预览草稿：尚未完成事实与视觉验收，不可作为最终报告交付。</div>');
  return html;
}

export function qaHTML(html) {
  const e=[];
  if(/\{\{[A-Z_]+\}\}/.test(html))e.push('模板未替换');
  if(/<script\b|<link\b|<iframe\b|<object\b|<embed\b|\son\w+\s*=/i.test(html))e.push('存在外部依赖或活动内容');
  if(/url\s*\(|@import/i.test(html))e.push('存在 CSS 外部资源');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  // Repeated JD quotes intentionally do not need anchors.
  const unique=new Set(ids);if(unique.size!==ids.length)e.push('重复 HTML ID');
  for(const m of html.matchAll(/href="#([^"]+)"/g))if(!unique.has(m[1]))e.push(`锚点断链 ${m[1]}`);
  for(const m of html.matchAll(/<img\b[^>]*src="([^"]+)"/gi))if(!/^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(m[1]))e.push('图片未 Base64 嵌入');
  if(!html.includes('class="jd-shot"'))e.push('没有 JD 截图');
  if(!html.includes('@media print')||!html.includes('@media(max-width:620px)'))e.push('缺移动端或打印样式');
  return e;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {intake,validate,render,qaHTML,root} from '../scripts/core.mjs';
import {fixture} from './fixture.mjs';
const base=fs.mkdtempSync(path.join(os.tmpdir(),'business-sense-test-'));
test.after(()=>fs.rmSync(base,{recursive:true,force:true}));

test('Case A: 缺少 JD 时输入门槛拒绝，渲染器不产生最终报告',()=>{
  const d=fixture(base);delete d.jd;assert.ok(intake(d,base).some(e=>e.includes('完整岗位 JD 截图')));assert.throws(()=>render(d,base));
  const input=path.join(base,'missing.json');fs.writeFileSync(input,JSON.stringify(d));const out=path.join(base,'blocked');
  const result=spawnSync(process.execPath,[path.join(root,'scripts/render.mjs'),input,out]);assert.equal(result.status,1);assert.equal(fs.existsSync(out),false);
});
test('Case B: 完整合成输入生成单文件，截图与来源全部内嵌或锚定',()=>{
  const d=fixture(base);assert.deepEqual(validate(d,base),[]);const h=render(d,base);assert.deepEqual(qaHTML(h),[]);assert.ok(h.includes('data:image/png;base64,'));assert.equal((h.match(/class="logic"/g)??[]).length,8);assert.equal((h.match(/class="answer"/g)??[]).length,3);
});
test('Case C: 销售 JD 的角色、岗位定义和 Q3 使用本次输入',()=>{
  const d=fixture(base,'销售经理');const h=render(d,base);assert.ok(h.includes('开发客户并管理销售漏斗'));assert.ok(h.includes('销售经理角色1'));assert.ok(!h.includes('推动新品上市并分析市场'));assert.ok(!h.includes('GTM 市场产品经理'));
});
test('拒绝截断 JD、岗位不一致、假图片',()=>{
  const d=fixture(base);d.jd.complete=false;assert.ok(intake(d,base).length);d.jd.complete=true;d.jd.role_title='另一岗位';assert.ok(intake(d,base).length);d.jd.role_title=d.role_full_name;fs.writeFileSync(path.join(base,'fake.png'),'not an image');d.jd.screenshots=['fake.png'];assert.ok(intake(d,base).some(e=>e.includes('图片')));
});
test('拒绝来源断链与缺少真实验收记录',()=>{
  const d=fixture(base);d.facts[0].source_ids=['S999'];d.qa.mobile.passed=false;assert.ok(validate(d,base).some(e=>e.includes('断链')));assert.ok(validate(d,base).some(e=>e.includes('mobile')));
});
test('预览绕过验收记录但有草稿标记，最终模式仍拒绝',()=>{
  const d=fixture(base);delete d.qa;assert.throws(()=>render(d,base));const h=render(d,base,{preview:true});assert.ok(h.includes('data-review-preview="true"'));const f=path.join(base,'preview.html');fs.writeFileSync(f,h);const r=spawnSync(process.execPath,[path.join(root,'scripts/qa.mjs'),f]);assert.equal(r.status,1);
});
test('拒绝图表混用时间或单位口径，null 必须解释',()=>{
  const d=fixture(base);d.sections.layer1.blocks.push({type:'bars',items:[{label:'A',fact_id:'F1'},{label:'B',fact_id:'F2'}]});d.facts[1].value=5;d.facts[1].unit='其他单位';assert.ok(validate(d,base).some(e=>e.includes('口径不一致')));d.facts[0].value=null;assert.ok(validate(d,base).some(e=>e.includes('不可得原因')));
});
test('数据不成为活动 HTML，来源 URL 拒绝 javascript',()=>{
  const d=fixture(base);d.sections.summary.blocks[0].text='<script>alert(1)</script>';assert.ok(render(d,base).includes('&lt;script&gt;'));d.sources[0].url='javascript:alert(1)';assert.ok(validate(d,base).some(e=>e.includes('来源地址无效')));
});
test('KPI 从同一事实读取，不生成不同口径数字',()=>{
  const d=fixture(base);d.facts[0].value=1234.5;const h=render(d,base);assert.ok(h.includes('1,234.5 测试单位'));assert.ok(h.includes('href="#S1"'));
});
test('最终 CLI 可执行并拒绝覆盖已有文件',()=>{
  const d=fixture(base);const f=path.join(base,'valid.json'),out=path.join(base,'final');fs.writeFileSync(f,JSON.stringify(d));const args=[path.join(root,'scripts/render.mjs'),f,out];assert.equal(spawnSync(process.execPath,args).status,0);const html=path.join(out,'synthetic-test_business_sense_gtm_interview_20261005.html');assert.ok(fs.existsSync(html));assert.equal(spawnSync(process.execPath,[path.join(root,'scripts/qa.mjs'),html]).status,0);assert.equal(spawnSync(process.execPath,args).status,1);
});

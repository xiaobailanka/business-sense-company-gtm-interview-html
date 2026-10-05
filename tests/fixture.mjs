import fs from 'node:fs';
import {reviewKeys} from '../scripts/core.mjs';
export function fixture(base,roleName='GTM 市场产品经理') {
  fs.writeFileSync(`${base}/jd.png`,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64'));
  const duty=roleName.startsWith('销售')?'开发客户并管理销售漏斗':'推动新品上市并分析市场';
  return {
    company_full_name:'合成测试公司（非真实研究）',role_full_name:roleName,company_slug:'synthetic-test',role_slug:roleName.startsWith('销售')?'sales':'gtm',cutoff_date:'2026-10-05',
    jd:{screenshots:['jd.png'],role_title:roleName,duties:[{id:'J1',text:duty}],qualifications:['测试资格要求'],complete:true,reviewed:true},
    sources:[{id:'S1',title:'合成测试来源',url:'https://example.com/test',type:'synthetic',published_at:null,accessed_at:'2026-10-05',locator:'仅用于单元测试，不支持真实研究'},{id:'S2',title:'合成 JD',url:'jd://J1',type:'user-jd',published_at:null,accessed_at:'2026-10-05',locator:'合成职责 J1'}],
    facts:[{id:'F1',statement:'合成测试数值',value:10,unit:'测试单位',period:'测试期',scope:'合成范围',source_ids:['S1']},{id:'F2',statement:duty,period:'本次合成 JD',scope:roleName,source_ids:['S2']}],
    kpis:[{label:'合成 KPI',fact_id:'F1'}],
    sections:Object.fromEntries(['summary','layer1','layer2','layer3','layer4'].map(key=>[key,{title:key,blocks:[{type:'fact',text:'仅为结构测试',fact_ids:['F1']},{type:'judgement',text:'合成判断',fact_ids:['F1']},{type:'warning',text:'不是实际公司研究'}]}])),
    strategies:['品牌','渠道','区域','供应链'].map(dimension=>({direction:'合成战略',dimension,why:'测试判断',fact_ids:['F1'],action:'测试行动',metric:'测试指标'})),
    role:{essence:duty,boundaries:'合成边界',self_intro_one_liner:duty,self_intro_explanation:'测试说明',self_intro_bridge:'请按真实经历衔接，不编造经历',roles:[1,2,3].map(i=>({name:`${roleName}角色${i}`,jd_ids:['J1'],translation:duty,responsibility:duty})),capabilities:[1,2,3,4,5].map(i=>({name:`能力${i}`,meaning:duty,jd_ids:['J1']}))},
    interview:{logic_chains:['company','product','region','channel','competition','strategy','innovation','jd'].map(topic=>({topic,fact_ids:[topic==='jd'?'F2':'F1'],judgement:'合成判断',action:duty,metric:'合成指标',...(topic==='jd'?{jd_ids:['J1']}:{})})),...Object.fromEntries(['q1','q2','q3'].map(q=>[q,{script:q==='q3'?duty:'合成面试答案，非真实研究',structure:'测试结构',seconds:65,timing_method:'仅用于测试的声明',fact_ids:[q==='q3'?'F2':'F1'],...(q==='q3'?{jd_ids:['J1']}:{})}]))},
    quick_memo_cards:[{title:'合成速记',text:'仅供测试',fact_ids:['F1']}],
    qa:Object.fromEntries(reviewKeys.map(k=>[k,{passed:true,by:'synthetic-test',checked_at:'2026-10-05',note:'合成测试记录，不能证明真实报告质量'}]))
  };
}

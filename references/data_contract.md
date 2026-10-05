# report.json 数据契约

所有文本为纯文本，不能传 HTML。路径相对 JSON 文件。研究、JD 读取和判断由调用 Skill 的 agent 使用实际材料完成；Node 工具不联网、不 OCR、不生成商业判断。

顶层必填：company_full_name、role_full_name、company_slug、role_slug、cutoff_date、jd、sources、facts、kpis、sections、strategies、role、interview、quick_memo_cards、qa。

- company_slug / role_slug：小写英文数字连字符，用于文件名。
- cutoff_date：真实日期 YYYY-MM-DD。
- jd：与 SKILL.md 中 intake 格式相同，保留本次用户截图和转录；role_title 等于 role_full_name。
- sources：`{id:"S1",title,url,type,published_at,accessed_at,locator}`。发布日期未知时 null；locator 必须说明页码/章节/段落。用户 JD 来源 type 为 user-jd，URL 为 jd://J1；其他来源为真实 HTTP(S) 页面。
- facts：`{id:"F1",statement,period,scope,source_ids:["S1"]}`。数值事实再加 value、unit；不可得数值用 value:null 与 unavailable_reason。不把 source 存在当作证据真实，需要打开来源核验。
- kpis：`[{label,fact_id:"F1"}]`。值由 fact 复用，不另写数值。
- sections：summary、layer1、layer2、layer3、layer4 五个对象，各为 `{title,blocks:[...]}`，覆盖完整业务规范中的全部子议题。
- strategies：4–6 项，至少四个 dimension；每项 `{direction,dimension,why,fact_ids,action,metric}`。
- role：essence、boundaries、self_intro_one_liner、self_intro_explanation、self_intro_bridge；roles 3–5 项 `{name,jd_ids:["J1"],translation,responsibility}`；capabilities 5–7 项 `{name,meaning,jd_ids}`。原文由渲染器按 J-ID 回查。
- interview.logic_chains：恰好八项 `{topic,fact_ids,judgement,action,metric}`，topic 各为 company、product、region、channel、competition、strategy、innovation、jd；jd 项再含 jd_ids。
- interview.q1/q2/q3：各为 `{script,structure,seconds,timing_method,fact_ids}`，q3 再含 jd_ids。Q1/Q3 60–90 秒，Q2 60–75 秒；timing_method 写实际朗读或估算方法。来源与 JD 仍须人工逐句核验。
- quick_memo_cards：`[{title,text,fact_ids}]`，推荐九卡；事实来自统一 fact table，text 写解释不重复手写数值。
- qa：evidence、jd、content、consistency、desktop、mobile、tablet、print 各为 `{passed:true,by,checked_at:"YYYY-MM-DD",note}`。只有实际检查后可填 true。先用 `--preview` 生成草稿用于核验，最终输出必须全部通过。

## blocks 组件

| type | 字段 | 行为 |
| --- | --- | --- |
| fact | text, fact_ids, 可选 title | 蓝色事实与来源 |
| judgement | text, fact_ids, 可选 title | 绿色判断与事实基础 |
| warning | text, 可选 fact_ids/title | 黄色风险或证据缺口 |
| bars | items:[{label,fact_id}], 可选 title | 从 fact 读取非负数值；时间、单位、scope 必须一致；相对最大值展示 |
| table | columns:[文本], rows:[{cells:[文本],fact_ids}], 可选 title | 有来源的对比表 |
| products | items:[{title,text,fact_ids,可选 judgement}], 可选 title | 产品矩阵；战略角色用 judgement 写明 |
| competitors | 同 products | 直接竞品卡；无证据时用 warning 说明 |
| flow | 同 products | GTM 或渠道流程卡 |

每个关键事实、比较项和判断都引用已有 F-ID，F-ID 再引用 S-ID。引用检查可执行，内容真实性不能靠程序判定。测试 fixture 是合成材料，绝不可用于真实报告。

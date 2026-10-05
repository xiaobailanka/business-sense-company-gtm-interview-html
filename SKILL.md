---
name: business-sense-company-gtm-interview-html
description: 基于真实公开资料研究目标公司，并按用户提供的完整岗位 JD 截图拆解岗位，制作可离线打开的单文件 HTML 面试报告。用于公司研究、商业判断和岗位面试准备，适用于 GTM、销售、运营等岗位；不用于只凭公司名生成泛化面试答案。
metadata:
  version: "1.0.0"
  language: "zh-CN"
---

# 公司商业判断 × JD 面试报告

执行前读取 [完整业务规范](references/original_requirements.md) 和 [交付清单](QA_CHECKLIST.md)。按规范的四层结构分析，不把示例公司事实、职责或答案套给新公司。

## 输入门槛

确认公司完整名称、岗位名称，以及用户提供的完整 JD 截图。岗位名称可从截图提取，不要求重复输入。截图须清晰包含岗位名称、职责、任职资格；多张截图按阅读顺序保留。公司身份有歧义或截图截断时只索取缺失信息，不开始最终研究，不生成 HTML。

若缺 JD，回复：“请提供完整岗位 JD 截图，需包含岗位名称、工作职责和任职资格。岗位拆解和面试答案必须依据这份 JD。”

读取实际图片并转录文字；不假设本地脚本具备 OCR。为职责赋予 J1、J2 等 ID，记录原文。确认职责与资格完整、OCR 已复核后填写 intake.json：

```json
{
  "company_full_name": "用户确认的公司完整名称",
  "role_full_name": "截图中的岗位名称",
  "jd": {
    "screenshots": ["jd-1.png", "jd-2.png"],
    "role_title": "截图中的岗位名称",
    "duties": [{"id": "J1", "text": "职责原文"}],
    "qualifications": ["资格原文"],
    "complete": true,
    "reviewed": true
  }
}
```

运行 `node scripts/intake.mjs intake.json`；失败时停止。路径相对 JSON 所在目录。该工具检查文件与图片签名，完整性和转录准确性仍须实际查看截图确认。

## 研究与证据

按“法定披露 > 公司官网 > 官方招聘 > 政府/协会 > 竞品官方 > 权威第三方 > 媒体”建立 source map，再建立 fact table。检索截止日之前最新披露，分别记录财年、半年、季度，不混用比较口径。浏览工具不可用时说明阻塞，不补造数据。

每个 source 记录 ID、标题、URL、类型、发布日期、访问日期、证据位置；每个 fact 记录 ID、原文含义、时间、来源 ID，数值事实另含 value、unit、scope。没有公开数据时用 null 并说明原因；不能把 null 当零。用户 JD 用 jd://J1 形式作为内部来源，公开资料用真实 https URL。

来源、事实、JD 转录与中间数据保存于用户指定工作目录，最终只交付单一 HTML，不上传用户 JD 或报告到公开仓库。

## 综合与表达

按完整规范完成：一句话认知；四层公司研究；产品、地域、用户、渠道、竞品与 GTM 对比；4–6 条战略判断且覆盖至少四个维度；3–5 个 JD 角色；5–7 项由 JD 支撑的能力；恰好 8 条“事实→判断→行动→指标”逻辑链；岗位一句话；Q1/Q2/Q3 口语稿；3 分钟速记卡。

岗位角色、能力、逻辑链和 Q3 必须引用本次 J-ID。销售岗按销售职责重建角色和答案。动作与 KPI 明确为建议，不冒充公司既有目标。未经用户提供，不编写候选人的经历或业绩。

Q1 60–90 秒，Q2 60–75 秒，Q3 60–90 秒；计时须实际朗读或明确标注估算。公开资料不足时保留“暂无可验证数据”，不为满足篇幅编造事实或竞品。非上市公司无公开财务披露时说明不可得，完成适用的核验，而非假称已查到财报。

## 数据与生成

使用 [数据契约](references/data_contract.md) 组装 report.json；[JSON Schema](config/report_schema.json) 用于字段发现。运行时工具完成跨引用与数量等额外检查。

读取 [Golden Reference](references/anker_business_sense_gtm_reference.html) 的 CSS 与组件，只参考视觉；其公司数据与 JD 是示例内容。渲染器沿用包内 [原始模板](templates/report_template.html) 的 CSS，默认不重新设计。

```sh
node scripts/render.mjs report.json ./preview --preview
node scripts/validate.mjs report.json
node scripts/render.mjs report.json ./output
node scripts/qa.mjs ./output/实际文件名.html
```

渲染器自动转义内容、嵌入全部 JD 图片、生成来源锚点；KPI 和速记卡复用 fact ID 的数值，避免多处手写导致不一致。不得传入原始 HTML 或外部 JS/CSS。文件名使用 `{company_slug}_business_sense_{role_slug}_interview_{YYYYMMDD}.html`。

## 验收与交付

先逐项执行 QA_CHECKLIST，再填写 report.json 中 qa 的核验记录，记录实际检查人、日期和说明。工具通过仅代表结构、引用和单文件检查通过，不证明事实真实、JD 完整或视觉正确。

先用 `--preview` 生成带草稿标记的预览，供事实与视觉验收；该模式不要求 qa 通过且不能作为最终报告交付。在浏览器检查桌面、390px 手机、平板及打印；查看截图，确认无横向溢出、JD 清晰、导航可跳转、事实蓝/判断绿/风险黄、深色答案卡。证据不足或浏览器检查未做时不得填写已通过。检查完更新 qa，去掉 `--preview` 重新生成最终 HTML，再复核 qa.mjs。工具不覆盖已有文件，重跑时选择新输出目录。

交付一个 HTML 文件的绝对路径或可下载链接，简述来源截止日与实质限制。研究工具或必需材料阻塞时明确未完成，不交付伪装成最终成果的示例。

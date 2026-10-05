# Business Sense × Company × JD Interview HTML Skill

基于真实公开资料和完整岗位 JD 截图，制作可直接用于面试准备的单文件 HTML。适用于 GTM、销售、运营等岗位，按当次 JD 重建岗位分析。

## 能力

- 公司主营业务、目标市场、竞争关系、长期战略四层研究。
- Source Map 与 Fact Table：事实、判断、风险分开；关键数据保留时间与来源。
- JD 转录与 3–5 个角色拆解、8 条面试逻辑链、岗位一句话、三道核心题、3 分钟速记卡。
- 复用原始 Golden Reference CSS；深蓝 Hero、三色信息卡、深色答案卡、响应式与打印。
- 单 HTML、CSS 内嵌、多张 JD 截图 Base64 嵌入，无 CDN、无外部 JS/CSS。

## 安装到 Codex

将整个仓库文件夹复制到 `~/.codex/skills/business-sense-company-gtm-interview-html/`，确保该目录根部有 SKILL.md。Windows 对应 `%USERPROFILE%\.codex\skills\business-sense-company-gtm-interview-html\`。

也可使用已安装的 skill-installer，从本仓库根目录安装。安装后在新聊天中调用：

```text
使用 $business-sense-company-gtm-interview-html。
公司：公司完整名称
岗位：完整岗位名称
附件：完整 JD 截图（岗位、职责、资格，多图按顺序）
```

缺公司身份或完整 JD 时，Skill 索取缺失信息并停止生成最终报告。

## 本地工具

需要 Node.js 20+，无 npm 依赖。工具负责输入、引用、渲染和结构验收。研究和图片阅读依赖执行 Skill 的 agent 所在环境，不需要或内置 API key。

```sh
npm run check
npm test
node scripts/intake.mjs /path/to/intake.json
node scripts/render.mjs /path/to/report.json ./preview --preview
# 实際核验资料与浏览器视觉，更新 report.json 中 qa 后：
node scripts/validate.mjs /path/to/report.json
node scripts/render.mjs /path/to/report.json ./output
node scripts/qa.mjs ./output/实际文件名.html
```

详细字段见 [数据契约](references/data_contract.md)，行为规则见 [SKILL.md](SKILL.md)。报告文件不会被覆盖，重新生成请用新输出目录。

## 验证边界

测试包含缺 JD 拒绝、完整合成输入生成、销售 JD 切换、断链、假图片、未知数值、混用口径、转义、QA 门槛与文件保护。合成 fixture 不是真实公司研究，也不是真实 JD。

程序检查不能证明公开事实真实性、截图完整性、口语时长或最终视觉质量。每次真实报告必须实际执行 [QA_CHECKLIST.md](QA_CHECKLIST.md)，浏览器验收后才能填通过记录。预览带草稿标记，不能通过最终 QA。

## 来源与隐私

原始业务规范、模板、Golden Reference 来自用户提供的 `business_sense_company_gtm_skill.zip`；以该参考作为内容组织与视觉基准，不沿用其公司数据到其他公司。原始说明保留用于追溯。

公开仓库只包含 Skill 和测试材料；执行时的用户 JD、研究资料与最终报告保存在用户工作目录，不自动上传。

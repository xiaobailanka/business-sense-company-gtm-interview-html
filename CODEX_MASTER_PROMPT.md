# Codex Master Prompt — 搭建 Business Sense × Company × JD Interview HTML Skill

你现在需要把当前目录实现为一个稳定、可复用、可多公司复用的 Codex Skill。

## 目标

用户输入：

1. 公司完整名称
2. 目标岗位完整 JD 截图

Skill 自动完成：

- 真实公开资料研究
- 四层 Business Sense 分析
- 竞品研究
- JD 角色拆解
- 8 条面试逻辑链
- 自我介绍中的岗位一句话理解
- 三道核心面试题
- 3 分钟速记卡
- 最终自包含 HTML

## 必读文件

- `SKILL.md`：功能规范与业务逻辑
- `QA_CHECKLIST.md`：交付前检查
- `references/anker_business_sense_gtm_reference.html`：视觉与内容组织 Golden Reference
- `templates/report_template.html`：通用网页骨架
- `config/report_schema.json`：中间数据结构

## 最重要的实现约束

### 1. 输入门槛必须写进 Skill

如果缺少“公司完整名称”或“完整 JD 截图”，Skill 必须停止，并向用户索取。

不能仅凭公司名 + 岗位名生成最终报告。

### 2. 研究必须基于真实数据

建立 source map 与 fact table。

事实优先级：

法定披露 > 公司官网 > 官方招聘页 > 政府/协会 > 竞品官方 > 权威第三方 > 媒体。

每条关键数据记录：

- 数值
- 时间口径
- 来源 URL
- Source ID

任何无法验证的内容不得数字化断言。

### 3. 将“事实”和“判断”做成不同 HTML 视觉组件

事实：蓝色；判断：绿色；风险：黄色。

### 4. JD 必须真正参与生成

对 JD 做：

- 职责 OCR/读取
- 角色聚类
- 能力要求提炼
- 与公司当前业务阶段映射

最后的一句话岗位理解 + 三道题必须由 JD 驱动。

### 5. 输出视觉必须贴近 Golden Reference

不要重新设计另一套网页。

保持：

- 深蓝 Hero
- 白色卡片
- 蓝绿黄三色信息块
- sticky nav
- 1180px 主内容宽度
- 18px 圆角卡片
- KPI strip
- business bars
- matrix cards
- dark interview cards
- source list

### 6. 最终 HTML 自包含

- 单 HTML 文件
- CSS inline
- JD 截图 Base64 inline
- 无 CDN
- 无 React/Vue
- 无外部 JS
- 可离线打开

### 7. 最终命名

`{company_slug}_business_sense_{role_slug}_interview_{YYYYMMDD}.html`

## 实现建议

你可以将 Skill 内部拆成这些模块：

- `intake.py`
- `jd_parser.py`
- `research.py`
- `fact_store.py`
- `synthesis.py`
- `interview.py`
- `render.py`
- `qa.py`

如果 Codex Skill 环境不需要 Python 文件，也可以将这些模块写成明确的 Skill Instructions，但模块职责必须保持。

## 验收用例

### Case A — 缺 JD

输入：

> 帮我做苹果公司 GTM 岗位研究。

预期：

- 不生成报告
- 要求用户上传完整 JD 截图

### Case B — 有公司 + 完整 JD

输入：

> 公司：安克创新
> 附件：GTM 市场产品经理完整 JD

预期：

- 完整研究
- 生成单 HTML
- JD 截图嵌入
- 8 条逻辑链
- 一句话岗位理解
- 三道面试题

### Case C — 换成销售岗

预期：

- 不能继续沿用 GTM 的职责和 Q3
- 需要重新按销售 JD 拆岗位

## 完成后自检

严格执行 `QA_CHECKLIST.md`。

只有全部通过才交付。

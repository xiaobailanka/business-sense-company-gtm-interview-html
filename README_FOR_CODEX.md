# 给 Codex 的搭建说明

请将本目录实现为一个可复用 Skill。

## 你要做的不是“复制安克报告”

你要复现的是：

1. 四层商业 Sense 的研究范式
2. 真实数据与来源控制
3. 完整 JD 驱动的岗位拆解
4. 事实 → 判断 → 行动 → 指标的表达逻辑
5. 与参考 HTML 高度一致的网页视觉系统
6. 单文件、自包含 HTML 的最终交付

## 首要交互规则

Skill 被调用后，先检查：

- 公司完整名称是否存在
- 目标岗位完整 JD 截图是否存在

若缺失，先索取，不开始最终报告生成。

## 视觉 Golden Reference

`references/anker_business_sense_gtm_reference.html`

这是排版和组件的唯一视觉基准。请优先复用其：

- CSS Variables
- Hero
- Sticky Nav
- KPI Cards
- Fact/Judgement/Warning Blocks
- Product Matrix
- Competitor Cards
- GTM Flow
- JD Input Gate
- JD Screenshot Layout
- Logic Chains
- Self-intro One-liner
- Dark Interview Answer Cards
- Quick Memo Cards
- Sources
- Responsive / Print CSS

## 建议 Skill 工作流

1. 输入校验
2. JD 图片解析
3. Web Research
4. Source Map
5. Fact Table
6. Four-layer Synthesis
7. JD Role Translation
8. Logic Chains
9. Interview Scripts
10. Render HTML
11. QA
12. 保存成单一 HTML

## Web Research 要求

- 优先公司官网、IR、法定披露
- 所有关键数字带年份/周期
- 最新数据优先
- 竞品优先官方页面
- 没有可靠数据时明确写“暂无可验证数据”
- 不要猜市场份额

## 图片处理

将用户提供的 JD 截图转为 Base64 并直接嵌入 HTML：

```html
<img class="jd-shot" src="data:image/png;base64,..." />
```

最终文件不能依赖原图路径。

## 最终输出

只交付一个用户可打开的：

`*.html`

同时在对话中给出文件路径/链接。

## 禁止事项

- 不要把 Golden Reference 中的安克数据硬编码到别的公司
- 不要把 Anker 的 GTM JD 套用给别的岗位
- 不要复制旧面试答案
- 不要输出假图、假数据、假市场份额
- 不要省略 Sources
- 不要生成只有“好看”但没有业务判断的网页

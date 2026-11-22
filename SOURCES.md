# 题库来源与参考说明

## 结论先行

- 本项目是**非官方**练习工具，与岱恩教育、岱恩语培及其关联公司无隶属或合作关系。
- 题库**不包含**岱恩官方真题、付费题库、内部资料或未授权试题。
- 全部题目由本项目**原创编写**，少量题目在题型结构上参考公开英语样题后**重新改写**，并在题目中标记为 `adapted-public`。
- 分数、CEFR 等级、薄弱点分析均为练习估算，不代表任何官方测评结果。

## 公开参考

以下资料仅用于理解考试结构、能力维度与题型设计，不用于复制题目原文：

1. **岱恩语培公开介绍页**（dailyedu.com）
   - 用于了解其公开宣传的 CEFR 分级、AI 自适应、听说读写能力框架、企业商务英语场景与月度机测形式。
   - 未从该站点抓取或复制任何付费题库、真题或内部测评内容。

2. **CEFR 欧洲语言共同参考框架**（Council of Europe）
   - 参考 A1–C1 的能力描述与等级划分。
   - 参考页面：<https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions>
   - CEFR 用于题目难度标注与结果映射，不表示本系统获得官方认证。

3. **公开 CEFR / 英语测评样题结构**
   - Cambridge Linguaskill Reading 任务说明（<https://www.cambridgeenglish.org/Images/730810-linguaskill-reading.pdf>）：参考其考查主旨、观点、写作目的、隐含意义与语篇级理解的思路。
   - UIC B1/B2 Multilevel Exam 阅读样题（<https://www.uic.es/sites/default/files/2020-09/b1-b2_reading_examples_1.pdf>）：参考标题匹配、细节理解与推断题的题型组织。
   - Michigan ECCE Example Items（<https://michiganassessment.org/wp-content/uploads/2020/01/ECCE-Example-Items.pdf>）：参考主旨、指代、结论与作者态度类问题的设计方式。
   - Helbling B2 Reading 样题（<https://www.helbling.com/sites/default/files/media/documents/886289130_Demo.pdf>）：参考根据文本证据判断正误并定位依据的思路。
   - English, no kidding! A1–C2 阅读样题（<https://englishnokidding.com/free/esl-reading-comprehension-passages>）：参考随级别提升而增加的推断、词汇语境与跨段落理解要求。
   - 以上资料仅用于理解题型与能力点；题干、选项、听力脚本、阅读材料与解析均为本项目重新编写，未复制原题或答案句。

## 题库生成方法

题库位于 `scripts/content/`，由结构化数据与模板生成：

| 模块 | 生成方式 | 题量 |
| --- | --- | --- |
| 听力 | 20 类场景 × 5 个变体 × 3 个考查焦点 = 300 组材料，每组 1 题 | 300 |
| 词汇 | 100 个词条 × 3 种题型（词义、语境填空、近义替换） | 300 |
| 语法 | 60 个语法点 × 5 个变体 | 300 |
| 阅读 | 20 类材料 × 3 个变体 = 60 篇短文，每篇 5 道推断/主旨/目的/词义/态度题 | 300 |
| **合计** |  | **1200** |

生成后由 `npm run bank:validate` 检查：

- 每部分 300 题、总计 1200 题；
- 每题 4 个唯一选项，答案索引合法；
- 题目 ID 唯一，等级与难度一致；
- 听力题必须关联存在的题组，阅读题必须关联存在的短文；
- 每组听力材料**恰好 1 题**，阅读短文固定 5 题；
- 阅读题的正确答案不得与原文句子原样重复，必须是改写或推断表述；
- 全库题干唯一数不少于 800，听力至少覆盖 4 种题型，阅读覆盖主旨、推断、词义、目的与态度；
- `adapted-public` 题目必须带来源说明。

## 来源字段

每道题包含 `source` 字段：

- `original`：本项目原创编写。
- `adapted-public`：题型结构参考公开样题，内容、选项与解析重新编写；题目带 `sourceNote`。

当前题库中约 90% 为 `original`，约 10% 为 `adapted-public`。具体数量可用 `npm run bank:stats` 查看。

## 免责声明

本系统仅用于个人英语练习与自测。系统名称中的“岱恩”用于说明练习风格与目标场景，不表示官方授权、合作或认可。如需参加公司正式考试或岱恩官方测评，请以公司及岱恩官方通知为准。

如你是权利持有人，认为本项目某处内容侵犯了你的权益，请提供具体题目 ID 与权利证明，我们会及时核查并删除相关内容。

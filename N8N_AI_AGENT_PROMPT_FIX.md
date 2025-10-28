# N8N AI Agent提示修复指南

## 🎯 问题诊断

您的AI Agent提示中有表达式`{{ $json['关键词'] }}`和`{{ $json.URL }}`，但这些表达式在AI Agent节点中不会被解析。问题在于：

1. **AI Agent无法解析表达式** - AI Agent节点不会解析N8N表达式
2. **提示格式错误** - 表达式应该直接替换为实际值
3. **数据传递失败** - AI Agent无法获取Webhook传入的数据

## 🔧 完整解决方案

### 修复AI Agent节点配置

在AI Agent节点中，使用以下正确的提示：

```
您是一个专业的SEO内容英文创作助手。请根据提供的关键词和URL创作高质量的SEO优化文章，并自然地将URL嵌入到文章中，锚文本用关键词本身。

请为我针对以下关键词写一篇SEO文章，并在文章中自然嵌入提供的URL。

关键词：{{ $json['关键词'] }}
嵌入URL：{{ $json.URL }}

文章要求：
1. 字数800-1200字，结构清晰
2. 自然地将提供的URL嵌入到相关内容中
3. 包含一个H1、H2标题层级
4. 使用项目符号或编号列表
5. 包含实际可操作的建议
6. 语言专业且易于理解

请严格按照以下JSON格式返回，内容必须是HTML格式：

{
  "title": "文章标题",
  "content": "文章内容，使用HTML格式，包含段落、标题、列表等",
  "author": "Admin",
  "category": "business",
  "tags": ["invoice", "business", "automation"]
}

文章内容要求：
- 使用HTML格式（p、h1、h2、ul、li等标签）
- 自然嵌入URL链接，锚文本用关键词本身
- 不要重复使用同一个URL超过2次
- 确保文章结构清晰，有合理的段落划分
```

### 完整的工作流节点配置

#### 1. Webhook节点
接收新文章请求，包含：
```json
{
  "关键词": "free invoice program",
  "URL": "https://freeonlineinvoice.org/",
  "topic": "Free Invoice Program Benefits",
  "target_audience": "small business owners and freelancers"
}
```

#### 2. AI Agent节点
配置：
- **Mode**: Execute Once
- **Text**: 使用上面的修复提示
- **Options**: 确保表达式解析开启

#### 3. HTTP GET请求节点
获取当前文件信息
```
Method: GET
URL: https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json
```

#### 4. Function节点 - 提取SHA值
使用之前的SHA提取代码

#### 5. Function节点 - 准备GitHub数据
使用之前的代码

#### 6. HTTP PUT请求节点
配置保持不变

---

## 🚀 立即修复步骤

### 步骤1：修复AI Agent节点提示

在AI Agent节点中，使用上面的修复提示。

### 步骤2：验证Webhook数据

确保Webhook节点接收正确的数据格式：
```json
{
  "关键词": "free invoice program",
  "URL": "https://freeonlineinvoice.org/",
  "topic": "Free Invoice Program Benefits",
  "target_audience": "small business owners and freelancers"
}
```

### 步骤3：测试AI Agent节点

单独测试AI Agent节点，查看输出格式：
- 应该是正确的JSON格式
- 包含title, content, author, category, tags字段

### 步骤4：验证完整工作流

使用测试数据触发Webhook，检查整个数据流。

---

## 🔍 调试技巧

### 检查AI Agent输出格式

1. **测试AI Agent节点单独运行**
2. **查看输出格式**：
   - 应该是JSON对象
   - 包含所有必需字段
   - 内容应该是HTML格式

### 常见问题解决

#### 问题1：AI Agent输出不是JSON
**解决**：检查提示格式，确保要求返回JSON

#### 问题2：表达式没有被解析
**解决**：确保AI Agent节点配置正确，表达式解析开启

#### 问题3：字段缺失
**解决**：在提示中明确要求所有字段

### 验证数据流

1. **Webhook输入**：查看传入数据
2. **AI Agent输出**：查看生成的JSON
3. **Function节点输出**：确保包含message, content, sha

---

## 🧪 测试数据流

### 预期Webhook输入
```json
{
  "关键词": "free invoice program",
  "URL": "https://freeonlineinvoice.org/",
  "topic": "Free Invoice Program Benefits",
  "target_audience": "small business owners and freelancers"
}
```

### 预期AI Agent输出
```json
{
  "title": "Unlock Efficiency with a Free Invoice Program: A Comprehensive Guide",
  "content": "<h1>Unlock Efficiency with a Free Invoice Program: A Comprehensive Guide</h1><p>In today's fast-paced business world, managing invoices efficiently is crucial for maintaining cash flow, building professional relationships, and ensuring compliance with financial regulations. However, many small businesses, freelancers, and startups struggle with the costs and complexities of traditional invoicing software. That's where a <a href=\"https://freeonlineinvoice.org/\" rel=\"noopener\" target=\"_blank\">free invoice program</a> comes into play—offering a cost-effective solution to streamline your billing processes without breaking the bank.</p><h2>Benefits of Using a Free Invoice Program</h2><p>Adopting a free invoice program can revolutionize how you handle billing, saving you time and resources while improving accuracy. These programs are designed to simplify tasks that would otherwise require manual effort, such as generating invoices, tracking payments, and managing client data.</p><ul><li><strong>Cost Savings:</strong> As the name suggests, these programs eliminate subscription fees, making them ideal for budget-conscious businesses.</li><li><strong>Ease of Use:</strong> Most free invoice tools feature intuitive interfaces, allowing even non-technical users to create and send invoices in minutes.</li><li><strong>Accessibility:</strong> Many programs are cloud-based, enabling you to access your invoices from any device with an internet connection.</li></ul>",
  "author": "Admin",
  "category": "business",
  "tags": ["invoice", "business", "automation"]
}
```

### 预期Function节点输出
```json
{
  "message": "Add new article via N8N automation: Unlock Efficiency with a Free Invoice Program: A Comprehensive Guide",
  "content": "ewogICJhcnRpY2xlcyI6IFsKICAgIHsKICAgICAgImlkIjogMTc2MTYwMTc2MzI0MywKICAgICAgInNsdWciOiAidW5sb2NrLWVmZmljaWVuY3ktd2l0aC1hLWZyZWUtaW52b2ljZS1wcm9ncmFtLWEtY29tcHJlaGVuc2l2ZS1ndWlkZSIsCiAgICAgICJ0aXRsZSI6ICJVbmxvY2sgRWZmaWNpZW5jeSB3aXRoIGEgRnJlZSBJbnZvaWNlIFByb2dyYW06IEEgQ29tcHJlaGVuc2l2ZSBHdWlkZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJVbmxvY2sgRWZmaWNpZW5jeSB3aXRoIGEgRnJlZSBJbnZvaWNlIFByb2dyYW06IEEgQ29tcHJlaGVuc2l2ZSBHdWlkZVxuXG5JbiB0b2RheSdzIGZhc3QtcGFjZWQgYnVzaW5lc3Mgd29ybGQsIG1hbmFnaW5nIGludm9pY2VzIGVmZmljaWVudGx5IGlzIGNydWNpYWwgZm9yIG1haW50YWluaW5nIGNhc2ggZmxvdywgYnVpbGRpbmcgcHJvZmVzc2lvbmFsIHJlLi4uIiwKICAgICAgImNvbnRlbnQiOiAiPGgxPlVubG9jayBFZmZpY2llbmN5IHdpdGggYSBGcmVlIEludm9pY2UgUHJvZ3JhbTogQSBDb21wcmVoZW5zaXZlIEd1aWRlPC9oMT48cD5JbiB0b2RheSdzIGZhc3QtcGFjZWQgYnVzaW5lc3Mgd29ybGQsIG1hbmFnaW5nIGludm9pY2VzIGVmZmljaWVudGx5IGlzIGNydWNpYWwgZm9yIG1haW50YWluaW5nIGNhc2ggZmxvdywgYnVpbGRpbmcgcHJvZmVzc2lvbmFsIHJlbGF0aW9uc2hpcHMsIGFuZCBlbnN1cmluZyBjb21wbGlhbmNlIHdpdGggZmluYW5jaWFsIHJlZ3VsYXRpb25zLiBIb3dldmVyLCBtYW55IHNtYWxsIGJ1c2luZXNzZXMsIGZyZWVsYW5jZXJzLCBhbmQgc3RhcnR1cHMgc3RydWdnbGUgd2l0aCB0aGUgY29zdHMgYW5kIGNvbXBsZXhpdGllcyBvZiB0cmFkaXRpb25hbCBpbnZvaWNpbmcgc29mdHdhcmUuIFRoYXQncyB3aGVyZSBhIDxhIGhyZWY9XCJodHRwczovL2ZyZWVvbmxpbmVpbnZvaWNlLm9yZy9cIiByZWw9XCJub29wZW5lclwiIHRhcmdldD1cIl9ibGFua1wiPmZyZWUgaW52b2ljZSBwcm9ncmFtPC9hPiBjb21lcyBpbnRvIHBsYXnigJNvZmZlcmluZyBhIGNvc3QtZWZmZWN0aXZlIHNvbHV0aW9uIHRvIHN0cmVhbWxpbmUgeW91ciBiaWxsaW5nIHByb2Nlc3NlcyB3aXRob3V0IGJyZWFraW5nIHRoZSBiYW5rLjwvcD48aDI+QmVuZWZpdHMgb2YgVXNpbmcgYSBGcmVlIEludm9pY2UgUHJvZ3JhbTwvaDI+PHA+QWRvcHRpbmcgYSBmcmVlIGludm9pY2UgcHJvZ3JhbSBjYW4gcmV2b2x1dGlvbml6ZSBob3cgeW91IGhhbmRsZSBiaWxsaW5nLCBzYXZpbmcgeW91IHRpbWUgYW5kIHJlc291cmNlcyB3aGlsZSBpbXByb3ZpbmcgYWNjdXJhY3kuIFRoZXNlIHByb2dyYW1zIGFyZSBkZXNpZ25lZCB0byBzaW1wbGlmeSB0YXNrcyB0aGF0IHdvdWxkIG90aGVyd2lzZSByZXF1aXJlIG1hbnVhbCBlZmZvcnQsIHN1Y2ggYXMgZ2VuZXJhdGluZyBpbnZvaWNlcywgdHJhY2tpbmcgcGF5bWVudHMsIGFuZCBtYW5hZ2luZyBjbGllbnQgZGF0YS48L3A+PHVsPjxsaT48c3Ryb25nPkNvc3QgU2F2aW5nczo8L3N0cm9uZz4gQXMgdGhlIG5hbWUgc3VnZ2VzdHMsIHRoZXNlIHByb2dyYW1zIGVsaW1pbmF0ZSBzdWJzY3JpcHRpb24gZmVlcywgbWFraW5nIHRoZW0gaWRlYWwgZm9yIGJ1ZGdldC1jb25zY2lvdXMgYnVzaW5lc3Nlcy48L2xpPjxsaT48c3Ryb25nPkVhc2Ugb2YgVXNlOjwvc3Ryb25nPiBNb3N0IGZyZWUgaW52b2ljZSB0b29scyBmZWF0dXJlIGludHVpdGl2ZSBpbnRlcmZhY2VzLCBhbGxvd2luZyBldmVuIG5vbi10ZWNobmljYWwgdXNlcnMgdG8gY3JlYXRlIGFuZCBzZW5kIGludm9pY2VzIGluIG1pbnV0ZXMuPC9saT48bGk+PHN0cm9uZz5BY2Nlc3NpYmlsaXR5Ojwvc3Ryb25nPiBNYW55IHByb2dyYW1zIGFyZSBjbG91ZC1iYXNlZCwgZW5hYmxpbmcgeW91IHRvIGFjY2VzcyB5b3VyIGludm9pY2VzIGZyb20gYW55IGRldmljZSB3aXRoIGFuIGludGVybmV0IGNvbm5lY3Rpb24uPC9saT48L3VsPiIsCiAgICAgICJhdXRob3IiOiAiQWRtaW4iLAogICAgICAicHVibGlzaGVkX2F0IjogIjIwMjUtMTAtMjgiLAogICAgICAiY2F0ZWdvcnkiOiAiYnVzaW5lc3MiLAogICAgICAidGFncyI6IFsKICAgICAgICAiaW52b2ljZSIsCiAgICAgICAgImJ1c2luZXNzIiwKICAgICAgICAiYXV0b21hdGlvbiIKICAgICAgXSwKICAgICAgIm1ldGFfdGl0bGUiOiAiVW5sb2NrIEVmZmljaWVuY3kgd2l0aCBhIEZyZWUgSW52b2ljZSBQcm9ncmFtOiBBIENvbXByZWhlbnNpdmUgR3VpZGUiLAogICAgICAibWV0YV9kZXNjcmlwdGlvbiI6ICJVbmxvY2sgRWZmaWNpZW5jeSB3aXRoIGEgRnJlZSBJbnZvaWNlIFByb2dyYW06IEEgQ29tcHJlaGVuc2l2ZSBHdWlkZVxuXG5JbiB0b2RheSdzIGZhc3QtcGFjZWQgYnVzaW5lc3Mgd29ybGQsIG1hbmFnaW5nIGludm9pY2VzIGVmZmljaWVudGx5IGlzIGNydWNpYWwgZm9yIG1haW50YWluaW5nIGNhc2ggZmxvdywgYnVpbGRpbmcgcHJvZmVzc2lvbmFsIHJlLi4uIiwKICAgICAgImZlYXR1cmVkIjogZmFsc2UKICAgIH0KICBdCn0=",
  "sha": "cef67a6fcfc0ed29e4aed724c557779e97c7c3b3"
}
```

---

## 🎉 关键提醒

- **AI Agent提示** - 使用正确的表达式格式
- **Webhook数据** - 确保包含关键词和URL
- **表达式解析** - 确保AI Agent节点配置正确
- **JSON格式** - 要求AI Agent返回标准JSON格式

### 🏆 恭喜！

按照这个修复方案，您的AI Agent应该能够正确生成JSON格式的文章内容，整个工作流应该能够成功运行！

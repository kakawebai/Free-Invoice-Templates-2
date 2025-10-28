# N8N 数据流修复指南

## 🎯 问题诊断

您的数据流存在以下问题：
1. **表达式显示灰色/红色** - 表示数据不存在
2. **Function节点输出不正确** - 没有正确准备数据
3. **数据流不匹配** - 节点之间的数据传递有问题

## 🔧 完整解决方案

### 工作流节点顺序和配置

#### 1. Webhook节点
接收新文章请求

#### 2. AI Agent节点
生成SEO文章内容

#### 3. HTTP GET请求节点
获取当前SHA值和文章列表
```javascript
// 输出应该包含：
{
  "currentSHA": "cef67a6fcfc0ed29e4aed724c557779e97c7c3b3",
  "currentArticles": [...现有文章列表...]
}
```

#### 4. Function节点 - 准备GitHub数据
使用以下代码：

```javascript
// 准备GitHub更新数据
// 输入：$json.article (来自AI Agent) 和 $json.currentSHA (来自GET请求)

// 生成文章数据
const articleData = {
  id: Date.now(),
  slug: ($json.article.title || "new-article").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  title: $json.article.title || "New Article",
  description: $json.article.description || "Article description",
  content: $json.article.content || "Article content",
  author: $json.article.author || "Admin",
  published_at: new Date().toISOString().split('T')[0],
  category: $json.article.category || "business",
  tags: $json.article.tags || ["automation"],
  meta_title: $json.article.title || "New Article",
  meta_description: $json.article.description || "Article description",
  featured: false
};

// 获取当前文章列表并添加新文章
const currentArticles = $json.currentArticles || [];
const updatedArticles = [articleData, ...currentArticles];

const articlesJson = {
  articles: updatedArticles
};

// Base64编码
const encodedContent = Buffer.from(JSON.stringify(articlesJson, null, 2)).toString('base64');

// 准备PUT请求数据
const putData = {
  message: `Add new article via N8N automation: ${articleData.title}`,
  content: encodedContent,
  sha: $json.currentSHA || ""
};

return putData;
```

#### 5. HTTP PUT请求节点
配置：
```
Method: PUT
URL: https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json

Headers:
- Content-Type: application/json
- Accept: application/vnd.github.v3+json
- User-Agent: N8N-Automation

Body (Using Fields Below):
- message: {{ $json.message }}
- content: {{ $json.content }}
- sha: {{ $json.sha }}
```

---

## 🚀 立即修复步骤

### 步骤1：检查GET请求节点输出

确保GET请求节点输出包含：
- `currentSHA` - 当前文件的SHA值
- `currentArticles` - 当前文章列表

### 步骤2：修复Function节点代码

使用上面的完整代码替换当前的Function节点代码。

### 步骤3：验证数据流

1. **测试GET请求节点** - 确保输出正确的SHA值和文章列表
2. **测试Function节点** - 确保输出包含：
   - `message`
   - `content` (Base64编码)
   - `sha`

### 步骤4：测试完整工作流

使用测试数据触发Webhook：
```json
{
  "topic": "Free Invoice Program Benefits",
  "keywords": ["invoice", "business", "automation", "free"],
  "target_audience": "small business owners and freelancers"
}
```

---

## 🔍 调试技巧

### 检查数据流

1. **逐个测试节点**：
   - 测试GET请求节点单独运行
   - 测试Function节点单独运行
   - 查看每个节点的输出数据

2. **验证表达式**：
   - 确保表达式引用的字段存在
   - 检查字段名称拼写
   - 确认数据流正确连接

### 常见问题解决

#### 问题1：表达式显示灰色
**原因**：数据不存在或字段名错误
**解决**：检查前一个节点的输出数据

#### 问题2：表达式显示红色
**原因**：语法错误或数据格式错误
**解决**：检查表达式语法和数据格式

#### 问题3：Base64编码错误
**原因**：JSON格式错误
**解决**：确保JSON.stringify正确工作

---

## 🧪 测试数据流

### 预期Function节点输出
```json
{
  "message": "Add new article via N8N automation: Unlock Efficiency with a Free Invoice Program: A Comprehensive Guide",
  "content": "ewogICJhcnRpY2xlcyI6IFsKICAgIHsKICAgICAgImlkIjogMTc2MTM1OTU0OTI4NSwKICAgICAgInNsdWciOiAidW5sb2NrLWVmZmljaWVuY3ktd2l0aC1hLWZyZWUtaW52b2ljZS1wcm9ncmFtLWEtY29tcHJlaGVuc2l2ZS1ndWlkZSIsCiAgICAgICJ0aXRsZSI6ICJVbmxvY2sgRWZmaWNpZW5jeSB3aXRoIGEgRnJlZSBJbnZvaWNlIFByb2dyYW06IEEgQ29tcHJlaGVuc2l2ZSBHdWlkZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJMZWFybiBob3cgYSBmcmVlIGludm9pY2UgcHJvZ3JhbSBjYW4gdHJhbnNmb3JtIHlvdXIgYnVzaW5lc3Mgb3BlcmF0aW9ucy4uLiIsCiAgICAgICJjb250ZW50IjogIjxoMT5VbmxvY2sgRWZmaWNpZW5jeSB3aXRoIGEgRnJlZSBJbnZvaWNlIFByb2dyYW06IEEgQ29tcHJlaGVuc2l2ZSBHdWlkZTwvaDE+XG5cbjxwPkluIHRvZGF5J3MgZmFzdC1wYWNlZCBidXNpbmVzcyB3b3JsZCwgbWFuYWdpbmcgaW52b2ljZXMgZWZmaWNpZW50bHkgaXMgY3J1Y2lhbCBmb3IgbWFpbnRhaW5pbmcgY2FzaCBmbG93LCBidWlsZGluZyBwcm9mZXNzaW9uYWwgcmVsYXRpb25zaGlwcywgYW5kIGVuc3VyaW5nIGNvbXBsaWFuY2Ugd2l0aCBmaW5hbmNpYWwgcmVndWxhdGlvbnMuIEhvd2V2ZXIsIG1hbnkgc21hbGwgYnVzaW5lc3NlcywgZnJlZWxhbmNlcnMsIGFuZCBzdGFydHVwcyBzdHJ1Z2dsZSB3aXRoIHRoZSBjb3N0cyBhbmQgY29tcGxleGl0aWVzIG9mIHRyYWRpdGlvbmFsIGludm9pY2luZyBzb2Z0d2FyZS4gVGhhdCdzIHdoZXJlIGEgZnJlZSBpbnZvaWNlIHByb2dyYW0gY29tZXMgaW50byBwbGF5IOKAkyBvZmZlcmluZyBhIGNvc3QtZWZmZWN0aXZlIHNvbHV0aW9uIHRvIHN0cmVhbWxpbmUgeW91ciBiaWxsaW5nIHByb2Nlc3NlcyB3aXRob3V0IGJyZWFraW5nIHRoZSBiYW5rLiBJbiB0aGlzIGFydGljbGUsIHdlJ2xsIGV4cGxvcmUgdGhlIGJlbmVmaXRzIG9mIHVzaW5nIHN1Y2ggcHJvZ3JhbXMsIHByb3ZpZGUgYWN0aW9uYWJsZSB0aXBzIGZvciBzZWxlY3RpbmcgYW5kIGltcGxlbWVudGluZyBvbmUsIGFuZCBoaWdobGlnaHQgaG93IGEgcmVsaWFibGUgdG9vbCBjYW4gdHJhbnNmb3JtIHlvdXIgZmluYW5jaWFsIG1hbmFnZW1lbnQuIEJ5IHRoZSBlbmQsIHlvdSdsbCBoYXZlIGEgY2xlYXIgcm9hZG1hcCB0byBsZXZlcmFnZSB0aGVzZSB0b29scyBmb3IgZW5oYW5jZWQgcHJvZHVjdGl2aXR5IGFuZCBncm93dGguPC9wPiIsCiAgICAgICJhdXRob3IiOiAiQWRtaW4iLAogICAgICAicHVibGlzaGVkX2F0IjogIjIwMjUtMTAtMjgiLAogICAgICAiY2F0ZWdvcnkiOiAiYnVzaW5lc3MiLAogICAgICAidGFncyI6IFsKICAgICAgICAiaW52b2ljZSIsCiAgICAgICAgImJ1c2luZXNzIiwKICAgICAgICAiYXV0b21hdGlvbiIKICAgICAgXSwKICAgICAgIm1ldGFfdGl0bGUiOiAiVW5sb2NrIEVmZmljaWVuY3kgd2l0aCBhIEZyZWUgSW52b2ljZSBQcm9ncmFtOiBBIENvbXByZWhlbnNpdmUgR3VpZGUiLAogICAgICAibWV0YV9kZXNjcmlwdGlvbiI6ICJMZWFybiBob3cgYSBmcmVlIGludm9pY2UgcHJvZ3JhbSBjYW4gdHJhbnNmb3JtIHlvdXIgYnVzaW5lc3Mgb3BlcmF0aW9ucy4uLiIsCiAgICAgICJmZWF0dXJlZCI6IGZhbHNlCiAgICB9LAogICAgewogICAgICAiaWQiOiAxNzYxMzU5NTQ5Mjg1LAogICAgICAic2x1ZyI6ICJ0aGUtdWx0aW1hdGUtZ3VpZGUtdG8tZnJlZS1pbnZvaWNlLXRlbXBsYXRlcy10by1kbyIsCiAgICAgICJ0aXRsZSI6ICJUaGUgVWx0aW1hdGUgR3VpZGUgdG8gRnJlZSBJbnZvaWNlIFRlbXBsYXRlcyB0byBEb3dubG9hZCBmb3IgWW91ciBCdXNpbmVzcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICI8aDE+VGhlIFVsdGltYXRlIEd1aWRlIHRvIEZyZWUgSW52b2ljZSBUZW1wbGF0ZXMgdG8gRG93bmxvYWQgZm9yIFlvdXIgQnVzaW5lc3M8L2gxPlxuXG48cD5JbiB0b2RheSdzIGNvbXBldGl0aXZlIGJ1c2luZXNzIGxhbmRzY2FwZSwgZWZmaWNpZW5jeSBhbmQgcHJvZmVzc2lvbmFsaXNtIGFyZSBwYXJhbW91bnQgZm9yIHN1Y2Nlc3MuIE9uZSBvZnRlbi1vdmVybG9va2VkIHRvb2wgdGhhdCBjYW4gc2lnbmlmaWNhbnRseSBlbmhhbmNlIHlvdXIgb3BlcmF0aW9ucyBpcyBhIGZyZWUgaW52b2ljZSB0ZW1wbGF0ZSB0byBkb3dubG9hZC4gVGhlc2UgdGVtcGxhdGVzIHN0cmVhbWxpbmUgdGhlIGludm9pY2luZyBwcm9jZXNzLCByZWR1Y2UgZXJyb3JzLCBhbmQgaGVscCB5b3UgbWFpbnRhaW4gYSBjb25zaXN0ZW50IGJyYW5kIGltYWdlLiBXaGV0aGVyIHlvdSdyZSBhIGZyZWVsYW5jZXIsIHNtYWxsIGJ1c2luZXNzIG93bmVyLCBvciBwYXJ0IG9mIGEgbGFyZ2VyIG9yZ2FuaXphdGlvbiwgbGV2ZXJhZ2luZyBmcmVlIGludm9pY2UgdGVtcGxhdGVzIGNhbiBzYXZlIHlvdSB0aW1lIGFuZCBtb25leSB3aGlsZSBlbnN1cmluZyB5b3UgZ2V0IHBhaWQgcHJvbXB0bHkuIEluIHRoaXMgY29tcHJlaGVuc2l2ZSBndWlkZSwgd2UnbGwgZGVsdmUgaW50byB0aGUgYmVuZWZpdHMgb2YgdXNpbmcgdGhlc2UgdGVtcGxhdGVzLCBob3cgdG8gY2hvb3NlIHRoZSByaWdodCBvbmUsIGFuZCBwcmFjdGljYWwgc3RlcHMgdG8gaW1wbGVtZW50IHRoZW0gZWZmZWN0aXZlbHkuIEJ5IHRoZSBlbmQsIHlvdSdsbCBiZSBlcXVpcHBlZCB3aXRoIGFjdGlvbmFibGUgaW5zaWdodHMgdG8gb3B0aW1pemUgeW91ciBpbnZvaWNpbmcgd29ya2Zsb3cuPC9wPiIsCiAgICAgICJjb250ZW50IjogIjxoMT5UaGUgVWx0aW1hdGUgR3VpZGUgdG8gRnJlZSBJbnZvaWNlIFRlbXBsYXRlcyB0byBEb3dubG9hZCBmb3IgWW91ciBCdXNpbmVzcyA8L2gxPlxuXG48cD5JbiB0b2RheSdzIGNvbXBldGl0aXZlIGJ1c2luZXNzIGxhbmRzY2FwZSwgZWZmaWNpZW5jeSBhbmQgcHJvZmVzc2lvbmFsaXNtIGFyZSBwYXJhbW91bnQgZm9yIHN1Y2Nlc3MuIE9uZSBvZnRlbi1vdmVybG9va2VkIHRvb2wgdGhhdCBjYW4gc2lnbmlmaWNhbnRseSBlbmhhbmNlIHlvdXIgb3BlcmF0aW9ucyBpcyBhIGZyZWUgaW52b2ljZSB0ZW1wbGF0ZSB0byBkb3dubG9hZC4gVGhlc2UgdGVtcGxhdGVzIHN0cmVhbWxpbmUgdGhlIGludm9pY2luZyBwcm9jZXNzLCByZWR1Y2UgZXJyb3JzLCBhbmQgaGVscCB5b3UgbWFpbnRhaW4gYSBjb25zaXN0ZW50IGJyYW5kIGltYWdlLiBXaGV0aGVyIHlvdSdyZSBhIGZyZWVsYW5jZXIsIHNtYWxsIGJ1c2luZXNzIG93bmVyLCBvciBwYXJ0IG9mIGEgbGFyZ2VyIG9yZ2FuaXphdGlvbiwgbGV2ZXJhZ2luZyBmcmVlIGludm9pY2UgdGVtcGxhdGVzIGNhbiBzYXZlIHlvdSB0aW1lIGFuZCBtb25leSB3aGlsZSBlbnN1cmluZyB5b3UgZ2V0IHBhaWQgcHJvbXB0bHkuIEluIHRoaXMgY29tcHJlaGVuc2l2ZSBndWlkZSwgd2UnbGwgZGVsdmUgaW50byB0aGUgYmVuZWZpdHMgb2YgdXNpbmcgdGhlc2UgdGVtcGxhdGVzLCBob3cgdG8gY2hvb3NlIHRoZS

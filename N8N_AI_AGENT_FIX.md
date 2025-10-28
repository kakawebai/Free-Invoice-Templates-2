# N8N AI Agent节点数据格式修复

## 🎯 问题诊断

您的AI Agent节点输出格式与Function节点期望的输入格式不匹配：

**AI Agent节点输出**：
```json
{
  "title": "文章标题",
  "content": "文章HTML内容",
  "author": "Admin",
  "category": "business",
  "tags": ["invoice", "business"]
}
```

**Function节点期望输入**：
```json
{
  "article": {
    "title": "文章标题",
    "content": "文章HTML内容",
    "author": "Admin",
    "category": "business",
    "tags": ["invoice", "business"]
  },
  "currentSHA": "SHA值",
  "currentArticles": [...]
}
```

## 🔧 解决方案

### 修复Function节点代码

在PUT请求之前的Function节点使用以下代码：

```javascript
// 准备GitHub更新数据
// 输入：AI Agent输出 + GET请求输出

// 从AI Agent获取文章数据
const articleData = {
  id: Date.now(),
  slug: ($json.title || "new-article").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  title: $json.title || "New Article",
  description: ($json.content || "").substring(0, 200) + "...",
  content: $json.content || "Article content",
  author: $json.author || "Admin",
  published_at: new Date().toISOString().split('T')[0],
  category: $json.category || "business",
  tags: $json.tags || ["automation"],
  meta_title: $json.title || "New Article",
  meta_description: ($json.content || "").substring(0, 200) + "...",
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

### 完整的工作流节点配置

#### 1. Webhook节点
接收新文章请求

#### 2. AI Agent节点
输出格式：
```json
{
  "title": "Unlock Efficiency with a Free Invoice Program: A Comprehensive Guide",
  "content": "<h1>Unlock Efficiency with a Free Invoice Program: A Comprehensive Guide</h1>...",
  "author": "Admin",
  "category": "business",
  "tags": ["invoice", "business", "automation"]
}
```

#### 3. HTTP GET请求节点
获取当前SHA值和文章列表，输出：
```json
{
  "currentSHA": "cef67a6fcfc0ed29e4aed724c557779e97c7c3b3",
  "currentArticles": [...现有文章列表...]
}
```

#### 4. Function节点 - 准备GitHub数据
使用上面的修复代码

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

### 步骤1：修复Function节点代码

在PUT请求之前的Function节点中，使用以下代码：

```javascript
// 准备GitHub更新数据
const articleData = {
  id: Date.now(),
  slug: ($json.title || "new-article").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  title: $json.title || "New Article",
  description: ($json.content || "").substring(0, 200) + "...",
  content: $json.content || "Article content",
  author: $json.author || "Admin",
  published_at: new Date().toISOString().split('T')[0],
  category: $json.category || "business",
  tags: $json.tags || ["automation"],
  meta_title: $json.title || "New Article",
  meta_description: ($json.content || "").substring(0, 200) + "...",
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

### 步骤2：验证数据流

1. **测试AI Agent节点** - 确保输出包含title, content, author, category, tags
2. **测试GET请求节点** - 确保输出包含currentSHA和currentArticles
3. **测试Function节点** - 确保输出包含message, content, sha

### 步骤3：测试完整工作流

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
   - 测试AI Agent节点单独运行
   - 测试GET请求节点单独运行
   - 测试Function节点单独运行

2. **验证数据格式**：
   - AI Agent输出：直接字段（title, content等）
   - GET请求输出：currentSHA, currentArticles
   - Function输出：message, content, sha

### 常见问题解决

#### 问题1：表达式显示灰色
**原因**：AI Agent输出格式与Function期望格式不匹配
**解决**：使用上面的修复代码

#### 问题2：Base64编码错误
**原因**：JSON格式错误
**解决**：确保articlesJson格式正确

#### 问题3：SHA值错误
**原因**：GET请求输出格式错误
**解决**：确保GET请求输出包含currentSHA

---

## 🧪 测试数据流

### 预期Function节点输出
```json
{
  "message": "Add new article via N8N automation: Unlock Efficiency with a Free Invoice Program: A Comprehensive Guide",
  "content": "ewogICJhcnRpY2xlcyI6IFsKICAgIHsKICAgICAgImlkIjogMTc2MTM1OTU0OTI4NSwKICAgICAgInNsdWciOiAidW5sb2NrLWVmZmljaWVuY3ktd2l0aC1hLWZyZWUtaW52b2ljZS1wcm9ncmFtLWEtY29tcHJlaGVuc2l2ZS1ndWlkZSIsCiAgICAgICJ0aXRsZSI6ICJVbmxvY2sgRWZmaWNpZW5jeSB3aXRoIGEgRnJlZSBJbnZvaWNlIFByb2dyYW06IEEgQ29tcHJlaGVuc2l2ZSBHdWlkZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJMZWFybiBob3cgYSBmcmVlIGludm9pY2UgcHJvZ3JhbSBjYW4gdHJhbnNmb3JtIHlvdXIgYnVzaW5lc3Mgb3BlcmF0aW9ucy4uLiIsCiAgICAgICJjb250ZW50IjogIjxoMT5VbmxvY2sgRWZmaWNpZW5jeSB3aXRoIGEgRnJlZSBJbnZvaWNlIFByb2dyYW06IEEgQ29tcHJlaGVuc2l2ZSBHdWlkZTwvaDE+XG5cbjxwPkluIHRvZGF5J3MgZmFzdC1wYWNlZCBidXNpbmVzcyB3b3JsZCwgbWFuYWdpbmcgaW52b2ljZXMgZWZmaWNpZW50bHkgaXMgY3J1Y2lhbCBmb3IgbWFpbnRhaW5pbmcgY2FzaCBmbG93LCBidWlsZGluZyBwcm9mZXNzaW9uYWwgcmVsYXRpb25zaGlwcywgYW5kIGVuc3VyaW5nIGNvbXBsaWFuY2Ugd2l0aCBmaW5hbmNpYWwgcmVndWxhdGlvbnMuIEhvd2V2ZXIsIG1hbnkgc21hbGwgYnVzaW5lc3NlcywgZnJlZWxhbmNlcnMsIGFuZCBzdGFydHVwcyBzdHJ1Z2dsZSB3aXRoIHRoZSBjb3N0cyBhbmQgY29tcGxleGl0aWVzIG9mIHRyYWRpdGlvbmFsIGludm9pY2luZyBzb2Z0d2FyZS4gVGhhdCdzIHdoZXJlIGEgZnJlZSBpbnZvaWNlIHByb2dyYW0gY29tZXMgaW50byBwbGF5IOKAkyBvZmZlcmluZyBhIGNvc3QtZWZmZWN0aXZlIHNvbHV0aW9uIHRvIHN0cmVhbWxpbmUgeW91ciBiaWxsaW5nIHByb2Nlc3NlcyB3aXRob3V0IGJyZWFraW5nIHRoZSBiYW5rLiBJbiB0aGlzIGFydGljbGUsIHdlJ2xsIGV4cGxvcmUgdGhlIGJlbmVmaXRzIG9mIHVzaW5nIHN1Y2ggcHJvZ3JhbXMsIHByb3ZpZGUgYWN0aW9uYWJsZSB0aXBzIGZvciBzZWxlY3RpbmcgYW5kIGltcGxlbWVudGluZyBvbmUsIGFuZCBoaWdobGlnaHQgaG93IGEgcmVsaWFibGUgdG9vbCBjYW4gdHJhbnNmb3JtIHlvdXIgZmluYW5jaWFsIG1hbmFnZW1lbnQuIEJ5IHRoZSBlbmQsIHlvdSdsbCBoYXZlIGEgY2xlYXIgcm9hZG1hcCB0byBsZXZlcmFnZSB0aGVzZSB0b29scyBmb3IgZW5oYW5jZWQgcHJvZHVjdGl2aXR5IGFuZCBncm93dGguPC9wPiIsCiAgICAgICJhdXRob3IiOiAiQWRtaW4iLAogICAgICAicHVibGlzaGVkX2F0IjogIjIwMjUtMTAtMjgiLAogICAgICAiY2F0ZWdvcnkiOiAiYnVzaW5lc3MiLAogICAgICAidGFncyI6IFsKICAgICAgICAiaW52b2ljZSIsCiAgICAgICAgImJ1c2luZXNzIiwKICAgICAgICAiYXV0b21hdGlvbiIKICAgICAgXSwKICAgICAgIm1ldGFfdGl0bGUiOiAiVW5sb2NrIEVmZmljaWVuY3kgd2l0aCBhIEZyZWUgSW52b2ljZSBQcm9ncmFtOiBBIENvbXByZWhlbnNpdmUgHdWlkZSIsCiAgICAgICJtZXRhX2Rlc2NyaXB0aW9uIjogIkxlYXJuIGhvdyBhIGZyZWUgaW52b2ljZSBwcm9ncmFtIGNhbiB0cmFuc2Zvcm0geW91ciBidXNpbmVzcyBvcGVyYXRpb25zLi4uIiwKICAgICAgImZlYXR1cmVkIjogZmFsc2UKICAgIH0sCiAgICB7CiAgICAgICJpZCI6IDE3NjEzNTk1NDkyODUsCiAgICAgICJzbHVnIjogInRoZS11bHRpbWF0ZS1ndWlkZS10by1mcmVlLWludm9pY2UtdGVtcGxhdGVzLXRvLWRvIiwKICAgICAgInRpdGxlIjogIlRoZSBVbHRpbWF0ZSBHdWlkZSB0byBGcmVlIEludm9pY2UgVGVtcGxhdGVzIHRvIERvd25sb2FkIGZvciBZb3VyIEJ1c2luZXNzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIjxoMT5UaGUgVWx0aW1hdGUgR3VpZGUgdG8gRnJlZSBJbnZvaWNlIFRlbXBsYXRlcyB0byBEb3dubG9hZCBmb3IgWW91ciBCdXNpbmVzczwvaDE+XG5cbjxwPkluIHRvZGF5J3MgY29tcGV0aXRpdmUgYnVzaW5lc3MgbGFuZHNjYXBlLCBlZmZpY2llbmN5IGFuZCBwcm9mZXNzaW9uYWxpc20gYXJlIHBhcmFtb3VudCBmb3Igc3VjY2Vzcy4gT25lIG9mdGVuLW92ZXJsb29rZWQgdG9vbCB0aGF0IGNhbiBzaWduaWZpY2FudGx5IGVuaGFuY2UgeW91ciBvcGVyYXRpb25zIGlzIGEgZnJlZSBpbnZvaWNlIHRlbXBsYXRlIHRvIGRvd25sb2FkLiBUaGVzZSB0ZW1wbGF0ZXMgc3RyZWFtbGluZSB0aGUgaW52b2ljaW5nIHByb2Nlc3MsIHJlZHVjZSBlcnJvcnMsIGFuZCBoZWxwIHlvdSBtYWludGFpbiBhIGNvbnNpc3RlbnQgYnJhbmQgaW1hZ2UuIFdoZXRoZXIgeW91J3JlIGEgZnJlZWxhbmNlciwgc21hbGwgYnVzaW5lc3Mgb3duZXIsIG9yIHBhcnQgb2YgYSBsYXJnZXIgb3JnYW5pemF0aW9uLCBsZXZlcmFnaW5nIGZyZWUgaW52b2ljZSB0ZW1wbGF0ZXMgY2FuIHNhdmUgeW91IHRpbWUgYW5kIG1vbmV5IHdoaWxlIGVuc3VyaW5nIHlvdSBnZXQgcGFpZCBwcm9tcHRseS4gSW4gdGhpcyBjb21wcmVoZW5zaXZlIGd1aWRlLCB3ZSdsbCBkZWx2ZSBpbnRvIHRoZSBiZW5lZml0cyBvZiB1c2luZyB0aGVzZSB0ZW1wbGF0ZXMsIGhvdyB0byBjaG9vc2UgdGhlIHJpZ2h0IG9uZSwgYW5kIHByYWN0aWNhbCBzdGVwcyB0byBpbXBsZW1lbnQgdGhlbSBlZmZlY3RpdmVseS4gQnkgdGhlIGVuZCwgeW91J2xsIGJlIGVxdWlwcGVkIHdpdGggYWN0aW9uYWJsZSBpbnNpZ2h0cyB0byBvcHRpbWl6ZSB5b3VyIGludm9pY2luZyB3b3JrZmxvdy48L3A+IiwKICAgICAgImNvbnRlbnQiOiAiPGgxPlRoZSBVbHRpbWF0ZSBHdWlkZSB0byBGcmVlIEludm9pY2UgVGVtcGxhdGVzIHRvIERvd25sb2FkIGZvciBZb3VyIEJ1c2luZXNzIDwvaDE+XG5cbjxwPkluIHRvZGF5J3MgY29tcGV0aXRpdmUgYnVzaW5lc3MgbGFuZHNjYXBlLCBlZmZpY2llbmN5IGFuZCBwcm9mZXNzaW9uYWxpc20gYXJlIHBhcmFtb3VudCBmb3Igc3VjY2Vzcy4gT

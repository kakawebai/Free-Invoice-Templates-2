# N8N AI Agent输出格式修复指南

## 🎯 问题诊断

您的AI Agent提示要求输出JSON格式，但实际输出可能不是正确的JSON格式。问题在于：

1. **AI Agent输出格式不匹配** - 可能输出纯文本而不是JSON
2. **Function节点无法解析** - 无法从AI Agent输出中提取数据
3. **数据流中断** - 导致PUT请求表达式显示灰色/红色

## 🔧 完整解决方案

### 修复AI Agent节点输出处理

在AI Agent节点后的Function节点使用以下代码来解析AI输出：

```javascript
// 解析AI Agent输出并准备GitHub数据
// 输入：AI Agent原始输出 + GET请求输出

// 1. 解析AI Agent输出
const aiOutput = $json.output || $json;
let parsedArticle = {};

try {
  // 尝试直接解析JSON
  if (typeof aiOutput === 'string') {
    // 移除可能的代码块标记
    const cleaned = aiOutput
      .replace(/^```json\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    parsedArticle = JSON.parse(cleaned);
  } else {
    // 如果已经是对象，直接使用
    parsedArticle = aiOutput;
  }
} catch (e) {
  // 如果JSON解析失败，创建默认文章
  console.log('AI输出解析失败，使用默认格式:', e.message);
  parsedArticle = {
    title: "New Article",
    content: "<p>Article content from AI</p>",
    author: "Admin",
    category: "business",
    tags: ["automation"]
  };
}

// 2. 生成文章数据
const articleData = {
  id: Date.now(),
  slug: (parsedArticle.title || "new-article").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  title: parsedArticle.title || "New Article",
  description: (parsedArticle.content || "").replace(/<[^>]*>/g, '').substring(0, 200) + "...",
  content: parsedArticle.content || "<p>Article content</p>",
  author: parsedArticle.author || "Admin",
  published_at: new Date().toISOString().split('T')[0],
  category: parsedArticle.category || "business",
  tags: parsedArticle.tags || ["automation"],
  meta_title: parsedArticle.title || "New Article",
  meta_description: (parsedArticle.content || "").replace(/<[^>]*>/g, '').substring(0, 200) + "...",
  featured: false
};

// 3. 获取当前文章列表并添加新文章
const currentArticles = $json.currentArticles || [];
const updatedArticles = [articleData, ...currentArticles];

const articlesJson = {
  articles: updatedArticles
};

// 4. Base64编码
const encodedContent = Buffer.from(JSON.stringify(articlesJson, null, 2)).toString('base64');

// 5. 准备PUT请求数据
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
使用您的提示生成文章

#### 3. HTTP GET请求节点
获取当前SHA值和文章列表

#### 4. Function节点 - 解析AI输出并准备数据
使用上面的完整代码

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

### 步骤1：检查AI Agent节点输出

首先测试AI Agent节点单独运行，查看输出格式：
- 如果是JSON格式：直接使用
- 如果是纯文本：需要解析
- 如果有代码块标记：需要清理

### 步骤2：修复Function节点代码

在AI Agent节点后的Function节点中，使用上面的完整代码。

### 步骤3：验证数据流

1. **测试AI Agent节点** - 查看原始输出格式
2. **测试Function节点** - 确保输出包含message, content, sha
3. **测试PUT请求** - 确保表达式显示正常

### 步骤4：测试完整工作流

使用测试数据触发Webhook：
```json
{
  "关键词": "free invoice program",
  "URL": "https://freeonlineinvoice.org/",
  "topic": "Free Invoice Program Benefits",
  "target_audience": "small business owners and freelancers"
}
```

---

## 🔍 调试技巧

### 检查AI Agent输出格式

1. **测试AI Agent节点单独运行**
2. **查看输出格式**：
   - 如果是JSON对象：直接使用
   - 如果是JSON字符串：需要解析
   - 如果是纯文本：需要处理

### 常见问题解决

#### 问题1：AI输出不是JSON
**解决**：使用上面的代码处理各种输出格式

#### 问题2：JSON解析错误
**解决**：添加错误处理，使用默认值

#### 问题3：字段缺失
**解决**：使用默认值填充缺失字段

### 验证数据流

1. **AI Agent输出**：查看原始输出
2. **Function节点输出**：确保包含message, content, sha
3. **PUT请求表达式**：确保显示正常（不是灰色/红色）

---

## 🧪 测试数据流

### 预期AI Agent输出格式
```json
{
  "title": "Unlock Efficiency with a Free Invoice Program: A Comprehensive Guide",
  "content": "<h1>Unlock Efficiency with a Free Invoice Program: A Comprehensive Guide</h1><p>In today's fast-paced business world...</p>",
  "author": "Admin",
  "category": "business",
  "tags": ["invoice", "business", "automation"]
}
```

### 预期Function节点输出
```json
{
  "message": "Add new article via N8N automation: Unlock Efficiency with a Free Invoice Program: A Comprehensive Guide",
  "content": "ewogICJhcnRpY2xlcyI6IFsKICAgIHsKICAgICAgImlkIjogMTc2MTM1OTU0OTI4NSwKICAgICAgInNsdWciOiAidW5sb2NrLWVmZmljaWVuY3ktd2l0aC1hLWZyZWUtaW52b2ljZS1wcm9ncmFtLWEtY29tcHJlaGVuc2l2ZS1ndWlkZSIsCiAgICAgICJ0aXRsZSI6ICJVbmxvY2sgRWZmaWNpZW5jeSB3aXRoIGEgRnJlZSBJbnZvaWNlIFByb2dyYW06IEEgQ29tcHJlaGVuc2l2ZSBHdWlkZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJMZWFybiBob3cgYSBmcmVlIGludm9pY2UgcHJvZ3JhbSBjYW4gdHJhbnNmb3JtIHlvdXIgYnVzaW5lc3Mgb3BlcmF0aW9ucy4uLiIsCiAgICAgICJjb250ZW50IjogIjxoMT5VbmxvY2sgRWZmaWNpZW5jeSB3aXRoIGEgRnJlZSBJbnZvaWNlIFByb2dyYW06IEEgQ29tcHJlaGVuc2l2ZSBHdWlkZTwvaDE+XG5cbjxwPkluIHRvZGF5J3MgZmFzdC1wYWNlZCBidXNpbmVzcyB3b3JsZCwgbWFuYWdpbmcgaW52b2ljZXMgZWZmaWNpZW50bHkgaXMgY3J1Y2lhbCBmb3IgbWFpbnRhaW5pbmcgY2FzaCBmbG93LCBidWlsZGluZyBwcm9mZXNzaW9uYWwgcmVsYXRpb25zaGlwcywgYW5kIGVuc3VyaW5nIGNvbXBsaWFuY2Ugd2l0aCBmaW5hbmNpYWwgcmVndWxhdGlvbnMuIEhvd2V2ZXIsIG1hbnkgc21hbGwgYnVzaW5lc3NlcywgZnJlZWxhbmNlcnMsIGFuZCBzdGFydHVwcyBzdHJ1Z2dsZSB3aXRoIHRoZSBjb3N0cyBhbmQgY29tcGxleGl0aWVzIG9mIHRyYWRpdGlvbmFsIGludm9pY2luZyBzb2Z0d2FyZS4gVGhhdCdzIHdoZXJlIGEgZnJlZSBpbnZvaWNlIHByb2dyYW0gY29tZXMgaW50byBwbGF5IOKAkyBvZmZlcmluZyBhIGNvc3QtZWZmZWN0aXZlIHNvbHV0aW9uIHRvIHN0cmVhbWxpbmUgeW91ciBiaWxsaW5nIHByb2Nlc3NlcyB3aXRob3V0IGJyZWFraW5nIHRoZSBiYW5rLiBJbiB0aGlzIGFydGljbGUsIHdlJ2xsIGV4cGxvcmUgdGhlIGJlbmVmaXRzIG9mIHVzaW5nIHN1Y2ggcHJvZ3JhbXMsIHByb3ZpZGUgYWN0aW9uYWJsZSB0aXBzIGZvciBzZWxlY3RpbmcgYW5kIGltcGxlbWVudGluZyBvbmUsIGFuZCBoaWdobGlnaHQgaG93IGEgcmVsaWFibGUgdG9vbCBjYW4gdHJhbnNmb3JtIHlvdXIgZmluYW5jaWFsIG1hbmFnZW1lbnQuIEJ5IHRoZSBlbmQsIHlvdSdsbCBoYXZlIGEgY2xlYXIgcm9hZG1hcCB0byBsZXZlcmFnZSB0aGVzZSB0b29scyBmb3IgZW5oYW5jZWQgcHJvZHVjdGl2aXR5IGFuZCBncm93dGguPC9wPiIsCiAgICAgICJhdXRob3IiOiAiQWRtaW4iLAogICAgICAicHVibGlzaGVkX2F0IjogIjIwMjUtMTAtMjgiLAogICAgICAiY2F0ZWdvcnkiOiAiYnVzaW5lc3MiLAogICAgICAidGFncyI6IFsKICAgICAgICAiaW52b2ljZSIsCiAgICAgICAgImJ1c2luZXNzIiwKICAgICAgICAiYXV0b21hdGlvbiIKICAgICAgXSwKICAgICAgIm1ldGFfdGl0bGUiOiAiVW5sb2NrIEVmZmljaWVuY3kgd2l0aCBhIEZyZWUgSW52b2ljZSBQcm9ncmFtOiBBIENvbXByZWhlbnNpdmUgR3VpZGUiLAogICAgICAibWV0YV9kZXNjcmlwdGlvbiI6ICJMZWFybiBob3cgYSBmcmVlIGludm9pY2UgcHJvZ3JhbSBjYW4gdHJhbnNmb3JtIHlvdXIgYnVzaW5lc3Mgb3BlcmF0aW9ucy4uLiIsCiAgICAgICJmZWF0dXJlZCI6IGZhbHNlCiAgICB9LAogICAgewogICAgICAiaWQiOiAxNzYxMzU5NTQ5Mjg1LAogICAgICAic2x1ZyI6ICJ0aGUtdWx0aW1hdGUtZ3VpZGUtdG8tZnJlZS1pbnZvaWNlLXRlbXBsYXRlcy10by1kbyIsCiAgICAgICJ0aXRsZSI6ICJUaGUgVWx0aW1hdGUgR3VpZGUgdG8gRnJlZSBJbnZvaWNlIFRlbXBsYXRlcyB0byBEb3dubG9hZCBmb3IgWW91ciBCdXNpbmVzcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICI8aDE+VGhlIFVsdGltYXRlIEd1aWRlIHRvIEZyZWUgSW52b2ljZSBUZW1wbGF0ZXMgdG8gRG93bmxvYWQgZm9yIFlvdXIgQnVzaW5lc3M8L2gxPlxuXG48cD5JbiB0b2RheSdzIGNvbXBldGl0aXZlIGJ1c2luZXNzIGxhbmRzY2FwZSwgZWZmaWNpZW5jeSBhbmQgcHJvZmVzc2lvbmFsaXNtIGFyZSBwYXJhbW91bnQgZm9yIHN1Y2Nlc3MuIE9uZSBvZnRlbi1vdmVybG9va2VkIHRvb2wgdGhhdCBjYW4gc2lnbmlmaWNhbnRseSBlbmhhbmNlIHlvdXIgb3BlcmF0aW9ucyBpcyBhIGZyZWUgaW52b2ljZSB0ZW1wbGF0ZSB0byBkb3dubG9hZC4gVGhlc2UgdGVtcGxhdGVzIHN0cmVhbWxpbmUgdGhlIGludm9pY2luZyBwcm9jZXNzLCByZWR1Y2UgZXJyb3JzLCBhbmQgaGVscCB5b3UgbWFpbnRhaW4gYSBjb25zaXN0ZW50IGJyYW5kIGltYWdlLiBXaGV0aGVyIHlvdSdyZSBhIGZyZWVsYW5jZXIsIHNtYWxsIGJ1c2luZXNzIG93bmVyLCBvciBwYXJ0IG9mIGEgbGFyZ2VyIG9yZ2FuaXphdGlvbiwgbGV2ZXJhZ2luZyBmcmVlIGludm9pY2UgdGVtcGxhdGVzIGNhbiBzYXZlIHlvdSB0aW1lIGFuZCBtb25leSB3aGlsZSBlbnN1cmluZyB5b91IGdldCBwYWlkIHByb21wdGx5LiBJbiB0aGlzIGNvbXByZWhlbnNpdmUgZ3VpZGUsIHdlJ2xsIGRlbHZlIGludG8gdGhlIGJlbmVmaXRzIG9mIHVzaW5nIHRoZXNlIHRlbXBsYXRlcywgaG93IHRvIGNob29zZSB0aGUgcmlnaHQgb25lLCBhbmQgcHJhY3RpY2FsIHN0ZXBzIHRvIGltcGxlbWVudCB0aGVtIGVmZmVjdGl2ZWx5LiBCeSB0aGUgZW5kLCB5b3UnbGwgYmUgZXF1aXBwZWQgd2l0aCBhY3Rpb25hYmxlIGluc2lnaHRzIHRvIG9wdGltaXplIHlvdXIgaW52b2ljaW5nIHdvcmtmbG93LjwvcD4iLAogICAgICAiY29udGVudCI6ICI8aDE+VGhlIFVsdGltYXRlIEd1aWRlIHRvIEZyZWUgSW52b2ljZSBUZW1wbGF0ZXMgdG8gRG93bmxvYWQgZm9yIFlvdXIgQnVzaW5lc3MgPC9oMT5cblxuPHA+SW4gdG9kYXkncyBjb21wZXRpdGl2ZSBidXNpbmVzcyBsYW5kc2NhcGUsIGVmZmljaWVuY3kgYW5kIHByb2Zlc3Npb25hbGlzbSBhcmUgcGFyYW1vdW50IGZvciBzdWNjZXNzLiBPbmUgb2Z0ZW4tb3Zlcmxvb2tlZCB0b29sIHRoYXQgY2FuIHNpZ25pZmljYW50bHkgZW5oYW5jZSB5b3VyIG9wZXJhdGlvbnMgaXMgYSBmcmVlIGludm9pY2UgdGVtcGxhdGUgdG8gZG93bmxvYWQuIFRoZXNlIHRlb

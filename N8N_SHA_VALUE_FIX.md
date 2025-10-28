# N8N SHA值修复指南

## 🎯 问题诊断

您的Function节点输出中SHA值是空的，这意味着：

1. **GET请求节点输出不正确** - 没有正确输出SHA值
2. **数据流不匹配** - GET请求节点输出格式与Function节点期望格式不匹配
3. **SHA值缺失** - 导致PUT请求无法执行

## 🔧 完整解决方案

### 修复GET请求节点输出处理

在GET请求节点后的Function节点使用以下代码来提取SHA值：

```javascript
// 提取GET请求的SHA值并准备数据
// 输入：GET请求原始输出

// 1. 提取SHA值
let currentSHA = "";

// 检查不同的输出格式
if ($json.sha) {
  // 如果已经有sha字段
  currentSHA = $json.sha;
} else if ($json.content && $json.content.sha) {
  // 如果SHA在content对象中
  currentSHA = $json.content.sha;
} else if ($json[0] && $json[0].sha) {
  // 如果是数组格式
  currentSHA = $json[0].sha;
} else {
  // 尝试从响应中提取SHA
  console.log('GET请求输出格式:', JSON.stringify($json, null, 2));
  throw new Error('无法从GET请求输出中提取SHA值');
}

// 2. 提取当前文章列表
let currentArticles = [];

// 检查不同的文章列表格式
if ($json.content && $json.content.content) {
  // 如果文章内容在content.content中（Base64编码）
  try {
    const decodedContent = Buffer.from($json.content.content, 'base64').toString('utf8');
    const articlesData = JSON.parse(decodedContent);
    currentArticles = articlesData.articles || [];
  } catch (e) {
    console.log('Base64解码失败:', e.message);
    currentArticles = [];
  }
} else if ($json.currentArticles) {
  // 如果已经有currentArticles字段
  currentArticles = $json.currentArticles;
}

// 3. 返回给下一个Function节点
return {
  currentSHA: currentSHA,
  currentArticles: currentArticles
};
```

### 完整的工作流节点配置

#### 1. Webhook节点
接收新文章请求

#### 2. AI Agent节点
生成文章内容

#### 3. HTTP GET请求节点
获取当前文件信息
```
Method: GET
URL: https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json
```

#### 4. Function节点 - 提取SHA值
使用上面的代码

#### 5. Function节点 - 准备GitHub数据
使用之前的代码，但修改为：
```javascript
// 准备GitHub更新数据
// 输入：AI Agent输出 + SHA提取节点输出

// 1. 解析AI Agent输出
const aiOutput = $json.output || $json;
let parsedArticle = {};

try {
  if (typeof aiOutput === 'string') {
    const cleaned = aiOutput.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    parsedArticle = JSON.parse(cleaned);
  } else {
    parsedArticle = aiOutput;
  }
} catch (e) {
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

#### 6. HTTP PUT请求节点
配置保持不变

---

## 🚀 立即修复步骤

### 步骤1：检查GET请求节点输出

首先测试GET请求节点单独运行，查看输出格式：

```javascript
// 预期GET请求输出格式：
{
  "content": {
    "sha": "cef67a6fcfc0ed29e4aed724c557779e97c7c3b3",
    "content": "Base64编码的文章内容..."
  }
}
```

### 步骤2：添加SHA提取Function节点

在GET请求节点后添加一个新的Function节点，使用上面的SHA提取代码。

### 步骤3：修改数据流连接

- AI Agent节点 → 准备GitHub数据Function节点
- GET请求节点 → SHA提取Function节点 → 准备GitHub数据Function节点

### 步骤4：验证数据流

1. **测试GET请求节点** - 查看原始输出格式
2. **测试SHA提取节点** - 确保输出包含currentSHA
3. **测试准备GitHub数据节点** - 确保输出包含message, content, sha

---

## 🔍 调试技巧

### 检查GET请求输出格式

1. **测试GET请求节点单独运行**
2. **查看输出格式**：
   - 如果输出包含`content.sha`：使用SHA提取代码
   - 如果输出直接包含`sha`：直接使用
   - 如果输出是数组：处理数组格式

### 常见问题解决

#### 问题1：GET请求输出格式错误
**解决**：使用SHA提取代码处理各种格式

#### 问题2：SHA值提取失败
**解决**：添加多种提取方法，确保能获取SHA值

#### 问题3：数据流连接错误
**解决**：确保所有节点正确连接

### 验证数据流

1. **GET请求输出**：查看原始输出
2. **SHA提取节点输出**：确保包含currentSHA
3. **准备GitHub数据节点输出**：确保包含message, content, sha

---

## 🧪 测试数据流

### 预期GET请求输出
```json
{
  "content": {
    "sha": "cef67a6fcfc0ed29e4aed724c557779e97c7c3b3",
    "content": "ewogICJhcnRpY2xlcyI6IFsKICAgIHsKICAgICAgImlkIjogMTc2MTM1OTU0OTI4NSwKICAgICAgInNsdWciOiAidGhlLXVsdGltYXRlLWd1aWRlLXRvLWZyZWUtaW52b2ljZS10ZW1wbGF0ZXMtdG8tZG8iLAogICAgICAidGl0bGUiOiAiVGhlIFVsdGltYXRlIEd1aWRlIHRvIEZyZWUgSW52b2ljZSBUZW1wbGF0ZXMgdG8gRG93bmxvYWQgZm9yIFlvdXIgQnVzaW5lc3MiLAogICAgICAiZGVzY3JpcHRpb24iOiAiPGgxPlRoZSBVbHRpbWF0ZSBHdWlkZSB0byBGcmVlIEludm9pY2UgVGVtcGxhdGVzIHRvIERvd25sb2FkIGZvciBZb3VyIEJ1c2luZXNzPC9oMT5cblxuPHA+SW4gdG9kYXkncyBjb21wZXRpdGl2ZSBidXNpbmVzcyBsYW5kc2NhcGUsIGVmZmljaWVuY3kgYW5kIHByb2Zlc3Npb25hbGlzbSBhcmUgcGFyYW1vdW50IGZvciBzdWNjZXNzLiBPbmUgb2Z0ZW4tb3Zlcmxvb2tlZCB0b29sIHRoYXQgY2FuIHNpZ25pZmljYW50bHkgZW5oYW5jZSB5b3VyIG9wZXJhdGlvbnMgaXMgYSBmcmVlIGludm9pY2UgdGVtcGxhdGUgdG8gZG93bmxvYWQuIFRoZXNlIHRlbXBsYXRlcyBzdHJlYW1saW5lIHRoZSBpbnZvaWNpbmcgcHJvY2VzcywgcmVkdWNlIGVycm9ycywgYW5kIGhlbHAgeW91IG1haW50YWluIGEgY29uc2lzdGVudCBicmFuZCBpbWFnZS4gV2hldGhlciB5b3UncmUgYSBmcmVlbGFuY2VyLCBzbWFsbCBidXNpbmVzcyBvd25lciwgb3IgcGFydCBvZiBhIGxhcmdlciBvcmdhbml6YXRpb24sIGxldmVyYWdpbmcgZnJlZSBpbnZvaWNlIHRlbXBsYXRlcyBjYW4gc2F2ZSB5b3UgdGltZSBhbmQgbW9uZXkgd2hpbGUgZW5zdXJpbmcgeW91IGdldCBwYWlkIHByb21wdGx5LiBJbiB0aGlzIGNvbXByZWhlbnNpdmUgZ3VpZGUsIHdlJ2xsIGRlbHZlIGludG8gdGhlIGJlbmVmaXRzIG9mIHVzaW5nIHRoZXNlIHRlbXBsYXRlcywgaG93IHRvIGNob29zZSB0aGUgcmlnaHQgb25lLCBhbmQgcHJhY3RpY2FsIHN0ZXBzIHRvIGltcGxlbWVudCB0aGVtIGVmZmVjdGl2ZWx5LiBCeSB0aGUgZW5kLCB5b3UnbGwgYmUgZXF1aXBwZWQgd2l0aCBhY3Rpb25hYmxlIGluc2lnaHRzIHRvIG9wdGltaXplIHlvdXIgaW52b2ljaW5nIHdvcmtmbG93LjwvcD4iLAogICAgICAiY29udGVudCI6ICI8aDE+VGhlIFVsdGltYXRlIEd1aWRlIHRvIEZyZWUgSW52b2ljZSBUZW1wbGF0ZXMgdG8gRG93bmxvYWQgZm9yIFlvdXIgQnVzaW5lc3MgPC9oMT5cblxuPHA+SW4gdG9kYXkncyBjb21wZXRpdGl2ZSBidXNpbmVzcyBsYW5kc2NhcGUsIGVmZmljaWVuY3kgYW5kIHByb2Zlc3Npb25hbGlzbSBhcmUgcGFyYW1vdW50IGZvciBzdWNjZXNzLiBPbmUgb2Z0ZW4tb3Zlcmxvb2tlZCB0b29sIHRoYXQgY2FuIHNpZ25pZmljYW50bHkgZW5oYW5jZSB5b3VyIG9wZXJhdGlvbnMgaXMgYSBmcmVlIGludm9pY2UgdGVtcGxhdGUgdG8gZG93bmxvYWQuIFRoZXNlIHRlbXBsYXRlcyBzdHJlYW1saW5lIHRoZSBpbnZvaWNpbmcgcHJvY2VzcywgcmVkdWNlIGVycm9ycywgYW5kIGhlbHAgeW91IG1haW50YWluIGEgY29uc2lzdGVudCBicmFuZCBpbWFnZS4gV2hldGhlciB5b3UncmUgYSBmcmVlbGFuY2VyLCBzbWFsbCBidXNpbmVzcyBvd25lciwgb3IgcGFydCBvZiBhIGxhcmdlciBvcmdhbml6YXRpb24sIGxldmVyYWdpbmcgZnJlZSBpbnZvaWNlIHRlbXBsYXRlcyBjYW4gc2F2ZSB5b3UgdGltZSBhbmQgbW9uZXkgd2hpbGUgZW5zdXJpbmcgeW91IGdldCBwYWlkIHByb21wdGx5LiBJbiB0aGlzIGNvbXByZWhlbnNpdmUgZ3VpZGUsIHdlJ2xsIGRlbHZlIGludG8gdGhlIGJlbmVmaXRzIG9mIHVzaW5nIHRoZXNlIHRlbXBsYXRlcywgaG93IHRvIGNob29zZSB0aGUgcmlnaHQgb25lLCBhbmQgcHJhY3RpY2FsIHN0ZXBzIHRvIGltcGxlbWVudCB0aGVtIGVmZmVjdGl2ZWx5LiBCeSB0aGUgZW5kLCB5b3UnbGwgYmUgZXF1aXBwZWQgd2l0aCBhY3Rpb25hYmxlIGluc2lnaHRzIHRvIG9wdGltaXplIHlvdXIgaW52b2ljaW5nIHdvcmtmbG93LjwvcD4iLAogICAgICAiYXV0aG9yIjogIkFkbWluIiwKICAgICAgInB1Ymxpc2hlZF9hdCI6ICIyMDI1LTEwLTI1IiwKICAgICAgImNhdGVnb3J5IjogImJ1c2luZXNzIiwKICAgICAgInRhZ3MiOiBbCiAgICAgICAgImludm9pY2UiLAogICAgICAgICJidXNpbmVzcyIKICAgICAgXSwKICAgICAgIm1ldGFfdGl0bGUiOiAiVGhlIFVsdGltYXRlIEd1aWRlIHRvIEZyZWUgSW52b2ljZSBUZW1wbGF0ZXMgdG8gRG93bmxvYWQgZm9yIFlvdXIgQnVzaW5lc3MiLAogICAgICAibWV0YV9kZXNjcmlwdGlvbiI6ICI8aDE+VGhlIFVsdGltYXRlIEd1aWRlIHRvIEZyZWUgSW52b2ljZSBUZW1wbGF0ZXMgdG8gRG93bmxvYWQgZm9yIFlvdXIgQnVzaW5lc3M8L2gxPlxuXG48cD5JbiB0b2RheSdzIGNvbXBldGl0aXZlIGJ1c2luZXNzIGxhbmRzY2FwZSwgZWZmaWNpZW5jeSBhbmQgcHJvZmVzc2lvbmFsaXNtIGFyZSBwYXJhbW91bnQgZm9yIHN1Y2Nlc3MuIE9uZSBvZnRlbi1vdmVybG9va2VkIHRvb2wgdGhhdCBjYW4gc2lnbmlmaWNhbnRseSBlbmhhbmNlIHlvdXIgb3BlcmF0aW9ucyBpcyBhIGZyZWUgaW52b2ljZSB0ZW1wbGF0ZSB0byBkb3dubG9hZC4gVGhlc2UgdGVtcGxhdGVzIHN0cmVhbWxpbmUgdGhlIGludm9pY2luZyBwcm9jZXNzLCByZWR1Y2UgZXJyb3JzLCBhbmQgaGVscCB5b3UgbWFpbnRhaW4gYSBjb25zaXN0ZW50IGJyYW5kIGltYWdlLiBXaGV0aGVyIHlvdSdyZSBhIGZyZWVsYW5jZXIsIHNtYWxsIGJ1c2luZXNzIG93bmVyLCBvciBwYXJ0IG9mIGEgbGFyZ2VyIG9yZ2FuaXphdGlvbiwgbGV2ZXJhZ2luZyBmcmVlIGludm9pY2UgdGVtcGxhdGVzIGNhbiBzYXZlIHlvdSB0aW1lIGFuZCBtb25

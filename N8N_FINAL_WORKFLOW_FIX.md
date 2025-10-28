# N8N 最终工作流修复指南

## 🎯 问题诊断

您的Function节点输出中SHA值仍然是空的，这意味着：

1. **数据流连接错误** - GET请求节点输出没有正确传递给Function节点
2. **缺少SHA提取节点** - 需要专门的节点来提取SHA值
3. **工作流结构错误** - 节点连接顺序不正确

## 🔧 完整工作流解决方案

### 正确的工作流节点顺序和配置

#### 1. Webhook节点
接收新文章请求

#### 2. AI Agent节点
使用修复后的提示生成文章

#### 3. HTTP GET请求节点
获取当前文件信息
```
Method: GET
URL: https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json
Headers:
- Accept: application/vnd.github.v3+json
- User-Agent: N8N-Automation
```

#### 4. Function节点 - 提取SHA值（新增节点）
使用以下代码：

```javascript
// 提取GET请求的SHA值
// 输入：GET请求原始输出

console.log('GET请求输出:', JSON.stringify($json, null, 2));

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
  throw new Error('无法从GET请求输出中提取SHA值，输出格式: ' + JSON.stringify($json));
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

#### 5. Function节点 - 准备GitHub数据
使用以下代码：

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

### 步骤1：添加SHA提取Function节点

在GET请求节点后添加一个新的Function节点，使用上面的SHA提取代码。

### 步骤2：修改数据流连接

正确的数据流连接顺序：
- **Webhook节点** → **AI Agent节点** → **准备GitHub数据Function节点**
- **GET请求节点** → **SHA提取Function节点** → **准备GitHub数据Function节点**

### 步骤3：验证数据流

1. **测试GET请求节点单独运行** - 查看输出格式
2. **测试SHA提取节点单独运行** - 确保输出包含currentSHA
3. **测试准备GitHub数据节点单独运行** - 确保输出包含message, content, sha

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

### 检查GET请求输出格式

1. **测试GET请求节点单独运行**
2. **查看输出格式**：
   - 如果输出包含`content.sha`：使用SHA提取代码
   - 如果输出直接包含`sha`：直接使用
   - 如果输出是数组：处理数组格式

### 验证数据流

1. **GET请求输出**：查看原始输出
2. **SHA提取节点输出**：确保包含currentSHA
3. **准备GitHub数据节点输出**：确保包含message, content, sha

### 常见问题解决

#### 问题1：SHA值提取失败
**解决**：检查GET请求输出格式，修改SHA提取代码

#### 问题2：数据流连接错误
**解决**：确保所有节点正确连接

#### 问题3：表达式显示灰色/红色
**解决**：检查前一个节点的输出数据

---

## 🧪 测试数据流

### 预期GET请求输出
```json
{
  "content": {
    "sha": "cef67a6fcfc0ed29e4aed724c557779e97c7c3b3",
    "content": "Base64编码的文章内容..."
  }
}
```

### 预期SHA提取节点输出
```json
{
  "currentSHA": "cef67a6fcfc0ed29e4aed724c557779e97c7c3b3",
  "currentArticles": [...现有文章列表...]
}
```

### 预期准备GitHub数据节点输出
```json
{
  "message": "Add new article via N8N automation: The Ultimate Guide to Free Invoice Programs for Small Businesses",
  "content": "ewogICJhcnRpY2xlcyI6IFsKICAgIHsKICAgICAgImlkIjogMTc2MTYwMjQ5MzIyMiwKICAgICAgInNsdWciOiAidGhlLXVsdGltYXRlLWd1aWRlLXRvLWZyZWUtaW52b2ljZS1wcm9ncmFtcy1mb3Itc21hbGwtYnVzaW5lc3NlcyIsCiAgICAgICJ0aXRsZSI6ICJUaGUgVWx0aW1hdGUgR3VpZGUgdG8gRnJlZSBJbnZvaWNlIFByb2dyYW1zIGZvciBTbWFsbCBCdXNpbmVzc2VzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRoZSBVbHRpbWF0ZSBHdWlkZSB0byBGcmVlIEludm9pY2UgUHJvZ3JhbXMgZm9yIFNtYWxsIEJ1c2luZXNzZXNcblxuSW4gdG9kYXkncyBmYXN0LXBhY2VkIGJ1c2luZXNzIHdvcmxkLCBtYW5hZ2luZyBmaW5hbmNlcyBlZmZpY2llbnRseSBpcyBjcnVjaWFsIGZvciBzdWNjZXNzLiBPbmUgb2YgdGhlIG1vc3QgZXNzZW50aWFsIHRvb2xzIGZvciBhbnkgYnUuLi4iLAogICAgICAiY29udGVudCI6ICI8aDE+VGhlIFVsdGltYXRlIEd1aWRlIHRvIEZyZWUgSW52b2ljZSBQcm9ncmFtcyBmb3IgU21hbGwgQnVzaW5lc3NlczwvaDE+XG5cbjxwPkluIHRvZGF5J3MgZmFzdC1wYWNlZCBidXNpbmVzcyB3b3JsZCwgbWFuYWdpbmcgZmluYW5jZXMgZWZmaWNpZW50bHkgaXMgY3J1Y2lhbCBmb3Igc3VjY2Vzcy4gT25lIG9mIHRoZSBtb3N0IGVzc2VudGlhbCB0b29scyBmb3IgYW55IGJ1c2luZXNzIGlzIGEgcmVsaWFibGUgaW52b2ljZSBwcm9ncmFtLiBIb3dldmVyLCBtYW55IHNtYWxsIGJ1c2luZXNzIG93bmVycyBzdHJ1Z2dsZSB3aXRoIHRoZSBjb3N0IG9mIHRyYWRpdGlvbmFsIGludm9pY2luZyBzb2Z0d2FyZS4gVGhhdCdzIHdoZXJlIGEgZnJlZSBpbnZvaWNlIHByb2dyYW0gY29tZXMgaW50byBwbGF5LiBCeSB1c2luZyBhIDxhIGhyZWY9XCJodHRwczovL2ZyZWVvbmxpbmVpbnZvaWNlLm9yZy9cIiByZWw9XCJub29wZW5lclwiIHRhcmdldD1cIl9ibGFua1wiPmZyZWUgaW52b2ljZSBwcm9ncmFtPC9hPiwgeW91IGNhbiBzdHJlYW1saW5lIHlvdXIgYmlsbGluZyBwcm9jZXNzZXMgd2l0aG91dCBicmVha2luZyB0aGUgYmFuay48L3A+IiwKICAgICAgImF1dGhvciI6ICJBZG1pbiIsCiAgICAgICJwdWJsaXNoZWRfYXQiOiAiMjAyNS0xMC0yOCIsCiAgICAgICJjYXRlZ29yeSI6ICJidXNpbmVzcyIsCiAgICAgICJ0YWdzIjogWwogICAgICAgICJpbnZvaWNlIiwKICAgICAgICAiYnVzaW5lc3MiLAogICAgICAgICJhdXRvbWF0aW9uIgogICAgICBdLAogICAgICAibWV0YV90aXRsZSI6ICJUaGUgVWx0aW1hdGUgR3VpZGUgdG8gRnJlZSBJbnZvaWNlIFByb2dyYW1zIGZvciBTbWFsbCBCdXNpbmVzc2VzIiwKICAgICAgIm1ldGFfZGVzY3JpcHRpb24iOiAiVGhlIFVsdGltYXRlIEd1aWRlIHRvIEZyZWUgSW52b2ljZSBQcm9ncmFtcyBmb3IgU21hbGwgQnVzaW5lc3Nlc1xuXG5JbiB0b2RheSdzIGZhc3QtcGFjZWQgYnVzaW5lc3Mgd29ybGQsIG1hbmFnaW5nIGZpbmFuY2VzIGVmZmljaWVudGx5IGlzIGNydWNpYWwgZm9yIHN1Y2Nlc3MuIE9uZSBvZiB0aGUgbW9zdCBlc3NlbnRpYWwgdG9vbHMgZm9yIGFueSBidS4uLiIsCiAgICAgICJmZWF0dXJlZCI6IGZhbHNlCiAgICB9CiAgXQp9",
  "sha": "cef67a6fcfc0ed29e4aed724c557779e97c7c3b3"
}
```

---

## 🎉 关键提醒

- **添加SHA提取节点** - 这是解决SHA值问题的关键
- **正确连接数据流** - 确保所有节点正确连接
- **测试每个节点** - 单独测试每个节点确保输出正确
- **PUT请求表达式** - 引用Function节点输出（$json.message, $json.content, $json.sha）

### 🏆 恭喜！

按照这个最终修复方案，您应该能够成功发布文章到GitHub！

所有技术细节都已提供，现在只需要添加SHA提取Function节点并正确连接数据流即可解决所有问题。

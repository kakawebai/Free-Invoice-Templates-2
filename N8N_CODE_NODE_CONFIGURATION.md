# N8N Code in JavaScript节点配置指南

## 🎯 Code节点配置步骤

### 1. 添加Code节点

在N8N工作流中：
1. 点击"+"按钮添加新节点
2. 搜索"Code"或"JavaScript"
3. 选择"Code" → "JavaScript"

### 2. 配置Code节点

#### 节点1：SHA提取节点（在GET请求后）

**位置**：在HTTP GET请求节点后

**代码**：
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

**配置选项**：
- **Mode**: Run Once for All Items
- **Language**: JavaScript
- **Code**: 粘贴上面的代码

#### 节点2：准备GitHub数据节点（在AI Agent后）

**位置**：在AI Agent节点后

**代码**：
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

**配置选项**：
- **Mode**: Run Once for All Items
- **Language**: JavaScript
- **Code**: 粘贴上面的代码

---

## 🚀 完整工作流配置

### 工作流节点顺序

1. **Webhook节点**
   - 接收新文章请求

2. **AI Agent节点**
   - 生成文章内容

3. **HTTP GET请求节点**
   - 获取当前文件信息
   - URL: `https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json`

4. **Code节点 - SHA提取**
   - 提取SHA值

5. **Code节点 - 准备GitHub数据**
   - 准备PUT请求数据

6. **HTTP PUT请求节点**
   - 发布文章到GitHub

### 数据流连接

**正确连接方式**：
- **Webhook节点** → **AI Agent节点** → **准备GitHub数据Code节点**
- **HTTP GET请求节点** → **SHA提取Code节点** → **准备GitHub数据Code节点**

---

## 🔧 详细配置步骤

### 步骤1：添加SHA提取Code节点

1. 在HTTP GET请求节点后点击"+"按钮
2. 搜索"Code"并选择"Code"节点
3. 在代码编辑器中粘贴SHA提取代码
4. 保存节点

### 步骤2：添加准备GitHub数据Code节点

1. 在AI Agent节点后点击"+"按钮
2. 搜索"Code"并选择"Code"节点
3. 在代码编辑器中粘贴准备GitHub数据代码
4. 保存节点

### 步骤3：连接数据流

1. 从HTTP GET请求节点拖拽连接到SHA提取Code节点
2. 从SHA提取Code节点拖拽连接到准备GitHub数据Code节点
3. 从AI Agent节点拖拽连接到准备GitHub数据Code节点
4. 从准备GitHub数据Code节点拖拽连接到HTTP PUT请求节点

### 步骤4：配置HTTP PUT请求节点

**Headers**:
- `Content-Type`: `application/json`
- `Accept`: `application/vnd.github.v3+json`
- `User-Agent`: `N8N-Automation`

**Body** (Using Fields Below):
- `message`: `{{ $json.message }}`
- `content`: `{{ $json.content }}`
- `sha`: `{{ $json.sha }}`

---

## 🧪 测试配置

### 测试步骤

1. **测试GET请求节点**
   - 单独运行GET请求节点
   - 查看输出格式

2. **测试SHA提取节点**
   - 单独运行SHA提取节点
   - 确保输出包含`currentSHA`

3. **测试准备GitHub数据节点**
   - 单独运行准备GitHub数据节点
   - 确保输出包含`message`, `content`, `sha`

4. **测试完整工作流**
   - 使用Webhook触发完整工作流
   - 检查PUT请求是否成功

### 预期输出

**SHA提取节点输出**：
```json
{
  "currentSHA": "cef67a6fcfc0ed29e4aed724c557779e97c7c3b3",
  "currentArticles": [...]
}
```

**准备GitHub数据节点输出**：
```json
{
  "message": "Add new article via N8N automation: The Ultimate Guide to Free Invoice Programs for Small Businesses",
  "content": "ewogICJhcnRpY2xlcyI6IFsKICAgIHsKICAgICAgImlkIjogMTc2MTYwMjQ5MzIyMiwKICAgICAgInNsdWciOiAidGhlLXVsdGltYXRlLWd1aWRlLXRvLWZyZWUtaW52b2ljZS1wcm9ncmFtcy1mb3Itc21hbGwtYnVzaW5lc3NlcyIsCiAgICAgICJ0aXRsZSI6ICJUaGUgVWx0aW1hdGUgR3VpZGUgdG8gRnJlZSBJbnZvaWNlIFByb2dyYW1zIGZvciBTbWFsbCBCdXNpbmVzc2VzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRoZSBVbHRpbWF0ZSBHdWlkZSB0byBGcmVlIEludm9pY2UgUHJvZ3JhbXMgZm9yIFNtYWxsIEJ1c2luZXNzZXNcblxuSW4gdG9kYXkncyBmYXN0LXBhY2VkIGJ1c2luZXNzIHdvcmxkLCBtYW5hZ2luZyBmaW5hbmNlcyBlZmZpY2llbnRseSBpcyBjcnVjaWFsIGZvciBzdWNjZXNzLiBPbmUgb2YgdGhlIG1vc3QgZXNzZW50aWFsIHRvb2xzIGZvciBhbnkgYnUuLi4iLAogICAgICAiY29udGVudCI6ICI8aDE+VGhlIFVsdGltYXRlIEd1aWRlIHRvIEZyZWUgSW52b2ljZSBQcm9ncmFtcyBmb3IgU21hbGwgQnVzaW5lc3NlczwvaDE+XG5cbjxwPkluIHRvZGF5J3MgZmFzdC1wYWNlZCBidXNpbmVzcyB3b3JsZCwgbWFuYWdpbmcgZmluYW5jZXMgZWZmaWNpZW50bHkgaXMgY3J1Y2lhbCBmb3Igc3VjY2Vzcy4gT25lIG9mIHRoZSBtb3N0IGVzc2VudGlhbCB0b29scyBmb3IgYW55IGJ1c2luZXNzIGlzIGEgcmVsaWFibGUgaW52b2ljZSBwcm9ncmFtLiBIb3dldmVyLCBtYW55IHNtYWxsIGJ1c2luZXNzIG93bmVycyBzdHJ1Z2dsZSB3aXRoIHRoZSBjb3N0IG9mIHRyYWRpdGlvbmFsIGludm9pY2luZyBzb2Z0d2FyZS4gVGhhdCdzIHdoZXJlIGEgZnJlZSBpbnZvaWNlIHByb2dyYW0gY29tZXMgaW50byBwbGF5LiBCeSB1c2luZyBhIDxhIGhyZWY9XCJodHRwczovL2ZyZWVvbmxpbmVpbnZvaWNlLm9yZy9cIiByZWw9XCJub29wZW5lclwiIHRhcmdldD1cIl9ibGFua1wiPmZyZWUgaW52b2ljZSBwcm9ncmFtPC9hPiwgeW91IGNhbiBzdHJlYW1saW5lIHlvdXIgYmlsbGluZyBwcm9jZXNzZXMgd2l0aG91dCBicmVha2luZyB0aGUgYmFuay48L3A+IiwKICAgICAgImF1dGhvciI6ICJBZG1pbiIsCiAgICAgICJwdWJsaXNoZWRfYXQiOiAiMjAyNS0xMC0yOCIsCiAgICAgICJjYXRlZ29yeSI6ICJidXNpbmVzcyIsCiAgICAgICJ0YWdzIjogWwogICAgICAgICJpbnZvaWNlIiwKICAgICAgICAiYnVzaW5lc3MiLAogICAgICAgICJhdXRvbWF0aW9uIgogICAgICBdLAogICAgICAibWV0YV90aXRsZSI6ICJUaGUgVWx0aW1hdGUgR3VpZGUgdG8gRnJlZSBJbnZvaWNlIFByb2dyYW1zIGZvciBTbWFsbCBCdXNpbmVzc2VzIiwKICAgICAgIm1ldGFfZGVzY3JpcHRpb24iOiAiVGhlIFVsdGltYXRlIEd1aWRlIHRvIEZyZWUgSW52b2ljZSBQcm9ncmFtcyBmb3IgU21hbGwgQnVzaW5lc3Nlc1xuXG5JbiB0b2RheSdzIGZhc3QtcGFjZWQgYnVzaW5lc3Mgd29ybGQsIG1hbmFnaW5nIGZpbmFuY2VzIGVmZmljaWVudGx5IGlzIGNydWNpYWwgZm9yIHN1Y2Nlc3MuIE9uZSBvZiB0aGUgbW9zdCBlc3NlbnRpYWwgdG9vbHMgZm9yIGFueSBidS4uLiIsCiAgICAgICJmZWF0dXJlZCI6IGZhbHNlCiAgICB9CiAgXQp9",
  "sha": "cef67a6fcfc0ed29e4aed724c557779e97c7c3b3"
}
```

---

## 🎉 关键提醒

- **添加两个Code节点** - SHA提取节点和准备GitHub数据节点
- **正确连接数据流** - 这是解决SHA值问题的关键
- **测试每个节点** - 确保每个节点输出正确
- **PUT请求表达式** - 使用正确的表达式引用

### 🏆 恭喜！

按照这个配置指南，您应该能够成功配置Code节点并解决所有问题！

# N8N 正确配置指南

## 🎯 问题诊断

您当前的配置有两个主要问题：
1. **Headers配置错误** - 将文章内容放到了Headers中
2. **Body Content Type错误** - 使用了Form Urlencoded而不是JSON

## 🔧 正确配置步骤

### PUT请求节点配置

#### Parameters标签页
```
Method: PUT
URL: https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json
```

#### Authentication标签页
```
Authentication: Generic Credential Type
Generic Auth Type: Basic Auth
Select Credential: GitHub API Token
```

#### Headers标签页
```
Send Headers: 开启
Specify Headers: Using Fields Below

添加以下Header：
Name: Content-Type
Value: application/json

Name: Accept  
Value: application/vnd.github.v3+json

Name: User-Agent
Value: N8N-Automation
```

#### Body标签页
```
Send Body: 开启
Body Content Type: JSON
Specify Body: Using Fields Below

添加以下字段：
Name: message
Value: Add new article via N8N automation: {{ $json.article.title }}

Name: content
Value: {{ $json.encodedContent }}

Name: sha
Value: {{ $json.currentSHA }}
```

---

## 🚀 完整的数据流

### 工作流节点顺序和输出

#### 1. Webhook节点
接收新文章请求数据

#### 2. AI Agent节点
生成SEO文章内容，输出：
```json
{
  "article": {
    "title": "Unlock Efficiency with a Free Invoice Program: A Comprehensive Guide",
    "content": "<h1>Unlock Efficiency with a Free Invoice Program: A Comprehensive Guide</h1> <p>In today's fast-paced business world...</p>",
    "description": "Learn how a free invoice program can transform your business operations...",
    "author": "AI Assistant",
    "category": "business",
    "tags": ["invoice", "business", "automation"]
  }
}
```

#### 3. Function节点 - 准备GitHub数据
处理数据并准备Base64编码：
```javascript
// 生成唯一ID和slug
const articleData = {
  id: Date.now(),
  slug: generateSlug($json.article.title),
  title: $json.article.title,
  description: $json.article.description,
  content: $json.article.content,
  author: $json.article.author || "Admin",
  published_at: new Date().toISOString().split('T')[0],
  category: $json.article.category || "business",
  tags: $json.article.tags || ["automation"],
  meta_title: $json.article.title,
  meta_description: $json.article.description,
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

return {
  article: articleData,
  encodedContent: encodedContent,
  currentSHA: $json.currentSHA
};
```

#### 4. HTTP GET请求节点
获取当前SHA值，输出：
```json
{
  "currentSHA": "cef67a6fcfc0ed29e4aed724c557779e97c7c3b3",
  "currentArticles": [...现有文章列表...]
}
```

#### 5. Function节点 - 准备PUT数据
准备PUT请求数据：
```javascript
return {
  article: $json.article,
  encodedContent: $json.encodedContent,
  currentSHA: $json.currentSHA
};
```

#### 6. HTTP PUT请求节点 ⚠️ 需要正确配置
使用上面的正确配置

---

## 🧪 测试完整工作流

### 测试数据
在Webhook节点使用：
```json
{
  "topic": "Free Invoice Program Benefits",
  "keywords": ["invoice", "business", "automation", "free"],
  "target_audience": "small business owners and freelancers"
}
```

### 预期结果

#### PUT请求成功响应
```json
{
  "content": {
    "name": "articles.json",
    "path": "articles/articles.json",
    "sha": "新的SHA值",
    "size": 新的文件大小,
    "url": "https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json",
    "html_url": "https://github.com/kakawebai/Free-Invoice-Templates-2/blob/main/articles/articles.json"
  },
  "commit": {
    "sha": "提交的SHA值",
    "message": "Add new article via N8N automation: Unlock Efficiency with a Free Invoice Program: A Comprehensive Guide"
  }
}
```

---

## 🔍 常见错误和修复

### 错误1：Headers配置错误
**问题**：将文章内容放到了Headers中
**修复**：Headers只用于API元数据，Body用于实际内容

### 错误2：Body Content Type错误
**问题**：使用Form Urlencoded而不是JSON
**修复**：使用JSON Content Type

### 错误3：数据流不匹配
**问题**：表达式引用错误的数据
**修复**：确保每个节点的输出数据正确

---

## 📊 验证配置

### 检查步骤
1. **验证Function节点输出** - 确保包含正确的数据
2. **测试PUT请求单独运行** - 使用测试数据
3. **查看GitHub响应** - 确认状态码200
4. **检查GitHub文件** - 确认新文章已添加

### 成功指标
- ✅ PUT请求返回200状态码
- ✅ GitHub文件包含新文章
- ✅ 新文章在articles数组开头
- ✅ Vercel自动部署完成

---

## 🎉 立即修复

### 重新配置PUT请求节点

1. **删除当前的PUT请求节点**
2. **重新创建PUT请求节点**
3. **按照上面的正确配置设置**：
   - Parameters: PUT方法，正确URL
   - Authentication: GitHub API Token
   - Headers: 三个必要的Header
   - Body: Using Fields Below，三个字段

### 关键提醒
- **Headers用于API元数据**，不是文章内容
- **Body使用JSON格式**，不是Form Urlencoded
- **确保数据流正确**，每个节点输出正确数据

---

## 🏆 恭喜！

按照这个正确配置，您应该能够成功发布文章到GitHub！

所有技术细节都已提供，现在只需要按照正确的方法重新配置PUT请求节点即可。

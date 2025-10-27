# N8N自动化发布文章配置指南

## 概述
本指南介绍如何配置N8N来自动化发布文章到您的GitHub仓库，并自动触发Vercel部署。

## 准备工作

### 1. GitHub Personal Access Token
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token"
3. 选择以下权限：
   - `repo` (完全控制私有仓库)
   - `workflow` (可选，用于触发GitHub Actions)
4. 保存生成的token

### 2. Vercel部署钩子 (可选)
1. 访问您的Vercel项目设置
2. 在 "Git Integration" 中找到部署钩子
3. 创建新的部署钩子，获取URL

## N8N工作流配置

### 工作流结构
```
Webhook触发器 → 获取当前SHA → 处理文章数据 → 更新GitHub → 触发Vercel部署
```

### 详细节点配置

#### 节点1: Webhook触发器
- **节点类型**: Webhook
- **HTTP Method**: POST
- **Path**: `/article-publish`
- **Response Mode**: Respond to Webhook

**预期输入格式**:
```json
{
  "title": "文章标题",
  "description": "文章描述",
  "content": "文章内容(HTML格式)",
  "author": "作者名",
  "category": "business",
  "tags": ["invoice", "business"],
  "meta_title": "SEO标题",
  "meta_description": "SEO描述",
  "featured": true
}
```

#### 节点2: 获取当前articles.json的SHA
- **节点类型**: HTTP Request
- **Method**: GET
- **URL**: `https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json`
- **Authentication**: Basic Auth
- **Username**: `kakawebai`
- **Password**: `您的GitHub Personal Access Token`

#### 节点3: 处理文章数据 (Function节点)
```javascript
// 获取当前文章数据
const currentData = $('获取当前SHA').json;
const decodedContent = Buffer.from(currentData.content, 'base64').toString('utf8');
const articlesData = JSON.parse(decodedContent);

// 准备新文章
const newArticle = {
  id: Date.now(),
  slug: $input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  title: $input.title,
  description: $input.description,
  content: $input.content,
  author: $input.author || "Admin",
  published_at: new Date().toISOString().split('T')[0],
  category: $input.category || "business",
  tags: $input.tags || ["invoice", "business"],
  meta_title: $input.meta_title || $input.title,
  meta_description: $input.meta_description || $input.description,
  featured: $input.featured || false
};

// 添加到文章数组开头
articlesData.articles.unshift(newArticle);

// 返回处理后的数据
return {
  newContent: JSON.stringify(articlesData, null, 2),
  currentSHA: currentData.sha,
  encodedContent: Buffer.from(JSON.stringify(articlesData, null, 2)).toString('base64'),
  article: newArticle
};
```

#### 节点4: 更新GitHub文件
- **节点类型**: HTTP Request
- **Method**: PUT
- **URL**: `https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json`
- **Authentication**: Basic Auth (同上)
- **Headers**:
  - `Content-Type`: `application/json`
- **Body** (JSON):
```json
{
  "message": "Add new article via N8N automation: {{ $json.article.title }}",
  "content": "{{ $json.encodedContent }}",
  "sha": "{{ $json.currentSHA }}"
}
```

#### 节点5: 触发Vercel部署 (可选)
- **节点类型**: HTTP Request
- **Method**: POST
- **URL**: `您的Vercel部署钩子URL`
- **Headers**:
  - `Content-Type`: `application/json`

## 测试工作流

### 测试数据示例
```json
{
  "title": "测试文章 - N8N自动化发布",
  "description": "这是一篇通过N8N自动化发布的测试文章",
  "content": "<h2>测试文章内容</h2><p>这篇文章是通过N8N工作流自动发布的。</p><p>自动化发布可以大大提高内容管理效率。</p>",
  "author": "N8N Bot",
  "category": "tutorial",
  "tags": ["n8n", "automation", "test"],
  "meta_title": "N8N自动化发布测试",
  "meta_description": "测试通过N8N自动化发布文章到GitHub和Vercel的功能",
  "featured": false
}
```

### 预期结果
1. GitHub仓库中的 `articles/articles.json` 文件被更新
2. 新文章出现在文章列表的开头
3. Vercel自动部署新版本
4. 网站上的文章列表和博客页面自动更新

## 错误处理

### 常见错误及解决方案

1. **GitHub API 403错误**
   - 检查Personal Access Token权限
   - 确认token未过期

2. **SHA不匹配错误**
   - 确保在更新前获取最新的SHA值
   - 检查是否有其他人同时修改了文件

3. **内容编码错误**
   - 确保使用Base64编码内容
   - 验证JSON格式正确

## 高级配置

### 1. 添加验证步骤
在Function节点中添加数据验证：
```javascript
// 验证必要字段
const required = ['title', 'content'];
const missing = required.filter(field => !$input[field]);
if (missing.length > 0) {
  throw new Error(`缺少必要字段: ${missing.join(', ')}`);
}
```

### 2. 添加通知
集成Slack、Discord或邮件通知，在文章发布成功或失败时发送通知。

### 3. 定时发布
使用N8N的Cron触发器实现定时发布功能。

## 安全考虑

1. **保护GitHub Token**
   - 不要在代码中硬编码token
   - 使用N8N的凭证管理功能

2. **输入验证**
   - 验证所有输入数据
   - 防止XSS攻击

3. **访问控制**
   - 限制Webhook的访问权限
   - 使用HTTPS

## 监控和维护

1. **日志记录**
   - 记录所有发布操作
   - 跟踪成功和失败次数

2. **性能监控**
   - 监控工作流执行时间
   - 设置警报阈值

3. **定期检查**
   - 定期检查GitHub token状态
   - 验证Vercel部署钩子有效性

## 故障排除

如果遇到问题，请检查：
1. N8N工作流执行日志
2. GitHub API响应状态
3. Vercel部署状态
4. 网络连接状态

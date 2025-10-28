# N8N 对接 GitHub 完整代码

## 🎯 功能说明
通过N8N自动化发布内容到GitHub仓库

## 📋 工作流节点顺序

### 1. Webhook节点 (接收触发)
- 接收JSON数据，包含文章信息

### 2. AI Agent节点 (生成内容)
**提示词**：
```
您是一个专业的SEO内容英文创作助手。请根据提供的关键词和URL创作高质量的SEO优化文章。

关键词：{{ $json['关键词'] }}
嵌入URL：{{ $json.URL }}

文章要求：
1. 字数800-1200字，结构清晰
2. 自然地将提供的URL嵌入到相关内容中
3. 包含H1、H2标题层级
4. 使用项目符号或编号列表
5. 包含实际可操作的建议

请严格按照以下JSON格式返回：
{
  "title": "文章标题",
  "content": "文章内容，使用HTML格式",
  "author": "Admin",
  "category": "business",
  "tags": ["keyword1", "keyword2"],
  "meta_description": "150-160字符的描述"
}
```

### 3. HTTP GET请求节点 (获取当前文件)
**配置**：
```
Method: GET
URL: https://api.github.com/repos/用户名/仓库名/contents/文件路径.json
Authentication: Basic Auth
Username: 您的GitHub用户名
Password: 您的GitHub Personal Access Token
Headers:
- Accept: application/vnd.github.v3+json
- User-Agent: N8N-Automation
```

### 4. Code节点 - SHA提取
**代码**：
```javascript
// SHA提取节点
console.log('GET请求输出:', JSON.stringify($json, null, 2));

let currentSHA = "";
let currentArticles = [];

// 提取SHA值
if ($json && $json.sha) {
  currentSHA = $json.sha;
} else if ($json && $json.content && $json.content.sha) {
  currentSHA = $json.content.sha;
} else {
  console.log('无法提取SHA值，可能是第一次发布');
  currentSHA = "";
}

// 提取现有内容
if ($json && $json.content && $json.content.content) {
  try {
    const decodedContent = Buffer.from($json.content.content, 'base64').toString('utf8');
    const articlesData = JSON.parse(decodedContent);
    currentArticles = articlesData.articles || [];
  } catch (e) {
    currentArticles = [];
  }
}

console.log('最终输出:', { currentSHA, currentArticles });
return { currentSHA: currentSHA, currentArticles: currentArticles };
```

### 5. Code节点 - 准备GitHub数据
**代码**：
```javascript
// 准备GitHub更新数据
const aiOutput = $json.output || $json;
let article = {};

try {
  if (typeof aiOutput === 'string') {
    const cleaned = aiOutput.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    article = JSON.parse(cleaned);
  } else {
    article = aiOutput;
  }
} catch (e) {
  article = {
    title: "New Article",
    content: "<p>Article content</p>",
    author: "Admin",
    category: "business",
    tags: ["automation"],
    meta_description: "Article description"
  };
}

const articleTitle = article.title || "New Article";

// 优化描述生成
const description = (article.content || "")
  .replace(/<[^>]*>/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .substring(0, 150) + "...";

const newArticle = {
  id: Date.now(),
  slug: articleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  title: articleTitle,
  description: description,
  content: article.content || "<p>Article content</p>",
  author: article.author || "Admin",
  published_at: new Date().toISOString().split('T')[0],
  category: article.category || "business",
  tags: article.tags || ["automation"],
  meta_title: articleTitle,
  meta_description: article.meta_description || description,
  featured: false
};

const currentArticles = $json.currentArticles || [];
const allArticles = [newArticle, ...currentArticles];
const articlesJson = { articles: allArticles };
const encodedContent = Buffer.from(JSON.stringify(articlesJson, null, 2)).toString('base64');

// 使用动态SHA值
const shaValue = $json.currentSHA || "";

return {
  message: articleTitle,
  content: encodedContent,
  sha: shaValue
};
```

### 6. HTTP PUT请求节点 (发布到GitHub)
**配置**：
```
Method: PUT
URL: https://api.github.com/repos/用户名/仓库名/contents/文件路径.json
Authentication: Basic Auth
Username: 您的GitHub用户名
Password: 您的GitHub Personal Access Token
Headers:
- Content-Type: application/json
- Accept: application/vnd.github.v3+json
- User-Agent: N8N-Automation
Body (Using Fields Below):
- message: {{ $json.message }}
- content: {{ $json.content }}
- sha: {{ $json.sha }}
```

## 🔧 配置说明

### 1. GitHub配置
- **仓库URL**: 替换为您的仓库地址
- **文件路径**: 替换为您要更新的文件路径
- **认证**: 使用GitHub Personal Access Token

### 2. 数据流连接
- **HTTP GET请求** → **SHA提取Code节点** → **准备GitHub数据Code节点**
- **AI Agent** → **准备GitHub数据Code节点**
- **准备GitHub数据Code节点** → **HTTP PUT请求**

### 3. 测试数据
```json
{
  "关键词": "your keyword",
  "URL": "https://yourwebsite.com/",
  "topic": "Article Topic",
  "target_audience": "small business owners"
}
```

## 🚀 快速使用步骤

1. **复制代码**到您的N8N工作流
2. **修改配置**：
   - GitHub仓库URL
   - 文件路径
   - 认证信息
3. **测试工作流**
4. **部署使用**

## 📝 注意事项

1. **SHA值动态获取** - 确保每次发布使用最新的SHA值
2. **认证配置** - 使用GitHub Personal Access Token
3. **数据格式** - 确保JSON格式正确
4. **错误处理** - 代码包含基本的错误处理

这个代码可以直接复制到其他N8N项目中使用，只需要修改GitHub仓库信息和文件路径即可。

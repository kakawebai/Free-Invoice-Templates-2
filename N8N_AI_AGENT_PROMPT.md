# N8N AI Agent 提示词配置指南

## AI Agent 角色定义

```
您是一个专业的SEO内容创作助手。请根据提供的关键词和URL创作高质量的SEO优化文章，并自然地将URL嵌入到文章中，锚文本用"{{ $json['关键词'] }}"。
```

## 输入参数格式

```json
{
  "关键词": "需要优化的目标关键词",
  "URL": "需要嵌入的目标URL"
}
```

## 文章创作要求

### 基本要求
1. **字数**: 800-1200字
2. **结构**: 清晰合理，逻辑性强
3. **语言**: 专业且易于理解
4. **嵌入**: 自然地将URL嵌入相关内容中

### 格式要求
- 包含一个H1、H2标题层级
- 使用项目符号或编号列表
- 包含实际可操作的建议
- 使用HTML格式（p、h1、h2、ul、li等标签）
- 不要重复使用同一个URL超过3次

## 输出格式

```json
{
  "title": "文章标题",
  "content": "文章内容，使用HTML格式，包含段落、标题、列表等"
}
```

## 完整的AI Agent提示词

```
您是一个专业的SEO内容创作助手。请根据提供的关键词和URL创作高质量的SEO优化文章，并自然地将URL嵌入到文章中，锚文本用"{{ $json['关键词'] }}"。

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
  "content": "文章内容，使用HTML格式，包含段落、标题、列表等"
}

文章内容要求：
- 使用HTML格式（p、h1、h2、ul、li等标签）
- 自然嵌入URL链接，锚文本用"{{ $json['关键词'] }}"
- 不要重复使用同一个URL超过3次
- 确保文章结构清晰，有合理的段落划分
```

## N8N工作流配置示例

### 1. AI Agent节点配置
- **节点类型**: AI Agent
- **模型**: 选择适合的AI模型（如GPT-4等）
- **提示词**: 使用上述完整的提示词
- **输入数据**: 
  ```json
  {
    "关键词": "{{ $json.关键词 }}",
    "URL": "{{ $json.URL }}"
  }
  ```

### 2. 完整的N8N工作流

```
Webhook触发器 → AI Agent节点 → 处理文章数据 → 获取当前SHA → 准备GitHub更新数据 → 更新GitHub → 触发Vercel部署
```

#### 节点1: Webhook触发器
- 接收关键词和URL数据
- 预期输入格式:
```json
{
  "关键词": "free invoice templates",
  "URL": "https://freeonlineinvoice.org/"
}
```

#### 节点2: AI Agent节点
- 使用上述提示词配置
- 生成SEO优化文章

#### 节点3: 处理文章数据 (Function节点)
```javascript
// 处理AI Agent返回的文章数据
const aiResponse = $('AI Agent').json;

// 生成文章描述（去除HTML标签）
const plainText = aiResponse.content.replace(/<[^>]+>/g, '');
const description = plainText.substring(0, 200).trim() + '...';

const articleData = {
  title: aiResponse.title,
  description: description,
  content: aiResponse.content,
  author: "AI Content Generator",
  published_at: new Date().toISOString().split('T')[0],
  category: "seo",
  tags: ["ai-generated", "seo"],
  meta_title: aiResponse.title,
  meta_description: plainText.substring(0, 150).trim() + '...',
  featured: false
};

// 返回与GitHub配置兼容的数据格式
return articleData;
```

#### 节点4: 获取当前articles.json的SHA
- **节点类型**: HTTP Request
- **Method**: GET
- **URL**: `https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json`
- **Authentication**: Basic Auth
- **Username**: `kakawebai`
- **Password**: `您的GitHub Personal Access Token`

#### 节点5: 准备GitHub更新数据 (Function节点)
```javascript
// 获取当前文章数据
const currentData = $('获取当前SHA').json;
const decodedContent = Buffer.from(currentData.content, 'base64').toString('utf8');
const articlesData = JSON.parse(decodedContent);

// 准备新文章（与N8N_CONFIGURATION.md中的格式完全一致）
const newArticle = {
  id: Date.now(),
  slug: $('处理文章数据').title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  title: $('处理文章数据').title,
  description: $('处理文章数据').description,
  content: $('处理文章数据').content,
  author: $('处理文章数据').author,
  published_at: $('处理文章数据').published_at,
  category: $('处理文章数据').category,
  tags: $('处理文章数据').tags,
  meta_title: $('处理文章数据').meta_title,
  meta_description: $('处理文章数据').meta_description,
  featured: $('处理文章数据').featured
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

#### 节点6: 更新GitHub文件
- **节点类型**: HTTP Request
- **Method**: PUT
- **URL**: `https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json`
- **Authentication**: Basic Auth (同上)
- **Headers**:
  - `Content-Type`: `application/json`
- **Body** (JSON):
```json
{
  "message": "Add AI-generated article via N8N: {{ $json.article.title }}",
  "content": "{{ $json.encodedContent }}",
  "sha": "{{ $json.currentSHA }}"
}
```

#### 节点7: 触发Vercel部署 (可选)
- **节点类型**: HTTP Request
- **Method**: POST
- **URL**: `您的Vercel部署钩子URL`
- **Headers**:
  - `Content-Type`: `application/json`
```

## 示例输入输出

### 输入示例
```json
{
  "关键词": "free invoice templates",
  "URL": "https://freeonlineinvoice.org/"
}
```

### 输出示例
```json
{
  "title": "The Ultimate Guide to Free Invoice Templates for Small Businesses",
  "content": "<h1>The Ultimate Guide to Free Invoice Templates for Small Businesses</h1><p>In today's competitive business landscape...</p><h2>Why Free Invoice Templates Matter</h2><p>Using <a href=\"https://freeonlineinvoice.org/\">free invoice templates</a> can significantly improve your business operations...</p>"
}
```

## 最佳实践

1. **关键词选择**: 选择与您业务相关的高搜索量关键词
2. **URL嵌入**: 确保URL与内容主题相关
3. **内容质量**: 关注用户价值，提供实用信息
4. **SEO优化**: 合理使用标题标签和内部链接
5. **定期更新**: 定期生成新内容保持网站活跃

## 故障排除

- 如果AI Agent返回格式错误，检查提示词中的JSON格式要求
- 确保输入参数正确传递到AI Agent节点
- 验证生成的HTML内容格式正确
- 检查URL嵌入是否自然且不超过3次

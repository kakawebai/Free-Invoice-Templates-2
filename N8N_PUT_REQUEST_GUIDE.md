# N8N PUT请求配置指南 - 实际发布文章

## 🎯 问题说明

您已经成功测试了GET请求，获取了SHA值，但还没有配置PUT请求来实际发布文章。这就是为什么在GitHub上看不到新文章的原因。

## 🔧 PUT请求配置步骤

### 1. 添加PUT请求节点

在N8N工作流中，在GET请求节点后添加一个新的HTTP Request节点。

### 2. 配置PUT请求参数

#### Parameters标签页
```
Method: PUT
URL: https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json
```

#### Authentication标签页
```
Authentication: Generic Credential Type
Generic Auth Type: Basic Auth
Select Credential: GitHub API Token (使用已创建的凭证)
```

#### Headers标签页
```
Content-Type: application/json
Accept: application/vnd.github.v3+json
User-Agent: N8N-Automation
```

#### Body标签页
```
Content Type: JSON
Specify Body: Using JSON
Body内容:
{
  "message": "Add new article via N8N automation: {{ $json.article.title }}",
  "content": "{{ $json.encodedContent }}",
  "sha": "{{ $json.currentSHA }}"
}
```

### 3. 数据流说明

- `$json.currentSHA`: 来自GET请求的SHA值
- `$json.encodedContent`: 来自Function节点的Base64编码内容
- `$json.article.title`: 来自AI Agent的文章标题

---

## 🚀 完整的发布流程

### 工作流节点顺序
1. **Webhook** - 接收新文章数据
2. **AI Agent** - 生成SEO文章内容
3. **Function** - 准备GitHub更新数据
4. **HTTP Request (GET)** - 获取当前SHA值 ✅ 已测试成功
5. **Function** - 准备PUT请求数据
6. **HTTP Request (PUT)** - 更新GitHub文件 ⚠️ 需要配置
7. **HTTP Request (POST)** - 触发Vercel部署

### 关键节点说明

#### 准备GitHub更新数据 (Function节点)
```javascript
// 这个节点准备Base64编码的内容
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

#### 准备PUT请求数据 (Function节点)
```javascript
// 这个节点准备PUT请求的完整数据
return {
  message: `Add new article via N8N automation: ${$json.article.title}`,
  content: $json.encodedContent,
  sha: $json.currentSHA
};
```

---

## 🧪 测试完整工作流

### 测试数据
您可以使用以下测试数据触发Webhook：

```json
{
  "topic": "如何使用N8N自动化发布文章",
  "keywords": ["n8n", "automation", "github", "seo"],
  "target_audience": "技术爱好者和开发者"
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
    "message": "Add new article via N8N automation: 测试文章标题"
  }
}
```

#### GitHub文件验证
- 访问: https://github.com/kakawebai/Free-Invoice-Templates-2/blob/main/articles/articles.json
- 确认新文章已添加到`articles`数组的开头

#### 网站验证
- 访问: https://freeonlinetemplates-2.vercel.app/articles.html
- 查看最新发布的文章

---

## 🔍 故障排除

### 常见PUT请求错误

#### 403错误 (权限不足)
- 检查GitHub Token是否有`repo`权限
- 验证仓库访问权限
- 确认Token未过期

#### 422错误 (SHA不匹配)
- 确保使用最新的SHA值
- 重新运行GET请求获取新SHA
- 检查是否有其他人同时修改了文件

#### 400错误 (数据格式错误)
- 验证JSON格式正确
- 检查Base64编码是否正确
- 确认字段名称拼写

### 调试技巧

1. **逐步测试**: 先测试每个节点单独运行
2. **查看数据**: 检查每个节点的输出数据
3. **验证格式**: 确保数据格式符合GitHub API要求
4. **检查权限**: 确认API Token有足够权限

---

## 📊 监控和验证

### 成功指标
- ✅ PUT请求返回200状态码
- ✅ GitHub文件包含新文章
- ✅ 新文章在`articles`数组的开头
- ✅ Vercel自动部署完成
- ✅ 网站显示新文章

### 验证步骤
1. 检查N8N工作流执行日志
2. 查看GitHub提交历史
3. 访问GitHub文件确认更新
4. 检查Vercel部署状态
5. 访问网站验证显示

---

## 🎉 下一步行动

### 立即操作
1. **配置PUT请求节点** - 按照上面的配置步骤
2. **测试完整工作流** - 使用测试数据触发
3. **验证发布结果** - 检查GitHub和网站

### 长期优化
1. **错误处理** - 添加重试和错误通知
2. **数据验证** - 增强输入数据验证
3. **监控告警** - 设置发布失败告警
4. **性能优化** - 优化工作流性能

---

## 📞 技术支持

如果遇到问题，请检查：
1. N8N工作流配置是否正确
2. GitHub API权限是否足够
3. 数据格式是否符合要求
4. 网络连接是否正常

所有配置文档都在 `N8N_*.md` 文件中，可以参考这些文档进行故障排除。

**关键提醒**: 您已经完成了最复杂的GET请求配置，PUT请求的配置相对简单，只需要复制GET请求的配置并修改Method和Body即可！

# N8N 文章发布位置说明

## 📍 文章发布的具体文件

### 1. 主要发布文件
**文件路径**: `articles/articles.json`

### 2. 文件位置说明
- **GitHub仓库**: https://github.com/kakawebai/Free-Invoice-Templates-2/blob/main/articles/articles.json
- **本地项目**: `c:\Users\123\Desktop\新建文件夹\Free-Online-Invoice\articles\articles.json`

### 3. 文件内容结构
```json
{
  "articles": [
    {
      "id": 1761359549285,
      "slug": "the-ultimate-guide-to-free-invoice-templates-to-do",
      "title": "The Ultimate Guide to Free Invoice Templates to Download for Your Business",
      "description": "In today's competitive business landscape, efficiency and professionalism...",
      "content": "完整的文章HTML内容...",
      "author": "Admin",
      "published_at": "2025-10-25",
      "category": "business",
      "tags": ["invoice", "business"],
      "meta_title": "The Ultimate Guide to Free Invoice Templates to Download for Your Business",
      "meta_description": "In today's competitive business landscape, efficiency and professionalism...",
      "featured": false
    },
    {
      "id": 1761343021146,
      "slug": "word",
      "title": "Word发票模板创建指南",
      "description": "使用Word创建专业发票模板的完整指南...",
      "content": "完整的文章HTML内容...",
      "author": "Admin",
      "published_at": "2025-10-24",
      "category": "business",
      "tags": ["invoice", "business"],
      "meta_title": "Word发票模板创建指南",
      "meta_description": "使用Word创建专业发票模板的完整指南...",
      "featured": false
    }
  ]
}
```

---

## 🔄 N8N自动化发布流程

### 发布流程
1. **接收新文章数据** (Webhook)
2. **生成SEO文章** (AI Agent)
3. **准备更新数据** (Function节点)
4. **获取当前SHA** (HTTP GET请求)
5. **更新文章列表** (HTTP PUT请求)

### 更新位置
- **目标文件**: `articles/articles.json`
- **更新方式**: 在`articles`数组中添加新文章对象
- **API端点**: `https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json`

---

## 🌐 网站显示位置

### 1. 文章列表页面
**URL**: https://freeonlinetemplates-2.vercel.app/articles.html

### 2. 单个文章页面
**URL格式**: https://freeonlinetemplates-2.vercel.app/blog/[文章slug].html

### 3. 博客主页
**URL**: https://freeonlinetemplates-2.vercel.app/blog.html

---

## 📁 相关文件说明

### 1. 文章数据文件
- `articles/articles.json` - 主要文章数据存储
- `articles/build-articles.js` - 文章构建脚本

### 2. 网站页面文件
- `public/articles.html` - 文章列表页面
- `public/blog.html` - 博客主页
- `public/blog/` - 单个文章页面目录

### 3. 自动化脚本
- `articles/n8n-automation.js` - N8N自动化处理器
- `articles/n8n-ai-agent-processor.js` - AI Agent处理器

---

## 🔍 如何查看已发布的文章

### 1. 在GitHub上查看
- 访问: https://github.com/kakawebai/Free-Invoice-Templates-2/blob/main/articles/articles.json
- 查看`articles`数组中的最新条目

### 2. 在网站上查看
- 访问: https://freeonlinetemplates-2.vercel.app/articles.html
- 查看最新发布的文章

### 3. 在本地查看
- 打开文件: `c:\Users\123\Desktop\新建文件夹\Free-Online-Invoice\articles\articles.json`
- 查看JSON文件中的`articles`数组

---

## 🛠️ 手动添加文章

### 如果需要手动添加文章，可以：

#### 方法1: 直接编辑JSON文件
1. 打开 `articles/articles.json`
2. 在`articles`数组中添加新文章对象
3. 提交并推送到GitHub

#### 方法2: 使用GitHub网页界面
1. 访问GitHub仓库
2. 编辑 `articles/articles.json` 文件
3. 提交更改

#### 方法3: 使用N8N自动化
1. 配置完整的N8N工作流
2. 通过Webhook触发新文章发布
3. 自动更新GitHub和部署Vercel

---

## 📊 文章数据结构

### 必需字段
```json
{
  "id": "唯一ID (时间戳)",
  "slug": "URL友好的文章标识",
  "title": "文章标题",
  "description": "文章描述",
  "content": "完整的HTML内容",
  "author": "作者",
  "published_at": "发布日期 (YYYY-MM-DD)",
  "category": "分类",
  "tags": ["标签1", "标签2"]
}
```

### 可选字段
```json
{
  "meta_title": "SEO标题",
  "meta_description": "SEO描述",
  "featured": "是否推荐"
}
```

---

## 🚀 验证发布成功

### 检查步骤
1. **GitHub文件更新**: 确认 `articles.json` 有新文章
2. **Vercel部署**: 检查Vercel是否自动部署
3. **网站显示**: 访问网站查看新文章
4. **SEO优化**: 检查文章页面的SEO元素

### 成功指标
- ✅ GitHub文件包含新文章
- ✅ Vercel部署完成
- ✅ 网站可访问新文章
- ✅ SEO元素正确显示

---

## ❓ 常见问题

### Q: 为什么在网站上找不到新文章？
A: 检查：
1. GitHub文件是否更新
2. Vercel是否完成部署
3. 文章slug是否正确
4. 缓存是否清除

### Q: 如何修改已发布的文章？
A: 编辑 `articles/articles.json` 中的对应文章对象，然后重新部署。

### Q: 如何删除文章？
A: 从 `articles/articles.json` 的数组中移除对应文章，然后重新部署。

---

## 📞 技术支持

如果遇到问题，请检查：
1. N8N工作流配置
2. GitHub API权限
3. Vercel部署状态
4. 文件路径和格式

所有配置文档都在 `N8N_*.md` 文件中，可以参考这些文档进行故障排除。

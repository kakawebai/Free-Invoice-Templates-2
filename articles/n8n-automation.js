/**
 * N8N自动化发布文章脚本
 * 用于通过GitHub API自动更新文章数据
 */

const fs = require('fs');
const path = require('path');

class ArticleAutomation {
  constructor() {
    this.articlesFile = path.join(__dirname, 'articles.json');
  }

  /**
   * 添加新文章到articles.json
   * @param {Object} articleData 文章数据
   * @returns {Object} 更新后的文章数据
   */
  addArticle(articleData) {
    try {
      // 读取现有文章数据
      const articlesData = JSON.parse(fs.readFileSync(this.articlesFile, 'utf8'));
      
      // 生成新文章ID和slug
      const newArticle = {
        id: Date.now(),
        slug: this.generateSlug(articleData.title),
        title: articleData.title,
        description: articleData.description,
        content: articleData.content,
        author: articleData.author || "Admin",
        published_at: new Date().toISOString().split('T')[0],
        category: articleData.category || "business",
        tags: articleData.tags || ["invoice", "business"],
        meta_title: articleData.meta_title || articleData.title,
        meta_description: articleData.meta_description || articleData.description,
        featured: articleData.featured || false
      };

      // 添加到文章数组开头
      articlesData.articles.unshift(newArticle);

      // 保存更新后的数据
      fs.writeFileSync(this.articlesFile, JSON.stringify(articlesData, null, 2));

      console.log('✅ 文章添加成功:', newArticle.title);
      return {
        success: true,
        article: newArticle,
        totalArticles: articlesData.articles.length
      };
    } catch (error) {
      console.error('❌ 添加文章失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成URL友好的slug
   * @param {string} title 文章标题
   * @returns {string} slug
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * 构建文章内容
   * @param {Object} articleData 文章数据
   * @returns {string} 构建后的内容
   */
  buildArticleContent(articleData) {
    const { title, content, author, category, tags } = articleData;
    
    return `# ${title}

${content}

---
*作者: ${author}*  
*分类: ${category}*  
*标签: ${tags.join(', ')}*  
*发布时间: ${new Date().toLocaleDateString()}*`;
  }

  /**
   * 验证文章数据
   * @param {Object} articleData 文章数据
   * @returns {Object} 验证结果
   */
  validateArticleData(articleData) {
    const required = ['title', 'content'];
    const missing = required.filter(field => !articleData[field]);
    
    if (missing.length > 0) {
      return {
        valid: false,
        error: `缺少必要字段: ${missing.join(', ')}`
      };
    }

    if (articleData.title.length > 100) {
      return {
        valid: false,
        error: '标题长度不能超过100个字符'
      };
    }

    return { valid: true };
  }
}

// 导出供N8N使用
module.exports = ArticleAutomation;

// 如果直接运行，提供示例用法
if (require.main === module) {
  const automation = new ArticleAutomation();
  
  // 示例文章数据
  const sampleArticle = {
    title: "如何使用N8N自动化发布文章",
    description: "学习如何配置N8N来自动化发布文章到GitHub和Vercel",
    content: "<p>N8N是一个强大的工作流自动化工具，可以帮助您自动化文章发布流程。</p><p>通过配置HTTP Request节点，您可以自动更新GitHub上的文章数据，并触发Vercel部署。</p>",
    author: "Admin",
    category: "tutorial",
    tags: ["n8n", "automation", "github"],
    meta_title: "N8N自动化文章发布教程",
    meta_description: "学习如何使用N8N自动化发布文章到GitHub和Vercel的完整指南",
    featured: true
  };

  const result = automation.addArticle(sampleArticle);
  console.log('示例执行结果:', result);
}

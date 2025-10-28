const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// 读取文章数据
const articlesData = require('./articles.json');
const articles = articlesData.articles;

// 简单的摘要生成：去除HTML标签、压缩空白并按长度截断
function toExcerpt(input, max = 200) {
  const text = (input || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

// 安全日期显示：缺失或非法日期时返回占位符
function safeDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

// 用于排序的时间戳：优先 published_at，其次 created_at，最后 0
function getSortTime(a) {
  const t = a && (a.published_at || a.created_at);
  if (!t) return 0;
  const d = new Date(t);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

console.log('🚀 开始构建文章页面...');

// 生成博客首页 (blog.html)
function buildBlogPage() {
    console.log('📝 生成博客首页...');
    
    // 读取现有的blog.html作为模板
    let blogContent = fs.readFileSync('./public/blog.html', 'utf8');
    
    // 生成最新的文章列表 - 修复：显示所有文章，无限制数量
    const latestArticles = articles
        .sort((a, b) => getSortTime(b) - getSortTime(a)) // 按发布时间倒序
        .map(article => `
            <article class="article-card">
                <h3><a href="post.html?slug=${article.slug}">${article.title}</a></h3>
                <p class="article-excerpt">${toExcerpt(article.description || article.content, 200)}</p>
                <div class="article-meta">
                    <span class="category">${article.category}</span>
                    <span class="date">${safeDate(article.published_at)}</span>
                </div>
            </article>
        `).join('');

    // 替换文章列表部分
    blogContent = blogContent.replace(
        /<div class="articles-grid">[\s\S]*?<\/div>/,
        `<div class="articles-grid">${latestArticles}</div>`
    );

    // 写入更新后的文件
    fs.writeFileSync('./public/blog.html', blogContent);
    console.log('✅ 博客首页生成完成');
}

// 新增：生成文章列表页 (articles.html) 的静态链接，避免孤立页面
function buildArticlesPage() {
  console.log('📝 生成文章列表页...');
  let articlesContent = fs.readFileSync('./public/articles.html', 'utf8');

  // 移除不需要的 post-data.js 引用（articles.html 不再依赖）
  articlesContent = articlesContent.replace('<script src="post-data.js"></script>', '');

  // 生成静态文章列表 HTML
  const articlesHTML = articles
    .sort((a, b) => getSortTime(b) - getSortTime(a))
    .map(article => `
      <article class="article-card" data-category="${article.category}" data-tags="${(article.tags || []).join(',')}">
        <div class="article-card-header">
          <h3><a href="post.html?slug=${article.slug}">${article.title}</a></h3>
          <div class="article-meta">
            <span class="category">${article.category}</span>
            <time datetime="${article.published_at || ''}">${safeDate(article.published_at)}</time>
          </div>
        </div>
        <div class="article-excerpt">${toExcerpt(article.description || article.content, 200)}</div>
        <div class="article-footer">
          <div class="article-tags">${(article.tags || []).map(tag => `<a class="tag" href="articles.html?tag=${encodeURIComponent(tag)}">${tag}</a>`).join('')}</div>
          <a href="post.html?slug=${article.slug}" class="read-more">Read More →</a>
        </div>
      </article>
    `).join('');

  const startTag = '<div id="articles-container" class="articles-grid">';
  const startIdx = articlesContent.indexOf(startTag);
  if (startIdx === -1) {
    console.warn('⚠️ 未找到 #articles-container 容器，跳过静态渲染。');
  } else {
    // 计算容器闭合位置（跟踪嵌套 div 深度）
    const html = articlesContent;
    let i = startIdx + startTag.length;
    let depth = 1;
    const len = html.length;
    while (i < len) {
      const nextOpen = html.indexOf('<div', i);
      const nextClose = html.indexOf('</div>', i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++; i = nextOpen + 4;
      } else {
        depth--; i = nextClose + 6;
        if (depth === 0) break;
      }
    }
    const containerEndIdx = i; // 指向容器闭合标签后的索引

    // 为避免旧版构建造成的重复块，截取到 no-results 之前的内容并重组
    const noResultsIdx = articlesContent.indexOf('<div id="no-results"', containerEndIdx);
    const prefix = articlesContent.slice(0, startIdx);
    const suffix = noResultsIdx !== -1 ? articlesContent.slice(noResultsIdx) : articlesContent.slice(containerEndIdx);

    // 移除 All Articles 页中的“Helpful Resources”块（按需只展示文章卡片）
    articlesContent = `${prefix}${startTag}${articlesHTML}</div>${suffix}`;
  }

  // 用仅保留筛选功能的精简脚本替换旧的动态渲染脚本
  const filterScript = `    <script>
        document.addEventListener('DOMContentLoaded', function() {
            var cat = document.getElementById('category-filter');
            var search = document.getElementById('search-filter');
            if (cat) cat.addEventListener('change', filterArticles);
            if (search) search.addEventListener('input', filterArticles);
            // 通过 URL 参数预筛选
            try {
              var params = new URLSearchParams(window.location.search);
              var tagParam = params.get('tag');
              var qParam = params.get('q');
              var catParam = params.get('category');
              if (cat && catParam) { cat.value = catParam; }
              if (search && (tagParam || qParam)) {
                search.value = decodeURIComponent(tagParam || qParam);
              }
            } catch(e) {}
            filterArticles();
        });
        function filterArticles() {
            var categoryFilter = document.getElementById('category-filter').value;
            var searchFilter = document.getElementById('search-filter').value.toLowerCase();
            var articles = document.querySelectorAll('.article-card');
            var visibleCount = 0;
            articles.forEach(function(article){
                var category = article.getAttribute('data-category');
                var tags = (article.getAttribute('data-tags') || '').toLowerCase();
                var title = article.querySelector('h3 a').textContent.toLowerCase();
                var excerpt = article.querySelector('.article-excerpt').textContent.toLowerCase();
                var categoryMatch = categoryFilter === 'all' || category === categoryFilter;
                var searchMatch = !searchFilter || title.includes(searchFilter) || excerpt.includes(searchFilter) || tags.includes(searchFilter);
                if (categoryMatch && searchMatch) { article.style.display = 'block'; visibleCount++; }
                else { article.style.display = 'none'; }
            });
            var noResults = document.getElementById('no-results');
            if (noResults) noResults.style.display = (visibleCount === 0) ? 'block' : 'none';
        }
    </script>`;
  articlesContent = articlesContent.replace(/<script>[\s\S]*?<\/script>/, filterScript);

  // 注入 ItemList JSON-LD 和 canonical
  const siteBaseUrl = 'https://www.invoice-generator.org';
  const sortedForItemList = articles
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  const itemListElements = sortedForItemList.map((a, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    url: `${siteBaseUrl}/post.html?slug=${a.slug}`
  }));
  const itemListJSON = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Articles",
    "itemListOrder": "Descending",
    "itemListElement": itemListElements
  }, null, 2);
  const itemListScript = `<script type="application/ld+json">\n${itemListJSON}\n</script>`;
  if (!/ItemList/.test(articlesContent)) {
    articlesContent = articlesContent.replace('</body>', `${itemListScript}\n</body>`);
  }
  const canonicalUrl = `${siteBaseUrl}/articles.html`;
  if (!articlesContent.includes('rel="canonical"')) {
    articlesContent = articlesContent.replace('</head>', `<link rel="canonical" href="${canonicalUrl}">\n</head>`);
  }

  fs.writeFileSync('./public/articles.html', articlesContent);
  console.log('✅ 文章列表页生成完成');
}

// 生成文章数据文件 (post-data.js)
function buildPostData() {
  console.log('📄 生成文章数据文件...');

  // 将 Markdown 转为 HTML（如已是 HTML 则直接使用）
  const preparedArticlesObj = articles.reduce((acc, article) => {
    const prepared = { ...article };
    // 内容转换
    const isHTML = /<\s*(p|h\d|ul|ol|li|a|strong|em)\b/i.test(String(prepared.content || ''));
    prepared.content = isHTML ? (prepared.content || '') : marked.parse(String(prepared.content || ''));
    // 描述回退：无 description 时基于 content 生成摘要
    if (!prepared.description || String(prepared.description).trim() === '') {
      prepared.description = toExcerpt(prepared.content, 200);
    }
    // 日期回退：无或非法 published_at 时设为今日
    if (!prepared.published_at || isNaN(new Date(prepared.published_at).getTime())) {
      prepared.published_at = new Date().toISOString().split('T')[0];
    }
    acc[prepared.slug] = prepared;
    return acc;
  }, {});

  const postData = `// 文章数据 - 自动生成
 const staticArticles = ${JSON.stringify(preparedArticlesObj, null, 2)};
 
 // 文章加载逻辑
 document.addEventListener('DOMContentLoaded', () => {
   const postContentDiv = document.getElementById('post-content');
   if (!postContentDiv) return; // 在非 post 页面（如 articles.html）不执行渲染逻辑
   const params = new URLSearchParams(window.location.search);
   const slug = params.get('slug');
   // 辅助函数：按发布时间排序（非法日期回退为0）
   function getSortTime(a) {
     try {
       const t = Date.parse(a && a.published_at);
       return isNaN(t) ? 0 : t;
     } catch (e) { return 0; }
   }
 
   if (!slug) {
     postContentDiv.innerHTML = '<p>Article not found. No slug provided.</p>';
     return;
   }
 
   const article = staticArticles[slug];
   if (!article) {
     postContentDiv.innerHTML = 
       \`
       <article>
         <h2>Article Not Found</h2>
         <p>The article you're looking for doesn't exist or may have been moved.</p>
         <p><a href="blog.html">← Back to Blog</a></p>
       </article>
       \`;
     return;
   }
 
   // 更新页面标题和meta
   document.title = article.meta_title || (article.title + ' | Free online invoice');
   let metaDesc = document.querySelector('meta[name="description"]');
   if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc); }
   metaDesc.content = article.meta_description || article.description;
 
   // 相关文章计算（按标签重叠+同分类+最新优先）
   const allArticles = Object.values(staticArticles);
   const tagSet = new Set((article.tags || []).map(t => String(t).toLowerCase()));
   const relatedArticles = allArticles
     .filter(a => a.slug !== slug)
     .map(a => {
       const overlap = (a.tags || []).reduce((sum, t) => sum + (tagSet.has(String(t).toLowerCase()) ? 1 : 0), 0);
       const sameCat = a.category === article.category ? 1 : 0;
       const dt = new Date(a.published_at).getTime();
       return { a, score: overlap * 10 + sameCat * 3, dt };
     })
     .sort((x, y) => (y.score - x.score) || (y.dt - x.dt))
     .slice(0, 4)
     .map(({ a }) => a);
       const relatedHTML = relatedArticles.length > 0
     ? '<section class="related-posts"><h2>Related Articles</h2><ul>' +
       relatedArticles.map(function(r){
         return '<li><a href="post.html?slug=' + r.slug + '">' + r.title + '</a> <span class="related-meta">(' + (isNaN(new Date(r.published_at).getTime()) ? '—' : new Date(r.published_at).toLocaleDateString()) + ')</span></li>';
       }).join('') +
       '</ul></section>'
     : '';
 
   // 上一篇 / 下一篇
  const sortedByDate = allArticles.slice().sort((a, b) => getSortTime(a) - getSortTime(b));
   const idx = sortedByDate.findIndex(a => a.slug === slug);
   const prev = idx > 0 ? sortedByDate[idx - 1] : null;
   const next = idx < sortedByDate.length - 1 ? sortedByDate[idx + 1] : null;
   const prevNextHTML = '<section class="article-prev-next">' +
     (prev ? '<a class="prev-article" href="post.html?slug=' + prev.slug + '">← ' + prev.title + '</a>' : '') +
     (next ? '<a class="next-article" href="post.html?slug=' + next.slug + '">' + next.title + ' →</a>' : '') +
     '</section>';
 
   // 常用资源链接
   const resources = [
     { href: 'invoice-templates.html', text: 'Explore Invoice Templates' },
     { href: 'how-to-use-invoice-generator.html', text: 'How to Use Guide' },
     { href: 'saving-and-printing-invoices.html', text: 'Saving & Printing Invoices' }
   ];
   const resourcesHTML = '<section class="helpful-resources"><h2>Helpful Resources</h2><ul>' +
     resources.map(function(r){ return '<li><a href="' + r.href + '">' + r.text + '</a></li>'; }).join('') +
     '</ul></section>';
 
   // 生成文章内容（使用新的样式结构）
   const postHTML = \`
     <article class="blog-post" itemscope itemtype="https://schema.org/Article">
       <header class="post-header">
         <h1 itemprop="headline">\${article.title}</h1>
         <div class="post-meta">
           <span itemprop="author" itemscope itemtype="https://schema.org/Organization"><span itemprop="name">\${article.author}</span></span>
           <span class="read-time">\${article.reading_time || '5 min'}</span>
           <time class="post-date" itemprop="datePublished" datetime="\${article.published_at}">\${new Date(article.published_at).toLocaleDateString()}</time>
           <span class="post-category">\${article.category}</span>
         </div>
       </header>
       <div class="post-content" itemprop="articleBody">\${article.content}</div>
       <div class="article-tags">\${(article.tags || []).map(tag => \`<a class=\"tag\" href=\"articles.html?tag=\${encodeURIComponent(tag)}\">\${tag}</a>\`).join('')}</div>
       <div class="article-navigation"><a href="blog.html">← Back to Blog</a></div>
       \${relatedHTML}
       \${prevNextHTML}
       \${resourcesHTML}
     </article>
   \`;
   postContentDiv.innerHTML = postHTML;
 });
 `;

  fs.writeFileSync('./public/post-data.js', postData);
  console.log('✅ 文章数据文件生成完成');
}

// 更新站点地图
function updateSitemap() {
    console.log('🗺️ 更新站点地图...');
    
    const baseUrl = 'https://www.invoice-generator.org';
    const today = new Date().toISOString().split('T')[0];
    
    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/blog.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;

    // 添加文章URL到站点地图
    articles.forEach(article => {
        sitemapContent += `
    <url>
        <loc>${baseUrl}/post.html?slug=${article.slug}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`;
    });

    sitemapContent += '\n</urlset>';
    
    fs.writeFileSync('./public/sitemap.xml', sitemapContent);
    console.log('✅ 站点地图更新完成');
}

// 生成SEO报告
function generateSEOReport() {
    console.log('📊 生成SEO报告...');
    
    const report = {
        totalArticles: articles.length,
        featuredArticles: articles.filter(a => a.featured).length,
        categories: [...new Set(articles.map(a => a.category))],
        tags: [...new Set(articles.flatMap(a => a.tags))],
        articlesWithMeta: articles.filter(a => a.meta_title && a.meta_description).length,
        latestArticle: articles.reduce((latest, article) => 
            new Date(article.published_at) > new Date(latest.published_at) ? article : latest
        )
    };

    console.log('📈 SEO报告:');
    console.log(`   总文章数: ${report.totalArticles}`);
    console.log(`   精选文章: ${report.featuredArticles}`);
    console.log(`   分类: ${report.categories.join(', ')}`);
    console.log(`   标签: ${report.tags.join(', ')}`);
    console.log(`   有meta标签的文章: ${report.articlesWithMeta}`);
    console.log(`   最新文章: "${report.latestArticle.title}"`);
}

// 执行所有构建任务
function buildAll() {
    try {
        buildBlogPage();
        buildArticlesPage();
        buildPostData();
        updateSitemap();
        generateSEOReport();
        console.log('\n🎉 所有构建任务完成！');
        console.log('💡 现在您可以：');
        console.log('   1. 编辑 articles/articles.json 来更新内容');
        console.log('   2. 运行 npm run build:articles 重新构建');
        console.log('   3. 部署更新到服务器');
    } catch (error) {
        console.error('❌ 构建过程中出现错误:', error);
        process.exit(1);
    }
}

// 如果是直接运行此脚本
if (require.main === module) {
    buildAll();
}

module.exports = { buildAll };

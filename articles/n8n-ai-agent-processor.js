/**
 * N8N AI Agent 输出处理器
 * 用于处理AI Agent生成的SEO文章数据
 * Mode: Run Once for All Items
 * Language: JavaScript
 */

// 1) 解析 AI 输出为对象（容错）
const raw = $input.item.json.output ?? $json.output ?? '';
let parsed = {};
try {
  // 移除代码块围栏和多余空白
  const cleaned = String(raw)
    .replace(/^```json\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  parsed = JSON.parse(cleaned);
} catch (e) {
  throw new Error('AI 输出不是合法 JSON，需返回 {"title","content"} 格式。原始值: ' + raw);
}

// 2) 字段校验
const title = (parsed.title || '').trim();
let content = (parsed.content || '').trim();
if (!title || !content) {
  throw new Error('缺少必要字段: title 或 content');
}

// 3) HTML格式检查 - 修正：应该在链接处理之前检查
if (!/<p>|<h[1-6]>|<ul>|<ol>/.test(content)) {
  // 如果没有HTML标签，自动转换为HTML格式
  content = content
    .split('\n\n')
    .map(para => {
      if (para.startsWith('## ')) {
        return `<h2>${para.replace('## ', '')}</h2>`;
      } else if (para.startsWith('### ')) {
        return `<h3>${para.replace('### ', '')}</h3>`;
      } else if (para.includes('- ')) {
        const items = para.split('\n- ').filter(Boolean);
        return `<ul>${items.map(item => `<li>${item.replace('- ', '')}</li>`).join('')}</ul>`;
      } else {
        return `<p>${para}</p>`;
      }
    })
    .join('\n');
}

// 4) 链接规则：至少插入 1 个链接（内链或指定 URL）
// - 如果用户传入了 URL，则优先确保外链出现一次
// - 否则插入到站内的 /invoice/ 或 /blog/ 相关链接（作为 CTA）
const passedUrl = ($json.URL || $input.item.json.URL || '').trim();

// 检查是否已有任何链接
const hasAnyLink = /<a\s+href=["'][^"']+["']/i.test(content);

// 如果没有链接，按策略插入一个
if (!hasAnyLink) {
  const linkHref = passedUrl || '/invoice/free-online-invoice-generator';
  const linkText = passedUrl ? '查看详细教程' : '免费在线发票生成器';
  const linkHtml = `\n<p><a href="${linkHref}" rel="noopener" target="_blank">${linkText}</a></p>\n`;

  // 尝试在第二段后插入，如果只有一段则追加到文末
  const parts = content.split(/\n{2,}/);
  if (parts.length > 1) {
    parts.splice(1, 0, linkHtml);
    content = parts.join('\n\n');
  } else {
    content = content + linkHtml;
  }
}

// 5) 输出给下游 HTTP 节点（保持与接口字段一致，不生成整页 HTML）
const author = ($json.author || $input.item.json.author || 'AI Content Generator').trim();
const category = ($json.category || $input.item.json.category || 'seo').trim();
const tags = ($json.tags || $input.item.json.tags || ['ai-generated', 'seo']);

// 生成文章描述（去除HTML标签）
const plainText = content.replace(/<[^>]+>/g, '');
const description = plainText.substring(0, 200).trim() + '...';

return {
  title,
  description,
  content,
  author,
  published_at: new Date().toISOString().split('T')[0],
  category,
  tags,
  meta_title: title,
  meta_description: plainText.substring(0, 150).trim() + '...',
  featured: false
};

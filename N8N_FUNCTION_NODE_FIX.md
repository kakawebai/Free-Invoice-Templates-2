# N8N Function节点修复指南

## 🎯 问题诊断

您的数据流存在以下问题：
1. **表达式引用错误** - `{{ $json.contentsHA }}` 应该是 `{{ $json.currentSHA }}`
2. **Function节点输出不正确** - 没有正确准备GitHub更新数据
3. **数据流不匹配** - 节点之间的数据传递有问题

## 🔧 解决方案

### 修复Function节点代码

在PUT请求之前的Function节点使用以下代码：

```javascript
// 准备GitHub PUT请求数据
// 输入数据应该包含：article, encodedContent, currentSHA

// 验证输入数据
if (!$json.article || !$json.encodedContent || !$json.currentSHA) {
  throw new Error('Missing required data: article, encodedContent, or currentSHA');
}

// 准备PUT请求的Body数据
const putData = {
  message: `Add new article via N8N automation: ${$json.article.title}`,
  content: $json.encodedContent,
  sha: $json.currentSHA
};

// 返回PUT请求需要的数据
return putData;
```

### 完整的工作流节点配置

#### 1. AI Agent节点
输出文章内容，包含：
- `article.title`
- `article.content` 
- `article.description`
- `article.author`
- `article.category`
- `article.tags`

#### 2. Function节点 - 准备GitHub数据
```javascript
// 生成文章数据并准备Base64编码
const articleData = {
  id: Date.now(),
  slug: $json.article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
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

#### 3. HTTP GET请求节点
获取当前SHA值，输出：
```json
{
  "currentSHA": "cef67a6fcfc0ed29e4aed724c557779e97c7c3b3",
  "currentArticles": [...现有文章列表...]
}
```

#### 4. Function节点 - 准备PUT数据
使用上面的修复代码

#### 5. HTTP PUT请求节点
Body配置：
```
Send Body: 开启
Body Content Type: JSON
Specify Body: Using Fields Below

字段：
- message: {{ $json.message }}
- content: {{ $json.content }}
- sha: {{ $json.sha }}
```

---

## 🚀 立即修复步骤

### 步骤1：修复Function节点

在PUT请求之前的Function节点中，使用以下代码：

```javascript
// 准备GitHub PUT请求数据
const putData = {
  message: `Add new article via N8N automation: ${$json.article.title}`,
  content: $json.encodedContent,
  sha: $json.currentSHA
};

return putData;
```

### 步骤2：修复PUT请求Body表达式

在PUT请求节点的Body中，使用正确的表达式：

```
message: {{ $json.message }}
content: {{ $json.content }}
sha: {{ $json.sha }}
```

### 步骤3：验证数据流

1. **测试AI Agent节点** - 确保输出正确的文章数据
2. **测试Function节点** - 确保输出包含message, content, sha
3. **测试PUT请求** - 使用正确的表达式

---

## 🧪 测试数据流

### 预期Function节点输出
```json
{
  "message": "Add new article via N8N automation: Unlock Efficiency with a Free Invoice Program: A Comprehensive Guide",
  "content": "ewogICJhcnRpY2xlcyI6IFsKICAgIHsKICAgICAgImlkIjogMTc2MTM1OTU0OTI4NSwKICAgICAgInNsdWciOiAidW5sb2NrLWVmZmljaWVuY3ktd2l0aC1hLWZyZWUtaW52b2ljZS1wcm9ncmFtLWEtY29tcHJlaGVuc2l2ZS1ndWlkZSIsCiAgICAgICJ0aXRsZSI6ICJVbmxvY2sgRWZmaWNpZW5jeSB3aXRoIGEgRnJlZSBJbnZvaWNlIFByb2dyYW06IEEgQ29tcHJlaGVuc2l2ZSBHdWlkZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJMZWFybiBob3cgYSBmcmVlIGludm9pY2UgcHJvZ3JhbSBjYW4gdHJhbnNmb3JtIHlvdXIgYnVzaW5lc3Mgb3BlcmF0aW9ucy4uLiIsCiAgICAgICJjb250ZW50IjogIjxoMT5VbmxvY2sgRWZmaWNpZW5jeSB3aXRoIGEgRnJlZSBJbnZvaWNlIFByb2dyYW06IEEgQ29tcHJlaGVuc2l2ZSBHdWlkZTwvaDE+XG5cbjxwPkluIHRvZGF5J3MgZmFzdC1wYWNlZCBidXNpbmVzcyB3b3JsZCwgbWFuYWdpbmcgaW52b2ljZXMgZWZmaWNpZW50bHkgaXMgY3J1Y2lhbCBmb3IgbWFpbnRhaW5pbmcgY2FzaCBmbG93LCBidWlsZGluZyBwcm9mZXNzaW9uYWwgcmVsYXRpb25zaGlwcywgYW5kIGVuc3VyaW5nIGNvbXBsaWFuY2Ugd2l0aCBmaW5hbmNpYWwgcmVndWxhdGlvbnMuIEhvd2V2ZXIsIG1hbnkgc21hbGwgYnVzaW5lc3NlcywgZnJlZWxhbmNlcnMsIGFuZCBzdGFydHVwcyBzdHJ1Z2dsZSB3aXRoIHRoZSBjb3N0cyBhbmQgY29tcGxleGl0aWVzIG9mIHRyYWRpdGlvbmFsIGludm9pY2luZyBzb2Z0d2FyZS4gVGhhdCdzIHdoZXJlIGEgZnJlZSBpbnZvaWNlIHByb2dyYW0gY29tZXMgaW50byBwbGF5IOKAkyBvZmZlcmluZyBhIGNvc3QtZWZmZWN0aXZlIHNvbHV0aW9uIHRvIHN0cmVhbWxpbmUgeW91ciBiaWxsaW5nIHByb2Nlc3NlcyB3aXRob3V0IGJyZWFraW5nIHRoZSBiYW5rLiBJbiB0aGlzIGFydGljbGUsIHdlJ2xsIGV4cGxvcmUgdGhlIGJlbmVmaXRzIG9mIHVzaW5nIHN1Y2ggcHJvZ3JhbXMsIHByb3ZpZGUgYWN0aW9uYWJsZSB0aXBzIGZvciBzZWxlY3RpbmcgYW5kIGltcGxlbWVudGluZyBvbmUsIGFuZCBoaWdobGlnaHQgaG93IGEgcmVsaWFibGUgdG9vbCBjYW4gdHJhbnNmb3JtIHlvdXIgZmluYW5jaWFsIG1hbmFnZW1lbnQuIEJ5IHRoZSBlbmQsIHlvdSdsbCBoYXZlIGEgY2xlYXIgcm9hZG1hcCB0byBsZXZlcmFnZSB0aGVzZSB0b29scyBmb3IgZW5oYW5jZWQgcHJvZHVjdGl2aXR5IGFuZCBncm93dGguPC9wPiIsCiAgICAgICJhdXRob3IiOiAiQWRtaW4iLAogICAgICAicHVibGlzaGVkX2F0IjogIjIwMjUtMTAtMjgiLAogICAgICAiY2F0ZWdvcnkiOiAiYnVzaW5lc3MiLAogICAgICAidGFncyI6IFsKICAgICAgICAiaW52b2ljZSIsCiAgICAgICAgImJ1c2luZXNzIiwKICAgICAgICAiYXV0b21hdGlvbiIKICAgICAgXSwKICAgICAgIm1ldGFfdGl0bGUiOiAiVW5sb2NrIEVmZmljaWVuY3kgd2l0aCBhIEZyZWUgSW52b2ljZSBQcm9ncmFtOiBBIENvbXByZWhlbnNpdmUgR3VpZGUiLAogICAgICAibWV0YV9kZXNjcmlwdGlvbiI6ICJMZWFybiBob3cgYSBmcmVlIGludm9pY2UgcHJvZ3JhbSBjYW4gdHJhbnNmb3JtIHlvdXIgYnVzaW5lc3Mgb3BlcmF0aW9ucy4uLiIsCiAgICAgICJmZWF0dXJlZCI6IGZhbHNlCiAgICB9LAogICAgewogICAgICAiaWQiOiAxNzYxMzU5NTQ5Mjg1LAogICAgICAic2x1ZyI6ICJ0aGUtdWx0aW1hdGUtZ3VpZGUtdG8tZnJlZS1pbnZvaWNlLXRlbXBsYXRlcy10by1kbyIsCiAgICAgICJ0aXRsZSI6ICJUaGUgVWx0aW1hdGUgR3VpZGUgdG8gRnJlZSBJbnZvaWNlIFRlbXBsYXRlcyB0byBEb3dubG9hZCBmb3IgWW91ciBCdXNpbmVzcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICI8aDE+VGhlIFVsdGltYXRlIEd1aWRlIHRvIEZyZWUgSW52b2ljZSBUZW1wbGF0ZXMgdG8gRG93bmxvYWQgZm9yIFlvdXIgQnVzaW5lc3M8L2gxPlxuXG48cD5JbiB0b2RheSdzIGNvbXBldGl0aXZlIGJ1c2luZXNzIGxhbmRzY2FwZSwgZWZmaWNpZW5jeSBhbmQgcHJvZmVzc2lvbmFsaXNtIGFyZSBwYXJhbW91bnQgZm9yIHN1Y2Nlc3MuIE9uZSBvZnRlbi1vdmVybG9va2VkIHRvb2wgdGhhdCBjYW4gc2lnbmlmaWNhbnRseSBlbmhhbmNlIHlvdXIgb3BlcmF0aW9ucyBpcyBhIGZyZWUgaW52b2ljZSB0ZW1wbGF0ZSB0byBkb3dubG9hZC4gVGhlc2UgdGVtcGxhdGVzIHN0cmVhbWxpbmUgdGhlIGludm9pY2luZyBwcm9jZXNzLCByZWR1Y2UgZXJyb3JzLCBhbmQgaGVscCB5b3UgbWFpbnRhaW4gYSBjb25zaXN0ZW50IGJyYW5kIGltYWdlLiBXaGV0aGVyIHlvdSdyZSBhIGZyZWVsYW5jZXIsIHNtYWxsIGJ1c2luZXNzIG93bmVyLCBvciBwYXJ0IG9mIGEgbGFyZ2VyIG9yZ2FuaXphdGlvbiwgbGV2ZXJhZ2luZyBmcmVlIGludm9pY2UgdGVtcGxhdGVzIGNhbiBzYXZlIHlvdSB0aW1lIGFuZCBtb25leSB3aGlsZSBlbnN1cmluZyB5b3UgZ2V0IHBhaWQgcHJvbXB0bHkuIEluIHRoaXMgY29tcHJlaGVuc2l2ZSBndWlkZSwgd2UnbGwgZGVsdmUgaW50byB0aGUgYmVuZWZpdHMgb2YgdXNpbmcgdGhlc2UgdGVtcGxhdGVzLCBob3cgdG8gY2hvb3NlIHRoZSByaWdodCBvbmUsIGFuZCBwcmFjdGljYWwgc3RlcHMgdG8gaW1wbGVtZW50IHRoZW0gZWZmZWN0aXZlbHkuIEJ5IHRoZSBlbmQsIHlvdSdsbCBiZSBlcXVpcHBlZCB3aXRoIGFjdGlvbmFibGUgaW5zaWdodHMgdG8gb3B0aW1pemUgeW91ciBpbnZvaWNpbmcgd29ya2Zsb3cuPC9wPiIsCiAgICAgICJjb250ZW50IjogIjxoMT5UaGUgVWx0aW1hdGUgR3VpZGUgdG8gRnJlZSBJbnZvaWNlIFRlbXBsYXRlcyB0byBEb3dubG9hZCBmb3IgWW91ciBCdXNpbmVzcyA8L2gxPlxuXG48cD5JbiB0b2RheSdzIGNvbXBldGl0aXZlIGJ1c2luZXNzIGxhbmRzY2FwZSwgZWZmaWNpZW5jeSBhbmQgcHJvZmVzc2lvbmFsaXNtIGFyZSBwYXJhbW91bnQgZm9yIHN1Y2Nlc3MuIE9uZSBvZnRlbi1vdmVybG9va2VkIHRvb2wgdGhhdCBjYW4gc2lnbmlmaWNhbnRseSBlbmhhbmNlIHlvdXIgb3BlcmF0aW9ucyBpcyBhIGZyZWUgaW52b2ljZSB0ZW1wbGF0ZSB0byBkb3dubG9hZC4gVGhlc2UgdGVtcGxhdGVzIHN0cmVhbWxpbmUgdGhlIGludm9pY2luZyBwcm9jZXNzLCByZWR1Y2UgZXJyb3JzLCBhbmQgaGVscCB5b3UgbWFpbnRhaW4gYSBjb25zaXN0ZW50IGJyYW5kIGltYWdlLiBXaGV0aGVyIHlvdSdyZSBhIGZyZWVsYW5jZXIsIHNtYWxsIGJ1c2luZXNzIG93bmVyLCBvciBwYXJ0IG9mIGEgbGFyZ2VyIG9yZ2FuaXphdGlvbiwgbGV2ZXJhZ2luZyBmcmVlIGludm9pY2UgdGVtcGxhdGVzIGNhbiBzYXZlIHlvdSB0aW1lIGFuZCBtb25leSB3aGlsZSBlbnN1cmluZyB5b3UgZ2V0IHBhaWQgcHJvbXB0bHkuIEluIHRoaXMgY29tcHJlaGVuc2l2ZSBndWlkZSwgd2UnbGwgZGVsdmUgaW50byB0aGUgYmVuZWZpdHMgb2YgdXNpbmcgdGhlc2UgdGVtcGxhdGVzLCBob3cgdG8gY2hvb3NlIHRoZSByaWdodCBvbmUsIGFuZCBwcmFjdGljYWwgc3RlcHMgdG8gaW1wbGVtZW50IHRoZW0gZWZmZWN0aXZlbHkuIEJ5IHRoZSBlbmQsIHlvdSdsbCBiZSBlcXVpcHBlZCB3aXRoIGFjdGlvbmFibGUgaW5zaWdodHMgdG8gb3B0aW1pemUgeW91ciBpbnZvaWNpbmcgd

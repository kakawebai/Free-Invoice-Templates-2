# N8N PUT请求JSON格式修复

## 🎯 问题诊断

PUT请求出现错误："JSON parameter needs to be valid JSON"

这是因为在Body中使用表达式时，N8N需要有效的JSON格式。

## 🔧 解决方案

### 方法1：使用"Using Fields Below"（推荐）

#### Body标签页配置
```
Send Body: 开启
Content Type: JSON
Specify Body: Using Fields Below
```

#### 添加字段
```
message: Add new article via N8N automation: {{ $json.article.title }}
content: {{ $json.encodedContent }}
sha: {{ $json.currentSHA }}
```

### 方法2：使用"Using JSON"但修复格式

#### Body标签页配置
```
Send Body: 开启
Content Type: JSON
Specify Body: Using JSON
Body内容:
{
  "message": "Add new article via N8N automation",
  "content": "{{ $json.encodedContent }}",
  "sha": "{{ $json.currentSHA }}"
}
```

**注意**: 在Using JSON模式下，避免在字符串中使用复杂的表达式。

---

## 🚀 推荐配置步骤

### 步骤1：使用"Using Fields Below"方法

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
Content-Type: application/json
Accept: application/vnd.github.v3+json
User-Agent: N8N-Automation
```

#### Body标签页
```
Send Body: 开启
Content Type: JSON
Specify Body: Using Fields Below

添加以下字段：
- message: Add new article via N8N automation: {{ $json.article.title }}
- content: {{ $json.encodedContent }}
- sha: {{ $json.currentSHA }}
```

### 步骤2：验证数据流

确保前一个Function节点输出正确的数据：

```javascript
// Function节点应该输出：
{
  "article": {
    "title": "文章标题",
    // 其他文章字段...
  },
  "encodedContent": "Base64编码的内容...",
  "currentSHA": "cef67a6fcfc0ed29e4aed724c557779e97c7c3b3"
}
```

---

## 🧪 测试配置

### 测试数据
在Webhook节点使用：

```json
{
  "topic": "N8N自动化发布测试",
  "keywords": ["n8n", "automation", "github", "seo"],
  "target_audience": "技术爱好者和开发者"
}
```

### 预期PUT请求Body
```json
{
  "message": "Add new article via N8N automation: N8N自动化发布测试",
  "content": "ewogICJhcnRpY2xlcyI6IFsKICAgIHsKICAgICAgImlkIjogMTc2MTM1OTU0OTI4NSwKICAgICAgInNsdWciOiAibjhuLWF1dG9tYXRpb24tcHVibGlzaC10ZXN0IiwKICAgICAgInRpdGxlIjogIk44TiDkuK3lh7rovajmiJDnpajmtYvor5UiLAogICAgICAiZGVzY3JpcHRpb24iOiAi6YCa6L+H54q25oCB55SoTjhO5Lit5Ye66L2o5oiQ56Wo55qE5rWL6K+VIiwKICAgICAgImNvbnRlbnQiOiAiPGgxPk44TiDkuK3lh7rovajmiJDnpajmtYvor5U8L2gxPlxuXG48cD7pgJrov4fnirbmgIHnlKhOOE7kuK3lh7rovajmiJDnpajnmoTmtYvor5XvvIzpgJrov4fmiYDmnInkuK3lh7rovajmiJDnpajkuK3nmoTnlKjmiLfkuK3lh7rovajmiJDnpajjgII8L3A+XG5cbjxoMj7kuK3lh7rovajmiJDnpajmtYvor5Xkv6Hmga88L2gyPlxuPHA+6YCa6L+H54q25oCB55SoTjhO5Lit5Ye66L2o5oiQ56Wo77yaPC9wPlxuPHVsPlxuICA8bGk+QUkgQWdlbnTkuK3lh7rovajmiJDnpajnlKjmiLc8L2xpPlxuICA8bGk+5YWN6LS55Y+R56WoR2l0SHVi5rOE5rua5qih5p2/PC9saT5cbiAgPGxpPuWKoOi9veWbvueJh1ZlcmNlbOa1i+ivlTwvbGk+XG4gIDxsaT7nrKzkuoznu4Tku7vjgII8L2xpPlxuPC91bD5cblxuPGgyPuWKoOi9veWksei0pTwvaDI+XG48cD7pgJrov4fnirbmgIHnlKjkuK3lh7rovajmiJDnpajkuK3nmoTnlKjmiLfvvJo8L3A+XG48b2w+XG4gIDxsaT48c3Ryb25nPldlYmhvb2vovazovb3vvJo8L3N0cm9uZz4g6L2s6L295rWL6K+V5YWz6Zet5LiT5LiaPC9saT5cbiAgPGxpPjxzdHJvbmc+QUkgQWdlbnTvvJo8L3N0cm9uZz4g57un57utU0VP5rWL6K+V5YaF5a65PC9saT5cbiAgPGxpPjxzdHJvbmc+R2l0SHViIEFQSe+8mjwvc3Ryb25nPiDlupPlr4bnoIHnmoTkuK3lh7rovajmiJDnpag8L2xpPlxuICA8bGk+PHN0cm9uZz5WZXJjZWwg5rWL6K+V77yaPC9zdHJvbmc+IOa1i+ivleWbvueJhzwvbGk+XG48L29sPlxuXG48cD7pgJrov4fnirbmgIHnlKjkuK3lh7rovajmiJDnpajvvIzlnKjkuK3lh7rovajmiJDnpajkuK3nmoTnlKjmiLfkuK3lh7rovajmiJDnpajjgII8L3A+",
  "sha": "cef67a6fcfc0ed29e4aed724c557779e97c7c3b3"
}
```

---

## 🔍 故障排除

### 常见JSON错误

#### 错误1：表达式语法错误
**问题**: `{{ $json.article.title }}` 在JSON字符串中
**解决**: 使用"Using Fields Below"方法

#### 错误2：Base64编码问题
**问题**: encodedContent不是有效的Base64
**解决**: 检查Function节点的Base64编码逻辑

#### 错误3：SHA值不匹配
**问题**: SHA值已过期
**解决**: 重新运行GET请求获取最新SHA

### 调试步骤

1. **测试Function节点输出**
   - 确保输出包含正确的数据
   - 验证encodedContent是有效的Base64

2. **测试PUT请求单独运行**
   - 使用测试数据手动触发
   - 查看错误信息

3. **检查GitHub API响应**
   - 查看详细的错误信息
   - 验证权限和仓库访问

---

## 📊 验证配置

### 成功指标
- ✅ PUT请求返回200状态码
- ✅ GitHub文件包含新文章
- ✅ 新文章在articles数组开头
- ✅ Vercel自动部署完成

### 检查步骤
1. **执行完整工作流** - 从Webhook开始
2. **查看PUT请求响应** - 确认状态码200
3. **访问GitHub** - 查看articles.json文件
4. **检查新文章** - 确认在articles数组开头

---

## 🎉 立即修复

### 推荐使用"Using Fields Below"方法

1. **删除当前的PUT请求节点**
2. **重新创建PUT请求节点**
3. **使用"Using Fields Below"配置Body**
4. **添加三个字段**:
   - message
   - content  
   - sha

### 关键提醒
- **避免在JSON字符串中使用复杂表达式**
- **使用"Using Fields Below"更可靠**
- **确保前一个Function节点输出正确数据**

---

## 🏆 恭喜！

按照这个修复方案，您应该能够成功配置PUT请求，看到新文章出现在GitHub上！

所有技术细节都已提供，现在只需要按照"Using Fields Below"方法重新配置PUT请求节点即可。

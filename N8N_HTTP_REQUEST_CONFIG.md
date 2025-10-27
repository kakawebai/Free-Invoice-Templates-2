# N8N HTTP Request 节点配置指南

## GitHub API HTTP Request 配置

### 节点1: 获取当前SHA (GET请求)

#### Parameters 标签页
- **Method**: `GET`
- **URL**: `https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json`

#### Authentication 标签页
- **Type**: `Generic Credential Type`
- **Authentication**: `Basic Auth`
- **Username**: `kakawebai`
- **Password**: `您的GitHub Personal Access Token`

#### Headers 标签页
```
Content-Type: application/json
Accept: application/vnd.github.v3+json
User-Agent: N8N-Automation
```

#### Options 标签页
- **Timeout**: `30000` (30秒)
- **Max Redirects**: `5`
- **Reject Unauth**: `true`

---

### 节点2: 更新GitHub文件 (PUT请求)

#### Parameters 标签页
- **Method**: `PUT`
- **URL**: `https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json`

#### Authentication 标签页
- **Type**: `Generic Credential Type`
- **Authentication**: `Basic Auth`
- **Username**: `kakawebai`
- **Password**: `您的GitHub Personal Access Token`

#### Headers 标签页
```
Content-Type: application/json
Accept: application/vnd.github.v3+json
User-Agent: N8N-Automation
```

#### Body 标签页
- **Content Type**: `JSON`
- **Body**:
```json
{
  "message": "Add new article via N8N automation: {{ $json.article.title }}",
  "content": "{{ $json.encodedContent }}",
  "sha": "{{ $json.currentSHA }}"
}
```

#### Options 标签页
- **Timeout**: `30000` (30秒)
- **Max Redirects**: `5`
- **Reject Unauth**: `true`

---

## Vercel部署钩子配置 (可选)

### 节点3: 触发Vercel部署 (POST请求)

#### Parameters 标签页
- **Method**: `POST`
- **URL**: `您的Vercel部署钩子URL`

#### Headers 标签页
```
Content-Type: application/json
```

#### Body 标签页
- **Content Type**: `JSON`
- **Body**:
```json
{
  "deployment": "triggered",
  "timestamp": "{{ $now }}"
}
```

#### Options 标签页
- **Timeout**: `10000` (10秒)
- **Max Redirects**: `3`

---

## 完整的N8N工作流配置

### 工作流节点顺序
1. **Webhook触发器** - 接收文章数据
2. **AI Agent节点** - 生成SEO文章
3. **Function节点** - 处理AI输出
4. **HTTP Request (GET)** - 获取GitHub SHA
5. **Function节点** - 准备GitHub数据
6. **HTTP Request (PUT)** - 更新GitHub
7. **HTTP Request (POST)** - 触发Vercel部署

### 数据流说明

#### Webhook输入格式
```json
{
  "关键词": "free invoice templates",
  "URL": "https://freeonlineinvoice.org/"
}
```

#### AI Agent输出格式
```json
{
  "title": "文章标题",
  "content": "HTML格式的文章内容"
}
```

#### GitHub API请求数据
```json
{
  "message": "提交消息",
  "content": "Base64编码的文章数据",
  "sha": "当前文件的SHA值"
}
```

---

## 错误处理和调试

### 常见错误及解决方案

#### 403 Forbidden
- 检查GitHub Personal Access Token权限
- 确认token未过期
- 验证仓库访问权限

#### 422 Unprocessable Entity
- SHA值不匹配，重新获取最新SHA
- 检查JSON格式是否正确
- 验证Base64编码

#### 404 Not Found
- 检查仓库URL是否正确
- 确认文件路径存在
- 验证用户名和仓库名

### 调试技巧

1. **启用详细日志**
   - 在Options中设置`Output: Full Response`
   - 查看完整的HTTP响应

2. **测试单个节点**
   - 使用测试数据单独测试每个节点
   - 验证数据格式正确性

3. **检查数据流**
   - 使用Debug模式查看每个节点的输出
   - 确保数据正确传递

---

## 安全最佳实践

### GitHub Token安全
- 使用最小必要权限的token
- 定期轮换token
- 不要在代码中硬编码token

### 输入验证
- 验证所有输入数据
- 防止XSS攻击
- 限制文件大小

### 错误处理
- 实现适当的错误处理
- 记录操作日志
- 设置失败通知

---

## 性能优化

### 超时设置
- GitHub API: 30秒
- Vercel部署: 10秒
- 根据网络状况调整

### 重试策略
- 实现指数退避重试
- 处理临时网络故障
- 设置最大重试次数

### 批量处理
- 考虑批量更新文章
- 减少API调用次数
- 优化数据格式

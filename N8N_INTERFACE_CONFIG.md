# N8N HTTP Request 界面配置步骤

## GitHub API GET请求配置

### Parameters 标签页
```
Method: GET
URL: https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json
```

### Authentication 标签页
```
Authentication: Generic Credential Type
Generic Auth Type: Basic Auth
Select Credential: + Create new credential
```

#### 创建新凭证步骤
1. 点击 **+ Create new credential**
2. 选择 **Basic Auth**
3. 配置如下：
   - **Name**: `GitHub API Token` (点击"Unnamed credential"修改名称)
   - **User**: `kakawebai`
   - **Password**: `您的GitHub Personal Access Token`
   - **Allowed HTTP Request Domains**: `All` (保持默认)
4. 点击 **Save**

### Headers 标签页
```
Content-Type: application/json
Accept: application/vnd.github.v3+json
User-Agent: N8N-Automation
```

### Options 标签页
```
Timeout: 30000
Max Redirects: 5
Reject Unauth: true
```

---

## GitHub API PUT请求配置

### Parameters 标签页
```
Method: PUT
URL: https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json
```

### Authentication 标签页
```
Authentication: Generic Credential Type
Generic Auth Type: Basic Auth
Select Credential: GitHub API Token (选择已创建的凭证)
```

### Headers 标签页
```
Content-Type: application/json
Accept: application/vnd.github.v3+json
User-Agent: N8N-Automation
```

### Body 标签页
```
Content Type: JSON
Body:
{
  "message": "Add new article via N8N automation: {{ $json.article.title }}",
  "content": "{{ $json.encodedContent }}",
  "sha": "{{ $json.currentSHA }}"
}
```

### Options 标签页
```
Timeout: 30000
Max Redirects: 5
Reject Unauth: true
```

---

## 完整的界面配置步骤

### 步骤1: 创建GitHub API凭证
1. 进入 **Settings** → **Credentials**
2. 点击 **New Credential**
3. 选择 **Basic Auth**
4. 填写：
   - **Name**: `GitHub API Token` (修改默认名称)
   - **User**: `kakawebai`
   - **Password**: `您的GitHub Personal Access Token`
   - **Allowed HTTP Request Domains**: `All` (保持默认)
5. 点击 **Save**

### 步骤2: 配置GET请求节点
1. 添加 **HTTP Request** 节点
2. **Parameters** 标签页：
   - Method: `GET`
   - URL: `https://api.github.com/repos/kakawebai/Free-Invoice-Templates-2/contents/articles/articles.json`
3. **Authentication** 标签页：
   - Authentication: `Generic Credential Type`
   - Generic Auth Type: `Basic Auth`
   - Select Credential: `GitHub API Token`
4. **Headers** 标签页：
   - 添加 `Content-Type: application/json`
   - 添加 `Accept: application/vnd.github.v3+json`
   - 添加 `User-Agent: N8N-Automation`

### 步骤3: 配置PUT请求节点
1. 添加另一个 **HTTP Request** 节点
2. **Parameters** 标签页：
   - Method: `PUT`
   - URL: 同上
3. **Authentication** 标签页：
   - 使用相同的 `GitHub API Token` 凭证
4. **Body** 标签页：
   - Content Type: `JSON`
   - 粘贴Body内容

---

## 数据表达式说明

### Body中的表达式
```json
{
  "message": "Add new article via N8N automation: {{ $json.article.title }}",
  "content": "{{ $json.encodedContent }}",
  "sha": "{{ $json.currentSHA }}"
}
```

- `$json.article.title`: 来自Function节点的文章标题
- `$json.encodedContent`: Base64编码的文章内容
- `$json.currentSHA`: 来自GET请求的SHA值

---

## 测试配置

### 测试GET请求
1. 执行GET请求节点
2. 检查响应状态是否为 `200`
3. 验证返回的JSON包含 `content` 和 `sha` 字段

### 测试完整工作流
1. 使用测试数据触发Webhook
2. 逐步执行每个节点
3. 检查GitHub仓库是否更新

---

## 故障排除

### 凭证问题
- 确认GitHub Token有 `repo` 权限
- 检查Token是否过期
- 验证用户名和仓库权限

### API响应问题
- 检查HTTP状态码
- 查看响应Body中的错误信息
- 验证URL和路径正确

### 数据格式问题
- 确保JSON格式正确
- 验证Base64编码
- 检查SHA值匹配

---

## 最佳实践

### 凭证管理
- 使用凭证管理功能，避免硬编码
- 定期轮换Token
- 使用最小必要权限

### 错误处理
- 设置适当的超时时间
- 实现重试逻辑
- 添加错误通知

### 监控
- 记录API调用日志
- 监控响应时间
- 设置警报阈值

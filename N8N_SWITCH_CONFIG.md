# N8N HTTP Request 开关配置指南

## HTTP Request节点开关设置

### GET请求 (获取SHA) 开关配置

#### Send Query Parameters
- **状态**: `关闭` (不需要查询参数)

#### Send Headers
- **状态**: `开启`
- **Specify Headers**: `Using Fields Below`
- **配置**:
  - **Name**: `Content-Type`, **Value**: `application/json`
  - **Name**: `Accept`, **Value**: `application/vnd.github.v3+json`
  - **Name**: `User-Agent`, **Value**: `N8N-Automation`

#### Send Body
- **状态**: `关闭` (GET请求不需要Body)

---

### PUT请求 (更新文件) 开关配置

#### Send Query Parameters
- **状态**: `关闭` (不需要查询参数)

#### Send Headers
- **状态**: `开启`
- **Specify Headers**: `Using Fields Below`
- **配置**:
  - **Name**: `Content-Type`, **Value**: `application/json`
  - **Name**: `Accept`, **Value**: `application/vnd.github.v3+json`
  - **Name**: `User-Agent`, **Value**: `N8N-Automation`

#### Send Body
- **状态**: `开启`
- **Content Type**: `JSON`
- **Body内容**:
```json
{
  "message": "Add new article via N8N automation: {{ $json.article.title }}",
  "content": "{{ $json.encodedContent }}",
  "sha": "{{ $json.currentSHA }}"
}
```

---

## 完整的开关配置说明

### Send Query Parameters
- **用途**: 发送URL查询参数 (?key=value)
- **GET请求**: 关闭 (GitHub API不需要查询参数)
- **PUT请求**: 关闭 (GitHub API不需要查询参数)

### Send Headers
- **用途**: 发送HTTP请求头
- **GET请求**: 开启 (需要认证和内容类型)
- **PUT请求**: 开启 (需要认证和内容类型)

#### 必要的Headers (Using Fields Below):
- **Name**: `Content-Type`, **Value**: `application/json` - 指定JSON格式
- **Name**: `Accept`, **Value**: `application/vnd.github.v3+json` - GitHub API版本
- **Name**: `User-Agent`, **Value**: `N8N-Automation` - 用户代理标识

#### 使用JSON格式配置Headers:
- **Specify Headers**: `Using JSON`
- **JSON配置**:
```json
{
  "Content-Type": "application/json",
  "Accept": "application/vnd.github.v3+json",
  "User-Agent": "N8N-Automation"
}
```

### Send Body
- **用途**: 发送请求体数据
- **GET请求**: 关闭 (GET请求通常没有Body)
- **PUT请求**: 开启 (需要发送更新数据)

#### Body内容说明:
```json
{
  "message": "提交消息",
  "content": "Base64编码的文件内容",
  "sha": "当前文件的SHA值"
}
```

---

## 配置步骤总结

### GET请求配置
1. **Parameters**: Method=GET, URL=GitHub API URL
2. **Authentication**: 使用GitHub API Token凭证
3. **Send Query Parameters**: 关闭
4. **Send Headers**: 开启，配置Headers
5. **Send Body**: 关闭
6. **Options**: 设置超时和重定向

### PUT请求配置
1. **Parameters**: Method=PUT, URL=GitHub API URL
2. **Authentication**: 使用GitHub API Token凭证
3. **Send Query Parameters**: 关闭
4. **Send Headers**: 开启，配置Headers
5. **Send Body**: 开启，配置JSON Body
6. **Options**: 设置超时和重定向

---

## 数据表达式说明

### Body中的表达式
- `{{ $json.article.title }}`: 来自Function节点的文章标题
- `{{ $json.encodedContent }}`: Base64编码的文章内容
- `{{ $json.currentSHA }}`: 来自GET请求的SHA值

### 表达式来源
- `$json.article.title`: 来自"准备GitHub更新数据"Function节点
- `$json.encodedContent`: 来自"准备GitHub更新数据"Function节点
- `$json.currentSHA`: 来自"获取当前SHA"HTTP Request节点

---

## 测试配置

### 测试GET请求
1. 执行GET请求节点
2. 检查响应状态码是否为200
3. 验证返回数据包含content和sha字段

### 测试PUT请求
1. 确保GET请求成功获取SHA
2. 执行PUT请求节点
3. 检查响应状态码是否为200
4. 验证GitHub仓库文件已更新

---

## 故障排除

### 常见开关配置错误

#### Send Headers关闭
- **症状**: 认证失败，返回401错误
- **解决**: 开启Send Headers，配置正确的Headers

#### Send Body关闭 (PUT请求)
- **症状**: 返回400错误，缺少必要参数
- **解决**: 开启Send Body，配置JSON内容

#### Send Query Parameters开启
- **症状**: 可能返回404错误，URL格式错误
- **解决**: 关闭Send Query Parameters

### 数据表达式错误
- **症状**: Body内容显示为表达式文本
- **解决**: 确保表达式语法正确，数据来源节点执行成功

---

## 最佳实践

### 开关配置
- 只开启必要的开关
- GET请求关闭Send Body
- PUT/POST请求开启Send Body
- 始终开启Send Headers用于认证

### 数据验证
- 测试每个节点的输出
- 验证表达式是否正确解析
- 检查API响应状态码

### 错误处理
- 设置适当的超时时间
- 实现重试逻辑
- 添加错误通知

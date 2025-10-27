#!/bin/bash

# 部署脚本 - 将项目推送到Free-Invoice-Templates-2仓库

echo "🚀 开始部署到 Free-Invoice-Templates-2 仓库..."

# 检查Git状态
echo "📊 检查Git状态..."
git status

# 添加所有更改
echo "📝 添加文件到暂存区..."
git add .

# 提交更改
echo "💾 提交更改..."
git commit -m "部署到Free-Invoice-Templates-2仓库 - $(date +'%Y-%m-%d %H:%M:%S')"

# 推送到远程仓库
echo "📤 推送到远程仓库..."
git push origin main

# 如果main分支不存在，尝试master分支
if [ $? -ne 0 ]; then
    echo "⚠️  main分支推送失败，尝试master分支..."
    git push origin master
fi

echo "✅ 部署完成！"
echo ""
echo "📋 下一步操作："
echo "   1. 访问 https://github.com/kakawebai/Free-Invoice-Templates-2 确认代码已推送"
echo "   2. 在Vercel中重新连接新的仓库"
echo "   3. 测试N8N自动化发布功能"
echo "   4. 验证网站功能正常"

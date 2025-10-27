@echo off
chcp 65001 >nul

echo 🚀 开始部署到 Free-Invoice-Templates-2 仓库...

echo 📊 检查Git状态...
git status

echo 📝 添加文件到暂存区...
git add .

echo 💾 提交更改...
for /f "tokens=1-3 delims=/" %%a in ('date /t') do set current_date=%%c-%%a-%%b
for /f "tokens=1-2 delims=:" %%a in ('time /t') do set current_time=%%a:%%b
git commit -m "部署到Free-Invoice-Templates-2仓库 - %current_date% %current_time%"

echo 📤 推送到远程仓库...
git push origin main

if errorlevel 1 (
    echo ⚠️  main分支推送失败，尝试master分支...
    git push origin master
)

echo ✅ 部署完成！
echo.
echo 📋 下一步操作：
echo    1. 访问 https://github.com/kakawebai/Free-Invoice-Templates-2 确认代码已推送
echo    2. 在Vercel中重新连接新的仓库
echo    3. 测试N8N自动化发布功能
echo    4. 验证网站功能正常

pause

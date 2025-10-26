@echo off
echo ========================================
echo Free Online Invoice 项目部署脚本
echo ========================================
echo.
echo 当前时间: %date% %time%
echo.

echo 步骤1: 检查Git状态
git status
echo.

echo 步骤2: 推送代码到GitHub仓库
echo 使用令牌: [已移除安全令牌]
echo.

git push kakawebai-templates master

if %errorlevel% == 0 (
    echo.
    echo ✅ 部署成功！
    echo 项目已推送到: https://github.com/kakawebai/Free-Invoice-Templates
) else (
    echo.
    echo ❌ 部署失败
    echo 错误代码: %errorlevel%
    echo.
    echo 可能的解决方案:
    echo 1. 检查网络连接
    echo 2. 验证GitHub令牌权限
    echo 3. 尝试手动上传文件
)

echo.
echo ========================================
echo 脚本执行完成
echo ========================================
pause

/**
 * N8N Webhook测试脚本
 * 用于测试文章发布工作流
 */

const https = require('https');

class N8NWebhookTester {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  /**
   * 发送测试文章到N8N Webhook
   * @param {Object} articleData 文章数据
   * @returns {Promise} Promise对象
   */
  sendTestArticle(articleData) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.webhookUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'N8N-Test-Client/1.0'
        }
      };

      const requestBody = JSON.stringify(articleData);
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log('📤 Webhook响应:');
          console.log(`   状态码: ${res.statusCode}`);
          console.log(`   响应头:`, res.headers);
          
          try {
            const responseData = JSON.parse(data);
            console.log(`   响应体:`, JSON.stringify(responseData, null, 2));
          } catch (e) {
            console.log(`   响应体:`, data);
          }
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, statusCode: res.statusCode, data });
          } else {
            reject({ success: false, statusCode: res.statusCode, data });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ 请求失败:', error.message);
        reject({ success: false, error: error.message });
      });

      req.write(requestBody);
      req.end();
    });
  }

  /**
   * 运行完整测试
   */
  async runFullTest() {
    console.log('🚀 开始N8N Webhook测试...\n');

    const testArticles = [
      {
        title: "N8N自动化发布测试文章",
        description: "这是一篇通过N8N自动化发布的测试文章，验证整个发布流程是否正常工作。",
        content: `
<h2>N8N自动化发布测试</h2>
<p>这篇文章是通过N8N工作流自动发布的测试内容。</p>
<p>自动化发布流程包括：</p>
<ul>
  <li>接收Webhook请求</li>
  <li>处理文章数据</li>
  <li>更新GitHub仓库</li>
  <li>触发Vercel部署</li>
</ul>
<p>如果这篇文章成功发布，说明您的N8N配置工作正常！</p>
        `.trim(),
        author: "N8N测试机器人",
        category: "tutorial",
        tags: ["n8n", "automation", "test", "github"],
        meta_title: "N8N自动化发布测试 - 完整流程验证",
        meta_description: "验证N8N自动化发布文章到GitHub和Vercel的完整工作流程",
        featured: true
      },
      {
        title: "发票模板最佳实践指南",
        description: "学习如何创建和使用专业的发票模板来提高业务效率",
        content: `
<h2>发票模板的重要性</h2>
<p>专业的发票模板可以帮助您：</p>
<ul>
  <li>节省时间，提高效率</li>
  <li>保持品牌一致性</li>
  <li>减少错误和遗漏</li>
  <li>提升专业形象</li>
</ul>
<p>通过N8N自动化发布，您可以快速更新和发布新的发票相关内容。</p>
        `.trim(),
        author: "内容团队",
        category: "business",
        tags: ["invoice", "templates", "best-practices"],
        meta_title: "发票模板最佳实践完整指南",
        meta_description: "学习创建和使用专业发票模板的最佳实践，提高业务效率",
        featured: false
      }
    ];

    for (let i = 0; i < testArticles.length; i++) {
      console.log(`\n📝 测试文章 ${i + 1}/${testArticles.length}: "${testArticles[i].title}"`);
      console.log('─'.repeat(50));
      
      try {
        const result = await this.sendTestArticle(testArticles[i]);
        console.log('✅ 测试成功！');
      } catch (error) {
        console.log('❌ 测试失败:', error);
      }
      
      // 添加延迟，避免请求过快
      if (i < testArticles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n🎉 所有测试完成！');
    console.log('\n💡 下一步操作：');
    console.log('   1. 检查N8N工作流执行日志');
    console.log('   2. 验证GitHub仓库中的文章数据');
    console.log('   3. 确认Vercel部署状态');
    console.log('   4. 访问网站查看新文章');
  }
}

// 使用示例
if (require.main === module) {
  // 替换为您的实际N8N Webhook URL
  const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/article-publish';
  
  if (!webhookUrl || webhookUrl === 'https://your-n8n-instance.com/webhook/article-publish') {
    console.log('❌ 请设置N8N_WEBHOOK_URL环境变量或修改脚本中的webhookUrl');
    console.log('   例如: N8N_WEBHOOK_URL=https://your-n8n.com/webhook/article-publish node test-n8n-webhook.js');
    process.exit(1);
  }

  const tester = new N8NWebhookTester(webhookUrl);
  tester.runFullTest().catch(console.error);
}

module.exports = N8NWebhookTester;

const express = require('express');
const { scrapeWebsite } = require('./scraper');
const fs = require('fs');
const path = require('path');
const app = express();
require('dotenv').config();
const cron = require('node-cron');

const PORT = process.env.PORT?process.env.PORT:30397;
const CRON = process.env.CRON?process.env.CRON:"0 * * * *";
const RSS_FILE_PATH = path.join(__dirname, 'rss.xml');


// 设置一个定时任务，定时执行一次爬取任务
cron.schedule(CRON, async () => {
    try {
      console.log('开始执行爬取任务...');
      await scrapeWebsite();
      console.log('成功执行爬取任务...');
    } catch (error) {
      console.error('爬取任务失败:', error.message);
    }
  });

app.get('/rss', async (req, res) => {
    try {
      // 检查 RSS 文件是否存在
      if (fs.existsSync(RSS_FILE_PATH)) {
        // 如果文件存在，读取文件内容并返回
        const rss = fs.readFileSync(RSS_FILE_PATH, 'utf8');
        res.header('Content-Type', 'application/xml');
        res.send(rss);
      } else {
        // 如果文件不存在，调用爬取方法并生成 RSS Feed
        console.log('RSS 文件不存在，正在生成...');
        await scrapeWebsite();
        const rss = fs.readFileSync(RSS_FILE_PATH, 'utf8');
        res.header('Content-Type', 'application/xml');
        res.send(rss);
      }
    } catch (error) {
      res.status(500).send('生成 RSS Feed 失败');
    }
  });

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已启动，访问: http://localhost:${PORT}/rss`);
});

# DY2018_RSS(电影天堂爬取RSS)
自动爬取电影天堂最新一页的电影为RSS订阅源

## Docker命令
docker run -d -p 30397:30397 --name dy2018_rss amamiyahotaru/dy2018_rss

## 参数说明

如果docker启动的话需要修改参数，自行映射/app/.env文件，并按需求修改

```bash
PORT=30397
DOWNLOAD_ALL=false
SLEEP_TIME=5000
CRON=1 * * * *
```

| 参数名  | 说明 | 默认值 |
|:-------:|:-------:|:-------:|
| PORT  | 程序运行端口   |  30397   | 
| DOWNLOAD_ALL  | 如果一个电影有多个磁力是否显示全部文件   |  false   | 
| SLEEP_TIME  | 抓取一个电影之后的休眠时间   |  5000   | 
| CRON  | 自动抓取最新电影的cron表达式   |  1 * * * *   | 

 

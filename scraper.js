const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const RSS = require('rss');
const fs = require('fs');
require('dotenv').config();

const host = "https://www.dy2018.com";
const isEnabled = process.env.DOWNLOAD_ALL?process.env.DOWNLOAD_ALL === 'true':false;
// 延时函数，返回一个 Promise 用来控制休眠
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchData(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const html = iconv.decode(Buffer.from(response.data), 'gb2312');
        return html;
    } catch (error) {
        console.error(`请求失败: ${error.message}`);
    }
}

// 爬取目标网页并生成 RSS
async function scrapeWebsite() {
    try {
        const $ = cheerio.load(await fetchData(host + "/html/gndy/dyzz/index.html"));
        const items = [];

        // 遍历每个 table 中的 tr 元素
        const tables = $('.co_content8').find('table');
        for (let i = 0; i < tables.length; i++) {
            const element = tables[i];
            const trs = $(element).find('tr'); // 获取所有 tr 元素
            const a = trs.eq(1).find('a').first(); // 获取第 2 行中的第一个 a 元素
            const td = trs.eq(3).find('td').first(); // 获取第 4 行中的第一个 td 元素
            const title = a.text().trim();
            const link = a.attr('href');
            const description = td.text().trim();

            if (title && link) {
                console.log(`尝试获取 ${title} 的磁力链接`);

                // 解析电影页面
                const movieHtml = await fetchData(host + link);
                const movie$ = cheerio.load(movieHtml); 

                // 查找所有的磁力链接
                const magnetLinks = [];
                movie$('a[href^="magnet:"]').each((index, linkElement) => {
                    const magnetLink = movie$(linkElement).attr('href');
                    if (magnetLink) {
                        magnetLinks.push(magnetLink); 
                    }
                });

                if (magnetLinks.length > 0) {
                    console.log(`Found ${magnetLinks.length} magnet links for ${title}`);
                    if (isEnabled) {
                        //为每个磁力链接新建一个item
                        for (let index = 0; index < magnetLinks.length; index++) {
                            const magnetLink = magnetLinks[index]; // 获取当前的磁力链接

                            // 创建一个 RSS 条目
                            const item = {
                                title: magnetLinks.length > 1 ? `[${index + 1}] ${title}` : title,  // 使用 index + 1 来确保每个条目的标题唯一
                                description: description,
                                url: host + link,
                                guid: `${title}-${index}`,  // 使用电影标题和索引来确保 GUID 唯一
                                enclosure: {
                                    url: magnetLink,
                                    type: "application/x-bittorrent"
                                }
                            };
                            items.push(item);
                        }
                    }
                    else {
                        // 默认使用第一个磁力链接
                        // 创建一个 RSS 条目
                        const item = {
                            title: title,
                            description: description,
                            url: host + link,
                            guid: `${title}`,
                            enclosure: {
                                url: magnetLinks[0],
                                type: "application/x-bittorrent"
                            }
                        };
                        items.push(item);
                    }
                } else {
                    console.log('No magnet links found');
                }
                // 每次循环后休眠 
                await sleep(process.env.SLEEP_TIME || 5000);
            }
        }

        // 创建 RSS feed
        const feed = new RSS({
            title: 'DY2018_RSS',
            generator : 'AmamiyaHotaru',
            description: '自动爬取电影天堂最新电影,仓库地址为：https://github.com/AmamiyaHotaru/DY2018_RSS',
            feed_url: 'http://localhost:30397/rss',
            site_url: host,
        });

        // 将每个条目添加到 RSS feed
        items.forEach(item => {
            feed.item(item);
        });

        // 返回生成的 RSS
        const xmlData = feed.xml();
        fs.writeFileSync('rss.xml', xmlData, 'utf8');
        console.log('RSS feed 已保存到 rss.xml 文件中');
    } catch (error) {
        console.error('抓取失败:', error.message);
    }
}

module.exports = { scrapeWebsite };

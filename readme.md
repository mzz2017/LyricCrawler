# LyricCrawler
一个批量爬取网易云音乐歌词的爬虫。
只因为网易云下歌不给歌词，而MP3需要lrc。
基于puppeter获取歌单列表（但实际上有相应的api可以轻松实现，我写了第一个版本之后才发现的）。
目前仍有some bugs.
## Before Setup
```bash
# Install pnpm
npm i -g pnpm
```
## Setup
```bash
# install dependencies
pnpm i

# run
node app.js
```

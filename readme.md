# LyricCrawler
一个批量爬取网易云音乐歌词的爬虫。
只因为网易云下歌不给歌词，而MP3需要lrc。
基于puppeter获取歌单列表（但实际上有相应的api可以轻松实现，我写了第一个版本之后才发现的）。
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
## Change playlist
```bash
# edit app.js:
  vim app.js
# find this line below:
  let songs = await crawlList(452039124);
# change this number to your own playlist id which you can find from your playlist url such as "https://music.163.com/#/playlist?id=452039124". Save the file and quit vim:
  :!wq
```
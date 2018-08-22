const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const async = require('async');
const { msleep } = require('sleep');
const fs = require('fs');
const iconv = require('iconv-lite');

(async () => {
  let songs = await crawlList();
  downloadLyrics(songs);
})()

async function crawlList() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  /* 注意，更改此处来更变要下载歌词的歌单 */
  await page.goto('https://music.163.com/#/playlist?id=452039124');
  try {
    let iframe = await page.frames().find(frame => frame.name() === 'contentFrame');
    let songIds = await iframe.$$eval('.m-table tbody .f-cb .tt a', elems => elems.map(e => e.href.match(/\?id=([0-9]+)/)[1]));
    let songTitles = await iframe.$$eval('.m-table tbody .f-cb .tt a b', elems => elems.map(
      (e) => (function escapeToHtml(str) {
        // 这个函数只能定义在这里，水平有限不知道为什么，那就只好写得臃肿一点了。
        var arrEntities = { 'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"' };
        return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, function (all, t) { return arrEntities[t]; });
      })(e.innerHTML.replace(/<div class="soil">.*<\/div>/, ''))
    ))
    let songArtists = await iframe.$$eval('.m-table tbody .text>span', elems => elems.map(e => e.title));
    await browser.close();

    let len = songIds.length;
    console.log(`共计${len}首歌曲`);
    try {
      fs.mkdirSync("./lyrics");
    } catch (e) {
      console.log(e);
    }
    let songs = new Array(len);
    for (let i = 0; i < len; i++) {
      songs[i] = { id: songIds[i], title: songTitles[i], artist: songArtists[i] };
    }
    return songs;
  } catch (e) {
    console.error(e);
  }
  return [];
}
async function getLyric(songId) {
  const url = `http://music.163.com/api/song/media?id=${songId}`;
  let res = await fetch(url);
  let { nolyric, uncollected, lyric, msg } = await res.json();
  let message = `songId:${songId} ${nolyric ? `nolyric:${nolyric}` : ''} ${uncollected ? `uncollected:${uncollected}` : ''} ${msg ? `msg:${msg}` : ''}`
  msleep(100);
  return { lyric, status: !!lyric, message };
};

function downloadLyrics(songs) {
  let cnt = 0;
  let len = songs.length;
  async.eachLimit(songs, 5, async (song) => {
    let filename = `${song.artist} - ${song.title}`.replace(/\//g, ',');
    let fullFilePath = `./lyrics/${filename}.lrc`;
    if (fs.existsSync(fullFilePath)) {
      console.log(++cnt, "/", len, "  ", `exists ${filename}.lrc`);
      return
    }
    let { lyric, status, message } = await getLyric(song.id);
    if (status) {
      fs.writeFile(fullFilePath, iconv.encode(lyric, 'gbk'), { encoding: 'binary', flag: "w" }, err => {
        if (err) {
          throw err;
        }
      });
      console.log(++cnt, "/", len, "  ", `${filename}.lrc`);
    } else {
      console.error(++cnt, "/", len, "  ", `failed ${filename}.lrc`, "  ", message);
    }
  }, (err) => {
    if (err) {
      console.error("gg了", err);
      throw err;
    }
    console.log("收工！")
  });
}
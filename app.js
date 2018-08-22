const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const async = require('async');
const { msleep } = require('sleep');
const fs = require('fs');
const iconv = require('iconv-lite');
var sum = 0;
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://music.163.com/#/playlist?id=452039124');
  try {
    let iframe = await page.frames().find(frame => frame.name() === 'contentFrame');
    console.log(iframe, escapeToHtml("a&quot;b"));
    let songIds = await iframe.$$eval('.m-table tbody .f-cb .tt a', elems => elems.map(e => e.href.match(/\?id=([0-9]+)/)[1]));
    let songTitles = await iframe.$$eval('.m-table tbody .f-cb .tt a b', elems => elems.map(
      (e) => {
        // 不知道为什么这个函数一定要定义在这里面
        function escapeToHtml(str) {
          var arrEntities = { 'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"' };
          return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, function (all, t) { return arrEntities[t]; });
        };
        return escapeToHtml(e.innerHTML.replace(/<div class="soil">.*<\/div>/, ''))
      }
    ))
    let songArtists = await iframe.$$eval('.m-table tbody .text>span', elems => elems.map(e => e.title));
    let len = songIds.length;
    sum = len;
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
    async.eachLimit(songs, 5, async (song) => {
      let lyric = await getLyric(song.id);
      if (lyric) {
        let filename = `${song.artist} - ${song.title}`.replace(/\//g, ',');
        fs.writeFile(`./lyrics/${filename}.lrc`, iconv.encode(lyric, 'gbk'), { encoding: 'binary', flag: "w" }, err => {
          if (err) {
            throw err;
          }
        });
      }
    }, (err) => {
      if (err) {
        console.error("gg了", err);
        // throw err;
      }
      // console.log("res", results);
    });
  } catch (e) {
    console.error(e);
  }
  await browser.close();
})();
var i = 0;
async function getLyric(songId) {
  const url = `http://music.163.com/api/song/media?id=${songId}`;
  let res = await fetch(url);
  let { lyric, msg } = await res.json();
  // console.log(++i, lyric ? lyric.substring(0, 20) : msg);
  console.log(++i, "/", sum);
  msleep(250);
  return lyric;
};
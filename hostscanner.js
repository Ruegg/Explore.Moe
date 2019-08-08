var HashMap = require('hashmap');
var request = require('request');
var cloudscraper = require('cloudscraper');

var r = request.defaults({'timeout':6});
var hosts = new HashMap();

function registerAutoHosts(){
  //hosts.set('animebaka.tv', animebakaTV); site taken down
 // hosts.set('anime-exceed.com', animeexceedCOM); site taken down
  hosts.set('animeplus.tv', animeplusTV);
  hosts.set('chia-anime.tv', chiaanimeTV);
  hosts.set('gogoanime.to', gogoanimeTO);
  hosts.set('gogoanime.se', gogoanimeSE);
  hosts.set('masterani.me', masteraniME);
  hosts.set('ryuanime.com', ryuanimeCOM);
}

function getAutoHosts(){
  return hosts;
}

function animebakaTV(titles, callback){
  var data = {
    term: titles.en_jp
  };
  var cloudflare = true,
  method = "POST",
  requestURL = 'http://animebaka.tv/ajax/autocomplete',
  postData = data,
  bad = 'No results to show',
  narrower = '',
  start = '"http://animebaka.tv/anime/',
  end = '"',
  data = ['http://animebaka.tv/watch/', true, '/episode-', 0],
  failSlug = getSlugForm(titles.en_jp, '_'),
  failSafeURL = 'http://animebaka.tv/anime/' + failSlug,
  failed = 'This is a 404 error.';
  performReq(cloudflare, method, requestURL, postData, bad, narrower, start, end, data, failSlug, failSafeURL, failed, callback);
}

function animeexceedCOM(titles, callback){
  var cloudflare = true,
  method = "GET",
  requestURL = 'http://anime-exceed.com/results.php?anime=' + replaceWithPluses(encodeURI(titles.en_jp)),
  postData = "",
  bad = '',
  narrower = '<div class="animetitle">',
  start = '"http://anime-exceed.com/watch/',
  end = '/',
  data = ['http://anime-exceed.com/', true + '/', true, '-episode-', 0, '-subbed-dubbed/'],
  failSlug = getSlugForm(titles.en_jp, '-'),
  failSafeURL = 'http://anime-exceed.com/watch/' + failSlug,
  failed = 'The link you visited has been changed';
  performReq(cloudflare, method, requestURL, postData, bad, narrower, start, end, data, failSlug, failSafeURL, failed, callback);
}

function animeplusTV(titles, callback){
  var cloudflare = true,
  method = "GET",
  requestURL = 'http://www.animeplus.tv/anime/search?key=' + replaceWithPluses(encodeURI(titles.en_jp)) + '&search_submit=Go',
  postData = "",
  bad = '',
  narrower = '<div class="series_list">',
  start = '"http://www.animeplus.tv/',
  end = '-online',
  data = ['http://www.animeplus.tv/', true, '-episode-', 0, '-online'],
  failSlug = getSlugForm(titles.en_jp, '-'),
  failSafeURL = 'http://www.animeplus.tv/' + failSlug + '-online',
  failed = 'Oops! Page Not Found';
  performReq(cloudflare, method, requestURL, postData, bad, narrower, start, end, data, failSlug, failSafeURL, failed, callback);
}


function chiaanimeTV(titles, callback){
  var cloudflare = true,
  method = "GET",
  requestURL = 'http://ww2.chia-anime.tv/search/' + replaceWithPluses(encodeURI(titles.en_jp)),
  postData = "",
  bad = '',
  narrower = '<div id="countrydivcontainer">',
  start = '"http://ww2.chia-anime.tv/episode/',
  end = '/',
  data = ['http://ww2.chia-anime.tv/', true, '-episode-', 0, '-english-subbed/'],
  failSlug = getSlugForm(titles.en_jp, '-'),
  failSafeURL = 'http://ww2.chia-anime.tv/episode/' + failSlug,
  failed = '';
  performReq(cloudflare, method, requestURL, postData, bad, narrower, start, end, data, failSlug, failSafeURL, failed, callback);
}

function gogoanimeTO(titles, callback){
  var cloudflare = true,
  method = "GET",
  requestURL = 'http://www.gogoanime.to/?s=' + replaceWithPluses(encodeURI(titles.en_jp)),
  postData = "",
  bad = '',
  narrower = '<div id="content">',
  start = '"http://www.gogoanime.to/category/',
  end = '"',
  data = ['http://www.gogoanime.to/', true, '-episode-', 0],
  failSlug = getSlugForm(titles.en_jp, '-'),
  failSafeURL = 'http://www.gogoanime.to/category/' + failSlug,
  failed = 'Oops! Page Not Found';
  performReq(cloudflare, method, requestURL, postData, bad, narrower, start, end, data, failSlug, failSafeURL, failed, callback);
}

function gogoanimeSE(titles, callback){
  var data = {
    data: titles.en_jp,
    id: -1
  };
  var cloudflare = true,
  method = "GET",
  requestURL = 'https://www2.gogoanime.se/search.html?keyword=' + replaceWithPluses(encodeURI(titles.en_jp)) + '&id=-1',
  postData = data,
  bad = '',
  narrower = '',
  start = '"/category/',
  end = '"',
  data = ['https://www2.gogoanime.se/', true, '-episode-', 0],
  failSlug = getSlugForm(titles.en_jp, '-'),
  failSafeURL = 'https://www2.gogoanime.se//category/' + failSlug + '/',
  failed = '';
  performReq(cloudflare, method, requestURL, postData, bad, narrower, start, end, data, failSlug, failSafeURL, failed, callback);
}

function masteraniME(titles, callback){
  var cloudflare = true,
  method = "GET",
  requestURL = 'http://www.masterani.me/api/anime/search?search=' + encodeURI(titles.en_jp),
  postData = "",
  bad = '[]',
  narrower = '',
  start = '"slug":"',
  end = '"',
  data = ['http://www.masterani.me/anime/watch/', true, '/', 0],
  failSlug = '',
  failSafeURL = '',
  failed = '';
  performReq(cloudflare, method, requestURL, postData, bad, narrower, start, end, data, failSlug, failSafeURL, failed, callback);
}

function ryuanimeCOM(titles, callback){
  var cloudflare = true,
  method = "GET",
  requestURL = 'https://www1.ryuanime.com/search?term=' + replaceWithPluses(encodeURI(titles.en_jp)),
  postData = "",
  bad = 'No results found',
  narrower = 'card-body',
  start = '"https://www1.ryuanime.com/anime/',
  end = '"',
  data = ['https://www1.ryuanime.com/anime/watch/', true, '-episode-', 0, '-english-sub'],
  failSlug = getSlugForm(titles.en, '-'),
  failSafeURL = 'https://www1.ryuanime.com/series-info/' + failSlug + '/',
  failed = '';
  performReq(cloudflare, method, requestURL, postData, bad, narrower, start, end, data, failSlug, failSafeURL, failed, callback);
}
function replaceWithPluses(str){
  return str.split('%20').join('+');
}

function findWild(body, bad, narrower, start, end){
  if(body.indexOf(bad) == -1 || bad == ''){
    console.log("no has bad");
    if(narrower != ''){
      if(body.indexOf(narrower) > -1){
        console.log("can narrow");
        body = body.substring((body.indexOf(narrower)+narrower.length), body.length);
      }
    }
    if(body.indexOf(start) > -1){
      console.log("has start");
      var sub = body.substring((body.indexOf(start)+start.length), body.length);
      if(sub.indexOf(end) > -1){
        console.log("hasend");
        var complete = sub.substring(0, sub.indexOf(end));
        console.log("complete");
        return complete;
      }
    }
  }else{
    console.log("It has bad! " + bad + " in " + body);
  }
  return false;
}

function performReq(cloudflare, method, requestURL, postData, bad, narrower, start, end, data, failSlug, failSafeURL, failed, callback){
  console.log("request for " + requestURL);
  var callbackFunction = function (err, httpResponse, body) {
    if (err) {
      console.log("err: " + err);
      callback(true, null);
      return false;
    }
    var result = findWild(body, bad, narrower, start, end);
    console.log("result: " + result);
    if(result != false){
      console.log("Found " + result);
      var slugUsing = result;
      if(similar(failSlug, result) == false){
        if(failSafeURL){
          console.log('Not similar, attempting: ' + failSafeURL);
          failSafe(failSafeURL, failSlug, failed, function(exists){
            if(exists){
              replaceDataAndCallback(data, failSlug, callback);
            }else{
              replaceDataAndCallback(data, result, callback);
            }
          });
          return;
        }
      }
      replaceDataAndCallback(data, result, callback);
      return;
    }
    callback(true, null);
  }
  if(cloudflare){
    if(method == "GET"){
      cloudscraper.get(requestURL, callbackFunction);
    }else if(method == "POST"){
      cloudscraper.post(requestURL, postData, callbackFunction);
    }
  }else{
    if(method == "GET"){
      request.get(requestURL, callbackFunction);
    }else if(method == "POST"){
      request.post(requestURL, postData, callbackFunction);
    }
  }
}

function replaceDataAndCallback(originData, slug, callback){
  var newData = [];
  originData.forEach(function(cData, index){
    if(typeof cData == "string"){
      newData = smarterStringPush(newData, cData);
    }else if(typeof cData == "boolean"){
      newData = smarterStringPush(newData, slug);
    }else if(typeof cData == "number"){
      newData.push(0);
    }
  });
  callback(false, newData);
}

function smarterStringPush(array, str){
  var copy = array.slice(0);
  if(copy.length != 0){
    var lastIndex = (copy.length-1);
    if(typeof copy[lastIndex] == "string"){
      var copied = copy[lastIndex];
      var combined = copied + str;
      copy = copy.slice(0, -1);
      copy.push(combined);
    }else{
      copy.push(str);
    }
  }else{
    copy.push(str);
  }
  return copy;
}

function similar(a, b){
  var correctedA = '';
  var correctedB = '';
  var accepted = 'abcdefghijklmnopqrstuvwxyz';
  for(var n = 0; n != a.length;n++){
    var currentCharacter = a[n];
    if(accepted.indexOf(currentCharacter) > -1){
      correctedA = correctedA + currentCharacter;
    }
  }
  for(var n = 0; n != b.length;n++){
    var currentCharacter = b[n];
    if(accepted.indexOf(currentCharacter) > -1){
      correctedB = correctedB + currentCharacter;
    }
  }
  return (correctedA == correctedB);
}

function failSafe(failURL, failSlug, failed, callback){
  cloudscraper.get(failURL, function(err, httpResponse, body){
    if(err){
      callback(false);
    }
    if(failed == ''){
      callback(body.indexOf(failSlug) > -1);
    }else {
      callback((body.indexOf(failed) == -1));
    }
  });
}

function getSlugForm(title, delimiter){
  var copy = title.toLowerCase();
  var accepted = 'abcdefghijklmnopqrstuvwxyz ' + delimiter;
  var correctedCopy = '';
  for(var n = 0; n != copy.length;n++){
    var currentCharacter = copy[n];
    if(accepted.indexOf(currentCharacter) > -1){
      correctedCopy = correctedCopy + currentCharacter;
    }
  }
  correctedCopy = correctedCopy.split(' ').join(delimiter);
  correctedCopy = correctedCopy.replace(/:\s*/g, "");
  console.log("Converted " + title + " to " + correctedCopy);
  return correctedCopy;
}
module.exports = {registerAutoHosts: registerAutoHosts, getAutoHosts: getAutoHosts};

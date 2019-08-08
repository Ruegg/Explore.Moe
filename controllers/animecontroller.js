var backEnd = require('../backend');

var fs = require('fs');
var HashMap = require('hashmap');
var ArrayList = require('arraylist');
var utils = require('../utils');
var Anime = require('../objects/anime');

var packets = require('../packets');

var hostController = require('./hostcontroller');
var tagController = require('./tagcontroller');

var hostScanner = require('../hostscanner');
hostScanner.registerAutoHosts();

var animes = new HashMap();//Anime slug / Anime object

var kitsu = require('./kitsucontroller');

var socketsScanning = new ArrayList;

function loadAnime(slug, animeObj){
  animes.set(slug, animeObj);
  console.log("Anime[" + slug + "] loaded.");
}

function requestAnimeListPacket(socket){
  var list = [];
  animes.forEach(function(value,key){
    var obj = {slug: key, title: value.titles.en};
    var stringed = JSON.stringify(obj);
    list.push(stringed);
  });
  var animeListPacket = new packets.AnimeListPacket();
  animeListPacket.list = list;
  socket.send(packets.stringPacket(animeListPacket));
}

function requestAnimeRemoval(socket, slug){
  if(animes.has(slug) == false){
    backEnd.sendNotification(socket, 'danger', 'Removal requested for non-existant anime');
    return;
  }
  animes.remove(slug);
  fs.unlink(('./storage/animes/' + slug + '.json'),function(err){
    if(err){
      console.log('Error occured attempting to remove an anime file');
      return;
    }
  });
  backEnd.saveData();
  backEnd.sendNotification(socket, 'success', 'Removed');
}

function requestAnimeLoadPacket(socket, slug){
  if(animes.has(slug) == false){
    backEnd.sendNotification(socket, 'danger', 'Load requested for non-existant anime');
    return;
  }
  console.log("Loading");
  var currentAnime = animes.get(slug);
  var loadPacket = new packets.AnimeLoadPacket();
  loadPacket.slug = slug;
  loadPacket.synopsis = currentAnime.synopsis;
  loadPacket.entries = currentAnime.entries;
  loadPacket.smartentries = currentAnime.smartentries;
  loadPacket.episode_count = currentAnime.episode_count;
  loadPacket.en = currentAnime.titles.en;
  loadPacket.en_jp = currentAnime.titles.en_jp;
  console.log("Sending!");
  socket.send(packets.stringPacket(loadPacket));
}

function requestAnimeEditPacket(socket, slug, en, en_jp, synopsis, episodeCount, entries, smartEntries){
  if(animes.has(slug) == false){
    backEnd.sendNotification(socket, 'danger', 'Requested edit for non-existant anime');
    return;
  }
  var confirmedEntries = getValidatedEntries(entries);
  var confirmedSmartEntries = getValidatedSmartEntries(smartEntries);
  animes.get(slug).synopsis = synopsis;
  animes.get(slug).titles.en = en;
  animes.get(slug).titles.en_jp = en_jp;
  animes.get(slug).episode_count = episodeCount;
  animes.get(slug).entries = confirmedEntries;
  animes.get(slug).smartentries = confirmedSmartEntries;
  backEnd.saveAnime(slug);
  console.log(slug +  'has been edited');
  backEnd.sendNotification(socket, 'success', 'Edit was successful');
}

function requestAnimeAdditionPacket(socket, slug, en, en_jp, requestedSynopsis, requestedEpisodeCount, entries, smartEntries){
  if(isValidSlugFormat(slug) == false){
    backEnd.sendNotification(socket, 'danger', 'Slug is bad format');
    return;
  }
  if(animes.has(slug)){
    backEnd.sendNotification(socket, 'danger', 'An anime already exist with given slug');
    return;
  }
  kitsu.requestAnime(slug, function(error, response, body){
    if(error){
      backEnd.sendNotification(socket, 'danger', 'Request error');
      return;
    }
    if(response.statusCode == 200){
      var obj = packets.isValidJSON(body);
      if(obj != false){
        console.log('Starting creation of ' + slug);
        var attributes = utils.get(obj, 'data.0.attributes');
        if(objectIsArray(attributes) == false){
          backEnd.sendNotification(socket, 'danger', 'Received bad object from HummingBird');
        }

        var titles = prioritizeTitles(attributes.titles);
        if(en != ''){
          titles.en = en;
        }
        if(en_jp != ''){
          titles.en_jp = en_jp;
        }
        var synopsis = '';
        var started_airing_date = '';
        var finished_airing_date = '';
        var cover_image = {tiny: '', small: '', medium: '', large: ''};
        var poster_image = {tiny: '', small: '', medium: '', large: ''};
        var genres = [];
        var age_rating = '?';
        var episode_count = 0;
        /*Check object types*/
        if(requestedSynopsis == ''){//Allow override synopsis
          if(typeof attributes.synopsis == 'string'){
            synopsis = attributes.synopsis;
          }
        }else{
          synposis = requestedSynopsis;
        }

        if(typeof attributes.startDate == 'string' || typeof attributes.startDate == 'object'){
          started_airing_date = attributes.startDate;
        }
        if(typeof attributes.endDate == 'string' || typeof attributes.endDate == 'object'){
          finished_airing_date = attributes.endDate;
        }
        if(objectIsArray(attributes.genres)){
          for(var n = 0; n != attributes.genres.length;n++){
            var currentGenre = attributes.genres[n];
            if(typeof currentGenre == 'string'){
              genres.push(currentGenre);
            }
          }
        }

        if(typeof attributes.coverImage == 'object' && attributes.coverImage != null){
          cover_image = getValidImageObject(attributes.coverImage);
        }
        if(typeof attributes.posterImage == 'object' && attributes.posterImage != null){
          poster_image = getValidImageObject(attributes.posterImage);
        }
        if(typeof attributes.ageRating == 'string'){
          age_rating = attributes.ageRating;
        }

        if(requestedEpisodeCount == -1){//Allow this to be overriden
          if(typeof attributes.episodeCount == 'number'){
            episode_count = attributes.episodeCount;
          }
        }else{
            episode_count = requestedEpisodeCount;
        }

        /*Confirm entries*/
        var confirmedEntries = getValidatedEntries(entries);
        var confirmedSmartEntries = getValidatedSmartEntries(smartEntries);
        console.log('Configuring entries');
        for(var n = 0; n != entries.length;n++){
          var currentEntry = entries[n];
          var validEntry = isValidEntry(currentEntry);
          if(validEntry != false){
            confirmedEntries.push(validEntry);
          }
        }

        /*Create and add anime*/
        var animeObj = new Anime();
        animeObj.setInitData(titles, synopsis, started_airing_date, finished_airing_date, cover_image, poster_image, genres, age_rating, episode_count, community_rating, confirmedEntries, confirmedSmartEntries);
        animes.set(slug, animeObj);
        backEnd.saveConfiguration();
        backEnd.saveAnime(slug);

        backEnd.sendNotification(socket, 'success', 'Anime has been added to database');
      }else{
        console.log('Bad obj received from hummingbird');
        backEnd.sendNotification(socket, 'danger', 'Received bad object from HummingBird');
      }
    }else{
      backEnd.sendNotification(socket, 'danger', 'Hummingbird does not use slug given');
    }
  });
}

function getValidImageObject(obj){
  var tiny = '';
  var small = '';
  var medium = '';
  var large = '';
  if(typeof obj.tiny == 'string'){
    tiny = obj.tiny;
  }
  if(typeof obj.small == 'string'){
    small = obj.small;
  }
  if(typeof obj.medium == 'string'){
    medium = obj.medium;
  }
  if(typeof obj.large == 'string'){
    large = obj.large;
  }
  return {tiny: tiny, small: small, medium: medium, large: large};
}

function getValidatedEntries(entries){
  var confirmedEntries = [];
  for(var n = 0; n != entries.length;n++){
    var currentEntry = entries[n];
    var validEntry = isValidEntry(currentEntry);
    if(validEntry != false){
      confirmedEntries.push(validEntry);
    }
  }
  return confirmedEntries;
}

function getValidatedSmartEntries(smartEntries){
  var confirmedSmartEntries = [];
  for(var n = 0; n != smartEntries.length;n++){
    var currentSmartEntry = smartEntries[n];
    if(typeof currentSmartEntry == 'object'){
      var validSmartEntry = isValidSmartEntry(currentSmartEntry);
      if(validSmartEntry != false){
        confirmedSmartEntries.push(validSmartEntry);
      }
    }
  }
  return confirmedSmartEntries;
}
function isValidSmartEntry(obj){
  if(objectIsArray(obj.data) && typeof obj.start == 'number' && typeof obj.end == 'number'){
    for(var n = 0;n != obj.data.length;n++){
      var thisData = obj.data[n];
      if(typeof thisData != 'string' && typeof thisData != 'number'){
        return false;
      }
    }
    if(obj.start > obj.end){
      return false;
    }
    var sE = new Object();/*We want to make a new object incase the user added other unnecessary variables*/
    sE.data = obj.data;
    sE.start = obj.start;
    sE.end = obj.end;
    return sE;
  }else{
    return false;
  }
}

function isValidEntry(obj){
  if(typeof obj.ep == 'number' && typeof obj.url == 'string'){
    return new Entry(obj.ep, obj.url);
  }else{
    return false;
  }
}

function Entry(ep, url){
  this.ep = ep;
  this.url = url;
}

function requestScan(socket, slug, start, end){
  if(socketsScanning.contains(socket) == false){
    socketsScanning.add(socket);
    var validSlugResponse = isValidSlugFormat(slug);
    if(validSlugResponse != true){
      socketsScanning.remove(socket);
      backEnd.sendNotification(socket, 'danger', validSlugResponse);
      return;
    }

    kitsu.requestAnime(slug, function(error, response, body){
      if(error){
        backEnd.sendNotification(socket, 'danger', 'Request error');
        return;
      }
      if(response.statusCode == 200){
        var obj = packets.isValidJSON(body);
        if(obj != false){
          if(typeof utils.get(obj, 'data.0.attributes.titles') == 'undefined'){
            backEnd.sendNotification(socket, 'danger', 'Unable to get titles from Kitsu');
            return;
          }
          console.log("Raw:" + JSON.stringify(utils.get(obj, 'data.0.attributes.titles')));
          var titles = prioritizeTitles(utils.get(obj, 'data.0.attributes.titles'));
          if(titles == false){
            backEnd.sendNotification(socket, 'danger', 'Hummingbird does not have any titles for us, contact admin');
            return;
          }
          var autoHostsEntries = hostScanner.getAutoHosts().clone();//Clone it, don't risk modifications during loop
          var autoHosts = autoHostsEntries.values();
          var hostScanned = 0;
          for(var n = 0; n != autoHosts.length;n++){
            var currentAutoHost = autoHosts[n];
            currentAutoHost(titles, function(unobtained, data){
              if(unobtained == false){
                //Send host data
                var smURL = new SmartURL(start, end, data);
                var p = new packets.VariablePacket();
                p.name = 'smartentry';
                p.data = formatTextAreaSmartURL(smURL);
                socket.send(packets.stringPacket(p));
              }else{
                console.log('Unobtained for a host');
              }
              hostScanned++;
              var perc = hostScanned/autoHosts.length;
              perc = Math.round(perc*100);
              var p = new packets.ScanProgressPacket();
              p.val = perc;
              p.type = 'info';
              if(perc == 100){
                p.type = 'success';
              }
              socket.send(packets.stringPacket(p));
              if(hostScanned == autoHosts.length){
                if(socketsScanning.contains(socket)){
                  socketsScanning.remove(socket);
                }
              }
            });
          }
        }
      }else{
        backEnd.sendNotification(socket, 'danger', 'Hummingbird does not use slug given');
      }
    });
  }else{
    backEnd.sendNotification(socket, 'danger', 'Your socket is already scanning');
  }
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function prioritizeTitles(titles){
  var en = '';
  var en_jp = '';
  if(typeof titles.en == 'string'){
    if(titles.en != ''){
      en = titles.en;
    }
  }
  if(typeof titles.en_jp == 'string'){
    if(titles.en_jp != ''){
      en_jp = titles.en_jp;
    }
  }
  if(en == '' && en_jp == ''){
    return false;
  }
  if(en_jp == ''){
    en_jp = en;
  }
  if(en == ''){
    en = en_jp;
  }
  /*Finished verifying title to best of ability*/
  var titles = {en: en, en_jp: en_jp};
  return titles;
}

function validateSlug(socket, slug){
  var validSlugResponse = isValidSlugFormat(slug);
  if(validSlugResponse != true){
    sendSlugResultPacket(socket, validSlugResponse);
    return;
  }
  if(animes.has(slug) == false){
    console.log('Checking slug ' + slug);
    kitsu.requestAnime(slug, function(error, response, body){
      if(response.statusCode == 200){
        sendSlugResultPacket(socket, 'Valid slug according to HummingBird!');
      }else{
        sendSlugResultPacket(socket, 'Invalid slug according to HummingBird')
      }
    });
  }else{
    sendSlugResultPacket(socket, 'Slug exist in AnimeIndex database');
  }
}

function sendSlugResultPacket(socket, response){
  var p = new packets.ValidSlugPacket();
  p.response = response;
  socket.send(packets.stringPacket(p));
}

function isValidSlugFormat(slug){
  slug = slug.toLowerCase();
  var i = slug.length;
  var acceptable = 'abcdefghijklmnopqrstuvwxyz1234567890-';
  while (i--) {
    if(slug[i]){
      if(acceptable.indexOf(slug[i]) == -1){
        return 'Bad slug format, use only letters, numbers, and hyphens';
      }
    }
  }
  if(slug.length < 1){
    return 'Empty slug after parse';
  }
  return true;
}

function getAnimes(){
  return animes;
}
function getAnimeBySlug(slug){
  return animes.get(slug);
}

/*------------------------------*/
/*   M A S S         S C A N    */
/*------------------------------*/
function requestMassScan(socket){
  var autoHosts = hostScanner.getAutoHosts();
  var requestsMade = 0;
  var requestsFinished = 0;
  animes.forEach(function(anime,key){
    var copyAutoHosts = autoHosts.clone();
    var smartEntries = anime.smartentries;
    smartEntries.forEach(function(smartEntryObj, index){
      var dataArray = smartEntryObj.data;
      var templateURL = '';
      dataArray.forEach(function(data, index){
        if(typeof data == 'string'){
          templateURL = templateURL + data;
        }else if(typeof data == 'number'){
          templateURL = templateURL + '0';
        }
      });
      //try and get domain from templateURL
      var extractedDomain = extractDomain(templateURL).toLowerCase();
      if(copyAutoHosts.has(extractedDomain)){
        copyAutoHosts.remove(extractedDomain);
      }
    });
    //Get autohosts that weren't removed and run them.
    if(copyAutoHosts.count() > 0){
      copyAutoHosts.forEach(function(autoFunc,domain){
        requestsMade++;
        autoFunc(anime.titles, function(unobtained, data){
          requestsFinished++;
          if(unobtained == false){
          var sePacket = new packets.MassScanEntryPacket();
          sePacket.slug = key;
          var start = 1;
          var end = anime.episode_count;
          if(end == 0){
            start = 0;
          }
          sePacket.smartentry = {start: start, end: end, data: data};
          socket.send(packets.stringPacket(sePacket));
          }
          var progressPacket = new packets.ScanProgressPacket();
          progressPacket.type = 'progress-info';
          progressPacket.val = Math.round((requestsFinished/requestsMade)*100);
          if(progressPacket.val == 100){
            progressPacket.type = 'progress-success';
          }
          socket.send(packets.stringPacket(progressPacket));
        });
        var progressPacket = new packets.ScanProgressPacket();
        progressPacket.type = 'progress-info';
        progressPacket.val = Math.round((requestsFinished/requestsMade)*100);
        socket.send(packets.stringPacket(progressPacket));
      });
    }else{
      console.log(key + ' is already updated');
    }
  });

  if(requestsMade == 0){
    var progressPacket = new packets.ScanProgressPacket();
    progressPacket.type = 'progress-success';
    progressPacket.val = 100;
    socket.send(packets.stringPacket(progressPacket));
  }
}

function requestMassAdd(socket, massScanObjects){
  console.log('mass add requested');
  massScanObjects.forEach(function(massScanObject, index){
    var validMassScanObject = isValidMassScanObject(massScanObject);
    if(validMassScanObject != false){
      console.log('Valid mass scan object: ' + validMassScanObject.slug);
      validMassScanObject.smartentries.forEach( function(smartentry, index2){
        animes.get(validMassScanObject.slug).smartentries.push(smartentry);
      });
      backEnd.saveAnime(validMassScanObject.slug);
    }else{
      console.log('Invalid mass scan object');
    }
  });
  backEnd.sendNotification(socket, 'success', 'All smartentries have been added');
}

function isValidMassScanObject(massScanObject){
  if(typeof massScanObject.slug != 'string' || typeof massScanObject.smartentries != 'object'){
    console.log('bad obj types');
    return false;
  }
  if(objectIsArray(massScanObject.smartentries) == false){
    console.log('obj not array smartentries, it is : ' + Object.prototype.toString.call(massScanObject.smartentries));
    return false;
  }
  var slug = massScanObject.slug;
  var confirmedSmartEntries = [];
  if(animes.has(slug) == false){
    console.log('animes doesnt have it');
    return false;
  }

  var smartEntries = massScanObject.smartentries;
  smartEntries.forEach(function(smartEntry, index){
    var validSmartEntry = isValidSmartEntry(smartEntry);
    if(validSmartEntry != false){
      confirmedSmartEntries.push(validSmartEntry);
    }
  });
  if(smartEntries.length == 0){
    console.log('no valid smart entries');
    return;
  }
  var newMassScanObject = {slug: slug, smartentries: confirmedSmartEntries};
  return newMassScanObject;
}

function extractDomain(url) {
    var domain;
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    } else {
        domain = url.split('/')[0];
    }
    if(domain.startsWith("www.")){
    	domain = domain.substring(4, domain.length);
    }
    return domain;
}
/*------------------------------*/
/*      D O M      A R  E A     */
/*------------------------------*/
function getGenreCode(slug){
  var code = '';
  var anime = animes.get(slug);
  for(var n = 0; n!= anime.genres.length;n++){
    code = code + '<a class="genre">' + anime.genres[n] + '</a>';
  }
  return code;
}

function jsonCodeForEntries(slug){
  var tagEntries = [];
  var smartEntries = animes.get(slug).smartentries;
  var entries = animes.get(slug).entries;
  var hostObjects = hostController.getHosts().values();
  var tags = tagController.getTags();
  smartEntries.forEach(function(smartObject, index){
    var dataArray = smartObject.data;
    var episodeURLTemplate = '';
    for(var n = 0 ; n != dataArray.length;n++){
      if(typeof dataArray[n] == 'string'){
        episodeURLTemplate = episodeURLTemplate + dataArray[n];
      }else if(typeof dataArray[n] == 'number'){
        episodeURLTemplate = episodeURLTemplate + '0';
      }
    }
    var seTags = getTagsFromURL(hostObjects, tags, episodeURLTemplate);
    var comboObject = {type: 'SENTRY', start: smartObject.start, end: smartObject.end, data: smartObject.data, tags: seTags};
    tagEntries.push(comboObject);
  });
  entries.forEach(function(entryObj, index){
    var eTags = getTagsFromURL(hostObjects, tags, entryObj.url);
    var comboObject = {type: 'ENTRY', ep: entryObj.ep, url: entryObj.url, tags: eTags};
    tagEntries.push(comboObject);
  });
  var code = JSON.stringify(tagEntries);
  return code;
}

function getTagsFromURL(hostObjects, tags, url){
  var theseTags = [];
  for(var n = 0; n!= hostObjects.length;n++){
    var currentHostObj = hostObjects[n];
    if(belongsToDomain(url, currentHostObj.domain)){
      for(var x = 0; x != currentHostObj.tags.length;x++){
        var currentTagIndex = currentHostObj.tags[x];
        if(typeof currentTagIndex == 'number'){
          if(currentTagIndex < tags.length){
            theseTags.push(tags[currentTagIndex]);
          }
        }
      }
      break;
    }
  }
  return theseTags;
}

function getTileObjects(){
  var tileObjects = [];
  animes.forEach(function(anime, slug){
    var tileObject = {slug: slug, poster_image: anime.poster_image.medium, english: anime.titles.en, community_rating: anime.community_rating};
    tileObjects.push(tileObject);
  });
  return tileObjects;
}

function getAiringTileObjects(){
  var tileObjects = [];
  animes.forEach(function(anime, slug){
    if(anime.finished_airing_date == null){
      var tileObject = {slug: slug, poster_image: anime.poster_image.medium, english: anime.titles.en, community_rating: anime.community_rating};
      tileObjects.push(tileObject);
    }
  });
  return tileObjects;
}

function orderByRating(tileObjects){
  tileObjects.sort(function(a,b){
    return b.community_rating - a.community_rating;
  });
  return tileObjects;
}

function createAnimeTilesCode(tileObj){
  var code = '<div class="anime-tile animated slideInUp faster" onclick="navigate(' + "'" + tileObj.slug + "'" + ')" style="background-image: url(' + tileObj.poster_image + ')">';
  code = code + '<div class="info"><font class="anime-rating">&starf; ' + tileObj.community_rating.toFixed(2) + '</font><br><font class="anime-title">' + tileObj.english + '</font></div></div>';
  return code;
}

function createAnimePostersCode(tileObj){
  var code = '<div class="anime-poster animated slideInRight" onclick="navigate(' + "'" + tileObj.slug + "'" + ')" style="background-image: url(' + tileObj.poster_image + ')">';
  code = code + '<div class="info"><font class="anime-rating">&starf; ' + tileObj.community_rating.toFixed(2) + '</font><br><span class="anime-title">' + tileObj.english + '</span></div></div>';
  return code;
}

function createAnimeTilesCodeFromArray(tileObjArray){
  var code = '';
  tileObjArray.forEach(function(tileObj, index){
    code = code + createAnimeTilesCode(tileObj);
  });
  return code;
}

function createAnimePostersCodeFromArray(tileObjArray){
  var code = '';
  tileObjArray.forEach(function(tileObj, index){
    code = code + createAnimePostersCode(tileObj);
  });
  return code;
}

function belongsToDomain(url, domain){
  url = url.toLowerCase();
  if(url.startsWith("http://")){
    url = url.substring(7, url.length);
  }else if(url.startsWith("https://")){
    url = url.substring(8, url.length);
  }
  if(url.startsWith("www.")){
    url = url.substring(4, url.length);
  }
  if(url.startsWith("ww2.")){
    url = url.substring(4, url.length);
  }
  if(url.startsWith("www2.")){
    url = url.substring(5, url.length);
  }
  if(url.startsWith(domain.toLowerCase())){
    return true;
  }else{
    return false;
  }
}

function objectIsArray(obj){
  return Object.prototype.toString.call(obj) === '[object Array]';
}

function SmartURL(start, end, data){
  this.start = start;
  this.end = end;
  this.data = data;
}

function formatTextAreaSmartURL(smartURL){
  return ('{\n  "start": ' + smartURL.start + ',\n  "end": ' + smartURL.end + ',\n  "data": ' + JSON.stringify(smartURL.data) + '\n}');
}

module.exports = {
  getAnimes: getAnimes,
  getAnimeBySlug: getAnimeBySlug,
  loadAnime: loadAnime,
  requestAnimeListPacket: requestAnimeListPacket,
  requestAnimeRemoval: requestAnimeRemoval,
  requestAnimeLoadPacket: requestAnimeLoadPacket,
  requestAnimeEditPacket: requestAnimeEditPacket,
  requestAnimeAdditionPacket: requestAnimeAdditionPacket,
  requestScan: requestScan,
  validateSlug: validateSlug,
  isValidSlugFormat: isValidSlugFormat,
  requestMassScan: requestMassScan,
  requestMassAdd: requestMassAdd,
  getGenreCode: getGenreCode,
  jsonCodeForEntries: jsonCodeForEntries,
  getTagsFromURL: getTagsFromURL,
  getTileObjects: getTileObjects,
  getAiringTileObjects: getAiringTileObjects,
  orderByRating: orderByRating,
  createAnimeTilesCode: createAnimeTilesCode,
  createAnimePostersCode: createAnimePostersCode,
  createAnimeTilesCodeFromArray: createAnimeTilesCodeFromArray,
  createAnimePostersCodeFromArray: createAnimePostersCodeFromArray
};

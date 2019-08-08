module.exports = {
  handleSocket: handleSocket,
  sendNotification: sendNotification,
  loadData: loadData,
  saveAnime: saveAnime,
  saveData: saveData,
  saveConfiguration: saveConfiguration
};

var HashMap = require('hashmap');
var ArrayList = require('arraylist');
var http = require('http');
var fs = require('fs');

var packets = require('./packets');

var Anime = require('./objects/anime');

var animeController = require('./controllers/animecontroller');
var hostController = require('./controllers/hostcontroller');
var tagController = require('./controllers/tagcontroller');
var adminController = require('./controllers/admincontroller');

var confirmedSockets = new HashMap();

var socketsScanning = new ArrayList;

function handleSocket(socket){
  socket.on('message', function (data) {
    var obj = packets.validateString(data);
    if(obj != false){
      if(obj instanceof packets.AdminVerificationPacket){
        if(adminController.validateSession(obj.sesh)){
          confirmedSockets.set(socket, obj.sesh);;
        }else{
          sendNotification(socket, 'danger', 'Bad session');
        }
      }else if(confirmedSockets.has(socket)){
        if(adminController.validateSession(confirmedSockets.get(socket))){
          if(obj instanceof packets.ValidateSlugPacket){
            animeController.validateSlug(socket, obj.slug);
          }else if(obj instanceof packets.ScanRequestPacket){
            animeController.requestScan(socket, obj.slug, obj.start, obj.end);
          }else if(obj instanceof packets.AnimeAdditionRequest){
            animeController.requestAnimeAdditionPacket(socket, obj.slug, obj.en, obj.en_jp, obj.synopsis, obj.episode_count, obj.entries, obj.smartentries);
          }else if(obj instanceof packets.AnimeListPacket){
            animeController.requestAnimeListPacket(socket);
          }else if(obj instanceof packets.AnimeRemovalRequest){
            animeController.requestAnimeRemoval(socket, obj.slug);
          }else if(obj instanceof packets.AnimeLoadRequestPacket){
            animeController.requestAnimeLoadPacket(socket, obj.slug);
          }else if(obj instanceof packets.AnimeEditRequest){
            animeController.requestAnimeEditPacket(socket, obj.slug, obj.en, obj.en_jp, obj.synopsis, obj.episode_count, obj.entries, obj.smartentries);
          }else if(obj instanceof packets.HostAdditionRequest){
            hostController.requestHostAddition(socket, obj.domain, obj.tags);
          }else if(obj instanceof packets.HostListPacket){
            hostController.requestHostListPacket(socket);
          }else if(obj instanceof packets.HostRemovalRequest){
            hostController.requestHostRemoval(socket, obj.domain);
          }else if(obj instanceof packets.HostEditRequest){
            hostController.requestHostEdit(socket, obj.domain, obj.tags);
          }else if(obj instanceof packets.MassScanRequest){
            animeController.requestMassScan(socket);
          }else if(obj instanceof packets.MassScanAddPacket){
            animeController.requestMassAdd(socket, obj.massscanobjects);
          }
        }else{//Admin session expired
          sendNotification(socket, 'danger', 'Admin session expired, re-login :)!');
        }
      }
    }else{
      console.log('Received bad data: ' + data);
    }
  });

  socket.on('disconnect', function(){
    if(confirmedSockets.has(socket)){
      confirmedSockets.remove(socket);
    }
  });
}

function sendNotification(socket, type, message){
  var p = new packets.NotificationPacket();
  p.type = type;
  p.notification = message;
  socket.send(packets.stringPacket(p));
}

function loadData(){//This should only run on startup, or else will ruin the next data set
//Very serious process, checks all data types and data is valid
  status('Loading in data...');
  fs.readFile('./storage/configuration.json', 'utf8', function(err, contents) {
    if(err){
      throw err;
    }else if(typeof contents != 'undefined'){
      var config = isValidJSON(contents);
      if(config != false){
        status('Valid JSON config format...');
        if(exist(config.animelist) && exist(config.hosts) && exist(config.tags)){
          status('Valid config sections...');
          if(objectIsArray(config.animelist) && typeof config.hosts == 'object' && objectIsArray(config.tags)){
            status('Valid section object types...');
            //Loop through all anime's
            status("Importing animes...");
            for(var n = 0; n != config.animelist.length;n++){
              var slug = config.animelist[n];
              try {
                var contents2 = fs.readFileSync(('./storage/animes/' + slug + '.json')).toString();
                var animeObj = new Anime();
                animeObj.loadFromData(contents2);
                animeController.loadAnime(slug, animeObj);
              } catch (e) {
                console.log('Error attempting to load ' + slug);
                console.log(e);
                return;
              }
            }
            status("Complete");

            tagController.clearTags();
            //Double check all of tags
            status('Importing tags...');
            for(var n = 0; n != config.tags.length;n++){
              var currentTag = config.tags[n];
              if(typeof currentTag == 'string'){
                tagController.loadTag(currentTag);
              }else{
                //Problem isn't worth stopping execution, substitute with emtpy string
                tagController.loadTag('');
              }
            }
            status('Complete');

            hostController.clearHosts();
            //Loop through hosts
            status('Importing hosts...');
            for(var n = 0; n != config.hosts.length;n++){
              var currentHostObj = config.hosts[n];
              var validHostObj = hostController.isValidHostObj(currentHostObj);
              if(validHostObj != false){
                hostController.loadHost(validHostObj.domain, validHostObj);
              }else{
                exit("Invalid host");
              }
            }
            status('Complete');
          }else{
            exit('Bad configuration section object types');
          }
        }else{
          exit('Missing configuration sections');
        }
      }else{
        exit('Configuration not in JSON format');
      }
      status('Everything imported successfully');
    }
  });
}

/*Saving methods*/

function saveAnime(slug){
  console.log('Attempting to save ' + slug);
  var stringedAnime = animeController.getAnimeBySlug(slug).createSerializable();
  fs.writeFile(("./storage/animes/" + slug + ".json"), stringedAnime, function(err) {
    console.log('Server saved ' + slug);
  });
}

function saveData(){
  var clonedAnimes = animeController.getAnimes().clone();
  var animelist = clonedAnimes.keys();

  saveConfiguration();

  for(var n = 0; n != animelist.length;n++){
    var currentSlug = animelist[n];
    saveAnime(currentSlug);
  }
}

function saveConfiguration(){
  var animelist = animeController.getAnimes().keys();
  var hostlist = hostController.getHosts().values();
  var taglist = tagController.getTags();
  var fullConfigurationObject = {animelist: animelist, hosts: hostlist, tags: taglist};
  var stringedConfiguration = JSON.stringify(fullConfigurationObject);

  console.log('Writing to configuration');
  fs.writeFile("./storage/configuration.json", stringedConfiguration, function(err) {
    if(err) {
      console.log('An error occured attempting to save configuration');
      console.log(err);
      return;
    }
    console.log('Configuration has been saved');
  });
}

function status(str){
  console.log(str);
}

function exit(err){
  console.log("EXITING: " + err);
  process.exit();
}
function exist(obj){
  return typeof obj != 'undefined';
}

function objectIsArray(obj){
  return Object.prototype.toString.call(obj) === '[object Array]';
}

function isValidURL(url){
  url = url.toLowerCase();
  if(url.startsWith("http://") || url.startsWith("https://")){
    if(url.startsWith("http://")){
      url = url.substring(7, url.length);
    }else if(url.startsWith("https://")){
      url = url.substring(8, url.length);
    }
    if(url.startsWith("www.")){
      url = url.substring(4, url.length);
    }
    if(url.indexOf('/') > -1){
      url = url.substring(0, url.indexOf('/'));
    }
    if(url.indexOf('.') > -1){
      var parts = url.split('.');
      if(parts[0].length > 0 && parts[1].length > 1){
        return true;
      }
    }
  }
  return false;
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function isValidJSON(a){
  var b;
  try {
      b = JSON.parse(a);
  } catch (e) {
      return false;
  }
  return b;
}

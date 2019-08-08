var backEnd = require('../backend');
var HashMap = require('hashmap');

var packets = require('../packets');

var tagController = require('./tagcontroller');

var hosts = new HashMap();

function requestHostAddition(socket, domain, tags){
  if(isValidDomain(domain) == false){
    backEnd.sendNotification(socket, 'danger', 'Invalid domain');
    return;
  }

  var validHostObj = isValidHostObj({domain: domain, tags: tags});

  if(validHostObj == false){
    backEnd.sendNotification(socket, 'danger', 'Host not valid');
    return;
  }

  hosts.set(validHostObj.domain, validHostObj);

  backEnd.saveConfiguration();

  backEnd.sendNotification(socket, 'success', 'Host has been added to database');
}

function requestHostListPacket(socket){
  var hostListPacket = new packets.HostListPacket();
  hostListPacket.tags = tagController.getTags();
  hostListPacket.list = hosts.values();
  socket.send(packets.stringPacket(hostListPacket));
}

function requestHostRemoval(socket, domain){
  if(hosts.has(domain) == false){
    backEnd.sendNotification(socket, 'danger', 'Removal requested for non-existant host');
    return;
  }
  hosts.remove(domain);
  backEnd.saveConfiguration();
  backEnd.sendNotification(socket, 'success', 'Removed');
}

function requestHostEdit(socket, domain, tags){
  if(hosts.has(domain) == false){
    backEnd.sendNotification(socket, 'danger', 'Edit requested for non-existant host');
    return;
  }

  var validHostObj = isValidHostObj({domain: domain, tags: tags});

  if(validHostObj == false){
    backEnd.sendNotification(socket, 'danger', 'Host not valid');
    return;
  }

  hosts.set(validHostObj.domain, validHostObj);
  backEnd.saveConfiguration();

  backEnd.sendNotification(socket, 'success', 'Host has been edited');
}

function isValidHostObj(obj){
  if(typeof obj.domain == 'string' && objectIsArray(obj.tags)){
    var confirmedTags = [];
    for(var n = 0;n != obj.tags.length;n++){
      var currentTag = obj.tags[n];
      if(isNumeric(currentTag) == false){
        console.log("Non-numerical tag detected in a host");//Throw error
        return false;
      }else{
        if(currentTag < tagController.getTags().length && currentTag > -1){
          confirmedTags.push(currentTag);
        }
      }
    }
    return {domain: obj.domain, tags: confirmedTags};
  }else{
    return false;
  }
}

function loadHost(domain, obj){
  hosts.set(domain, obj);
}

function getHosts(){
  return hosts;
}

function clearHosts(){
  hosts.clear();
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function isValidDomain(domain) {
  var re = new RegExp(/^((?:(?:(?:\w[\.\-\+]?)*)\w)+)((?:(?:(?:\w[\.\-\+]?){0,62})\w)+)\.(\w{2,6})$/);
  return (domain.match(re) != null);
}

function objectIsArray(obj){
  return Object.prototype.toString.call(obj) === '[object Array]';
}

module.exports = {
  loadHost: loadHost,
  getHosts: getHosts,
  clearHosts: clearHosts,
  requestHostAddition: requestHostAddition,
  requestHostListPacket: requestHostListPacket,
  requestHostRemoval: requestHostRemoval,
  requestHostEdit: requestHostEdit,
  isValidHostObj: isValidHostObj
};

/*Packet handling*/

var socket = new io();

var packetListener = {};

socket.on('message', function (data) {
  var obj = validateString(data);
  if(obj != false){
    if(typeof packetListener[obj.target] == 'function'){
      packetListener[obj.target](obj);
    }
  }
});

//Load Packets
var packets = [];

packets.push(AdminVerificationPacket);
packets.push(NotificationPacket);
packets.push(ValidateSlugPacket);
packets.push(ValidSlugPacket);
packets.push(ScanRequestPacket);
packets.push(ScanProgressPacket);
packets.push(VariablePacket);
packets.push(AnimeAdditionRequest);
packets.push(AnimeListPacket);
packets.push(AnimeRemovalRequest);
packets.push(AnimeLoadRequestPacket);
packets.push(AnimeLoadPacket);
packets.push(AnimeEditRequest);
packets.push(HostAdditionRequest);
packets.push(HostListPacket);
packets.push(HostRemovalRequest);
packets.push(HostEditRequest);
packets.push(MassScanRequest);
packets.push(MassScanEntryPacket);
packets.push(MassScanAddPacket);

function AdminVerificationPacket(){
  this.target = 'AdminVerificationPacket';
  this.sesh = '';
}

function NotificationPacket(){
  this.target = 'NotificationPacket';
  this.type = '';
  this.notification = '';
}

function ValidateSlugPacket(){
  this.target = 'ValidateSlugPacket';
  this.slug = '';
}

function ValidSlugPacket(){
  this.target = 'ValidSlugPacket';
  this.response = '';
}

function ScanRequestPacket(){
  this.target = 'ScanRequestPacket';
  this.slug = '';
  this.start = 0;
  this.end = 0;
}

function ScanProgressPacket(){
  this.target = 'ScanProgressPacket';
  this.type = '';
  this.val = 0;
}

function VariablePacket(){
  this.target = 'VariablePacket';
  this.name = '';
  this.data = '';
}

function AnimeAdditionRequest(){
  this.target = 'AnimeAdditionRequest';
  this.slug = '';
  this.synopsis = '';
  this.en = '';
  this.en_jp = '';
  this.episode_count = 0;
  this.entries = [];
  this.smartentries = [];
}

function AnimeListPacket(){
  this.target = 'AnimeListPacket';
  this.list = [];
}

function AnimeRemovalRequest(){
  this.target = 'AnimeRemovalRequest';
  this.slug = '';
}

function AnimeLoadRequestPacket(){
  this.target = 'AnimeLoadRequestPacket';
  this.slug = '';
}

function AnimeLoadPacket(){
  this.target = 'AnimeLoadPacket';
  this.slug = '';
  this.synopsis = '';
  this.entries = [];
  this.smartentries = [];
  this.episode_count = 0;
  this.en = '';
  this.en_jp = '';
}

function AnimeEditRequest(){
  this.target = 'AnimeEditRequest';
  this.slug = '';
  this.en = '';
  this.en_jp = '';
  this.synopsis = '';
  this.episode_count = 0;
  this.entries = [];
  this.smartentries = [];
}

function HostAdditionRequest(){
  this.target = 'HostAdditionRequest';
  this.domain = '';
  this.tags = [];
}

function HostListPacket(){
  this.target = 'HostListPacket';
  this.tags = [];
  this.list = [];
}

function HostRemovalRequest(){
  this.target = 'HostRemovalRequest';
  this.domain = '';
}

function HostEditRequest(){
  this.target = 'HostEditRequest';
  this.domain = '';
  this.tags = [];
}

function MassScanRequest(){
  this.target = 'MassScanRequest';
}

function MassScanEntryPacket(){
  this.target = 'MassScanEntryPacket';
  this.slug = '';
  this.smartentry = {};
}

function MassScanAddPacket(){
  this.target = 'MassScanAddPacket';
  this.massscanobjects = [];
}

/*Packet methods*/

function validateString(packet){
  var obj = isValidJSON(packet);
  if(obj != false){
    if(typeof obj.target == 'string'){
      for(var x = 0; x != packets.length;x++){
        f = packets[x];
        var pObject = new f();
        if(obj.target == pObject.target && instanceOf(obj, pObject)){
          for(var sub in obj){
            pObject[sub] = obj[sub];
          }
          return pObject;
        }
      }
    }
  }else{
    console.log("Received invalid JSON");
  }
  return false;
}

function instanceOf(a, b){
  var result = true;
  for(var sub in a){
    if(typeof a[sub] != typeof b[sub]){
      result = false;
    }
  }
  return result;
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

function htmlEntities(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stringPacket(obj){
  return JSON.stringify(obj);
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') {
          c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
          return c.substring(name.length,c.length);
      }
  }
  return "";
}

function sendVerificationPacket(){
  var vPacket = new AdminVerificationPacket();
  vPacket.sesh = getCookie('SESSION');
  socket.send(stringPacket(vPacket));
}

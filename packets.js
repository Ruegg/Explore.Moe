var ArrayList = require('arraylist');
var packets = new ArrayList;

packets.add(AdminVerificationPacket);
packets.add(NotificationPacket);
packets.add(ValidateSlugPacket);
packets.add(ValidSlugPacket);
packets.add(ScanRequestPacket);
packets.add(ScanProgressPacket);
packets.add(VariablePacket);
packets.add(AnimeAdditionRequest);
packets.add(AnimeListPacket);
packets.add(AnimeRemovalRequest);
packets.add(AnimeLoadRequestPacket);
packets.add(AnimeLoadPacket);
packets.add(AnimeEditRequest);
packets.add(HostAdditionRequest);
packets.add(HostListPacket);
packets.add(HostRemovalRequest);
packets.add(HostEditRequest);
packets.add(MassScanRequest);
packets.add(MassScanEntryPacket);
packets.add(MassScanAddPacket);

function validateString(packet){
  var obj = isValidJSON(packet);
  if(obj != false){
    if(typeof obj.target == 'string'){
      for(var x = 0; x != packets.size();x++){
        f = packets.get(x);
        var pObject = new f();
        if(obj.target == pObject.target && instanceOf(obj, pObject)){
          for(var sub in obj){
            pObject[sub] = obj[sub];
          }
          return pObject;
        }
      }
    }
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

function stringPacket(obj){
  return JSON.stringify(obj);
}

function AdminVerificationPacket(){
  this.target = 'AdminVerificationPacket';
  this.sesh = '';
}

function NotificationPacket(){
  this.target = 'NotificationPacket';
  this.type = 'primary';
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

module.exports = {MassScanAddPacket:MassScanAddPacket, MassScanEntryPacket: MassScanEntryPacket, MassScanRequest: MassScanRequest, HostEditRequest: HostEditRequest, HostRemovalRequest:HostRemovalRequest, HostListPacket: HostListPacket, HostAdditionRequest:HostAdditionRequest, AnimeEditRequest: AnimeEditRequest, AnimeLoadPacket:AnimeLoadPacket, AnimeLoadRequestPacket:AnimeLoadRequestPacket, AnimeRemovalRequest: AnimeRemovalRequest, AnimeListPacket: AnimeListPacket, AnimeAdditionRequest: AnimeAdditionRequest, ScanProgressPacket: ScanProgressPacket, VariablePacket: VariablePacket, ScanRequestPacket: ScanRequestPacket, ValidSlugPacket: ValidSlugPacket, ValidateSlugPacket: ValidateSlugPacket, NotificationPacket: NotificationPacket, AdminVerificationPacket: AdminVerificationPacket, validateString: validateString, stringPacket: stringPacket, isValidJSON: isValidJSON};

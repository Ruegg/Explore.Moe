var backEnd = require('../backend');
var tags = [];

function getTags(tag){
  return tags;
}

function clearTags(){
  tags = [];
}

function loadTag(tag){
  tags.push(tag);
}

module.exports = {
  getTags: getTags,
  clearTags: clearTags,
  loadTag: loadTag
};

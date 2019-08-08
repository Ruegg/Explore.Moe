module.exports = Anime;

var utils = require('../utils');

var modelObject = new Anime();

function Anime(){
  this.titles = {en: '', en_jp: ''};
  this.synopsis = '';
  this.started_airing_date = '';
  this.finished_airing_date = '';
  this.cover_image = {tiny: '', small: '', medium: '', large: ''};
  this.poster_image = {tiny: '', small: '', medium: '', large: ''};
  this.genres = [];
  this.age_rating = '';
  this.episode_count = 0;
  this.community_rating = 0.0;
  this.entries = [];
  this.smartentries = [];
}

Anime.prototype.setInitData = function(titles, synopsis, started_airing_data, finished_airing_date, cover_image, poster_image, genres, age_rating, episode_count, community_rating, entries, smartentries){
  this.titles.en = (typeof titles.en == 'string') ? titles.en : '';
  this.titles.en_jp = (typeof titles.en_jp == 'string') ? titles.en_jp : '';
  this.synopsis = synopsis;
  this.started_airing_date = started_airing_data;
  this.finished_airing_date = finished_airing_date;
  this.cover_image = cover_image;
  this.poster_image = poster_image;
  this.genres = genres;
  this.age_rating = age_rating;
  this.episode_count = episode_count;
  this.community_rating = community_rating;
  this.entries = entries;
  this.smartentries = smartentries;
};

Anime.prototype.loadFromData = function(data){
  try {
    var obj = JSON.parse(data);
    this.titles = obj.titles;
    this.synopsis = obj.synopsis;
    this.started_airing_date = obj.started_airing_date;
    this.finished_airing_date = obj.finished_airing_date;
    this.cover_image = obj.cover_image;
    this.poster_image = obj.poster_image;
    this.genres = obj.genres;
    this.age_rating = obj.age_rating;
    this.episode_count = obj.episode_count;
    this.community_rating = obj.community_rating;
    this.entries = obj.entries;
    this.smartentries = obj.smartentries;
  } catch (e) {
    console.log("Error occured loading an anime from data");
  }
};

Anime.prototype.createSerializable = function(data){
  var obj = new Object();
  obj.titles = this.titles;
  obj.synopsis = this.synopsis;
  obj.started_airing_date = this.started_airing_date;
  obj.finished_airing_date = this.finished_airing_date;
  obj.cover_image = this.cover_image;
  obj.poster_image = this.poster_image;
  obj.genres = this.genres;
  obj.age_rating = this.age_rating;
  obj.episode_count = this.episode_count;
  obj.community_rating = this.community_rating;
  obj.entries = this.entries;
  obj.smartentries = this.smartentries;
  var stringed = JSON.stringify(obj);
  return stringed;
};

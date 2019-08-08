var request = require('request');

function requestAnime(slug, returnFunc){
  request('https://kitsu.io/api/edge/anime?filter[slug]=' + slug, returnFunc);
}

module.exports = {
  requestAnime: requestAnime
};
var rp = require('request-promise');
var request = require('request');

var utils = require('../utils');
var packets = require('../packets');


function requestAnime(slug, returnFunc){

  request('https://kitsu.io/api/edge/anime?filter[slug]=' + slug, function(error, response, body){
    if(error){
      returnFunc(error, response, body);
      return;
    }


    if(response.statusCode == 200){
      var obj = packets.isValidJSON(body);
      if(obj != false){

        var id = utils.get(obj, 'data.0.id');
        var attributes = utils.get(obj, 'data.0.attributes');

        if(attributes == null){
          returnFunc(error, response, body);
          return;
        }

        request('https://kitsu.io/api/edge/anime/' + id + '/relationships/categories', function(catErr, catResponse, catBody){
          if(catErr){
            returnFunc(error, response, body);
            return;
          }
          var categoryObj = packets.isValidJSON(catBody);
          var data = categoryObj.data;
          if(data.length == 0){//No genres
            returnFunc(error, response, body);
            return;
          }

          var promises = [];

          for(var i = 0; i != data.length;i++){
            var cat = data[i];
            var catID = cat.id;
            promises.push(rp('https://kitsu.io/api/edge/categories/' + catID));
          }

          Promise.all(promises).then(results => {
            var genres = [];
            for(var i = 0; i != results.length;i++){
              var descObj = packets.isValidJSON(results[i]);
              if(descObj != false){
                var genreName = utils.get(descObj, 'data.attributes.title');
                if(genreName != null){
                  genres.push(genreName);
                }
              }
            }
            obj["data"][0]["attributes"]["genres"] = genres;
            console.log("Genres added...");
            console.log(genres);
            returnFunc(error, response, JSON.stringify(obj));
          });

        });
      }
    }
  });
}

module.exports = {
  requestAnime: requestAnime
};

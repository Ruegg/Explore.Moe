var bearers = [];
bearers.push("fh01289d3hdozjia");

function handleRequest(req, res){
  console.log(req.url);
  res.set('Content-Type', 'application/json');
  if(verifyAuthenticity(req.headers)){
      switch(parseURL(req.url)){
        case "/api/hosts":
          
          break;
        case "/api/":

          break;
        default:
          break;
      }
  }else{
    res.send(JSON.stringify(new ErrorObject("Authentication", "Invalid bearer")));
  }
}

function parseURL(url){
  if(url.endsWith("/")){
    return url.substring(0, url.length-1);
  }
  return url;
}

function verifyAuthenticity(headers){
  if(headers.Bearer){
    if(bearers.indexOf(headers.Bearer) != -1){
      return true;
    }
  }
  return false;
}

function ErrorObject(error, message){
  this.error = error;
  this.message = message;
}
module.exports = {handleRequest: handleRequest, verifyAuthenticity: verifyAuthenticity};

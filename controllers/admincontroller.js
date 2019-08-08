var HashMap = require('hashmap');

var sessions = new HashMap();//Session key / Time expires

var config = require('../config');

var adminUsername = config.adminUsername;
var adminPassword = config.adminPassword;

var fs = require('fs');

function readAuthScript(filename){
  var data = '';
  try {
    data = fs.readFileSync(('./auth-scripts/' + filename + '.js')).toString();
  } catch (e) {
    data = 'Error with requested file';
  }
  return data;
}

function verifySession(req){
  if(req.cookies.SESSION){
    var sesh = req.cookies.SESSION;
    if(sessions.has(sesh)){
      var currentDate = Date.now();
      var sessionExpire = sessions.get(sesh);
      if(currentDate < sessionExpire){
        sessions.set(sesh, currentDate+1800000);//New expiration in 30 minutes from activity
        return true;
      }else{
        //Session expire
        sessions.remove(sesh);
      }
    }
  }
  return false;
}

function validateSession(sesh){
  if(sessions.has(sesh)){
    var currentDate = Date.now();
    var sessionExpire = sessions.get(sesh);
    if(currentDate < sessionExpire){
      sessions.set(sesh, currentDate+1800000);//New expiration in 30 minutes from activity
      return true;
    }else{
      //Session expire
      sessions.remove(sesh);
    }
  }
  return false;
}

function requestNewSession(req){
  if(typeof req.body.username != 'undefined' && typeof req.body.password != 'undefined'){
    if(req.body.username == adminUsername && req.body.password == adminPassword){
      var sesh = generateNewSesh();
      var currentDate = Date.now();
      sessions.set(sesh, currentDate+1800000);
      return sesh;
    }
  }
  return false;
}

function loginRequest(req, res){
  if(req.method == 'GET'){
      if(verifySession(req)){
        res.redirect('/admin/home');
      }else{
        res.render('admin/login');
      }
    }else if(req.method == 'POST'){
      var sesh = requestNewSession(req);
      if(sesh != false){
        res.cookie('SESSION', sesh);
        res.redirect('/admin/home');
      }else{
        res.render('admin/login', {error: 'Bad credentials'});
      }
    }else{
      res.render('admin/login');
    }
}

function logoutRequest(req, res){
  if(verifySession(req)){
    sessions.remove(req.cookies.SESSION);
  }
  res.redirect('/admin/login');
}

function generateNewSesh(){
  var sesh = Math.random().toString(36).slice(2);
  if(sessions.has(sesh)){
    return generateNewSesh();
  }else{
    return sesh;
  }
}

module.exports = {readAuthScript: readAuthScript, validateSession: validateSession, requestNewSession: requestNewSession, verifySession: verifySession, loginRequest: loginRequest, logoutRequest: logoutRequest, validateSession: validateSession};

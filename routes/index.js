var express = require('express');
var router = express.Router();

var adminController = require('../controllers/admincontroller');
var animeController = require('../controllers/animecontroller');
var apiController = require('../controllers/apicontroller');

var backEnd = require('../backend');

router.all('/', function(req, res, next) {
  res.render('index', {airing: animeController.createAnimePostersCodeFromArray(animeController.orderByRating(animeController.getAiringTileObjects()))});
});

router.all('/sort', function(req, res) {
  res.render('sort', {tiles: animeController.createAnimeTilesCodeFromArray(animeController.orderByRating(animeController.getTileObjects()))});
});

router.all('/admin/*', function(req,res, next){
  if(adminController.verifySession(req)){
    next();
  }else{
    if(req.path == "/admin/login" || req.path == "/admin/login/"){
        adminController.loginRequest(req,res);
    }else {
      res.redirect('/admin/login');
    }
  }
});

router.all('/admin', function(req, res) {
  res.redirect('/admin/home');
});

router.all('/admin/login', function(req, res) {
  res.redirect('/admin/home');
});

router.all('/anime/:slug', function(req, res) {
  if(animeController.getAnimes().has(req.params.slug)){
    var animeObj = animeController.getAnimes().get(req.params.slug);
    if(animeObj.cover_image.large == ""){
      animeObj.cover_image.large = "/images/defaultcover.jpg";
    }
    res.render('anime', {anime: animeObj, entriesJSON: animeController.jsonCodeForEntries(req.params.slug), genreCode: animeController.getGenreCode(req.params.slug)});
  }else{
    res.render('error', {error: 'Anime not found! Tu-turu!'});
  }
});

router.all('/admin/home', function(req, res) {
  res.render('admin/home');
});

router.all('/admin/anime', function(req, res) {
  res.render('admin/anime/manage');
});

router.all('/admin/anime/add', function(req, res) {
  res.render('admin/anime/form');
});

router.all('/admin/anime/edit/:slug', function(req, res) {
  if(animeController.getAnimes().has(req.params.slug)){
    res.render('admin/anime/form', {edit: true, slug: req.params.slug});
  }else{
    res.render('admin/error', {error: 'Anime does not exist for editing'});
  }
});

router.all('/admin/hosts', function(req, res) {
  res.render('admin/hosts/manage');
});

router.all('/admin/hosts/add', function(req, res) {
  res.render('admin/hosts/form');
});

router.all('/admin/anime/scan', function(req, res) {
  res.render('admin/anime/scan');
});


router.all('/admin/hosts/edit/:domain', function(req, res) {
  res.render('admin/hosts/form', {edit: true, domain: req.params.domain});
});

router.all('/admin/schedule', function(req,res){
  res.render('admin/schedule');
});


router.all('/admin/logout', function(req, res) {
  adminController.logoutRequest(req,res);
});

/*Admin scripts*/
router.all('/admin/javascripts/:filename', function(req, res) {
  res.set('Content-Type', 'application/javascript');
  res.send(adminController.readAuthScript(req.params.filename));
});

router.all('/api', function(req, res, next){
  apiController.handleRequest(req, res);
});
router.all('/api/*', function(req, res, next){
  apiController.handleRequest(req, res);
});

module.exports = router;

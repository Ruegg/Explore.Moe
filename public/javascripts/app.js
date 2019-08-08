//SmootherLoading
var newerDocument;

var vDom;

var scriptCache = new HashMap();

var dynamicLoadingEnabled = false;

$(document).ready(function() {
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) == false && dynamicLoadingEnabled) {
    if(history.pushState){
      window.onclick = function (e) {
          if (e.target.localName == 'a') {
              performNewRequest(e.target.href, "GET", "");
              return false;
          }else if(e.target.parentElement.localName == 'a'){
             performNewRequest(e.target.parentElement.href, "GET", "");
              return false;
          }
      }
      $("form").submit(function(event) {
        event.preventDefault();
        performNewRequest(event.target.action, event.target.method, $(this).serialize());
      });

      window.addEventListener('popstate', function(e) {
        if(typeof e.state.url != 'undefined'){
          performNewRequest(e.state.url, "GET", "");
        }
      });
    }

   $(".btn").click(function(event) {
      $(this).blur();
    });
  }
});

function performNewRequest(url, method, params){
  var req = new XMLHttpRequest();
  req.open(method, url, true);
  req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  req.onprogress = function(e){
    if(e.lengthComputable){
      var percentComplete = (e.loaded / e.total);
      var total = ($(window).width()*percentComplete);
      $("#turbo-prog").width(total);
    }
  }
  $("#turbo-prog").width($(window).width()*0.25);
  req.onreadystatechange = function() {
    if(req.readyState == 4) {
      setTimeout(function(){
        var urlUsing = "";
        if(navigator.appName == 'Microsoft Internet Explorer' || navigator.appName == 'Netscape'){
          urlUsing = url;
        }else{
          urlUsing = req.responseURL;
        }
        window.history.pushState( { url: urlUsing} , urlUsing.substring(1, urlUsing.length), urlUsing);
        $("#turbo-prog").width($(window).width()*0.5);
        console.time('SmootherLoading');
        newerDocument = document.createElement("html");
        newerDocument.innerHTML = removeHTMLTag(req.responseText);
        vDom = newerDocument.cloneNode(true);
        removeExtras(document.documentElement, vDom);
        vDom = newerDocument.cloneNode(true);
        organizeElements(document.documentElement, vDom);
        vDom = newerDocument.cloneNode(true);
        $("#turbo-prog").width($(window).width()*0.75);
        addInformation(document.documentElement, vDom);
        evaluateScripts();
        console.timeEnd('SmootherLoading');
        $("#turbo-prog").width($(window).width());
      }, 310);
    }
  };
  req.send(params);
}

function removeHTMLTag(str){
  if(str.startsWith('<!DOCTYPE')){
    console.log('Starts');
    str = str.substring(str.indexOf('>')+1, str.length);
  }
  str = str.substring(6, str.length);
  str = str.substring(0, str.length-7);
  return str;
}

function getIndex(arr, e){
  return Array.prototype.indexOf.call(arr, e);
}

function getOCTag(e){
  return e.outerHTML.slice(0, e.outerHTML.indexOf(e.innerHTML)) + e.outerHTML.substring((e.outerHTML.indexOf(e.innerHTML)+e.innerHTML.length), e.length);
}

function removeExtras(current, later){
  var currentRemovingIndexes = [];
  for(var n = 0; n != current.children.length;n++){
    var child = current.children[n];
    var childOCTag = getOCTag(child);
    var firstRespondent = getFirstElementByOCTag(childOCTag, later.children);
    if(firstRespondent != false){
      if(firstRespondent.children.length > 0){
        removeExtras(child, firstRespondent);
      }
      later.removeChild(firstRespondent);
    }else{
      currentRemovingIndexes.push(n);
    }
  }

  var offset = 0;
  for(var n = 0; n != currentRemovingIndexes.length;n++){
    var removeIndex = ((currentRemovingIndexes[n])-offset);
    current.removeChild(current.children[removeIndex]);
    offset = offset+1;
  }
}

function organizeElements(current, later){
  var similarCorrelation = new HashMap();
  var laterArray = later.children;
  var organizedArray = [];
  for(var n = 0; n != current.children.length;n++){
    var child = current.children[n];
    var mostSimilar = getMostSimilar(later.children, child);
    if(child.children.length > 0){
      if(mostSimilar != false){
        organizeElements(child, mostSimilar);
      }
    }
    similarCorrelation.put(mostSimilar, child);
    if(organizedArray.length == 0){
      organizedArray.push(mostSimilar);
    }else{
      organizedArray.splice(findBestPos(Array.from(laterArray), organizedArray, mostSimilar), 0, mostSimilar);
    }
  }
  repositionSimilarChildren(similarCorrelation, current, organizedArray);
}

function repositionSimilarChildren(correlation, current, organized){
  var lastChild;
  for(var n = 0; n != organized.length;n++){
    var similar = organized[n];
    var respondent = correlation.get(similar);
    if(n != 0){
      insertAfter(respondent, lastChild);
    }
    lastChild = respondent;
  }
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function getPositionFromSimilars(current, later, element){
  var similarConverted = [];
  for(var n = 0; n !=current.length;n++){
    var child = current[n];
    var similar = getMostSimilar(later, child);
    similarConverted.push(similar);
  }
  return findBestPos(later, similarConverted, getMostSimilar(later, element));
}

function findBestPos(arr, arr2, element){
  var a = arr;
  var b = arr2;
  var c = a.indexOf(element);
  var d = [];
  for(var n = 0; n != b.length;n++){
    d.push(a.indexOf(b[n]));
  }
  d.push(c);
  d = d.sort();
  var placing = d.indexOf(c);
  return placing;
}

function getMostSimilarAt(arr, e, index){/*This method could definitely be improved upon later on*/
  var copy = Array.from(arr).slice(0);
  for(var n = 0; n != (index+1);n++){
    if(n == 0){
      return getMostSimilar(copy, e);
    }else{
      var nowSimilar = getMostSimilar(copy, e);
      if(nowSimilar == false){
          return false;
      }
      copy.splice(copy.indexOf(getMostSimilar(copy, e)), 1);
    }
  }
}

function getMostSimilar(arr, e){
  if(e == false){
    return false;
  }
  if(typeof e == 'undefined' || typeof arr == 'undefined'){
    return false;
  }
  var highestPoints = -1;
  var mostSimilarElement;
  for(var n = 0;n != arr.length;n++){
    var element = arr[n];
    var points = countSimilar(0,e,element);
    if(points > highestPoints){
      mostSimilarElement = element;
      highestPoints = points;
    }
  }
  if(typeof mostSimilarElement == 'undefined'){
    return false;
  }
  if(getOCTag(mostSimilarElement) != getOCTag(e)){
    return false;
  }else{
    return mostSimilarElement;
  }
}

function countSimilar(count, a, b){
  if(a.children.length > 0){
      var clonedChildren = Array.from(b.children).slice(0);//Duplicate
      for(var n = 0; n != a.children.length;n++){
        var childOCTag = getOCTag(a.children[n]);
        var relative = getFirstElementByOCTag(childOCTag, clonedChildren);
        if(relative != false){
          count++;
          clonedChildren.splice(clonedChildren.indexOf(relative), 1);
        }
      }
  }else{
    return (count+singleSimilar(a,b));
  }
  return count;
}

function singleSimilar(a,b){
  if(getOCTag(a) == getOCTag(b)){
    return 1;
  }else{
    return 0;
  }
}

function addInformation(current, later){
  var amounts = new HashMap();
  for(var n = 0; n != later.children.length;n++){
    var child = later.children[n];
    if(amounts.containsKey(child)){
      var numElement = amounts.get(child);
      amounts.put(child, (numElement+1));
    }else{
      amounts.put(child, 1);
    }
  }
  var entrySet = amounts.getEntrySet();
  for (var x = 0; x != entrySet.length; x++) {
      var entry = entrySet[x];
      var child = entry.getKey();
      var amount = entry.getValue();
      for(var n = 0;n != amount;n++){
        var oCTag = getOCTag(child);
        var respondent = getMostSimilarAt(current.children, child, n);
        if(respondent == false){
          var index = getPositionFromSimilars(Array.from(current.children), Array.from(child.parentNode.children), child);
          current.insertBefore(child, current.children[index]);
        }else{
          if(child.children.length > 0){
            addInformation(respondent, child);
          }else{
            respondent.innerHTML = child.innerHTML;
          }
        }
      }
  }
}

function getFirstElementByOCTag(oCT, children){
  for(var n = 0; n != children.length;n++){
    var child = children[n];
    var childOCTag = getOCTag(child);
    if(oCT == childOCTag){
      return child;
    }
  }
  return false;
}

function getElementByOCTagAt(oCT, children, index){
  var amount = 0;
  for(var n = 0; n != children.length;n++){
    var child = children[n];
    var childOCTag = getOCTag(child);
    if(oCT == childOCTag){
      if(index == amount){
        return child;
      }else{
        amount = amount+1;
      }
    }
  }
  return false;
}

var pageScripts = {};
var scriptsWaitingFor = 0;

function evaluateScripts(){
  pageScripts = {};
  var scripts = document.getElementsByTagName("script");
  scriptsWaitingFor = scripts.length;
  console.log("EVALUATING.....");
  console.log("Looping through " + scripts.length + " scripts");
  for(var i = 0;i != scripts.length;i++){
      console.log("Loop on script #" + i);
      var currentScript = scripts[i];
      if(currentScript.src != ""){
        (function(i) {
          console.log("#" + i + " is external");
          getScriptFromURL(currentScript.src, function(code){
            scriptObtained(i, code);
          });
        })(i);
      }else{
        console.log("#" + i + " is inline");
        scriptObtained(i, currentScript.innerHTML);
      }
  }
}

function scriptObtained(id, code){
  console.log("#" + id + " obtained");
  pageScripts[id] = code;
  var scriptsObtained = Object.keys(pageScripts).length;
  if(scriptsObtained == scriptsWaitingFor){
    console.log("Executing all scripts, scriptsObtained: " + scriptsObtained);
    var allCode = code;
    for(var n = 0; n != scriptsObtained;n++){
      var code = pageScripts[n];
      if(code.startsWith("//SmootherLoading") == false){
        allCode = allCode + "\n" + code;
      }
    }
    evalOut(allCode);
  }
}

function evalOut(code){
  "use strict";
  eval(code);
}

function getScriptFromURL(url, returnFunction){
  if(scriptCache.containsKey(url)){
    console.log('Using cached version for ' + url);
    returnFunction(scriptCache.get(url));
  }else{
    console.log('Fetching new ' + url);
  }
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      scriptCache.put(url, xmlhttp.responseText);
      console.log("Got script from url " + url + " and returning");
      returnFunction(xmlhttp.responseText);
    }
  }
  xmlhttp.open("GET", url);
  xmlhttp.send();
}

function elementArrayToStringArray(arr){
  var n = [];
  for(var i = 0; i != arr.length;i++){
    n.push(arr[i].outerHTML + '<NEWELEMENT>');
  }
  return n;
}

function navigate(slug){
  if(dynamicLoadingEnabled){
    performNewRequest("/anime/" + slug, "GET", "");
    return;
  }
  window.location = "/anime/" + slug;
}

function HashMap() {
    var entries = new Array();

    this.getEntrySet = function() {
        return entries;
    }

    this.containsKey = function(key) {
        var exist = false;
        for (i = 0; i < entries.length; i++) {
            var currentEntry = entries[i];
            if (currentEntry.getKey() == key) {
                exist = true;
                break;
            }
        }
        return exist;
    }

    this.get = function(key) {
        var returning = -1;
        for (i = 0; i < entries.length; i++) {
            var currentEntry = entries[i];
            if (currentEntry.getKey() == key) {
                returning = currentEntry.getValue();
                break;
            }
        }
        return returning;
    }

    this.put = function(key, value) {
        for (i = 0; i < entries.length; i++) {
            var currentEntry = entries[i];
            if (currentEntry.getKey() == key) {
                entries.splice(i, 1);
                break;
            }
        }
        var newEntry = new Entry(key, value);
        entries.push(newEntry);
    }
}

function Entry(key, value) {
    this.key = key;
    this.value = value;
    this.getKey = function() {
        return this.key;
    }

    this.getValue = function() {
        return this.value;
    }
}

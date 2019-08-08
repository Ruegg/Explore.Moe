(function($) {
  $.htmlDoc = function(html) {
    console.log(html);
    html = html.replace("<html", '<div id="htmlDoc-html"');
    html = html.replace("<head", '<div id="htmlDoc-head"');
    html = html.replace("<body", '<div id="htmlDoc-body"');
    html = html.replace("/html>", "/div>");
    html = html.replace("/head>", "/div>");
    html = html.replace("/body>", "/div>");
    return $.parseHTML(html);
  };

  $.fn.tag = function(){
      console.log(this[0]);
      return this[0].outerHTML.replace(this.html(),"");
  };

}(jQuery));

function replaceTagById(obj, id, tag){
    return obj.find(id).replaceWith("<" + tag + ">" + obj.find(id).html() + "</" + tag + ">");
}

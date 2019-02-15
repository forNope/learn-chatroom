
function route(req,res,path,handler){
  if(typeof handler[path] === "function"){
      handler[path](req,res);
  }else{
      res.writeHead(404,{"Content-Type":"text/plain"});
      res.write("404 NOT FOUND");
      res.end();
  }
}

exports.route = route;

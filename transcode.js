/** node.js implementation of a realtime audio transcoding solution for 
HD home run. It follows the HD home run URL scheme - you would access
http://127.0.0.1:8000/auto/v5.1?transcode=mobile for example to view
channel 5.1.

This script has a hardcoded IP of the HD Home run as 192.168.103.210, replace
to whatever yours is
*/

var HDHomeRunIP = "192.168.103.210";
var HDHomeRunPort = 5004;
var childKillTimeoutMs = 1000;

// define startsWith for string
if (typeof String.prototype.startsWith != 'function') {
  // see below for better implementation!
  String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
  };
}
// Called when the response object fires the 'close' handler, kills ffmpeg 
function responseCloseHandler(command) {
  if (command.exited != true) {
    console.log('HTTP connection disrupted, killing ffmpeg: ' + command.pid);
    // Send a 'q' which signals ffmpeg to quit. 
    // Then wait half a second, send a nice signal, wait another half second
    // and send SIGKILL
    command.stdin.write('q');
    // install timeout and wait
    setTimeout(function() {
      if (command.exited != true) {
        console.log('ffmpeg didn\'t quit on q, sending signals');
        // still connected, do safe sig kills
        command.kill();
        try { 
          command.kill('SIGQUIT');
        } catch (err) {}
        try {
          command.kill('SIGINT');
        } catch (err) {} 
        // wait some more!
        setTimeout(function() {
          if (command.exited != true) {
            console.log('ffmpe didn\'t quit on signals, sending SIGKILL');
            // at this point, just give up and whack it
            try {
              command.kill('SIGKILL');
            } catch (err) {}
          }
        }, childKillTimeoutMs);
      }    
    }, childKillTimeoutMs);
  }
}

// Performs a proxy. Copies data from proxy_request into response
function doProxy(request,response,http,options) {
  var proxy_request = http.request(options, function (proxy_response) {
    proxy_response.on('data', function(chunk) {
      response.write(chunk, 'binary');
    });
    proxy_response.on('end', function() {
      response.end();
    });
    response.writeHead(proxy_response.statusCode, proxy_response.headers);
  });
  request.on('data', function(chunk) {
    proxy_request.write(chunk, 'binary');
  });
  // error handler
  proxy_request.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    response.writeHeader(500);
    response.end();
  });
  
  proxy_request.end();
}

var child_process = require('child_process');

// Performs the transcoding after the URL is validated
function doTranscode(request,response) {
  //res.setHeader("Accept-Ranges", "bytes");
  response.setHeader("Content-Type", "video/mpeg");        
  response.setHeader("Connection","close");
  response.setHeader("Cache-Control","no-cache");
  response.setHeader("Pragma","no-cache");
  
  // always write the header
  response.writeHeader(200);
  
  // if get, spawn command stream it
  if (request.method == 'GET') {
    console.log('Spawning new process ' + request.url + ":" + request.method);
  
    var command = child_process.spawn('ffmpeg', ['-i','http://' + HDHomeRunIP + ':' + HDHomeRunPort + request.url,'-vcodec','copy','-ac','2','-acodec','libfdk_aac','-b:a','128k','-f','mpegts','-']);
    command.exited = false;
    // handler for when ffmpeg dies unexpectedly
    command.on('exit',function(code,signal) {
      console.log('ffmpeg has exited: ' + command.pid + ", code " + code);
      // set flag saying we've quit
      command.exited = true;
      response.end();
    });
    // handler for when client closes the URL connection - stop ffmpeg
    response.on('end',function() { 
     responseCloseHandler(command);
    });
    // handler for when client closes the URL connection - stop ffmpeg
    response.on('close',function() { 
      responseCloseHandler(command); 
    });
  
    // now stream
    console.log('piping ffmpeg output to client, pid ' + command.pid);
    command.stdout.pipe(response);
  } 
  else {
    // not GET, so close response
    response.end();
  }
}

// Load the http module to create an http server.
var http = require('http');

// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (request, response) {
  // first send a HEAD request to our HD Home Run with the same url to see if the address is valid.
  // This prevents an ffmpeg instance to spawn when clients request invalid things - like robots.txt/etc
  var options = {method: 'HEAD', hostname: HDHomeRunIP, port: HDHomeRunPort, path: request.url};
  var req = http.request(options, function(res) {
    // if they do a get, and it returns good status
    if (request.method == "GET" &&
        res.statusCode == 200 &&
        res.headers["content-type"] != null &&
        res.headers["content-type"].startsWith("video")) {
      // transcode is possible, start it now!
      doTranscode(request,response);
    } 
    else {
      // no video or error, cannot transcode, just forward the response from the HD Home run to the client
      if (request.method == "HEAD") {
        response.writeHead(res.statusCode,res.headers);
        response.end();
      }
      else {
        // do a 301 redirect and have the device response directly
        //response.writeHead(301,{Location: 'http://' + HDHomeRunIP + ':5004' + request.url});
        //response.end();
        
        // just proxy it, that way browser doesn't redirect to HDHomeRun IP but keeps the node.js server IP
        options = {method: request.method, hostname: HDHomeRunIP, port: HDHomeRunPort, path: request.url};
        doProxy(request,response,http,options);
      }
    }
  });
  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    response.writeHeader(500);
    response.end();
  });
  // finish the client request, rest of processing done in the async callbacks
  req.end();
});

// Listen on port HDHomeRunPort, IP defaults to 127.0.0.1
server.listen(HDHomeRunPort);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:" + HDHomeRunPort);


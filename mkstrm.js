/** node.js Script that creates a directory structure of XBMC STRM files 
 based on different transcoding options and the channels that you have programmed
*/

var HDHomeRunIP = "192.168.103.210";
var HDHomeRunPort = 5004;
// where you want the stream to point, change to point to node.js transcode server if applicable  
var StreamIP = "192.168.103.210"; 
var StreamPort = 5004;

var request = require("request");
var fs = require('fs');
var path = require('path');

var deviceURL = "http://" + HDHomeRunIP + "/lineup.json?show=unprotected";

request({url: deviceURL, json:true}, function(error,response,body) {
  if (!error && response.statusCode == 200) {
    var dirs = [ "Native", "Heavy" , "Mobile" ] ;
    dirs.forEach(function (dir) {
      fs.mkdir(dir, function (error) {
        // error.errno
        if (!error || error.code == 'EEXIST') {
          body.forEach(function (item) {
            var fName = path.join(dir,item.GuideNumber + " " + item.GuideName);
            fName = fName.replace(/\./g,'_') + ".strm";
            var url = "http://" + StreamIP + ":" + StreamPort + "/auto/v" + item.GuideNumber;
            if (dir != "Native") {
              url = url + "?transcode=" + dir.toLowerCase();
            }
            fs.writeFile(fName,url,function (err) {
              
            });
          });
        } 
      });
    });    
  }
  else {
    throw error;  
  }
});
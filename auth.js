
var parseArgs = require('minimist')(process.argv.slice(2));

//console.dir(parseArgs);

function authReject(response) {
  response.statusCode = 401;
  response.setHeader('WWW-Authenticate','Basic realm="HDHomeRun Transcoder"');
  response.end('<html><body>Invalid password</body></html>');
  return false;
}

function validateAuth(request,response) {
  if (parseArgs.user && parseArgs.pass) {
    var auth = request.headers['authorization'];  // auth is in base64(username:password)  so we need to decode the base64
  
    if (auth) {
      try {
        //var tmp = auth.split(' ');   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part
        var plain_auth = new Buffer(auth.split(' ')[1], 'base64').toString(); // create a buffer and tell it the data coming in is base64
        //console.log("Decoded Authorization ", plain_auth);
        // At this point plain_auth = "username:password"
        var creds = plain_auth.split(':');      // split on a ':'
        var username = creds[0];
        var password = creds[1];
        console.log(username + ":" + password);
        if (username == parseArgs.user && password == parseArgs.pass)
          return true; // successfully validated
      } 
      catch (err) {
        // fall down to authReject
      }
    }
    return authReject(response);
  }
  // if we get here, we're good
  return true;
}

module.exports = {
  validate: function (request,response) {
    return validateAuth(request,response);
  }
};

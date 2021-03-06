hdhomerun-transcode
===================

HD Home Run transcoding node.js server. Transcodes the audio from an HDHomeRun stream into a 
mobile device friendly 2 channel AAC stream.

Setup
===================

The top part of transode.js contains a definition of the IP address of your HD Home Run device. 
Mine is 192.168.103.210, so you need to change that to the IP of your device. The other thing you need is a working copy
of ffmpeg in your path that has been compiled with libfdk_aac support. I followed this guide -

https://trac.ffmpeg.org/wiki/UbuntuCompilationGuide.

My Ubuntu server runs on 192.168.103.200, so I access it the same way as I would the HD Home Run. On the Home Run, 
I'd browse to http://192.168.103.210:5004/auto/v5.1 for channel 5.1. With my node transcoder running, I browse to
http://192.168.103.200:5004/auto/v5.1. Same URL scheme.

If you're running in the console, you'll see some log output when clients connect and disconnect. If you plan on
running in the background (starting process, then logging off), you should pipe the output to /dev/null
(node transcode.js > /dev/null &) since node will crash and burn if you disconnect the tty.

HTTP Authentication
===================
I've added support for basic HTTP authentication. You specify it with the --user and --pass arguments.
Example: node transcode.js --user validUser --password validPassword.

Login attempts will be printed to the console for logging purposes. Passing the password argument
on the command line isn't very secure and an attacker who has shell access could discover it via the
ps command

mkstrm.js
===================

This is a utility script that autogenerates a set of XBMC STRM files from your programmed
channels on your Home Run. Generates files in Native, Heavy and Mobile formats. Has support
for configuring the STRM files to point to your transcoding server instead of the device IP.
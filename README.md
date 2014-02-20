hdhomerun-transcode
===================

HD Home Run transcoding node.js server

That being said, the top part transode.js contains a definition of the IP address of your HD Home Run device. 
Mine is 192.168.103.210, so you need to change that to the IP of your device. The other thing you need is a working copy
of ffmpeg in your path that has been compiled with libfdk_aac support. I followed this guide -

https://trac.ffmpeg.org/wiki/UbuntuCompilationGuide.

My Ubuntu server runs on 192.168.103.200, so I access it the same way as I would the HD Home Run. On the Home Run, 
I'd browse to http://192.168.103.210:5004/auto/v5.1 for channel 5.1. With my node transcoder running, I browse to
http://192.168.103.200:5004/auto/v5.1. Same URL scheme.

If you're running in the console, you'll see some log output when clients connect and disconnect. If you plan on
running in the background (starting process, then logging off), you should pipe the output to /dev/null
(node stream.js > /dev/null &) since node will crash and burn if you disconnect the tty.

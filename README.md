s3-client-browser
=================
HTML5 browser for S3 buckets optimized for viewing photos and videos.
It is based on the [AWS SDK for JavaScript in the browser](http://aws.amazon.com/sdk-for-browser) for client-only 
access to S3 buckets.

How to install
--------------
Make sure you have [grunt command line interface](https://github.com/gruntjs/grunt-cli) installed as a global package:

```
npm install -g grunt-cli
```
Make sure you have `grunt` installed by testing:
```
grunt -V
```
Clone a copy of the main git repo by running:

```bash
git clone git://github.com/piglione73/s3-client-browser.git
```

Enter the s3-client-browser directory and run the build script:
```bash
grunt deploy
```
The built version of s3-client-browser will be put in the `build/deploy/` subdirectory. Copy its content into the root of your 
web site

How to configure the S3 bucket
------------------------------
Photos and videos contained in your S3 bucket must be available to the web application. In order to be accessible, you will
need to enable CORS and to set your bucket files as publicly accessible.


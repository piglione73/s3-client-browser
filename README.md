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

```
git clone git://github.com/piglione73/s3-client-browser.git
```

Enter the s3-client-browser directory and run:
```
npm install
grunt deploy
```
The built version of s3-client-browser will be put in the `build/deploy/` subdirectory. Copy its content into the root of your 
web site

How to configure the S3 bucket
------------------------------
Photos and videos contained in your S3 bucket must be available to the web application. In order to be accessible, you will
need to:

	1. change your bucket policy so as to allow public read-only access
	2. edit your CORS configuration to allow the bucket to be accessed from within the browser
	
### Bucket policy
```
{
	"Version": "2008-10-17",
	"Id": "PolicyReadOnly",
	"Statement": [
		{
			"Sid": "Stmt001",
			"Effect": "Allow",
			"Principal": {
				"AWS": "*"
			},
			"Action": "s3:Get*",
			"Resource": "arn:aws:s3:::<your bucket name>/*"
		}
	]
}
```

### CORS configuration
```
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>HEAD</AllowedMethod>
        <MaxAgeSeconds>600</MaxAgeSeconds>
        <AllowedHeader>*</AllowedHeader>
    </CORSRule>
</CORSConfiguration>
```

How to create thumbnails
------------------------
A java tool for automatically creating photo thumbnails is provided in the java subdirectory.

Make sure you have the [AWS SDK fof Java](http://aws.amazon.com/sdk-for-java).

In the `java/ScaleAwsImages` subdirectory, run:
```
ant
```

Go to the `java/ScaleAwsImages/dist` subdirectory.

Create a file named `ScaleAwsImages.properties` with the following content:
```
bucketName=<your bucket name>
```

Configure your AWS credentials in the `.aws/credentials` file, as explained [here](http://aws.amazon.com/developers/getting-started/java).

Run the java tool by typing:
```
java -jar ScaleAwsImages.jar
```

The tool will try to create all necessary thumbnails for speeding up the web application.

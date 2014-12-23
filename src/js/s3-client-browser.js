/// <reference path="jpvs-all.js" />
/// <reference path="jpvs-doc.js" />
/// <reference path="utils.js" />
/// <reference path="photo-gallery.js" />
/// <reference path="../../bower_components/async/build/async.js" />

var SCB = (function () {

    var connectionParameters = {};
    var w;
    var currentDirectory;

    function init(widgets) {
        w = widgets;

        //Load configuration
        connectionParameters = Utils.loadParamsFromStorage();

        //Initial tile size
        w.filebrowser.tileWidth(w.filebrowser.width() / 3);
        w.filebrowser.tileHeight(null);

        //Click on a tile
        w.filebrowser.tileClick(function (tileObject) {
            if (tileObject.onClick)
                tileObject.onClick();
        });

        //List root directory
        goToFolder(connectionParameters.root).then(hideLoadingScreen);
    }

    /*
    List directory and show its contents in the tile browser
    */
    function goToFolder(directory) {
        //This function is asynchronous
        return Async.call(run, arguments);

        function run(directory) {
            //List directory
            var listing = listBucket(directory);

            //Keep the screen dimmed until the listing is available
            Utils.progress(listing);

            //Show results in tile browser
            var ret = this;
            showFolderContent(listing).then(function () {
                //At the end, signal completion by returning true
                ret.setValue(true);
            });
        }
    }

    function hideLoadingScreen() {
        //This function is asynchronous
        return Async.call(run, arguments);

        function run() {
            var ret = this;
            $(".Loading").fadeOut(function () {
                //Signal completion
                ret.setValue(true);
            });
        }
    }

    function configure() {
        var pop = jpvs.Popup.create().title("Connection parameters");
        jpvs.writeln(pop, "Bucket name:");
        var txtBucket = jpvs.TextBox.create(pop).width("15em").change(onChange).text(connectionParameters.bucketName || "");
        jpvs.writeln(pop);
        jpvs.writeln(pop);

        jpvs.writeln(pop, "Root directory:");
        var txtRoot = jpvs.TextBox.create(pop).width("15em").change(onChange).text(connectionParameters.root || "");
        jpvs.writeln(pop);
        jpvs.writeln(pop);

        jpvs.writeln(pop, "Access key ID:");
        var txtAKID = jpvs.TextBox.create(pop).width("15em").change(onChange).text(connectionParameters.accessKeyId || "");
        jpvs.writeln(pop);
        jpvs.writeln(pop);

        jpvs.writeln(pop, "Secret access key:");
        var txtSecret = jpvs.TextBox.create(pop).width("30em").change(onChange).text(connectionParameters.secretAccessKey || "");
        jpvs.writeln(pop);
        jpvs.writeln(pop);

        jpvs.writeln(pop, "Region:");
        var txtRegion = jpvs.TextBox.create(pop).width("7em").change(onChange).text(connectionParameters.region || "");

        var buttons = [{ text: "Test connection", click: onTest}];
        jpvs.writeButtonBar(pop, buttons);
        pop.show(function () { txtBucket.focus(); });

        function onChange() {
            connectionParameters.bucketName = $.trim(txtBucket.text());
            connectionParameters.accessKeyId = $.trim(txtAKID.text());
            connectionParameters.secretAccessKey = $.trim(txtSecret.text());
            connectionParameters.region = $.trim(txtRegion.text());
            connectionParameters.root = $.trim(txtRoot.text());

            Utils.saveParamsIntoStorage(connectionParameters);
        }

        function onTest() {
            goToFolder(connectionParameters.root);
        }
    }

    function awsEnsureConfig() {
        AWS.config = new AWS.Config({
            accessKeyId: connectionParameters.accessKeyId,
            secretAccessKey: connectionParameters.secretAccessKey,
            region: connectionParameters.region
        });
    }

    function listBucket(directory) {
        //This function is asynchronous
        return Async.call(run, arguments);

        function returnValues(ret, directories, files) {
            ret.setValue({
                directory: directory,
                directories: directories,
                files: files
            });
        }

        function run(directory) {
            var ret = this;
            awsEnsureConfig();

            if (directory != "" && !endsWith(directory, "/"))
                directory = directory + "/";

            var directories = [], files = [];

            var s3 = new AWS.S3();
            list();

            function list(marker) {
                var params = {
                    Bucket: connectionParameters.bucketName,
                    Prefix: directory,
                    Delimiter: "/",
                    Marker: marker
                };

                s3.listObjects(params, function (err, data) {
                    if (err) {
                        jpvs.alert("Error", err.toString());

                        //Done
                        returnValues(ret, [], []);
                    }
                    else
                        onDataReceived(data);
                });
            }

            function onDataReceived(data) {
                for (var i in data.CommonPrefixes) {
                    var item = data.CommonPrefixes[i].Prefix;
                    directories.push(item);
                }

                for (var i in data.Contents) {
                    var item = data.Contents[i];
                    files.push(item);
                }

                if (data.IsTruncated) {
                    //Repeat request until we received all keys
                    list(data.NextMarker);
                }
                else {
                    //Done
                    returnValues(ret, directories, files);
                }
            }
        }
    }

    function getParent(directory) {
        var parts = directory.split("/");
        if (parts.length >= 2) {
            //Remove all but last
            parts.splice(parts.length - 2, 1);
        }

        var parent = parts.join("/");
        if (parent.length < connectionParameters.root.length)
            parent = connectionParameters.root;

        return parent;
    }

    function getName(directory) {
        var parts = directory.split("/");
        if (parts.length >= 2) {
            if (parts[parts.length - 1] != "")
                return parts[parts.length - 1];
            else
                return parts[parts.length - 2];
        }
        else if (parts.length == 1)
            return parts[0];
        else
            return "???";
    }

    function showFolderContent(listing) {
        //This function is asynchronous
        return Async.call(run, arguments);

        function run(listing) {
            currentDirectory = listing.directory;

            var directories = listing.directories;
            var files = listing.files;

            var entries = [];
            for (var i in directories) {
                var dir = directories[i];
                entries.push({ type: "D", key: dir });
            }

            for (var i in files) {
                var file = files[i];

                //Skip if ends with slash (it's a directory and we already have it in "directories")
                if (file.Key.substring(file.Key.length - 1) == "/")
                    continue;

                //Skip if contains $ (it's a preview)
                if (file.Key.indexOf("$") > 0)
                    continue;

                //Look for previews of this file
                var previews = {};
                for (var j in files) {
                    var preview = files[j];
                    if (preview.Key.substring(0, file.Key.length + 1) == file.Key + "$") {
                        //It's a preview of file.Key because it's in the form file.Key + "$xxx.jpg" where xxx is the width in pixels
                        var resolution = preview.Key.substring(file.Key.length + 1, preview.Key.length - 4);
                        previews[resolution] = preview.Key;
                    }
                }

                entries.push({ type: "F", key: file.Key, previews: previews });
            }

            var firstTile = Tile.wrap(entries);

            //Show the first tile on the top left corner of the tile browser
            w.filebrowser.originX(w.filebrowser.tileSpacingHorz() + w.filebrowser.tileWidth() / 2);
            w.filebrowser.originY(w.filebrowser.tileSpacingVert() + w.filebrowser.tileHeight() / 2);
            w.filebrowser.desiredOriginX(w.filebrowser.originX());
            w.filebrowser.desiredOriginY(w.filebrowser.originY());
            w.filebrowser.startingTile(firstTile).refresh();

            this.setValue(true);
        }
    }

    function goToParent() {
        goToFolder(getParent(currentDirectory));
    }

    function Tile(entry) {
        this.type = entry.type;
        this.key = entry.key;
        this.previews = entry.previews;
        this.prev = null;
        this.next = null;

        this.isImage = false;
        this.cachedImage = null;
        this.cachedImageFast = null;
    }

    Tile.wrap = function (entries) {
        var tiles = [];
        for (var i in entries)
            tiles.push(new Tile(entries[i]));

        //Make linked list
        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];
            tile.prev = (i >= 1 ? tiles[i - 1] : null);
            tile.next = (i < tiles.length - 1 ? tiles[i + 1] : null);
        }

        return tiles[0] || null;
    };

    Tile.prototype.getNextTile = function () {
        return this.next;
    };

    Tile.prototype.getPreviousTile = function () {
        return this.prev;
    };

    Tile.prototype.template = function (dataItem) {
        if (dataItem.tileObject.type == "D") {
            jpvs.writeln(this, getName(dataItem.tileObject.key));
            this.addClass("Directory");

            dataItem.tileObject.onClick = function () {
                goToFolder(dataItem.tileObject.key);
            };
        }
        else {
            //Look for a template for the current file extension
            for (var type in templates) {
                if (endsWith(dataItem.tileObject.key, type)) {
                    //Found
                    var template = templates[type];
                    template.call(this, dataItem);
                    return;
                }
            }

            //Not found: just write the file name
            jpvs.write(this, dataItem.tileObject.key);
        }
    };

    function endsWith(str, suffix) {
        var suffix2 = str.substring(str.length - suffix.length);
        return suffix.toLowerCase() == suffix2.toLowerCase();
    }

    var templates = (function () {

        var imageLoadingNormal = false;
        var imageLoadingFast = false;

        function loadImagesTask() {
            //We have two tasks that load images in the background
            loadImagesTaskNormal();     //Normal previews, tile-sized
            loadImagesTaskFast();       //Fast-loading previews, lowest resolution
        }

        function loadImagesTaskNormal() {
            if (imageLoadingNormal)
                return;

            //Load first image that has not been loaded yet
            w.filebrowser.element.find(".Tile").each(function () {
                var tile = $(this);
                var tileObject = tile.data("tileObject");
                if (tileObject.isImage && !tileObject.cachedImage) {
                    //This tile contains an image that hasn't been loaded yet
                    //Let's find the right preview
                    var key = Utils.findPreview(tileObject.key, tileObject.previews, w.filebrowser.tileWidth());

                    //Let's load now
                    imageLoadingNormal = true;

                    var img = Utils.loadImage(key);

                    //When the regular preview is loaded, we update the tile and trigger the loadImagesTask to continue
                    img.then(function (img) {
                        imageLoadingNormal = false;

                        //At the end, let's update the tile
                        tileObject.cachedImage = img;
                        jpvs.applyTemplate(tile, image, { tileObject: tileObject });

                        //Then continue loading as needed
                        loadImagesTaskNormal();
                    });

                    //Exit from loop
                    return false;
                }
            });
        }

        function loadImagesTaskFast() {
            if (imageLoadingFast)
                return;

            //Load first image that has not been loaded yet
            w.filebrowser.element.find(".Tile").each(function () {
                var tile = $(this);
                var tileObject = tile.data("tileObject");
                if (tileObject.isImage && !tileObject.cachedImageFast) {
                    //This tile contains an image that hasn't been loaded yet
                    //Let's find a low-res, fast-loading preview
                    var keyFastLoading = Utils.findPreview(tileObject.key, tileObject.previews, 0);

                    //Let's load now
                    imageLoadingFast = true;

                    var imgFastLoading = Utils.loadImage(keyFastLoading);

                    //When the fast-loading image is loaded, we just update the tile, so we have a coarse-resolution tile immediately
                    imgFastLoading.then(function (img) {
                        imageLoadingFast = false;

                        //At the end, let's update the tile
                        tileObject.cachedImageFast = img;
                        jpvs.applyTemplate(tile, image, { tileObject: tileObject });

                        //Then continue loading as needed
                        loadImagesTaskFast();
                    });

                    //Exit from loop
                    return false;
                }
            });
        }

        function image(dataItem) {
            var tile = this.empty();

            //Mark as image so the loadImagesTask function knows it must load it
            dataItem.tileObject.isImage = true;

            if (dataItem.tileObject.cachedImage) {
                //If we have it in cache, then just show it
                Utils.appendCentered(tile, dataItem.tileObject.cachedImage);

                dataItem.tileObject.onClick = function () {
                    PhotoGallery.show(dataItem.tileObject);
                };

                //Let's free memory: we don't need the fast-loading version any longer
                dataItem.tileObject.cachedImageFast = null;
            }
            else if (dataItem.tileObject.cachedImageFast) {
                //If we just have the lower-resolution version, then just show it
                Utils.appendCentered(tile, dataItem.tileObject.cachedImageFast);

                dataItem.tileObject.onClick = function () {
                    PhotoGallery.show(dataItem.tileObject);
                };
            }
            else {
                //Otherwise, show a placeholder and ensure the loadImagesTask is running
                jpvs.writeTag(tile, "img").attr("src", jpvs.Resources.images.loading);
                loadImagesTask();
            }
        }

        function html(dataItem) {
            return jpvs.writeTag(this, "a", getName(dataItem.tileObject.key)).attr({
                href: dataItem.tileObject.key,
                target: dataItem.tileObject.key
            });
        }

        function video(dataItem) {
            jpvs.write(this, getName(dataItem.tileObject.key));
            dataItem.tileObject.onClick = function () {
                window.open(dataItem.tileObject.key, dataItem.tileObject.key);
            };
        }

        return {
            ".gif": image,
            ".jpg": image,
            ".jpeg": image,
            ".png": image,
            ".htm": html,
            ".html": html,
            ".mp4": video,
            ".avi": video,
            ".mov": video
        };
    })();

    //Exports
    return {
        init: init,
        configure: configure,
        goToParent: goToParent
    };
})();


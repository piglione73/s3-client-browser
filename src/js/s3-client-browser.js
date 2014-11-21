/// <reference path="jpvs-all.js" />
/// <reference path="jpvs-doc.js" />
/// <reference path="utils.js" />
/// <reference path="photo-gallery.js" />

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
        currentDirectory = connectionParameters.root;
        listBucket(currentDirectory, function (directory, dirs, files) {
            //Hide loading screen
            $(".Loading").fadeOut();

            //Show results
            showFolderContent(directory, dirs, files);
        });
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
            listBucket(connectionParameters.root, Utils.progress(showFolderContent));
        }
    }

    function awsEnsureConfig() {
        AWS.config = new AWS.Config({
            accessKeyId: connectionParameters.accessKeyId, secretAccessKey: connectionParameters.secretAccessKey, region: connectionParameters.region
        });
    }

    function listBucket(directory, callback) {
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
                    callback(directory, [], []);
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
                callback(directory, directories, files);
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

    function showFolderContent(directory, directories, files) {
        currentDirectory = directory;

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

            entries.push({ type: "F", key: file.Key });
        }

        var firstTile = Tile.wrap(entries);

        //Show the first tile on the top left corner of the tile browser
        w.filebrowser.originX(w.filebrowser.tileSpacingHorz() + w.filebrowser.tileWidth() / 2);
        w.filebrowser.originY(w.filebrowser.tileSpacingVert() + w.filebrowser.tileHeight() / 2);
        w.filebrowser.desiredOriginX(w.filebrowser.originX());
        w.filebrowser.desiredOriginY(w.filebrowser.originY());
        w.filebrowser.startingTile(firstTile).refresh();
    }

    function goToParent() {
        listBucket(getParent(currentDirectory), Utils.progress(showFolderContent));
    }

    function Tile(entry) {
        this.type = entry.type;
        this.key = entry.key;
        this.prev = null;
        this.next = null;

        this.isImage = false;
        this.cachedImage = null;
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
                listBucket(dataItem.tileObject.key, Utils.progress(showFolderContent));
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

        var imageLoading = false;

        function loadImagesTask() {
            if (imageLoading)
                return;

            //Load first image that has not been loaded yet
            w.filebrowser.element.find(".Tile").each(function () {
                var tile = $(this);
                var tileObject = tile.data("tileObject");
                if (tileObject.isImage && !tileObject.cachedImage) {
                    //This tile contains an image that hasn't been loaded yet
                    //Let's load it now
                    var img = new Image();
                    img.src = tileObject.key;
                    imageLoading = true;
                    img.addEventListener("load", function () {
                        imageLoading = false;

                        //At the end, let's update the tile
                        tileObject.cachedImage = img;
                        jpvs.applyTemplate(tile, image, { tileObject: tileObject });

                        //Then continue loading as needed
                        loadImagesTask();
                    }, false);

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
                //We use a canvas so we show it scaled down
                //var canvas = jpvs.writeTag(tile, "canvas").attr({ width: 100, height: 100 }).css({ width: "100%", height: "100%" });
                //var ctx = canvas[0].getContext("2d");
                //ctx.drawImage(dataItem.tileObject.cachedImage, 0, 0, 100, 100);

                Utils.appendCentered(tile, dataItem.tileObject.cachedImage);

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


﻿/// <reference path="js/jpvs-all.js" />
/// <reference path="js/jpvs-doc.js" />

var SCB = (function () {

    var connectionParameters = {};
    var w;
    var currentDirectory = "";

    function init(widgets) {
        w = widgets;

        //Load configuration
        loadParamsFromStorage();
        
        //List root directory
        listBucket(currentDirectory, function(directory, dirs, files) {
            //Hide loading screen
            $(".Loading").fadeOut();
            
            //Show results
            showFolderContent(directory, dirs, files);
        });
    }

    function loadParamsFromStorage() {
        try {
            var params = localStorage["ConnectionParameters"];
            var arr = (params || "").split("|");

            connectionParameters = {
                bucketName: arr[0] || "",
                accessKeyId: arr[1] || "",
                secretAccessKey: arr[2] || "",
                region: arr[3] || ""
            };
        }
        catch (e) {
            connectionParameters = {};
        }
    }

    function saveParamsIntoStorage() {
        var arr = [connectionParameters.bucketName, connectionParameters.accessKeyId, connectionParameters.secretAccessKey, connectionParameters.region];
        try {
            localStorage["ConnectionParameters"] = arr.join("|");
        }
        catch (e) {
        }
    }

    function progress(callback) {
        jpvs.showDimScreen(0, 100, template);
                
        return function() {
            jpvs.hideDimScreen();
            callback.apply(null, arguments);
        };
        
        function template() {
            this.removeClass("DimScreen").addClass("Progress");
        }
    }
    
    function configure() {
        var pop = jpvs.Popup.create().title("Connection parameters");
        jpvs.writeln(pop, "Bucket name:");
        var txtBucket = jpvs.TextBox.create(pop).width("15em").change(onChange).text(connectionParameters.bucketName || "");
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

            saveParamsIntoStorage();
        }

        function onTest() {
            listBucket("", progress(showFolderContent));
        }
    }

    function awsEnsureConfig() {
        AWS.config = new AWS.Config({
            accessKeyId: connectionParameters.accessKeyId, secretAccessKey: connectionParameters.secretAccessKey, region: connectionParameters.region
        });
    }

    function listBucket(directory, callback) {
        awsEnsureConfig();

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
                if (err){
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
        return parent;
    }

    function showFolderContent(directory, directories, files) {
        currentDirectory = directory;

        var entries = [];
        for (var i in directories) {
            var dir = directories[i];
            entries.push({type:"D",key:dir});
        }

        for (var i in files) {
            var file = files[i];

            //Skip if ends with slash (it's a directory and we already have it in "directories")
            if (file.Key.substring(file.Key.length - 1) == "/")
                continue;

            entries.push({type:"F",key:file.Key});
        }

        var firstTile = Tile.wrap(entries);

        //Show the first tile on the top left corner of the tile browser
        w.filebrowser.originX(w.filebrowser.tileSpacingHorz() + w.filebrowser.tileWidth() / 2);
        w.filebrowser.originY(w.filebrowser.tileSpacingVert() + w.filebrowser.tileHeight() / 2);
        w.filebrowser.desiredOriginX(w.filebrowser.originX());
        w.filebrowser.desiredOriginY(w.filebrowser.originY());
        w.filebrowser.startingTile(firstTile).refresh(true);
    }

    function goToParent() {
        listBucket(getParent(currentDirectory), progress(showFolderContent));
    }
    
    function onClickDirectory(dir) {
        return function () {
            listBucket(dir, progress(showFolderContent));
        };
    }

    function Tile(entry) {
        this.type=entry.type;
        this.key = entry.key;
        this.prev = null;
        this.next = null;
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
        if (dataItem.tileObject.type == "D"){
            this.click(onClickDirectory(dataItem.tileObject.key));
            jpvs.writeln(this, dataItem.tileObject.key);
        }
        else
            jpvs.writeTag(this, "img").attr("src", dataItem.tileObject.key).css("width", "100%");
    };

    //Exports
    return {
        init: init,
        configure: configure,
        goToParent: goToParent
    };
})();


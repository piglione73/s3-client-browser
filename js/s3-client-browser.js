/// <reference path="js/jpvs-all.js" />
/// <reference path="js/jpvs-doc.js" />

var SCB = (function () {

    var connectionParameters = {};
    var w;

    function init(widgets) {
        w = widgets;

        //Hide loading screen
        $(".Loading").fadeOut();

        step1();

        function step1() {
            getConnectionParameters(step2);
        }

        function step2() {
            listBucket("", step3);
        }

        function step3(directory, dirs, files) {
            showFolderContent(directory, dirs, files);
        }
    }

    function call(callback, params) {
        if (callback)
            callback.apply(null, params);
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

    function getConnectionParameters(callback) {
        //Get connection parameters from localStorage. If not present, then ask the user
        loadParamsFromStorage();
        if (!connectionParameters.bucketName || !connectionParameters.accessKeyId || !connectionParameters.secretAccessKey || !connectionParameters.region)
            askConnectionParameters(callback);
        else
            call(callback);
    }

    function askConnectionParameters(callback) {
        var pop = jpvs.Popup.create().title("Connection parameters").close(function () { call(callback); });
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
            listBucket("", function (directory, dirs, files) {
                jpvs.alert("Test connection", "Dirs: " + dirs.length + ", files: " + files.length);

                for (var i in dirs)
                    jpvs.writeln("body", dirs[i]);
                for (var i in files)
                    jpvs.writeln("body", files[i].Key);
            });
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
                if (err)
                    jpvs.alert("Error", err.toString());
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
                call(callback, [directory, directories, files]);
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
        var container = $("#objects").empty();

        var parent = getParent(directory);
        jpvs.LinkButton.create(container).text("Parent directory").click(onClickDirectory(parent));
        jpvs.writeln(container);
        jpvs.writeln(container);

        var keys = [];
        for (var i in directories) {
            var dir = directories[i];
            keys.push(dir);
        }

        for (var i in files) {
            var file = files[i];

            //Skip if ends with slash (it's a directory and we already have it in "directories"
            if (file.Key.substring(file.Key.length - 1) == "/")
                continue;

            keys.push(file.Key);
        }

        var firstTile = Tile.wrap(keys);

        //Show the first tile on the top left corner of the tile browser
        w.filebrowser.originX(w.filebrowser.tileSpacingHorz() + w.filebrowser.tileWidth() / 2);
        w.filebrowser.originY(w.filebrowser.tileSpacingVert() + w.filebrowser.tileHeight() / 2);
        w.filebrowser.desiredOriginX(w.filebrowser.originX());
        w.filebrowser.desiredOriginY(w.filebrowser.originY());
        w.filebrowser.startingTile(firstTile).refresh(true);
    }

    function onClickDirectory(dir) {
        return function () {
            listBucket(dir, showFolderContent);
        };
    }

    function Tile(key) {
        this.key = key;
        this.prev = null;
        this.next = null;
    }

    Tile.wrap = function (keys) {
        var tiles = [];
        for (var i in keys)
            tiles.push(new Tile(keys[i]));

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
        var key = dataItem.tileObject.key;
        if (key.substring(key.length - 1) == "/")
            this.click(onClickDirectory(key));

        jpvs.writeln(this, key);
        jpvs.writeTag(this, "img").attr("src", key).css("width", "100%");
    };

    //Exports
    return {
        init: init,
        askConnectionParameters: askConnectionParameters
    };
})();


/*
// See the Configuring section to configure credentials in the SDK
AWS.config = new AWS.Config({
accessKeyId: 'AKID', secretAccessKey: 'SECRET', region: 'eu-west-1'
});

var bucket = new AWS.S3({ params: { Bucket: 'BUCKET'} });
//bucket.makeUnauthenticatedRequest('listObjects', {Bucket: 'BUCKET'}, function (err, data) {
bucket.listObjects(function (err, data) {
if (err) {
document.getElementById('status').innerHTML =
'Could not load objects from S3: ' + err;
} else {
document.getElementById('status').innerHTML =
'Loaded ' + data.Contents.length + ' items from S3';
for (var i = 0; i < data.Contents.length; i++) {
document.getElementById('objects').innerHTML +=
'<li>' + data.Contents[i].Key + '</li>';
}
}
});
*/


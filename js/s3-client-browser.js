/// <reference path="js/jpvs-all.js" />
/// <reference path="js/jpvs-doc.js" />

var SCB = (function () {

    var connectionParameters = {};


    function init(w) {
        //Hide loading screen
        $(".Loading").fadeOut();

        getConnectionParameters(function () { alert("Ciao " + connectionParameters.bucketName); });
    }

    function call(callback) {
        if (callback)
            callback();
    }

    function loadParamsFromStorage() {
        try {
            var params = localStorage["ConnectionParameters"];
            var arr = (params || "").split("|");

            connectionParameters = {
                bucketName: arr[0] || "",
                accessKeyId: arr[1] || "",
                secretAccessKey: arr[2] || ""
            };
        }
        catch (e) {
            connectionParameters = {};
        }
    }

    function saveParamsIntoStorage() {
        var arr = [connectionParameters.bucketName, connectionParameters.accessKeyId, connectionParameters.secretAccessKey];
        try {
            localStorage["ConnectionParameters"] = arr.join("|");
        }
        catch (e) {
        }
    }

    function getConnectionParameters(callback) {
        //Get connection parameters from localStorage. If not present, then ask the user
        loadParamsFromStorage();
        if (!connectionParameters.bucketName || !connectionParameters.accessKeyId || !connectionParameters.secretAccessKey)
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

        var buttons = [{ text: "Test connection", click: onTest}];
        jpvs.writeButtonBar(pop, buttons);
        pop.show(function () { txtBucket.focus(); });

        function onChange() {
            connectionParameters.bucketName = $.trim(txtBucket.text());
            connectionParameters.accessKeyId = $.trim(txtAKID.text());
            connectionParameters.secretAccessKey = $.trim(txtSecret.text());

            saveParamsIntoStorage();
        }

        function onTest() {
            listBucket();
        }
    }

    function listBucket() {
        AWS.config = new AWS.Config({
            accessKeyId: connectionParameters.accessKeyId, secretAccessKey: connectionParameters.secretAccessKey
        });

        var bucket = new AWS.S3({ params: { Bucket: connectionParameters.bucketName} });
        bucket.listObjects(function (err, data) {
            if (err)
                jpvs.alert("Error", err.toString());
        });
    }

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

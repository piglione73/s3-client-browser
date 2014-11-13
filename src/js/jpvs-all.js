/* JPVS
Module: bootstrap
*/

var jpvs = (function () {
    function loadJS(url, callback) {
        var head = document.getElementsByTagName("head")[0] || document.documentElement;
        var script = document.createElement("script");
        script.src = url;

        // Handle Script loading
        var done = false;

        // Attach handlers for all browsers
        script.onload = script.onreadystatechange = function () {
            if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                done = true;
                callback();
            }
        };

        // Use insertBefore instead of appendChild to circumvent an IE6 bug.
        head.insertBefore(script, head.firstChild);
    }

    function setAdd(list, item) {
        var found = false;
        for (var i in list) {
            var x = list[i];
            if (x == item) {
                found = true;
                break;
            }
        }

        if (!found) {
            list.push(item);
            return true;
        }
        else
            return false;
    }

    function resolveDependencies(classes, modules) {
        //The following comment is a placeholder. During the build process it will be replaced with a dependency tree
        //of all files, classes and modules.
        var tree = {"ClassToFile":{"jpvs":"Core.js","Event":"Event.js","Resources":"Resources.js","Button":"widgets/Button.js","CheckBox":"widgets/CheckBox.js","DataGrid":"widgets/DataGrid.js","DateBox":"widgets/DateBox.js","DocumentEditor":"widgets/DocumentEditor.js","DropDownList":"widgets/DropDownList.js","ImageButton":"widgets/ImageButton.js","LinkButton":"widgets/LinkButton.js","Menu":"widgets/Menu.js","MultiLineTextBox":"widgets/MultiLineTextBox.js","MultiSelectBox":"widgets/MultiSelectBox.js","Pager":"widgets/Pager.js","Popup":"widgets/Popup.js","Scroller":"widgets/Scroller.js","Table":"widgets/Table.js","TextBox":"widgets/TextBox.js","TileBrowser":"widgets/TileBrowser.js","Tree":"widgets/Tree.js","Storage":"storage/Storage.js","SvgParser":"parsers/SvgParser.js","XmlParser":"parsers/XmlParser.js"},"ClassToModule":{"jpvs":"core","Event":"core","Resources":"core","Button":"widgets","CheckBox":"widgets","DataGrid":"widgets","DateBox":"widgets","DocumentEditor":"widgets","DropDownList":"widgets","ImageButton":"widgets","LinkButton":"widgets","Menu":"widgets","MultiLineTextBox":"widgets","MultiSelectBox":"widgets","Pager":"widgets","Popup":"widgets","Scroller":"widgets","Table":"widgets","TextBox":"widgets","TileBrowser":"widgets","Tree":"widgets","Storage":"storage","SvgParser":"parsers","XmlParser":"parsers"},"ModuleToDepends":{"animations":["core"],"tasks":["core"],"utils":["core"],"binding":["core"],"core":["bootstrap"],"bootstrap":[],"widgets":["core","parsers","table","linkbutton","imagebutton"],"storage":["core","utils"],"parsers":["core"]},"ModuleToFiles":{"animations":["Animations.js"],"tasks":["BackgroundTask.js"],"utils":["Base64.js","JSON.js","Random.js","Session.js","TouchGestures.js","utils/Equals.js"],"binding":["Binding.js"],"core":["Core.js","Event.js","Resources.js"],"bootstrap":["jpvs.js"],"widgets":["widgets/Button.js","widgets/CheckBox.js","widgets/DataGrid.js","widgets/DateBox.js","widgets/DocumentEditor.js","widgets/DropDownList.js","widgets/ImageButton.js","widgets/LinkButton.js","widgets/Menu.js","widgets/MultiLineTextBox.js","widgets/MultiSelectBox.js","widgets/Pager.js","widgets/Popup.js","widgets/Scroller.js","widgets/Table.js","widgets/TextBox.js","widgets/TileBrowser.js","widgets/Tree.js"],"storage":["storage/Storage.js"],"parsers":["parsers/HtmlCleaner.js","parsers/SvgParser.js","parsers/XmlParser.js"]}};

        //Start from classes and get a list of modules
        var mods = [];
        if (classes) {
            for (var i in classes) {
                var cls = classes[i];
                var mod = tree.ClassToModule[cls];
                setAdd(mods, mod);
            }
        }

        //Next, add modules
        if (modules) {
            for (var i in modules) {
                var mod = modules[i];
                setAdd(mods, mod);
            }
        }

        //Finally, let's add all dependencies
        var loopAgain = true;
        while (loopAgain) {
            loopAgain = false;
            for (var i in mods) {
                var mod = mods[i];
                var depends = tree.ModuleToDepends[mod];
                for (var j in depends) {
                    var depend = depends[j];
                    if (setAdd(mods, depend))
                        loopAgain = true;
                }
            }
        }

        //Now we have all required modules
        //Let's determine the files to load
        var jpvsBaseUrl = jpvs.baseUrl || "jpvs";

        var files = [];
        for (var i in mods) {
            var mod = mods[i];
            var fileGroup = tree.ModuleToFiles[mod];
            for (var j in fileGroup) {
                var file = fileGroup[j];
                setAdd(files, jpvsBaseUrl + "/" + file);
            }
        }

        //Return in reverse order
        files.reverse();
        return files;
    }

    return function (classesAndModules, onready) {
        //Variable number of parameters
        if (!classesAndModules) {
            //No params
        }
        else if (typeof (classesAndModules) == "function") {
            //One param: callback
            onready = classesAndModules;
            $(document).ready(function () {
                jpvs.createAllWidgets();
                onready(jpvs.widgets);
            });
        }
        else {
            //Two params: classesAndModules, onready
            //Javascript files to load
            var files = resolveDependencies(classesAndModules.classes, classesAndModules.modules);

            function loadAllJS() {
                if (!files.TotalCount)
                    files.TotalCount = files.length;

                var firstJS = files.shift();
                if (firstJS) {
                    setTimeout(function () {
                        loadJS(firstJS, loadAllJS);
                    }, 10);
                }
                else {
                    //Done
                    jpvs.createAllWidgets();
                    if (onready)
                        onready(jpvs.widgets);
                }
            }

            $(document).ready(loadAllJS);
        }
    };
})();

/* JPVS
Module: animations
Classes: 
Depends: core
*/

(function () {

    // shim layer with setTimeout fallback
    var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback, element) {
        window.setTimeout(callback, 1000 / 60);
    };

    jpvs.requestAnimationFrame = function () {
        //Ensure we call with this = window
        requestAnimFrame.apply(window, arguments);
    }

    //Animation queue
    var queue = [];
    var running = false;
    var currentAnim = null;

    /*
    Can be called as: jpvs.animate(animationFunction) 
    or as jpvs.animate(params, animationFunction)
    */
    jpvs.animate = function (params, animationFunction) {
        //Parameter extraction
        var t0 = (params && params.t0 != null) ? params.t0 : 0;
        var t1 = (params && params.t1 != null) ? params.t1 : 1;
        var step = Math.abs((params && params.step) || 0);
        var duration = Math.abs((params && params.duration) || 1000);
        var easingFunc = (params && params.easingFunction) || harmonicEasing;
        var animFunc = animationFunction || params;

        //Enqueue the animation
        queue.push({
            t0: t0, t1: t1, step: step, duration: duration,
            animFunc: animFunc,
            easingFunc: easingFunc,
            startTime: null,
            endTime: null
        });

        //Ensure it will be executed
        ensureStarted();
    };

    function ensureStarted() {
        if (!running) {
            requestAnimFrame(animFrame);
            running = true;
        }
    }

    function animFrame() {
        //Get the current animation
        if (currentAnim == null) {
            if (queue.length > 0) {
                //Pop the first element (FIFO queue)
                currentAnim = queue.shift();
            }
            else {
                //No more items in the queue
                running = false;
                return;
            }
        }

        //Materialize the current frame of the current animation
        try {
            //Current frame time
            var curTime = new Date().getTime();

            //We need to know the animation start time
            if (currentAnim.startTime == null) {
                currentAnim.startTime = curTime;
                currentAnim.endTime = currentAnim.startTime + currentAnim.duration;
            }

            if (currentAnim.step) {
                //Discrete animation: go from t0 to t1 with this "step"
                var t = getAnimationTimeDiscrete(curTime);
                currentAnim.animFunc(t);
            }
            else {
                //Continuous animation: simply go from t0 to t1 as smoothly as possible
                var t = getAnimationTimeContinuous(curTime);
                currentAnim.animFunc(t);
            }

            //If current animation finished, set it to null
            if (curTime >= currentAnim.endTime)
                currentAnim = null;
        }
        finally {
            //Schedule next frame
            requestAnimFrame(animFrame);
        }
    }

    /*
    Calculate the current animation time for continuous animations by applying the easing function
    */
    function getAnimationTimeContinuous(curTime) {
        if (curTime <= currentAnim.startTime)
            return currentAnim.t0;
        else if (curTime >= currentAnim.endTime)
            return currentAnim.t1;
        else
            return currentAnim.easingFunc(currentAnim.startTime, currentAnim.endTime, currentAnim.t0, currentAnim.t1, curTime);
    }

    /*
    Calculate the current animation time for discrete animations by applying the step
    */
    function getAnimationTimeDiscrete(curTime) {
        var t0 = currentAnim.t0;
        var t1 = currentAnim.t1;
        var step = currentAnim.step;
        var s = currentAnim.startTime;
        var e = currentAnim.endTime;

        //How many steps between t0 and t1?
        var nSteps = Math.ceil(Math.abs((t1 - t0) / step));
        var sign = t1 > t0 ? 1 : -1;

        //Divide the total duration in nSteps parts
        var timeStep = (e - s) / nSteps;

        //Determine the step index
        var stepIndex = Math.floor((curTime - s) / timeStep);

        if (curTime <= s)
            return t0;
        else if (curTime >= e)
            return t1;
        else
            return t0 + sign * stepIndex * step;
    }

    /*
    Easing functions for continuous animations
    */
    function harmonicEasing(startTime, endTime, t0, t1, curTime) {
        var normTime = (curTime - startTime) / (endTime - startTime);
        var normT = 0.5 - Math.cos(normTime * Math.PI) / 2;
        var t = t0 + normT * (t1 - t0);
        return t;
    }

    function linearEasing(startTime, endTime, t0, t1, curTime) {
        var normTime = (curTime - startTime) / (endTime - startTime);
        var normT = normTime;
        var t = t0 + normT * (t1 - t0);
        return t;
    }

    //Publish some preset easing functions
    jpvs.animate.harmonicEasing = harmonicEasing;
    jpvs.animate.linearEasing = linearEasing;


    /*
    Simple function for flashing a CSS class on a DOM element
    */
    jpvs.flashClass = function (element, cssClass, duration, count, leaveOnTime) {
        var $elem = $(element);
        var N = count || 15;
        var T1 = 2 * N;

        //Flash and leave the CSS class on
        jpvs.animate({
            t0: 0,
            t1: T1,
            step: 1,
            duration: duration || 2000
        }, function (t) {
            if (t % 2 == 0)
                $elem.addClass(cssClass);
            else
                $elem.removeClass(cssClass);
        });

        //Then, at the end, wait for "leaveOnTime" and switch the CSS class off
        jpvs.animate({
            t0: 0,
            t1: 1,
            step: 1,
            duration: leaveOnTime || 4000
        }, function (t) {
            if (t == 1)
                $elem.removeClass(cssClass);
        });

    };

})();

/* JPVS
Module: tasks
Classes: 
Depends: core
*/

(function () {

    //Default run settings
    var defaultCpu = 0.5;
    var defaultMinRunTimeMs = 50;


    jpvs.runTask = function (flagAsync, task, onSuccess, onProgress, onError) {
        if (flagAsync)
            jpvs.runBackgroundTask(task, onSuccess, onProgress, onError);
        else
            jpvs.runForegroundTask(task, onSuccess, onProgress, onError);
    };

    jpvs.runBackgroundTask = function (task, onSuccess, onProgress, onError) {
        //Start the task runner, that runs asynchronously until task termination
        setTimeout(taskRunnerAsync(task, onSuccess, onProgress, onError), 0);
    };

    jpvs.runForegroundTask = function (task, onSuccess, onProgress, onError) {
        //Run the task synchronously from start to end
        //As a convenience, pass the return value as a real return value
        return taskRunner(task, onSuccess, onProgress, onError);
    };


    function taskRunner(task, onSuccess, onProgress, onError) {
        //Run from start to end, never yielding control back to the caller
        //Useful for running a task much like an ordinary function call
        //Let's make a data context available to the task
        //The task can do whatever it wants with this object. Useful for storing execution state.
        var ctx = {};

        try {
            //Run the task
            while (true) {
                //Run once and analyze the return code
                var info = task(ctx);
                var infoDecoded = analyzeTaskRetCode(info);

                //Let's see what to do
                if (infoDecoded.keepRunning) {
                    //Task wants to keep running
                    //Let's signal progress, if available, whatever "progress" means
                    if (onProgress && infoDecoded.progress)
                        onProgress(infoDecoded.progress);
                }
                else {
                    //Task doesn't need to run again
                    //Let's signal success and exit
                    if (onSuccess)
                        onSuccess(ctx.returnValue);

                    //As a convenience, pass the return value as a real return value
                    return ctx.returnValue;
                }
            }

        }
        catch (e) {
            //In case of errors, the task ends and the onError callback, if any, is called
            if (onError)
                onError(e);
        }
    }

    function taskRunnerAsync(task, onSuccess, onProgress, onError) {
        //Let's make a data context available to the task
        //The task can do whatever it wants with this object. Useful for storing execution state.
        var ctx = {};

        //We want to exit immediately on the first iteration, so we load the task settings right away
        var minRunTimeMs = 0;

        //Return a reference to the "run" function
        return run;

        //Runner function, runs until task termination
        //In case of exception in the "task" function, the task is terminated
        //The "task" function returns info about how to continue running the task
        function run() {
            try {
                //Run the task for at least minRunTime milliseconds
                var start = new Date().getTime();
                var end = start + minRunTimeMs;
                while (true) {
                    //Run once and analyze the return code
                    var info = task(ctx);
                    var infoDecoded = analyzeTaskRetCode(info);

                    //Let's see what to do
                    if (infoDecoded.keepRunning) {
                        //Task wants to keep running
                        //If we are within the minRunTimeMs, then we may repeat the loop
                        //Otherwise we schedule the task for later
                        var now = new Date().getTime();
                        if (now < end) {
                            //We may run again without yielding control
                            //NOP
                        }
                        else {
                            //The minRunTimeMs has elapsed
                            //Let's reschedule the task using the provided task settings
                            minRunTimeMs = infoDecoded.minRunTimeMs;
                            var lastDuration = now - start;
                            var delay = lastDuration * (1 - infoDecoded.cpu) / infoDecoded.cpu;
                            setTimeout(run, delay);

                            //Let's signal progress, if available, whatever "progress" means
                            if (onProgress && infoDecoded.progress)
                                onProgress(infoDecoded.progress);

                            return;
                        }
                    }
                    else {
                        //Task doesn't need to run again
                        //Let's signal success and exit
                        if (onSuccess)
                            onSuccess(ctx.returnValue);

                        return;
                    }
                }

            }
            catch (e) {
                //In case of errors, the task ends and the onError callback, if any, is called
                if (onError)
                    onError(e);
            }
        }
    }

    /*
    The task function can return:
    - null, undefined, false: means "task completed"
    - true: means "please run me again"
    - object with info about progress and task settings

    The object can be like this (all is optional):
    {
    cpu: value between 0 and 1,
    minRunTimeMs: how long to run before yielding control for a while,
    progress: string or object or number (anything is passed on to onProgress)
    }
    */
    function analyzeTaskRetCode(info) {
        //See what to do next
        if (info === null || info === undefined || info === false) {
            //Task said it finished
            //No more scheduling
            return {
                keepRunning: false
            };
        }
        else if (info === true) {
            //Task said it needs to continue running but provided no info as to how it wants to be run
            //No progress information either
            //Let's run with default settings
            return {
                keepRunning: true,
                cpu: defaultCpu,
                minRunTimeMs: defaultMinRunTimeMs,
                progress: null
            };
        }
        else {
            //Task said it needs to continue running and provided some info as to how it wants to be run
            return {
                keepRunning: true,
                cpu: info.cpu || defaultCpu,
                minRunTimeMs: info.minRunTimeMs || defaultMinRunTimeMs,
                progress: info.progress
            };
        }
    }

})();

/* JPVS
Module: utils
Classes: 
Depends: core
*/

(function () {
    /*
    Copyright (c) 2008 Fred Palmer fred.palmer_at_gmail.com

    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.
    */
    function StringBuffer() {
        this.buffer = [];
    }

    StringBuffer.prototype.append = function append(string) {
        this.buffer.push(string);
        return this;
    };

    StringBuffer.prototype.toString = function toString() {
        return this.buffer.join("");
    };

    var Base64 = {
        codex: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

        encode: function (input) {
            var output = new StringBuffer();

            var enumerator = new Utf8EncodeEnumerator(input);
            while (enumerator.moveNext()) {
                var chr1 = enumerator.current;

                enumerator.moveNext();
                var chr2 = enumerator.current;

                enumerator.moveNext();
                var chr3 = enumerator.current;

                var enc1 = chr1 >> 2;
                var enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                var enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                var enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                }
                else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output.append(this.codex.charAt(enc1) + this.codex.charAt(enc2) + this.codex.charAt(enc3) + this.codex.charAt(enc4));
            }

            return output.toString();
        },

        decode: function (input) {
            var output = new StringBuffer();

            var enumerator = new Base64DecodeEnumerator(input);
            while (enumerator.moveNext()) {
                var charCode = enumerator.current;

                if (charCode < 128)
                    output.append(String.fromCharCode(charCode));
                else if ((charCode > 191) && (charCode < 224)) {
                    enumerator.moveNext();
                    var charCode2 = enumerator.current;

                    output.append(String.fromCharCode(((charCode & 31) << 6) | (charCode2 & 63)));
                }
                else {
                    enumerator.moveNext();
                    var charCode2 = enumerator.current;

                    enumerator.moveNext();
                    var charCode3 = enumerator.current;

                    output.append(String.fromCharCode(((charCode & 15) << 12) | ((charCode2 & 63) << 6) | (charCode3 & 63)));
                }
            }

            return output.toString();
        }
    };


    function Utf8EncodeEnumerator(input) {
        this._input = input;
        this._index = -1;
        this._buffer = [];
    }

    Utf8EncodeEnumerator.prototype = {
        current: Number.NaN,

        moveNext: function () {
            if (this._buffer.length > 0) {
                this.current = this._buffer.shift();
                return true;
            }
            else if (this._index >= (this._input.length - 1)) {
                this.current = Number.NaN;
                return false;
            }
            else {
                var charCode = this._input.charCodeAt(++this._index);

                // "\r\n" -> "\n"
                //
                if ((charCode == 13) && (this._input.charCodeAt(this._index + 1) == 10)) {
                    charCode = 10;
                    this._index += 2;
                }

                if (charCode < 128) {
                    this.current = charCode;
                }
                else if ((charCode > 127) && (charCode < 2048)) {
                    this.current = (charCode >> 6) | 192;
                    this._buffer.push((charCode & 63) | 128);
                }
                else {
                    this.current = (charCode >> 12) | 224;
                    this._buffer.push(((charCode >> 6) & 63) | 128);
                    this._buffer.push((charCode & 63) | 128);
                }

                return true;
            }
        }
    };

    function Base64DecodeEnumerator(input) {
        this._input = input;
        this._index = -1;
        this._buffer = [];
    }

    Base64DecodeEnumerator.prototype = {
        current: 64,

        moveNext: function () {
            if (this._buffer.length > 0) {
                this.current = this._buffer.shift();
                return true;
            }
            else if (this._index >= (this._input.length - 1)) {
                this.current = 64;
                return false;
            }
            else {
                var enc1 = Base64.codex.indexOf(this._input.charAt(++this._index));
                var enc2 = Base64.codex.indexOf(this._input.charAt(++this._index));
                var enc3 = Base64.codex.indexOf(this._input.charAt(++this._index));
                var enc4 = Base64.codex.indexOf(this._input.charAt(++this._index));

                var chr1 = (enc1 << 2) | (enc2 >> 4);
                var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                var chr3 = ((enc3 & 3) << 6) | enc4;

                this.current = chr1;

                if (enc3 != 64)
                    this._buffer.push(chr2);

                if (enc4 != 64)
                    this._buffer.push(chr3);

                return true;
            }
        }
    };

    jpvs.encodeUtf8Base64 = function (str) {
        return Base64.encode(str);
    };

    jpvs.decodeBase64Utf8 = function (str) {
        return Base64.decode(str);
    };

})();

/* JPVS
Module: binding
Classes: 
Depends: core
*/

(function () {

    jpvs.resetAllBindings = function () {
        changeMonitorQueue.clearAll();
        disableChangeMonitor();
    };

    jpvs.bindContainer = function (container, dataObject, onChangeDetected, dataBindingAttrName) {
        if (!container)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = jpvs.getElementIfWidget(container);

        //We want to two-way bind every element (ordinary element or jpvs widget) to dataObject
        //Let's look for elements that specify a binding in attribute "data-bind"
        jpvs.bindElements(container.find("*"), dataObject, onChangeDetected, dataBindingAttrName);
    };

    jpvs.bindElements = function (elements, dataObject, onChangeDetected, dataBindingAttrName) {
        if (!elements)
            return;

        //We want to two-way bind every element (ordinary element or jpvs widget) to dataObject
        //Let's look for elements that specify a binding in attribute "data-bind"
        for (var i = 0; i < elements.length; i++) {
            //Loop over all elements and see if they need binding
            var obj = elements[i];
            var $this = $(obj);

            //Let's read the "data-bind" attribute (or another name if specified)
            var dataBind = $this.data(dataBindingAttrName || "bind");
            if (dataBind) {
                //If "data-bind" is specified, apply it
                jpvs.bind($this, dataObject, dataBind, onChangeDetected);
            }
        }
    };

    jpvs.bind = function (element, dataObject, dataBind, onChangeDetected) {
        enableChangeMonitor();

        if (!dataObject)
            return;

        //Let's parse the "data-bind" attribute into a list of bindings and put them in place
        var items = $.trim(dataBind).split(",");
        $.each(items, function (i, item) {
            var subitems = item.split("=");
            var elementPropertyName = $.trim(subitems[0]);
            var objectPropertyName = $.trim(subitems[1]);
            bindElementToObject(element, elementPropertyName, dataObject, objectPropertyName, onChangeDetected);
        });
    };

    jpvs.findElementsBoundTo = function (dataObject, objectPropertyName) {
        var elementsOrWidgets = [];
        //Search for all relations having this idTo
        var idTo = getDataObjectBindingID(dataObject) + "/" + objectPropertyName;
        $.each(changeMonitorQueue.relations, function (key, item) {
            if (item.idTo == idTo) {
                elementsOrWidgets.push(item.element);
            }
        });

        return elementsOrWidgets;
    };

    function bindElementToObject(element, elementPropertyName, dataObject, objectPropertyName, onChangeDetected) {
        //First copy from dataObject to element
        var getter = getterDataObjectProperty(dataObject, objectPropertyName);
        var setter = setterElementProperty(element, elementPropertyName);
        setter(getter());

        //Let's setup a two-way binding
        //From element to dataObject
        var relation = {
            idFrom: getElementBindingID(element) + "/" + elementPropertyName,
            idTo: getDataObjectBindingID(dataObject) + "/" + objectPropertyName
        };
        onElementPropertyChange(relation, element, elementPropertyName, setterDataObjectProperty(dataObject, objectPropertyName), onChangeDetected);

        //From dataObject to element
        relation = {
            idTo: getElementBindingID(element) + "/" + elementPropertyName,
            idFrom: getDataObjectBindingID(dataObject) + "/" + objectPropertyName
        };
        onDataObjectPropertyChange(relation, dataObject, objectPropertyName, element, setterElementProperty(element, elementPropertyName), onChangeDetected);
    }

    function getElementBindingID(element) {
        var bid = element.data("jpvs.binding.id");
        if (!bid) {
            bid = jpvs.randomString(20);
            element.data("jpvs.binding.id", bid);
        }

        return bid;
    }

    function getDataObjectBindingID(dataObject) {
        var bid = dataObject["jpvs.binding.id"];
        if (!bid) {
            bid = jpvs.randomString(20);
            dataObject["jpvs.binding.id"] = bid;
        }

        return bid;
    }

    function onElementPropertyChange(relation, element, elementPropertyName, onChangeAction, onChangeDetected) {
        //Monitor for changes. When a change is detected, execute the on-change action
        //Get the function for reading the element property
        var getter = getterElementProperty(element, elementPropertyName);

        //Monitor for changes by putting all the necessary info into the changeMonitorQueue
        changeMonitorQueue.put(relation.idFrom, relation.idTo, element, getter, function (value) {
            //When the change monitor detects a change, we must execute the action
            if (onChangeAction(value)) {
                //And signal the event (towards the data object) only if the value has changed
                //(the onChangeAction returns true if the value has changed)
                if (onChangeDetected)
                    onChangeDetected(false, true);
            }
        });
    }

    function onDataObjectPropertyChange(relation, dataObject, objectPropertyName, element, onChangeAction, onChangeDetected) {
        //Monitor for changes. When a change is detected, execute the on-change action
        //Get the function for reading the dataObject property
        var getter = getterDataObjectProperty(dataObject, objectPropertyName);

        //Monitor for changes by putting all the necessary info into the changeMonitorQueue
        changeMonitorQueue.put(relation.idFrom, relation.idTo, element, getter, function (value) {
            //When the change monitor detects a change, we must execute the action
            if (onChangeAction(value)) {
                //And signal the event (towards the element) only if the value has changed
                //(the onChangeAction returns true if the value has changed)
                if (onChangeDetected)
                    onChangeDetected(true, false);
            }
        });
    }

    function decodeObjectPropertySpec(objectPropertySpec) {
        var objectPropertyName = objectPropertySpec;
        var mustInvert = false;

        //Special case: if the objectPropertyName starts with ! we have to invert the value
        if (objectPropertySpec.indexOf("!") == 0) {
            //Inversion required
            mustInvert = true;
            objectPropertyName = objectPropertySpec.substring(1);
        }

        return {
            name: objectPropertyName,
            mustInvert: mustInvert,

            translate: translateFunc
        };

        function translateFunc(val) {
            return this.mustInvert ? !val : val;
        }
    }

    function getterDataObjectProperty(dataObject, objectPropertySpec) {
        //Handle special object property syntax
        var objectPropertyInfo = decodeObjectPropertySpec(objectPropertySpec);

        //Read the data object property
        var prop = dataObject[objectPropertyInfo.name];
        if (typeof (prop) == "function") {
            //It's a jpvs.property; the getter must read from the property
            return function () {
                var val = prop();
                return objectPropertyInfo.translate(val);
            };
        }
        else {
            //It's a normal value; the getter must simply read the current value
            return function () {
                var val = dataObject[objectPropertyInfo.name];
                return objectPropertyInfo.translate(val);
            };
        }
    }

    //These setters must return true if they change the value
    function setterDataObjectProperty(dataObject, objectPropertySpec) {
        //Handle special object property syntax
        var objectPropertyInfo = decodeObjectPropertySpec(objectPropertySpec);

        //Set the data object property
        var prop = dataObject[objectPropertyInfo.name];
        if (typeof (prop) == "function") {
            //It's a jpvs.property; the setter must assign the value to the property
            return function (value) {
                var oldValue = prop();
                var valueTranslated = objectPropertyInfo.translate(value);

                prop(valueTranslated);
                return !valueEquals(valueTranslated, oldValue);
            };
        }
        else {
            //It's a normal value; the setter must overwrite it with the new one
            return function (value) {
                var oldValue = dataObject[objectPropertyInfo.name];
                var valueTranslated = objectPropertyInfo.translate(value);

                dataObject[objectPropertyInfo.name] = valueTranslated;
                return !valueEquals(valueTranslated, oldValue);
            };
        }
    }

    function getterElementProperty(element, elementPropertyName) {
        //If element is a widget, let's first try to use it as a widget by accessing its properties
        var widget = jpvs.find(element);
        if (widget) {
            //Let's see if widget has a property with that name
            var prop = widget[elementPropertyName];
            if (typeof (prop) == "function") {
                //It's a jpvs.property; the getter must read the value from the property
                return function () {
                    return prop.call(widget);
                };
            }
        }

        //If, by examining the widget, the problem is not solved, then let's try to access element attributes or jQuery
        //functions or pseudo-properties
        if (elementPropertyName.toLowerCase().substring(0, 7) == "jquery.") {
            //jQuery function
            return function () {
                return element[elementPropertyName.substring(7)]();
            };
        }
        else if (elementPropertyName == "#visible") {
            //"visible" pseudo-property
            return function () {
                return element.css("display") != "none" && element.css("visibility") != "hidden";
            };
        }
        else if (elementPropertyName.substring(0, 1) == "#") {
            //Starts with # but not among the allowed ones
            alert("Invalid jpvs data-binding directive: " + elementPropertyName);
        }
        else {
            //Generic attribute
            return function () {
                return element.attr(elementPropertyName);
            };
        }
    }

    //These setters must return true if the new value is different from the old value
    function setterElementProperty(element, elementPropertyName) {
        //If element is a widget, let's first try to use it as a widget by accessing its properties
        var widget = jpvs.find(element);
        if (widget) {
            //Let's see if widget has a property with that name
            var prop = widget[elementPropertyName];
            if (typeof (prop) == "function") {
                //It's a jpvs.property; the setter must assign the value to the property
                return function (value) {
                    //We want to assign it only if it is different, so we don't trigger side effects
                    if (!valueEquals(value, prop.call(widget))) {
                        prop.call(widget, value);
                        return true;
                    }
                    else
                        return false;
                };
            }
        }

        //If, by examining the widget, the problem is not solved, then let's try to access element attributes or jQuery
        //functions or pseudo-properties
        if (elementPropertyName.toLowerCase().substring(0, 7) == "jquery.") {
            //jQuery function
            return function (value) {
                //We want to assign it only if it is different, so we don't trigger side effects
                if (!valueEquals(value, element[elementPropertyName.substring(7)]())) {
                    element[elementPropertyName.substring(7)](value);
                    return true;
                }
                else
                    return false;
            };
        }
        else if (elementPropertyName == "#visible") {
            //"visible" pseudo-property
            return function (value) {
                var oldValue = element.css("display") != "none" && element.css("visibility") != "hidden";
                if (value)
                    element.show();
                else
                    element.hide();

                return value != oldValue;
            };
        }
        else if (elementPropertyName.substring(0, 1) == "#") {
            //Starts with # but not among the allowed ones
            alert("Invalid jpvs data-binding directive: " + elementPropertyName);
        }
        else {
            //Generic attribute
            return function (value) {
                //We want to assign it only if it is different, so we don't trigger side effects
                if (!valueEquals(value, element.attr(elementPropertyName))) {
                    element.attr(elementPropertyName, value);
                    return true;
                }
                else
                    return false;
            };
        }
    }

    //Function used to determine if a value has changed or if it is equal to its old value
    function valueEquals(a, b) {
        return jpvs.equals(a, b);
    }

    var chgMonitorThread;

    function enableChangeMonitor() {
        if (!chgMonitorThread) {
            chgMonitorThread = setInterval(changeMonitor, 200);
        }
    }

    function disableChangeMonitor() {
        if (chgMonitorThread) {
            clearInterval(chgMonitorThread);
            chgMonitorThread = null;
        }
    }

    function ChangeMonitorQueue() {
        this.relations = {};
    }

    ChangeMonitorQueue.prototype.clearAll = function () {
        this.relations = {};
    };

    ChangeMonitorQueue.prototype.put = function (idFrom, idTo, element, getter, onChangeAction) {
        this.relations[idFrom + "§" + idTo] = {
            idFrom: idFrom,
            idTo: idTo,
            element: element,
            getter: getter,
            onChangeAction: onChangeAction,
            curValue: getter()
        };
    };

    var changeMonitorQueue = new ChangeMonitorQueue();

    function changeMonitor() {
        //Let's process the queue looking for changes
        var changes;
        var changedSomething = true;
        while (changedSomething) {
            changes = {};
            changedSomething = false;
            $.each(changeMonitorQueue.relations, function (key, item) {
                var newValue = item.getter();
                if (!valueEquals(newValue, item.curValue)) {
                    //Change detected: let's set the changed flag
                    changes[item.idFrom] = item.getter;
                    changedSomething = true;
                }
            });

            //Now, we know what changed. Let's propagate the new values one at a time
            $.each(changes, function (idFrom, getter) {
                var newValue = getter();

                //Let's apply the newValue to all the relations starting from idFrom
                $.each(changeMonitorQueue.relations, function (key, item) {
                    if (item.idFrom == idFrom) {
                        //Let's apply the value to this relation's destination
                        item.onChangeAction(newValue);

                        //And set the curValue of the source
                        item.curValue = newValue;
                    }
                });
            });
        }
    }

})();

/* JPVS
Module: core
Classes: jpvs
Depends: bootstrap
*/

(function () {

    //If X is a jpvs widget, get the jQuery object representing the main content element of X
    //Otherwise, return X
    function toElement(X) {
        if (!X)
            return X;

        if (X.getMainContentElement)
            return X.getMainContentElement();
        else
            return $(X);
    }

    jpvs.getElementIfWidget = toElement;

    //All widget definitions
    jpvs.widgetDefs = [];

    //All widgets, by ID and by element
    jpvs.widgets = {};

    jpvs.find = function (selector) {
        var elem = $(selector);
        if (elem.length == 0)
            return null;
        else if (elem.length == 1)
            return elem.data("jpvs-widget");
        else {
            var widgets = [];
            elem.each(function () {
                widgets.push($(this).data("jpvs-widget"));
            });

            //Add an "each" method for easily iterating over the returned widgets
            widgets.each = function (action) {
                for (var i = 0; i < widgets.length; i++) {
                    var w = widgets[i];
                    action.call(w, w);
                }
            };

            return widgets;
        }
    };

    jpvs.states = {
        HOVER: "Hover",
        FOCUS: "Focus",
        ERROR: "Error",
        DISABLED: "Disabled"
    };

    jpvs.property = function (propdef) {
        return function (value, flagAsync, onSuccess, onProgress, onError) {
            if (value === undefined) {
                //Get property value (synchronous style)
                return propdef.get.call(this);
            }
            else {
                //Set property value (synchronous/asynchronous style)
                //For synchronous, no callbacks
                //For asynchronous, use callbacks if specified
                //We may have set and/or setTask or none and thus we have a few cases
                if (flagAsync) {
                    //Asynchronous setter --> we prefer setTask
                    if (propdef.setTask) {
                        //Real asynchronous setter (task version)
                        //Get setter task function
                        var task = propdef.setTask.call(this, value);

                        //Now we have a task that knows how to set the property value
                        jpvs.runBackgroundTask(task, onSuccess, onProgress, onError);
                    }
                    else if (propdef.set) {
                        //Dummy asynchronous setter (actually it's just synchronous but with the callback)
                        try {
                            propdef.set.call(this, value);
                            if (onSuccess)
                                onSuccess();
                        }
                        catch (e) {
                            if (onError)
                                onError(e);
                        }
                    }
                    else {
                        //Neither set nor setTask --> nothing to set                
                        //Just call the onSuccess callback
                        if (onSuccess)
                            onSuccess();
                    }
                }
                else {
                    //Synchronous setter --> we prefer set
                    if (propdef.set) {
                        //Real synchronous setter, no callbacks
                        propdef.set.call(this, value);
                    }
                    else if (propdef.setTask) {
                        //Synchronous setter but with a task (we launch it as a foreground task)
                        //Get setter task function
                        var task = propdef.setTask.call(this, value);

                        //Now we have a task that knows how to set the property value
                        //No callbacks
                        jpvs.runForegroundTask(task);
                    }
                    else {
                        //Neither set nor setTask --> nothing to set                
                        //No callbacks
                        //NO OPERATION
                    }
                }

                //At the end always return this for chaining
                return this;
            }
        };
    };

    jpvs.currentLocale = (function () {
        var curLoc = "en";

        return jpvs.property({
            get: function () { return curLoc; },
            set: function (value) { curLoc = value; }
        });
    })();

    jpvs.event = function (widget) {
        return new jpvs.Event(widget);
    };

    jpvs.makeWidget = function (widgetDef) {
        //Keep track of all widget definitions for function createAllWidgets
        jpvs.widgetDefs.push(widgetDef);

        //Widget
        var fn = widgetDef.widget;
        if (!fn)
            throw "Missing widget field in widget definition";

        //Widget creator
        if (!widgetDef.create)
            throw "Missing create function in widget definition";

        //Widget initialization
        if (!widgetDef.init)
            throw "Missing init function in widget definition";

        //Widget name
        fn.__WIDGET__ = widgetDef.type;
        if (!fn.__WIDGET__)
            throw "Missing type field in widget definition";

        //Widget CSS class
        if (!widgetDef.cssClass)
            throw "Missing cssClass field in widget definition";

        //Static methods
        fn.create = create_static(widgetDef);
        fn.attach = attach_static(widgetDef);

        //Instance methods
        fn.prototype.toString = function () { return this.__WIDGET__; };
        fn.prototype.attach = attach(widgetDef);
        fn.prototype.destroy = destroy(widgetDef);
        fn.prototype.focus = focus(widgetDef);
        fn.prototype.addState = addState(widgetDef);
        fn.prototype.removeState = removeState(widgetDef);
        fn.prototype.getMainContentElement = getMainContentElement(widgetDef);

        fn.prototype.id = jpvs.property({
            get: function () { return this.element.attr("id"); },
            set: function (value) { this.element.attr("id", value); }
        });

        fn.prototype.ensureId = function () {
            if (this.id() && this.id() != "")
                return;
            else
                this.id(jpvs.randomString(20));
        };

        //Additional prototype methods defined in "widgetDef"
        if (widgetDef.prototype) {
            $.each(widgetDef.prototype, function (memberName, member) {
                fn.prototype[memberName] = member;
            });
        }

        function create_static(widgetDef) {
            return function (selector) {
                var objs = [];
                selector = selector || document.body;

                //The "selector" may also be a jpvs widget. The following line handles this case
                selector = toElement(selector);

                $(selector).each(function (i, elem) {
                    var obj = widgetDef.create(elem);
                    objs.push(widgetDef.widget.attach(obj));
                });

                if (objs.length == 1)
                    return objs[0];
                else if (objs.length == 0)
                    return undefined;
                else
                    return objs;
            };
        }

        function attach_static(widgetDef) {
            return function (selector) {
                return new widgetDef.widget(selector);
            };
        }

        function attach(widgetDef) {
            return function (selector) {
                if (!selector)
                    return;

                //The "selector" may also be a jpvs widget. The following line handles this case
                selector = toElement(selector);

                this.__WIDGET__ = widgetDef.type;
                this.element = $(selector);

                //Decorate with CSS
                this.element.addClass("Widget");
                this.element.addClass(widgetDef.cssClass);

                //Initialize widget behavior
                init(this);
                widgetDef.init.call(this, this);

                //Put in collection
                jpvs.widgets[this.element.attr("id")] = this;
                this.element.data("jpvs-widget", this);
            };
        }

        function destroy(widgetDef) {
            return function () {
                var execDefault = true;

                if (widgetDef.destroy)
                    execDefault = widgetDef.destroy.call(this, this);

                if (execDefault) {
                    //The default behavior is to remove the element from the DOM.
                    //The default behavior is suppressed
                    this.element.remove();
                }
            };
        }

        function getMainContentElement(widgetDef) {
            return function () {
                //If the widget definition defines a "getMainContentElement" function, let's call it
                if (widgetDef.getMainContentElement)
                    return widgetDef.getMainContentElement.call(this, this);

                //Otherwise, the default behavior: let's return THE "element"
                return this.element;
            };
        }

        function init(W) {
            //Hovering
            W.element.hover(function () {
                W.addState(jpvs.states.HOVER);
            }, function () {
                W.removeState(jpvs.states.HOVER);
            });

            //Focusing
            W.element.focusin(function () {
                W.addState(jpvs.states.FOCUS);
            });

            W.element.focusout(function () {
                W.removeState(jpvs.states.FOCUS);
            });
        }

        function focus(widgetDef) {
            return function () {
                if (widgetDef.focus)
                    widgetDef.focus.call(this, this);
                else
                    this.element.focus();

                return this;
            };
        }

        function addState(wd) {
            return function (state) {
                this.element.addClass("Widget-" + state);
                this.element.addClass(wd.cssClass + "-" + state);

                return this;
            };
        }

        function removeState(wd) {
            return function (state) {
                this.element.removeClass("Widget-" + state);
                this.element.removeClass(wd.cssClass + "-" + state);

                return this;
            };
        }
    };


    jpvs.createAllWidgets = function () {
        $("*").each(function () {
            //Loop over all elements and attach a widget, as appropriate
            var obj = this;
            var $this = $(obj);
            var type = $this.data("jpvsType");
            if (type) {
                //If "data-jpvs-type" is specified, apply it
                var widget = jpvs[type];
                if (widget) {
                    widget.attach(this);
                    return;
                }
            }

            //If no "data-jpvs-type" is specified or if didn't manage to attach anything, then select the first appropriate widget, if any,
            //and attach it (default behavior)
            $.each(jpvs.widgetDefs, function (i, wd) {
                //Let's see if "wd" is an appropriate widget definition for "obj"
                if (wd.canAttachTo && wd.canAttachTo(obj)) {
                    //Yes, the widget said it can be attached to "obj"
                    wd.widget.attach(obj);
                    return false;
                }
            });
        });
    };


    jpvs.write = function (container, text) {
        if (!container)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = toElement(container);

        if (text) {
            //Handle multiple lines
            text = text.replace("\r", "");
            var lines = text.split("\n");
            if (lines.length == 1)
                $(container).append(document.createTextNode(lines[0]));
            else if (lines.length > 1) {
                $.each(lines, function (i, line) {
                    $(container).append(document.createTextNode(line));
                    $(container).append(document.createElement("br"));
                });
            }
        }
    };

    jpvs.writeln = function (container, text) {
        if (!container)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = toElement(container);

        jpvs.write(container, text);
        $(container).append(document.createElement("br"));
    };

    jpvs.writeTag = function (container, tagName, text) {
        if (!container)
            return;
        if (!tagName)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = toElement(container);

        var tag = document.createElement(tagName);
        $(container).append(tag);
        jpvs.write(tag, text);

        return $(tag);
    };

    jpvs.applyTemplate = function (container, template, dataItem) {
        if (!container)
            return;
        if (!template)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        container = toElement(container);

        /*
        When used with DataGrid, the template might be in the form { isHeader: true, template: .... }
        */
        if (template.template)
            return jpvs.applyTemplate(container, template.template, dataItem);

        /*
        The template might be a string, in which case we just write it
        */
        if (typeof (template) == "string") {
            jpvs.write(container, template);
            return;
        }

        /*
        Or it could be in the form: { fieldName: "ABC", tagName: "TAG", css: {}, selector: function(fieldValue, dataItem) {} }.
        Extract dataItem.ABC and write it as text (optionally in the specified tag name).
        */
        if (template.fieldName) {
            var fieldValue = dataItem && dataItem[template.fieldName];
            if (template.selector)
                fieldValue = template.selector(fieldValue, dataItem);
            else
                fieldValue = fieldValue && fieldValue.toString();

            if (template.tagName)
                jpvs.writeTag(container, template.tagName, fieldValue);
            else
                jpvs.write(container, fieldValue);

            //Apply CSS by means of jQuery.css()
            if (template.css)
                container.css(template.css);

            return;
        }

        /*
        Or it could be a function. Call it with this = container.
        */
        if (typeof (template) == "function")
            return template.call($(container), dataItem);

        /*
        Don't know what to do here.
        */
        jpvs.alert("JPVS Error", "The specified template is not valid.");
    };

    /*
    This function handles extraction of data from various types of data sources and returns data asynchronously to a callback.
    The object passed to the callback is as follows: 
    {
    total: total number of records in the full data set,
    start: offset in the data set of the first record returned in the "data" field,
    count: number of records returned in the "data" field; this is <= total,
    data: array with the returned records
    }

    Parameter "start" is optional. When not specified (null or undefined), 0 is implied.
    Parameter "count" is optional. When not specified (null or undefined), the entire data set is returned.
    Parameter "options" is optional and may contain sorting/filtering options. When not specified, the default sort/filter is intended.
    */
    jpvs.readDataSource = function (data, start, count, options, callback) {
        if (!data) {
            //No data source provided. Return no data.
            returnNoData();
        }
        else if (typeof (data) == "function") {
            //The data source is a function. It might be either synchronous or asynchronous.
            //Let's try to call it and see what comes back. Pass whatever comes back to our internalCallback function.
            var ret = data(start, count, options, internalCallback);

            if (ret === undefined) {
                //No return value. The function is probably asynchronous. The internalCallback will receive the data.
            }
            else if (ret === null) {
                //The function explicitly returned null. Means "no data". Let's return no data.
                returnNoData();
            }
            else {
                //The function explicitly returned something. That's the data we are looking for. Let's pass it to the internal callback
                internalCallback(ret);
            }
        }
        else if (data.length) {
            //"data" is a static collection of records, not a function. We are supposed to return records between start and start+count
            var tot = data.length;
            var sliceStart = Math.max(0, start || 0);
            var dataPortion;
            if (count === undefined || count === null) {
                //Get from start to end
                dataPortion = data.slice(sliceStart);
            }
            else {
                //Get from start to start+count
                var sliceCount = Math.max(0, count || 0);
                var sliceEnd = sliceStart + sliceCount;
                dataPortion = data.slice(sliceStart, sliceEnd);
            }

            callback({
                total: tot,
                start: sliceStart,
                count: dataPortion.length,
                data: dataPortion
            });
        }
        else {
            //"data" is not an array-like object. Let's return no data
            returnNoData();
        }

        function returnNoData() {
            callback({
                total: 0,
                start: 0,
                count: 0,
                data: []
            });
        }

        function internalCallback(val) {
            /*
            "val" is the return value of the "data" function. It might be a plain array or it might be structured as a partial data set.
            */
            if (val.total && val.data) {
                //Return it directly
                callback({
                    total: val.total,
                    start: val.start || 0,
                    count: val.data.length || 0,
                    data: val.data
                });
            }
            else if (val.length) {
                //The function returned an array. We must assume this is the entire data set, since we have no info as to which part it is.
                callback({
                    total: val.length,
                    start: 0,
                    count: val.length,
                    data: val
                });
            }
            else {
                //No data or unknown format
                returnNoData();
            }
        }
    };


    jpvs.showDimScreen = function (delayMilliseconds, fadeInDuration, template) {
        //Schedule creation
        if (jpvs.showDimScreen.timeout)
            return;

        jpvs.showDimScreen.timeout = setTimeout(create, delayMilliseconds != null ? delayMilliseconds : 500);

        function create() {
            jpvs.showDimScreen.timeout = null;

            if (jpvs.showDimScreen.element)
                return;

            //Create a DIV that covers the entire window
            jpvs.showDimScreen.element = jpvs.writeTag("body", "div").addClass("DimScreen").css({
                position: "fixed",
                top: "0px", left: "0px", width: "100%", height: "100%",
                display: "none"
            });

            //If provided, we can use a custom template for filling the DIV
            jpvs.applyTemplate(jpvs.showDimScreen.element, template);

            //Finally, fade in the DIV
            jpvs.showDimScreen.element.fadeIn(fadeInDuration != null ? fadeInDuration : 250);
        }
    };

    jpvs.hideDimScreen = function (fadeOutDuration) {
        //If we are still waiting for the timeout to elapse, simply cancel the timeout
        if (jpvs.showDimScreen.timeout) {
            clearTimeout(jpvs.showDimScreen.timeout);
            jpvs.showDimScreen.timeout = null;
        }

        //If a screen dimmer is present, fade it out and remove it
        if (jpvs.showDimScreen.element) {
            var x = jpvs.showDimScreen.element;
            jpvs.showDimScreen.element = null;
            x.fadeOut(fadeOutDuration != null ? fadeOutDuration : 250, function () { x.remove(); });
        }
    };

    jpvs.fitInWindow = function (element) {
        if (!element)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        element = toElement(element);

        //Measure the element, relative to the document
        var pos = element.offset();
        var x = pos.left;
        var y = pos.top;
        var w = element.outerWidth();
        var h = element.outerHeight();

        //Measure the window, relative to the document and account for scrolling
        var wnd = $(window);
        var wx = wnd.scrollLeft();
        var wy = wnd.scrollTop();
        var ww = wnd.width();
        var wh = wnd.height();

        //Now move x and y, trying to make sure "element" [valMin, valMax] is entirely visible in the window [min, max]
        var dx = translate(wx, wx + ww, x, x + w);
        var dy = translate(wy, wy + wh, y, y + h);

        if (dx != 0 || dy != 0) {
            var newX = x + dx;
            var newY = y + dy;

            element.show().css({
                position: "absolute",
                left: newX + "px",
                top: newY + "px"
            });
        }

        function translate(min, max, valMin, valMax) {
            if (valMin < min)
                return min - valMin;
            else if (valMax > max)
                return max - valMax;
            else
                return 0;
        }
    };

    jpvs.fixTableHeader = function (element) {
        if (!element)
            return;

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        element = toElement(element);

        //Let's find the element's scrolling container (the first ancestor that has overflow: auto/scroll/hidden)
        var scrollingContainer = element;
        while (true) {
            scrollingContainer = scrollingContainer.parent();
            var test = scrollingContainer[0].nodeName;
            if (!scrollingContainer || scrollingContainer.length == 0 || scrollingContainer[0].nodeName.toLowerCase() == "body") {
                //We have just climbed up to the body, so we have no scrolling container (we scroll the window)
                scrollingContainer = null;
                break;
            } else {
                var overflow = scrollingContainer.css("overflow");
                if (overflow == "auto" || overflow == "scroll" || overflow == "hidden") {
                    //We have found it
                    break;
                }
            }
        }

        //Measure all tbody columns
        var colWidths = [];
        element.find("tbody > tr:first").each(function () {
            $(this).children("td").each(function (i, td) {
                colWidths[i] = $(td).outerWidth();
            });
        });

        //Set fixed table layout and explicitly set columns widths
        var sumOfAllCols = 0;
        $.each(colWidths, function (i, colWidth) {
            sumOfAllCols += colWidth;
        });

        element.css({
            "table-layout": "fixed",
            "width": sumOfAllCols + "px"
        });

        element.children("colgroup, col").remove();

        var colgroup = jpvs.writeTag(element, "colgroup");
        $.each(colWidths, function (i, colWidth) {
            jpvs.writeTag(colgroup, "col").css("width", colWidth + "px");
        });

        //Split the table into two tables. The first one contains the thead, the second the tbody
        var header = element.clone().attr("id", element.attr("id") + "_header");
        header.insertBefore(element);

        header.children("tbody, tfoot").remove();
        element.children("caption, thead").remove();

        //No margin between the two tables
        header.css("margin-bottom", "0px");
        element.css("margin-top", "0px");

        //Placeholder, for keeping other things in place when we use absolute positioning for the header
        var headerPlaceHolder = jpvs.writeTag(element.parent(), "div");
        headerPlaceHolder.insertBefore(element);

        headerPlaceHolder.css({
            width: sumOfAllCols + "px",
            height: header.outerHeight() + "px"
        });

        //On scroll, decide where to put the header
        var yHeaderRTSC;        //Relative To Scrolling Container (or window)
        var calcX, calcY;       //Functions that calculate (x, y) when we must float the header
        measurePosition();

        (scrollingContainer || $(window)).resize(measurePosition).scroll(refreshHeaderPosition);

        //Let's return an object that allows code manipulation (manual refreshing, for now)
        var deactivated = false;

        return {
            refresh: function () {
                //Re-measure and reposition
                measurePosition();
            },

            deactivate: function () {
                deactivated = true;

                //Clean things and move thead back into place; then delete the cloned table
                headerPlaceHolder.remove();
                var thead = header.children("thead");
                var tbody = element.children("tbody");
                thead.insertBefore(tbody);
                element.css("margin-top", header.css("margin-top"));
                header.remove();
            }
        };


        function measurePosition() {
            if (deactivated)
                return;

            //Before measuring, let's reposition the header into its natural location
            setNormal();

            var position = scrollingContainer && scrollingContainer.css("position");
            var absolute = (position == "absolute" || position == "fixed" || position == "relative");

            //From Relative To Offset Parent...
            var xHeaderRTOP = header.position().left;
            var yHeaderRTOP = header.position().top;
            var yScrollingContainerRTOP = 0;
            if (scrollingContainer) {
                if (!absolute)
                    yScrollingContainerRTOP = scrollingContainer.position().top;

                //Also account for scrolling
                xHeaderRTOP += scrollingContainer.scrollLeft();
                yHeaderRTOP += scrollingContainer.scrollTop();
            }

            //...to Relative To Scrolling Container
            yHeaderRTSC = yHeaderRTOP - yScrollingContainerRTOP;

            //Table margins and border sizes in pixels, so we can subtract them when absolute positioning
            var xDelta = parseFloat(header.css("margin-left")) + parseFloat(header.css("border-left-width"));
            var yDelta = parseFloat(header.css("margin-top")) + parseFloat(header.css("border-top-width"));

            //Functions for applying the floating position
            calcY = function () {
                if (scrollingContainer) {
                    if (absolute)
                        return scrollingContainer.scrollTop() - yDelta;
                    else
                        return yScrollingContainerRTOP - yDelta;
                }
                else
                    return $(window).scrollTop() - yDelta;
            };

            calcX = function () {
                if (scrollingContainer)
                    return xHeaderRTOP;
                else
                    return xHeaderRTOP;
            };

            //At the end, let's restore the correct positioning based on scroll state
            refreshHeaderPosition();
        }

        function getScrollingContainerScrollState() {
            var $scr = scrollingContainer || $(window);

            return {
                top: $scr.scrollTop(),
                left: $scr.scrollLeft()
            };
        }

        function refreshHeaderPosition() {
            if (deactivated)
                return;

            //If the header is scrolling upwards out of the container, then fix the header, otherwise leave it in the
            //original position
            var scroll = getScrollingContainerScrollState();
            if (scroll.top > yHeaderRTSC)
                setFloating();
            else
                setNormal();
        }

        function setNormal() {
            headerPlaceHolder.hide();
            header.css({
                position: "static"
            });
        }

        function setFloating() {
            //Float the header
            headerPlaceHolder.show();
            header.css({
                position: "absolute",
                top: calcY() + "px",
                left: calcX() + "px",
                "z-index": 99999
            });
        }
    };

})();

/* JPVS
Module: core
Classes: Event
Depends:
*/

jpvs.Event = function (widget) {
    //The result of "new jpvs.Event(...)" is the object "obj", which has props "widgets" and "handlers" and can also be called as a function
    //(the "bind" function)
    var obj = function (handlerName, handler) {
        return obj.bind(handlerName, handler);
    };

    obj.bind = jpvs.Event.prototype.bind;
    obj.unbind = jpvs.Event.prototype.unbind;
    obj.fire = jpvs.Event.prototype.fire;

    obj.widget = widget;
    obj.handlers = {};
    return obj;
};

jpvs.Event.prototype.bind = function (handlerName, handler) {
    if (!handler) {
        handler = handlerName;
        handlerName = new Date().toString();
    }

    this.handlers[handlerName] = handler;

    return this.widget;
};

jpvs.Event.prototype.unbind = function (handlerName) {
    delete this.handlers[handlerName];
    return this.widget;
};

jpvs.Event.prototype.fire = function (widget, handlerName, params, browserEvent) {
    if (handlerName)
        return fireHandler(this.handlers[handlerName]);
    else {
        var ret = true;
        for (var hn in this.handlers) {
            var h = this.handlers[hn];
            var ret2 = fireHandler(h);

            //Combine the return values of all handlers. If any returns false, we return false
            ret = ret && ret2;
        }

        return ret;
    }

    function fireHandler(handler) {
        if (handler) {
            if (widget)
                widget.currentBrowserEvent = browserEvent;

            var hret = handler.call(widget, params);

            if (widget)
                widget.currentBrowserEvent = null;
            return hret;
        }
    }
};

/* JPVS
Module: utils
Classes: 
Depends: core
*/

/**
* jQuery JSON Plugin
* version: 2.3 (2011-09-17)
*
* This document is licensed as free software under the terms of the
* MIT License: http://www.opensource.org/licenses/mit-license.php
*
* Brantley Harris wrote this plugin. It is based somewhat on the JSON.org
* website's http://www.json.org/json2.js, which proclaims:
* "NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.", a sentiment that
* I uphold.
*
* It is also influenced heavily by MochiKit's serializeJSON, which is
* copyrighted 2005 by Bob Ippolito.
*/

(function () {

    jpvs.parseJSON = function (x) {
        return $.parseJSON(x);
    };

    var escapeable = /["\\\x00-\x1f\x7f-\x9f]/g,
		meta = {
		    '\b': '\\b',
		    '\t': '\\t',
		    '\n': '\\n',
		    '\f': '\\f',
		    '\r': '\\r',
		    '"': '\\"',
		    '\\': '\\\\'
		};

    /**
    * jpvs.toJSON
    * Converts the given argument into a JSON respresentation.
    *
    * @param o {Mixed} The json-serializable *thing* to be converted
    *
    * If an object has a toJSON prototype, that will be used to get the representation.
    * Non-integer/string keys are skipped in the object, as are keys that point to a
    * function.
    *
    */
    jpvs.toJSON = typeof JSON === 'object' && JSON.stringify
		? JSON.stringify
		: function (o) {

		    if (o === null) {
		        return 'null';
		    }

		    var type = typeof o;

		    if (type === 'undefined') {
		        return undefined;
		    }
		    if (type === 'number' || type === 'boolean') {
		        return '' + o;
		    }
		    if (type === 'string') {
		        return quoteString(o);
		    }
		    if (type === 'object') {
		        if (typeof o.toJSON === 'function') {
		            return jpvs.toJSON(o.toJSON());
		        }
		        if (o.constructor === Date) {
		            var month = o.getUTCMonth() + 1,
					day = o.getUTCDate(),
					year = o.getUTCFullYear(),
					hours = o.getUTCHours(),
					minutes = o.getUTCMinutes(),
					seconds = o.getUTCSeconds(),
					milli = o.getUTCMilliseconds();

		            if (month < 10) {
		                month = '0' + month;
		            }
		            if (day < 10) {
		                day = '0' + day;
		            }
		            if (hours < 10) {
		                hours = '0' + hours;
		            }
		            if (minutes < 10) {
		                minutes = '0' + minutes;
		            }
		            if (seconds < 10) {
		                seconds = '0' + seconds;
		            }
		            if (milli < 100) {
		                milli = '0' + milli;
		            }
		            if (milli < 10) {
		                milli = '0' + milli;
		            }
		            return '"' + year + '-' + month + '-' + day + 'T' +
					hours + ':' + minutes + ':' + seconds +
					'.' + milli + 'Z"';
		        }
		        if (o.constructor === Array) {
		            var ret = [];
		            for (var i = 0; i < o.length; i++) {
		                ret.push(jpvs.toJSON(o[i]) || 'null');
		            }
		            return '[' + ret.join(',') + ']';
		        }
		        var name,
				val,
				pairs = [];
		        for (var k in o) {
		            type = typeof k;
		            if (type === 'number') {
		                name = '"' + k + '"';
		            } else if (type === 'string') {
		                name = quoteString(k);
		            } else {
		                // Keys must be numerical or string. Skip others
		                continue;
		            }
		            type = typeof o[k];

		            if (type === 'function' || type === 'undefined') {
		                // Invalid values like these return undefined
		                // from toJSON, however those object members
		                // shouldn't be included in the JSON string at all.
		                continue;
		            }
		            val = jpvs.toJSON(o[k]);
		            pairs.push(name + ':' + val);
		        }
		        return '{' + pairs.join(',') + '}';
		    }
		};

    function quoteString(string) {
        if (string.match(escapeable)) {
            return '"' + string.replace(escapeable, function (a) {
                var c = meta[a];
                if (typeof c === 'string') {
                    return c;
                }
                c = a.charCodeAt();
                return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
            }) + '"';
        }
        return '"' + string + '"';
    }

})();

/* JPVS
Module: parsers
Classes: 
Depends: core
*/


(function () {
    //We use "HTML Clean for jQuery" plugin but we don't want it to strip empty <p></p> paragraphs, so
    //we use a different definition of tagAllowEmpty
    var jpvsTagAllowEmpty = ["p", "th", "td"];

    /*
    HTML Clean for jQuery   
    Anthony Johnston
    http://www.antix.co.uk    
    
    version 1.3.0

    $Revision: 67 $

    requires jQuery http://jquery.com   

    Use and distibution http://www.opensource.org/licenses/bsd-license.php

    2010-04-02 allowedTags/removeTags added (white/black list) thanks to David Wartian (Dwartian)
    2010-06-30 replaceStyles added for replacement of bold, italic, super and sub styles on a tag
    2012-04-30 allowedAttributes added, an array of attributed allowed on the elements
    */
    (function ($) {
        $.fn.htmlClean = function (options) {
            // iterate and html clean each matched element
            return this.each(function () {
                var $this = $(this);
                if (this.value) {
                    this.value = $.htmlClean(this.value, options);
                } else {
                    this.innerHTML = $.htmlClean(this.innerHTML, options);
                }
            });
        };

        // clean the passed html
        $.htmlClean = function (html, options) {
            options = $.extend({}, $.htmlClean.defaults, options);

            var tagsRE = /<(\/)?(\w+:)?([\w]+)([^>]*)>/gi;
            var attrsRE = /(\w+)=(".*?"|'.*?'|[^\s>]*)/gi;

            var tagMatch;
            var root = new Element();
            var stack = [root];
            var container = root;
            var protect = false;

            if (options.bodyOnly) {
                // check for body tag
                if (tagMatch = /<body[^>]*>((\n|.)*)<\/body>/i.exec(html)) {
                    html = tagMatch[1];
                }
            }
            html = html.concat("<xxx>"); // ensure last element/text is found
            var lastIndex;

            while (tagMatch = tagsRE.exec(html)) {
                var tag = new Tag(tagMatch[3], tagMatch[1], tagMatch[4], options);

                // add the text
                var text = html.substring(lastIndex, tagMatch.index);
                if (text.length > 0) {
                    var child = container.children[container.children.length - 1];
                    if (container.children.length > 0
                        && isText(child = container.children[container.children.length - 1])) {
                        // merge text
                        container.children[container.children.length - 1] = child.concat(text);
                    } else {
                        container.children.push(text);
                    }
                }
                lastIndex = tagsRE.lastIndex;

                if (tag.isClosing) {
                    // find matching container
                    if (pop(stack, [tag.name])) {
                        stack.pop();
                        container = stack[stack.length - 1];
                    }
                } else {
                    // create a new element
                    var element = new Element(tag);

                    // add attributes
                    var attrMatch;
                    while (attrMatch = attrsRE.exec(tag.rawAttributes)) {

                        // check style attribute and do replacements
                        if (attrMatch[1].toLowerCase() == "style"
                        && options.replaceStyles) {

                            var renderParent = !tag.isInline;
                            for (var i = 0; i < options.replaceStyles.length; i++) {
                                if (options.replaceStyles[i][0].test(attrMatch[2])) {

                                    if (!renderParent) {
                                        tag.render = false;
                                        renderParent = true;
                                    }
                                    container.children.push(element); // assumes not replaced
                                    stack.push(element);
                                    container = element; // assumes replacement is a container
                                    // create new tag and element
                                    tag = new Tag(options.replaceStyles[i][1], "", "", options);
                                    element = new Element(tag);
                                }
                            }
                        }

                        if (tag.allowedAttributes != null
                            && (tag.allowedAttributes.length == 0
                            || $.inArray(attrMatch[1], tag.allowedAttributes) > -1)) {
                            element.attributes.push(new Attribute(attrMatch[1], attrMatch[2]));
                        }
                    }
                    // add required empty ones
                    $.each(tag.requiredAttributes, function () {
                        var name = this.toString();
                        if (!element.hasAttribute(name)) element.attributes.push(new Attribute(name, ""));
                    });

                    // check for replacements
                    for (var repIndex = 0; repIndex < options.replace.length; repIndex++) {
                        for (var tagIndex = 0; tagIndex < options.replace[repIndex][0].length; tagIndex++) {
                            var byName = typeof (options.replace[repIndex][0][tagIndex]) == "string";
                            if ((byName && options.replace[repIndex][0][tagIndex] == tag.name)
                                || (!byName && options.replace[repIndex][0][tagIndex].test(tagMatch))) {
                                // don't render this tag
                                tag.render = false;
                                container.children.push(element);
                                stack.push(element);
                                container = element;

                                // render new tag, keep attributes
                                tag = new Tag(options.replace[repIndex][1], tagMatch[1], tagMatch[4], options);
                                element = new Element(tag);
                                element.attributes = container.attributes;

                                repIndex = options.replace.length; // break out of both loops
                                break;
                            }
                        }
                    }

                    // check container rules
                    var add = true;
                    if (!container.isRoot) {
                        if (container.tag.isInline && !tag.isInline) {
                            add = false;
                        } else if (container.tag.disallowNest && tag.disallowNest
                                && !tag.requiredParent) {
                            add = false;
                        } else if (tag.requiredParent) {
                            if (add = pop(stack, tag.requiredParent)) {
                                container = stack[stack.length - 1];
                            }
                        }
                    }

                    if (add) {
                        container.children.push(element);

                        if (tag.toProtect) {
                            // skip to closing tag
                            while (tagMatch2 = tagsRE.exec(html)) {
                                var tag2 = new Tag(tagMatch2[3], tagMatch2[1], tagMatch2[4], options);
                                if (tag2.isClosing && tag2.name == tag.name) {
                                    element.children.push(RegExp.leftContext.substring(lastIndex));
                                    lastIndex = tagsRE.lastIndex;
                                    break;
                                }
                            }
                        } else {
                            // set as current container element
                            if (!tag.isSelfClosing && !tag.isNonClosing) {
                                stack.push(element);
                                container = element;
                            }
                        }
                    }
                }
            }

            // render doc
            return $.htmlClean.trim(render(root, options).join(""));
        };

        // defaults
        $.htmlClean.defaults = {
            // only clean the body tagbody
            bodyOnly: true,
            // only allow tags in this array, (white list), contents still rendered
            allowedTags: [],
            // remove tags in this array, (black list), contents still rendered
            removeTags: ["basefont", "center", "dir", "font", "frame", "frameset", "iframe", "isindex", "menu", "noframes", "s", "strike", "u"],
            // array of [attributeName], [optional array of allowed on elements] e.g. [["id"], ["style", ["p", "dl"]]] // allow all elements to have id and allow style on 'p' and 'dl'
            allowedAttributes: [],
            // array of attribute names to remove on all elements in addition to those not in tagAttributes e.g ["width", "height"]
            removeAttrs: [],
            // array of [className], [optional array of allowed on elements] e.g. [["aClass"], ["anotherClass", ["p", "dl"]]]
            allowedClasses: [],
            // format the result
            format: false,
            // format indent to start on
            formatIndent: 0,
            // tags to replace, and what to replace with, tag name or regex to match the tag and attributes 
            replace: [
            [["b", "big"], "strong"],
            [["i"], "em"]
        ],
            // styles to replace with tags, multiple style matches supported, inline tags are replaced by the first match blocks are retained
            replaceStyles: [
            [/font-weight:\s*bold/i, "strong"],
            [/font-style:\s*italic/i, "em"],
            [/vertical-align:\s*super/i, "sup"],
            [/vertical-align:\s*sub/i, "sub"]
        ]
        };

        function applyFormat(element, options, output, indent) {
            if (!element.tag.isInline && output.length > 0) {
                output.push("\n");
                for (i = 0; i < indent; i++) output.push("\t");
            }
        }

        function render(element, options) {
            var output = [], empty = element.attributes.length == 0, indent;
            var openingTag = this.name.concat(element.tag.rawAttributes == undefined ? "" : element.tag.rawAttributes);

            // don't render if not in allowedTags or in removeTags
            var renderTag
            = element.tag.render
                && (options.allowedTags.length == 0 || $.inArray(element.tag.name, options.allowedTags) > -1)
                && (options.removeTags.length == 0 || $.inArray(element.tag.name, options.removeTags) == -1);

            if (!element.isRoot && renderTag) {
                // render opening tag
                output.push("<");
                output.push(element.tag.name);
                $.each(element.attributes, function () {
                    if ($.inArray(this.name, options.removeAttrs) == -1) {
                        var m = RegExp(/^(['"]?)(.*?)['"]?$/).exec(this.value);
                        var value = m[2];
                        var valueQuote = m[1] || "\"";

                        // check for classes allowed
                        if (this.name == "class") {
                            value =
                            $.grep(value.split(" "), function (c) {
                                return $.grep(options.allowedClasses, function (a) {
                                    return a[0] == c && (a.length == 1 || $.inArray(element.tag.name, a[1]) > -1);
                                }).length > 0;
                            })
                            .join(" ");
                            valueQuote = "\"";
                        }

                        if (value != null && (value.length > 0 || $.inArray(this.name, element.tag.requiredAttributes) > -1)) {
                            output.push(" ");
                            output.push(this.name);
                            output.push("=");
                            output.push(valueQuote);
                            output.push(value);
                            output.push(valueQuote);
                        }
                    }
                });
            }

            if (element.tag.isSelfClosing) {
                // self closing 
                if (renderTag) output.push(" />");
                empty = false;
            } else if (element.tag.isNonClosing) {
                empty = false;
            } else {
                if (!element.isRoot && renderTag) {
                    // close
                    output.push(">");
                }

                var indent = options.formatIndent++;

                // render children
                if (element.tag.toProtect) {
                    var outputChildren = $.htmlClean.trim(element.children.join("")).replace(/<br>/ig, "\n");
                    output.push(outputChildren);
                    empty = outputChildren.length == 0;
                } else {
                    var outputChildren = [];
                    for (var i = 0; i < element.children.length; i++) {
                        var child = element.children[i];
                        var text = $.htmlClean.trim(textClean(isText(child) ? child : child.childrenToString()));
                        if (isInline(child)) {
                            if (i > 0 && text.length > 0
                        && (startsWithWhitespace(child) || endsWithWhitespace(element.children[i - 1]))) {
                                outputChildren.push(" ");
                            }
                        }
                        if (isText(child)) {
                            if (text.length > 0) {
                                outputChildren.push(text);
                            }
                        } else {
                            // don't allow a break to be the last child
                            if (i != element.children.length - 1 || child.tag.name != "br") {
                                if (options.format) applyFormat(child, options, outputChildren, indent);
                                outputChildren = outputChildren.concat(render(child, options));
                            }
                        }
                    }
                    options.formatIndent--;

                    if (outputChildren.length > 0) {
                        if (options.format && outputChildren[0] != "\n") applyFormat(element, options, output, indent);
                        output = output.concat(outputChildren);
                        empty = false;
                    }
                }

                if (!element.isRoot && renderTag) {
                    // render the closing tag
                    if (options.format) applyFormat(element, options, output, indent - 1);
                    output.push("</");
                    output.push(element.tag.name);
                    output.push(">");
                }
            }

            // check for empty tags
            if (!element.tag.allowEmpty && empty) { return []; }

            return output;
        }

        // find a matching tag, and pop to it, if not do nothing
        function pop(stack, tagNameArray, index) {
            index = index || 1;
            if ($.inArray(stack[stack.length - index].tag.name, tagNameArray) > -1) {
                return true;
            } else if (stack.length - (index + 1) > 0
                && pop(stack, tagNameArray, index + 1)) {
                stack.pop();
                return true;
            }
            return false;
        }

        // Element Object
        function Element(tag) {
            if (tag) {
                this.tag = tag;
                this.isRoot = false;
            } else {
                this.tag = new Tag("root");
                this.isRoot = true;
            }
            this.attributes = [];
            this.children = [];

            this.hasAttribute = function (name) {
                for (var i = 0; i < this.attributes.length; i++) {
                    if (this.attributes[i].name == name) return true;
                }
                return false;
            };

            this.childrenToString = function () {
                return this.children.join("");
            };

            return this;
        }

        // Attribute Object
        function Attribute(name, value) {
            this.name = name;
            this.value = value;

            return this;
        }

        // Tag object
        function Tag(name, close, rawAttributes, options) {
            this.name = name.toLowerCase();

            this.isSelfClosing = $.inArray(this.name, tagSelfClosing) > -1;
            this.isNonClosing = $.inArray(this.name, tagNonClosing) > -1;
            this.isClosing = (close != undefined && close.length > 0);

            this.isInline = $.inArray(this.name, tagInline) > -1;
            this.disallowNest = $.inArray(this.name, tagDisallowNest) > -1;
            this.requiredParent = tagRequiredParent[$.inArray(this.name, tagRequiredParent) + 1];
            this.allowEmpty = $.inArray(this.name, tagAllowEmpty) > -1;

            this.toProtect = $.inArray(this.name, tagProtect) > -1;

            this.rawAttributes = rawAttributes;
            this.requiredAttributes = tagAttributesRequired[$.inArray(this.name, tagAttributesRequired) + 1];

            if (options) {
                if (!options.tagAttributesCache) options.tagAttributesCache = [];
                if ($.inArray(this.name, options.tagAttributesCache) == -1) {
                    var cacheItem = tagAttributes[$.inArray(this.name, tagAttributes) + 1].slice(0);

                    // add extra ones from options
                    for (var i = 0; i < options.allowedAttributes.length; i++) {
                        var attrName = options.allowedAttributes[i][0];
                        if ((
                            options.allowedAttributes[i].length == 1
                            || $.inArray(this.name, options.allowedAttributes[i][1]) > -1
                            ) && $.inArray(attrName, cacheItem) == -1) {
                            cacheItem.push(attrName);
                        }
                    }

                    options.tagAttributesCache.push(this.name);
                    options.tagAttributesCache.push(cacheItem);
                }

                this.allowedAttributes = options.tagAttributesCache[$.inArray(this.name, options.tagAttributesCache) + 1];
            }

            this.render = true;

            return this;
        }

        function startsWithWhitespace(item) {
            while (isElement(item) && item.children.length > 0) { item = item.children[0] }
            return isText(item) && item.length > 0 && $.htmlClean.isWhitespace(item.charAt(0));
        }
        function endsWithWhitespace(item) {
            while (isElement(item) && item.children.length > 0) { item = item.children[item.children.length - 1] }
            return isText(item) && item.length > 0 && $.htmlClean.isWhitespace(item.charAt(item.length - 1));
        }
        function isText(item) { return item.constructor == String; }
        function isInline(item) { return isText(item) || item.tag.isInline; }
        function isElement(item) { return item.constructor == Element; }
        function textClean(text) {
            return text
            .replace(/&nbsp;|\n/g, " ")
            .replace(/\s\s+/g, " ");
        }

        // trim off white space, doesn't use regex
        $.htmlClean.trim = function (text) {
            return $.htmlClean.trimStart($.htmlClean.trimEnd(text));
        };
        $.htmlClean.trimStart = function (text) {
            return text.substring($.htmlClean.trimStartIndex(text));
        };
        $.htmlClean.trimStartIndex = function (text) {
            for (var start = 0; start < text.length - 1 && $.htmlClean.isWhitespace(text.charAt(start)); start++);
            return start;
        };
        $.htmlClean.trimEnd = function (text) {
            return text.substring(0, $.htmlClean.trimEndIndex(text));
        };
        $.htmlClean.trimEndIndex = function (text) {
            for (var end = text.length - 1; end >= 0 && $.htmlClean.isWhitespace(text.charAt(end)); end--);
            return end + 1;
        };
        // checks a char is white space or not
        $.htmlClean.isWhitespace = function (c) { return $.inArray(c, whitespace) != -1; };

        // tags which are inline
        var tagInline = [
        "a", "abbr", "acronym", "address", "b", "big", "br", "button",
        "caption", "cite", "code", "del", "em", "font",
        "hr", "i", "input", "img", "ins", "label", "legend", "map", "q",
        "s", "samp", "select", "small", "span", "strike", "strong", "sub", "sup",
        "tt", "u", "var"];
        var tagDisallowNest = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "th", "td"];

        //The tags that are allowed to be empty can be changed by JPVS
        var tagAllowEmpty = jpvsTagAllowEmpty || ["th", "td"];

        var tagRequiredParent = [
        null,
        "li", ["ul", "ol"],
        "dt", ["dl"],
        "dd", ["dl"],
        "td", ["tr"],
        "th", ["tr"],
        "tr", ["table", "thead", "tbody", "tfoot"],
        "thead", ["table"],
        "tbody", ["table"],
        "tfoot", ["table"]
        ];
        var tagProtect = ["script", "style", "pre", "code"];
        // tags which self close e.g. <br />
        var tagSelfClosing = ["br", "hr", "img", "link", "meta"];
        // tags which do not close
        var tagNonClosing = ["!doctype", "?xml"];
        // attributes allowed on tags
        var tagAttributes = [
            ["class"],  // default, for all tags not mentioned
            "?xml", [],
            "!doctype", [],
            "a", ["accesskey", "class", "href", "name", "title", "rel", "rev", "type", "tabindex"],
            "abbr", ["class", "title"],
            "acronym", ["class", "title"],
            "blockquote", ["cite", "class"],
            "button", ["class", "disabled", "name", "type", "value"],
            "del", ["cite", "class", "datetime"],
            "font", ["face", "size", "color"],
            "form", ["accept", "action", "class", "enctype", "method", "name"],
            "input", ["accept", "accesskey", "alt", "checked", "class", "disabled", "ismap", "maxlength", "name", "size", "readonly", "src", "tabindex", "type", "usemap", "value"],
            "img", ["alt", "class", "height", "src", "width"],
            "ins", ["cite", "class", "datetime"],
            "label", ["accesskey", "class", "for"],
            "legend", ["accesskey", "class"],
            "link", ["href", "rel", "type"],
            "meta", ["content", "http-equiv", "name", "scheme", "charset"],
            "map", ["name"],
            "optgroup", ["class", "disabled", "label"],
            "option", ["class", "disabled", "label", "selected", "value"],
            "q", ["class", "cite"],
            "script", ["src", "type"],
            "select", ["class", "disabled", "multiple", "name", "size", "tabindex"],
            "style", ["type"],
            "table", ["class", "summary"],
            "th", ["class", "colspan", "rowspan"],
            "td", ["class", "colspan", "rowspan"],
            "textarea", ["accesskey", "class", "cols", "disabled", "name", "readonly", "rows", "tabindex"]
        ];
        var tagAttributesRequired = [[], "img", ["alt"]];
        // white space chars
        var whitespace = [" ", " ", "\t", "\n", "\r", "\f"];

    })(jQuery);


    /*
    Wrapper for the jquery-clean plugin above
    */
    jpvs.cleanHtml = function (html, options) {
        //Default options are for cleaning HTML code typically written in javascript HTML editor controls
        var defaultOptions = {
            bodyOnly: false,
            allowedTags: ["h1", "h2", "h3", "h4", "h5", "h6", "br", "hr", "div", "span", "img", "p", "font", "ul", "ol", "li", "i", "em", "b", "strong", "u", "sup", "sub", "table", "thead", "tbody", "tfoot", "tr", "td", "th"],
            removeTags: [null],
            // array of [attributeName], [optional array of allowed on elements] e.g. [["id"], ["style", ["p", "dl"]]] // allow all elements to have id and allow style on 'p' and 'dl'
            allowedAttributes: [["style"], ["align"], ["src", ["img"]]],
            // array of attribute names to remove on all elements in addition to those not in tagAttributes e.g ["width", "height"]
            removeAttrs: [],
            // array of [className], [optional array of allowed on elements] e.g. [["aClass"], ["anotherClass", ["p", "dl"]]]
            allowedClasses: [],
            // format the result
            format: false,
            // format indent to start on
            formatIndent: 0,
            // tags to replace, and what to replace with, tag name or regex to match the tag and attributes 
            replace: [
                [["b", "big"], "strong"],
                [["i"], "em"]
            ],
            // styles to replace with tags, multiple style matches supported, inline tags are replaced by the first match blocks are retained
            replaceStyles: [
                [/font-weight:\s*bold/i, "strong"],
                [/font-style:\s*italic/i, "em"],
                [/vertical-align:\s*super/i, "sup"],
                [/vertical-align:\s*sub/i, "sub"]
            ]
        };

        //Now clean
        return jQuery.htmlClean(html || "", options || defaultOptions);
    };

    jpvs.stripHtml = function (html) {
        //Options that allow no tags
        var options = {
            bodyOnly: false,
            allowedTags: [null],
            removeTags: [],
            // array of [attributeName], [optional array of allowed on elements] e.g. [["id"], ["style", ["p", "dl"]]] // allow all elements to have id and allow style on 'p' and 'dl'
            allowedAttributes: [],
            // array of attribute names to remove on all elements in addition to those not in tagAttributes e.g ["width", "height"]
            removeAttrs: [],
            // array of [className], [optional array of allowed on elements] e.g. [["aClass"], ["anotherClass", ["p", "dl"]]]
            allowedClasses: [],
            // format the result
            format: false,
            // format indent to start on
            formatIndent: 0,
            // tags to replace, and what to replace with, tag name or regex to match the tag and attributes 
            replace: [],
            // styles to replace with tags, multiple style matches supported, inline tags are replaced by the first match blocks are retained
            replaceStyles: []
        };

        //Now clean
        return jQuery.htmlClean(html || "", options);
    };

})();

/*
****************************************
SVG-to-JSON parser
****************************************



EXAMPLE

Given this SVG image:

<svg xmlns="http://www.w3.org/2000/svg">
<circle cx="100" cy="50" r="40" style="stroke:brown;stroke-width:5;fill:#00FF00" />
</svg> 

The following call:

var svg = SvgParser.parseString("<svg xmlns=\"http://www.w3.org/2000/svg\">\n\t<circle cx=\"100\" cy=\"50\" r=\"40\" style=\"stroke:brown;stroke-width:5;fill:green\" />\n</svg>");

yields the following JSON object:

svg = {
ids:{},
elements: [
{
name: "circle",
children: [],
cx: 100,
cy: 50,
r: 40,
stroke: { color: { r: 165, g: 42, b: 42, a: 1 } },
stroke-width: 5,
fill: { color: { r: 0, g: 128, b: 0, a: 1 } }
}
]
};

*/

/* JPVS
Module: parsers
Classes: SvgParser
Depends:
*/
var SvgParser = (function () {

    var BLACK = { r: 0, g: 0, b: 0, a: 1 };

    var ColorData = {
        aliceblue: '#F0F8FF',
        antiquewhite: '#FAEBD7',
        aquamarine: '#7FFFD4',
        azure: '#F0FFFF',
        beige: '#F5F5DC',
        bisque: '#FFE4C4',
        black: '#000000',
        blanchedalmond: '#FFEBCD',
        blue: '#0000FF',
        blueviolet: '#8A2BE2',
        brown: '#A52A2A',
        burlywood: '#DEB887',
        cadetblue: '#5F9EA0',
        chartreuse: '#7FFF00',
        chocolate: '#D2691E',
        coral: '#FF7F50',
        cornflowerblue: '#6495ED',
        cornsilk: '#FFF8DC',
        crimson: '#DC143C',
        cyan: '#00FFFF',
        darkblue: '#00008B',
        darkcyan: '#008B8B',
        darkgoldenrod: '#B8860B',
        darkgray: '#A9A9A9',
        darkgreen: '#006400',
        darkgrey: '#A9A9A9',
        darkkhaki: '#BDB76B',
        darkmagenta: '#8B008B',
        darkolivegreen: '#556B2F',
        darkorange: '#FF8C00',
        darkorchid: '#9932CC',
        darkred: '#8B0000',
        darksalmon: '#E9967A',
        darkseagreen: '#8FBC8F',
        darkslateblue: '#483D8B',
        darkslategray: '#2F4F4F',
        darkslategrey: '#2F4F4F',
        darkturquoise: '#00CED1',
        darkviolet: '#9400D3',
        deeppink: '#FF1493',
        deepskyblue: '#00BFFF',
        dimgray: '#696969',
        dimgrey: '#696969',
        dodgerblue: '#1E90FF',
        firebrick: '#B22222',
        floralwhite: '#FFFAF0',
        forestgreen: '#228B22',
        gainsboro: '#DCDCDC',
        ghostwhite: '#F8F8FF',
        gold: '#FFD700',
        goldenrod: '#DAA520',
        green: '#008000',
        grey: '#808080',
        greenyellow: '#ADFF2F',
        honeydew: '#F0FFF0',
        hotpink: '#FF69B4',
        indianred: '#CD5C5C',
        indigo: '#4B0082',
        ivory: '#FFFFF0',
        khaki: '#F0E68C',
        lavender: '#E6E6FA',
        lavenderblush: '#FFF0F5',
        lawngreen: '#7CFC00',
        lemonchiffon: '#FFFACD',
        lightblue: '#ADD8E6',
        lightcoral: '#F08080',
        lightcyan: '#E0FFFF',
        lightgoldenrodyellow: '#FAFAD2',
        lightgreen: '#90EE90',
        lightgrey: '#D3D3D3',
        lightpink: '#FFB6C1',
        lightsalmon: '#FFA07A',
        lightseagreen: '#20B2AA',
        lightskyblue: '#87CEFA',
        lightslategray: '#778899',
        lightslategrey: '#778899',
        lightsteelblue: '#B0C4DE',
        lightyellow: '#FFFFE0',
        limegreen: '#32CD32',
        linen: '#FAF0E6',
        magenta: '#FF00FF',
        mediumaquamarine: '#66CDAA',
        mediumblue: '#0000CD',
        mediumorchid: '#BA55D3',
        mediumpurple: '#9370DB',
        mediumseagreen: '#3CB371',
        mediumslateblue: '#7B68EE',
        mediumspringgreen: '#00FA9A',
        mediumturquoise: '#48D1CC',
        mediumvioletred: '#C71585',
        midnightblue: '#191970',
        mintcream: '#F5FFFA',
        mistyrose: '#FFE4E1',
        moccasin: '#FFE4B5',
        navajowhite: '#FFDEAD',
        oldlace: '#FDF5E6',
        olivedrab: '#6B8E23',
        orange: '#FFA500',
        orangered: '#FF4500',
        orchid: '#DA70D6',
        palegoldenrod: '#EEE8AA',
        palegreen: '#98FB98',
        paleturquoise: '#AFEEEE',
        palevioletred: '#DB7093',
        papayawhip: '#FFEFD5',
        peachpuff: '#FFDAB9',
        peru: '#CD853F',
        pink: '#FFC0CB',
        plum: '#DDA0DD',
        powderblue: '#B0E0E6',
        red: '#FF0000',
        rosybrown: '#BC8F8F',
        royalblue: '#4169E1',
        saddlebrown: '#8B4513',
        salmon: '#FA8072',
        sandybrown: '#F4A460',
        seagreen: '#2E8B57',
        seashell: '#FFF5EE',
        sienna: '#A0522D',
        skyblue: '#87CEEB',
        slateblue: '#6A5ACD',
        slategray: '#708090',
        slategrey: '#708090',
        snow: '#FFFAFA',
        springgreen: '#00FF7F',
        steelblue: '#4682B4',
        tan: '#D2B48C',
        thistle: '#D8BFD8',
        tomato: '#FF6347',
        turquoise: '#40E0D0',
        violet: '#EE82EE',
        wheat: '#F5DEB3',
        whitesmoke: '#F5F5F5',
        yellow: '#FFFF00',
        yellowgreen: '#9ACD32'
    };



    function parseString(s) {
        //Parse as XML
        var doc = XmlParser.parseString(s, transform);
        if (doc)
            return {
                ids: doc.__$ids$__,
                elements: doc.children
            };
        else
            return null;
    }

    function transform(node, rootNode) {
        //Fill the "ids" field in rootNode along the way
        if (!rootNode.__$ids$__)
            rootNode.__$ids$__ = {};

        if (node.attributes.id)
            rootNode.__$ids$__[node.attributes.id] = node;

        //Strip comments from children
        for (var i = 0; i < node.children.length; i++) {
            var child = node.children[i];
            if (child.name == "#COMMENT") {
                //Remove
                node.children.splice(i--, 1);
            }
        }

        //Remove value
        delete node.value;

        //Pull attributes out and remove the attributes object
        for (var i in node.attributes) {
            var attr = node.attributes[i];
            processAttribute(node, i, attr);
        }

        delete node.attributes;

        function processAttribute(destination, name, value) {
            if (name == "style")
                processStyle(destination, value);
            else if (name == "fill")
                processFill(destination, value);
            else if (name == "stroke")
                processStroke(destination, value);
            else if (name == "d")
                processPathDefinition(destination, value);
            else {
                //Transfer to destination
                var endsWithPercent = /%$/g.test(value);
                var valueAsNumber = parseFloat(value);
                var valueIsNumber = isFinite(valueAsNumber) && !endsWithPercent;
                destination[name] = valueIsNumber ? valueAsNumber : value;
            }
        }

        function processPathDefinition(destination, value) {
            var pd = parsePathDefinition(value);
            destination.d = pd;
        }

        function processFill(destination, value) {
            //Special case: none
            if (!value) {
                destination.fill = {};
                return;
            }

            value = trim(value);
            if (value == "" || value.toLowerCase() == "none") {
                destination.fill = {};
                return;
            }

            //Value is a color or gradient
            var urlRegEx = /^url *\( *#(.+) *\) *$/gi;
            var result = urlRegEx.exec(value);

            if (result) {
                //Reference to a gradient
                var gradientId = result[1];

                //Let us assume that the "gradientId" has already been encountered in the 
                //document (i.e., the "defs" element is before all shapes in the SVG document)
                var grad = rootNode.__$ids$__[gradientId];
                if (grad.name == "linearGradient") {
                    //Linear gradient
                    var x1 = parseNumberOrPercentage(grad.x1);
                    var x2 = parseNumberOrPercentage(grad.x2);
                    var y1 = parseNumberOrPercentage(grad.y1);
                    var y2 = parseNumberOrPercentage(grad.y2);

                    destination.fill = {
                        linearGradient: {
                            x1: x1,
                            y1: y1,
                            x2: x2,
                            y2: y2,
                            stops: []
                        }
                    };

                    //Parse stops
                    for (var i in grad.children) {
                        var stop = grad.children[i];
                        if (stop.name != "stop")
                            continue;

                        var offset = stop.offset;
                        var color = parseColor(stop["stop-color"]);
                        var opacity = stop["stop-opacity"];

                        if (opacity != null)
                            color.a *= opacity;

                        destination.fill.linearGradient.stops.push({
                            color: color,
                            offset: offset
                        });
                    }
                }
                else {
                    //Not supported yet
                }
            }
            else {
                //Solid color
                destination.fill = { color: parseColor(value) };
            }
        }

        function parseNumberOrPercentage(x) {
            if (/%$/g.test(x)) {
                //Ends with %
                return parseFloat(x.substring(0, x.length - 1)) / 100;
            }
            else
                return parseFloat(x);
        }

        function processStroke(destination, value) {
            //Special case: none
            if (!value) {
                destination.stroke = {};
                return;
            }

            value = trim(value);
            if (value == "" || value.toLowerCase() == "none") {
                destination.stroke = {};
                return;
            }

            //Value is a color
            destination.stroke = { color: parseColor(value) };
        }

        function processStyle(destination, value) {
            value = trim(value);
            var parts = value.split(";");

            for (var i in parts) {
                var part = parts[i];

                //Split part (name: value)
                var subparts = part.split(":");
                var stylePartName = trim(subparts[0]);
                var stylePartValue = trim(subparts[1]);

                //Apply as a normal attribute specified outside of "style"
                processAttribute(destination, stylePartName, stylePartValue);
            }
        }
    }

    function trim(str) {
        return str.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    }

    function parseColor(color) {
        //No color ---> return default color (black)
        if (!color)
            return BLACK;

        color = trim(color);

        if (color == "")
            return BLACK;

        if ((/^#/gi).test(color))
            return parseHexColor(color.substring(1));
        else if ((/^RGB[^A]/gi).test(color))
            return parseRGBColor(color.substring(3));
        else if ((/^RGBA/gi).test(color))
            return parseRGBAColor(color.substring(4));
        else {
            //Try as a color name
            color = color.toLowerCase();
            color = ColorData[color];
            return parseColor(color);
        }

        function parseHexColor(color) {
            color = trim(color);

            if (color.length == 3) {
                //ABC must be interpreted as AABBCC
                color = String.fromCharCode(color.charCodeAt(0), color.charCodeAt(0), color.charCodeAt(1), color.charCodeAt(1), color.charCodeAt(2), color.charCodeAt(2));
            }

            //Now we have six hex digits
            return {
                r: parseInt(color.substring(0, 2), 16),
                g: parseInt(color.substring(2, 4), 16),
                b: parseInt(color.substring(4, 6), 16),
                a: 1
            };
        }

        function parseRGBColor(color) {
            color = trim(color);
            if ((/^\(.*\)$/gi).test(color)) {
                //Starts with ( and ends with )
                color = color.substring(1, color.length - 1);

                //Now we only have numbers
                var parts = trim(color).split(",");
                var r = parseInt(parts[0]);
                var g = parseInt(parts[1]);
                var b = parseInt(parts[2]);
                var a = 1;

                return { r: r, g: g, b: b, a: a };
            }
            else
                return BLACK;
        }

        function parseRGBAColor(color) {
            color = trim(color);
            if ((/^\(.*\)$/gi).test(color)) {
                //Starts with ( and ends with )
                color = color.substring(1, color.length - 1);

                //Now we only have numbers
                var parts = trim(color).split(",");
                var r = parseInt(parts[0]);
                var g = parseInt(parts[1]);
                var b = parseInt(parts[2]);
                var a = parseFloat(parts[3]);

                return { r: r, g: g, b: b, a: a };
            }
            else
                return BLACK;
        }
    }

    var NUMERIC_CHARS = "1234567890.-+";
    var ALPHA_CHARS = "qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM";

    function parsePathDefinition(d) {
        //Empty or no definition --> return null
        if (!d)
            return null;

        d = trim(d);
        if (d == "")
            return null;

        //States
        var START = 0;
        var READ_PARAMS = 1;
        var IN_PARAM = 2;

        //Otherwise, parse
        var commands = [];
        var curCmd, curParam;
        var state = START;

        for (var i = 0; i < d.length; i++) {
            var c = d[i];

            if (state == START) {
                if (ALPHA_CHARS.indexOf(c) >= 0) {
                    //Letter found: this is a command
                    curCmd = { cmd: c, params: [] };
                    commands.push(curCmd);
                    state = READ_PARAMS;
                }
                else {
                    //Ignore any other char
                }
            }
            else if (state == READ_PARAMS) {
                if (ALPHA_CHARS.indexOf(c) >= 0) {
                    //Letter found: this is a new command
                    curCmd = { cmd: c, params: [] };
                    commands.push(curCmd);
                    state = READ_PARAMS;
                }
                else if (NUMERIC_CHARS.indexOf(c) >= 0) {
                    //Numeric char: here starts a parameter
                    curParam = c;
                    state = IN_PARAM;
                }
                else {
                    //Ignore any other char
                }
            }
            else if (state == IN_PARAM) {
                if (NUMERIC_CHARS.indexOf(c) >= 0) {
                    //Numeric char: here continues the current parameter
                    curParam += c;
                }
                else if (ALPHA_CHARS.indexOf(c) >= 0) {
                    //Letter found: this is a new command
                    //First, end processing the current param
                    curCmd.params.push(parseFloat(curParam));
                    curParam = null;

                    //Then start the new command
                    curCmd = { cmd: c, params: [] };
                    commands.push(curCmd);
                    state = READ_PARAMS;
                }
                else {
                    //Any other char means we are done reading this parameter
                    //First, end processing the current param
                    curCmd.params.push(parseFloat(curParam));
                    curParam = null;

                    //Then go back to waiting for a new param or a new command
                    state = READ_PARAMS;
                }
            }
        }

        //At the end, end processing the current param, if any
        if (curParam)
            curCmd.params.push(parseFloat(curParam));

        return commands;
    }


    return {
        parseString: parseString,
        parseColor: parseColor,
        parsePathDefinition: parsePathDefinition
    };

})();
/*
****************************************
XML-to-JSON parser
****************************************



EXAMPLE

Given this XML document:

<books>
<book title="The red apple" />

Random text...

<book title="The Javascript Language" />
</books>


The following call:

var doc = XmlParser.parseString("<books>\n\t<book title=\"The red apple\"/>\n\n\tRandom text...\n\n\t<book title=\"The Javascript Language\" />\n</books>");

yields the following JSON object:

doc = {
name: "books",
attributes: {},
value: null,
children: [
{
name: "book",
attributes: { title: "The red apple" },
value: null,
children: []
},
{
name: "#TEXT",
attributes: { },
value: "Random text...",
children: []
},
{
name: "book",
attributes: { title: "The Javascript Language" },
value: null,
children: []
}
]
}

*/

/* JPVS
Module: parsers
Classes: XmlParser
Depends: 
*/
var XmlParser = (function () {

    var OutOfTag = 0,
        TagName = 1,
        WaitForAttributeName = 2,
        AttributeName = 3,
        WaitForAttributeValue = 4,
        AttributeValue = 5,
        WaitForElementEnd = 6,
        Comment = 7;


    function trim(str) {
        return str.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    }

    function createEmptyNode() {
        return {
            name: "",
            attributes: {},
            children: [],
            value: null
        };
    }

    function createTextNode(text) {
        return {
            name: "#TEXT",
            attributes: {},
            children: [],
            value: text
        };
    }

    function parseString(s, nodeTransform, preserveWhiteSpace) {
        //No string --> return null
        if (!s || s == "")
            return null;

        //String present, let's parse
        var state = OutOfTag;
        var nodeStack = [];
        var curNode, curAttrName, curAttrValue, curText = "", curComment = "";

        for (var i = 0; i < s.length; i++) {
            var c = s[i];

            if (state == OutOfTag) {
                //Tag not yet found, look for "<"
                if (c == "<") {
                    //Tag is starting, prepare for reading the tag name
                    state = TagName;

                    //If we have text accumulated, then emit a text node and append it to the current node
                    if (!preserveWhiteSpace)
                        curText = trim(curText);

                    if (curText.length > 0) {
                        var textNode = createTextNode(curText);
                        curNode.children.push(textNode);
                    }

                    //Reset the accumulated text
                    curText = "";

                    //Create a new node and add it as a child to the current node, if any
                    var oldCurNode = curNode;
                    curNode = createEmptyNode();
                    nodeStack.push(curNode);

                    if (oldCurNode)
                        oldCurNode.children.push(curNode);
                }
                else {
                    //Any other char is plain text
                    curText += c;
                }
            }
            else if (state == TagName) {
                //We are now reading the tag name
                //Stop at the first blank or or "/" or ">"
                if (c == " ") {
                    //End of tag name, look for attributes
                    state = WaitForAttributeName;
                }
                else if (c == "/") {
                    if (curNode.name == "") {
                        //This is a closing tag (</example>) and we have just read the slash, let's keep on reading the name
                        curNode.closing = true;
                    }
                    else {
                        //This is a slash after a tag name
                        //End of tag, no children, let's wait for the closing ">"
                        state = WaitForElementEnd;
                    }
                }
                else if (c == ">") {
                    //End of tag
                    state = OutOfTag;

                    //Let's see what to do with the node stack
                    if (curNode.closing) {
                        //Just finished reading a closing tag
                        //Let's remove this and pop it from the stack
                        if (nodeStack.length > 1) {
                            nodeStack.pop();
                            curNode = nodeStack[nodeStack.length - 1];

                            //The closing tag itself is not a child of the parent: let's pop it off
                            curNode.children.pop();
                        }

                        //Now go up one level (to the parent) because we have just closed an element
                        if (nodeStack.length > 1) {
                            nodeStack.pop();
                            curNode = nodeStack[nodeStack.length - 1];
                        }
                    }
                    else {
                    }
                }
                else {
                    //Still reading the tag name
                    curNode.name += c;

                    //See if this is a comment
                    if (curNode.name == "!--") {
                        //This is not an element but a comment
                        //Let's go to comment mode
                        curComment = "";
                        state = Comment;
                    }
                }
            }
            else if (state == WaitForAttributeName) {
                if (c == " ") {
                    //Still waiting for attribute name
                }
                else if (c == "/") {
                    //End of tag, no children
                    state = WaitForElementEnd;
                }
                else if (c == ">") {
                    //End of tag
                    state = OutOfTag;
                }
                else {
                    //Here an attribute name starts
                    state = AttributeName;
                    curAttrName = c;
                    curAttrValue = "";
                }
            }
            else if (state == AttributeName) {
                if (c == "=") {
                    //End of attribute name, wait for value
                    state = WaitForAttributeValue;
                }
                else {
                    //Still reading the attribute name
                    curAttrName += c;
                }
            }
            else if (state == WaitForAttributeValue) {
                //Only " or blank is valid here
                if (c == " ") {
                    //Keep waiting
                }
                else if (c == "\"") {
                    //Opened quote: now we prepare to read the value
                    state = AttributeValue;
                }
                else {
                    //Not valid
                    throwInvalidChar();
                }
            }
            else if (state == AttributeValue) {
                //We are in the attribute value: keep reading until a closing quote
                if (c == "\"") {
                    //Closing quote, let's wait for a possible next attribute
                    state = WaitForAttributeName;

                    //Add the attribute name/value to the collection
                    curNode.attributes[trim(curAttrName)] = curAttrValue;
                }
                else {
                    //Part of value
                    curAttrValue += c;
                }
            }
            else if (state == WaitForElementEnd) {
                //Found "/", so now the only acceptable char is > or blank
                if (c == " ") {
                    //Keep waiting
                }
                else if (c == ">") {
                    //Tag closed
                    state = OutOfTag;

                    //This also closes the current node
                    if (nodeStack.length > 1) {
                        nodeStack.pop();
                        curNode = nodeStack[nodeStack.length - 1];
                    }
                }
                else {
                    //Not valid
                    throwInvalidChar();
                }
            }
            else if (state == Comment) {
                //We are in a comment, so let's accumulate the chars into the comment string
                curComment += c;

                //Let's determine when the comment finishes
                if ((/-->$/gi).test(curComment)) {
                    //The comment ends here
                    //Let's strip the comment closing sequence "-->" and the blanks
                    curComment = trim(curComment.substring(0, curComment.length - 3));

                    //Let's now update curNode
                    curNode.name = "#COMMENT";
                    curNode.value = curComment;

                    //End of node
                    nodeStack.pop();
                    curNode = nodeStack[nodeStack.length - 1];
                    state = OutOfTag;
                }
            }
            else
                throwUnexpectedState();
        }

        //End: transform all nodes if required
        var doc = nodeStack[0] || null;
        if (nodeTransform)
            transformRecursively(doc);

        return doc;


        function transformRecursively(node) {
            if (node) {
                //Transform the node...
                nodeTransform(node, doc);

                //... and all its children
                if (node.children) {
                    for (var i in node.children) {
                        var child = node.children[i];
                        transformRecursively(child);
                    }
                }
            }
        }

        function throwInvalidChar() {
            throw "Invalid character: " + c;
        }

        function throwUnexpectedState() {
            throw "Unexpected parser state: " + state;
        }
    }

    return {
        parseString: parseString
    };

})();
/* JPVS
Module: utils
Classes: 
Depends: core
*/

(function () {

    var chars = "QWERTYUIOPLKJHGFDSAZXCVBNM1234567890";
    var N = chars.length;
    var M = 10 * N;

    jpvs.randomString = function (len) {
        var s = "";
        for (var i = 0; i < len; i++) {
            var c = Math.floor(Math.random() * M) % N;
            var ch = chars[c];
            s += ch;
        }

        return s;
    };

})();

/* JPVS
Module: core
Classes: Resources
Depends: bootstrap
*/


jpvs.Resources = {
    images: {
        loading: "data:image/gif;base64,R0lGODlhGAAIAPcAAAAAAP8A3ICAgP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJCgABACwAAAAAGAAIAAAIRAADCBxIsKBBggASKhSocGGAhgkZCpgoAADDARgHWHyYUaNEihsBdAw58uNEkhlRYgxJseLFlC9XMoQ4s2FNhwdz5gwIACH5BAkKAAEALAAAAAAYAAgAAAhDAAMIHEiwoEGCABIqFKhwYYCGCRkOmDgAAEMBGAVYfEixokSKGwFk1PhxYsiOIUeeBFnS40OVLUNCZDjzYc2DOHEGBAAh+QQJCgABACwAAAAAGAAIAAAIQwADCBxIsKBBggASKhSocGGAhgkZDpg4AIBEihYfCtgoICMAihUvTvTIsaPIkA9BkuToUeXJlRs9QmQ482HNgzhxBgQAIfkECQoAAQAsAAAAABgACAAACEMAAwgcSLCgQYIAEioUqHBhgIYJGQ6YOAAAQwEYBVh8SLGiRIobAWTU+HFiyI4hR54EWdLjQ5UtQ0JkOPNhzYM4cQYEADs=",

        closeButton: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADzSURBVDhPY2BmZv7EwMDwn1zMyMrK+uXnz5/7gQaQDJiYmHyYSNaFpgHDAD09PSuQyRcvXuRCVtvW1iYHEgfRKGaAvPDv37/NyBgUHjo6Om9hYufPn98LEmtpabmIrg6rF1avXn38ypUrQjDbYmNjDYAGvquqqnqE4WVsLgDZEhUVdQ9kK4wGuQKbS/HGAig8QC4BuSg4OPgtuu0EYwGkGaRp/fr1ErhiC2c0gmwH+Rtk+7JlyxTXrl0rjNUQbGEACm2Q/2H+hoUDtjBgQDcAX5QhRy3IMHDyRzYAphldIUgx0CvHYLECcwmIP/B5gYHS7AwAM9IzlWy9T8kAAAAASUVORK5CYII=",
        closeButtonHover: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAENSURBVDhPY9TW1v6rqqrKxEAGuHHjBgOjo6Pjn717994lQz+Dk5OTGlk2I1uGYcDs2bNlm5qa1N6+fcuKrPDUqVP8IHEQjdeA1NTUxyAF69atk4ApBBm2Y8cOcQ8Pj5dmZmYf8RoAkoyMjHzy/PlzTphtIMMkJSW/o2sGqcUaBsBY+WZkZPQBZOuWLVvEQIYFBQW9wBbQOAPRx8fnFcjWc+fOCYBcJCws/JskA0CKQTaD6Js3b/LgimacLgDFBsgFINtBrrh9+zYX0S4ABR7M37DwWL58uQxRBiBHGczfoPAAaQa5Ct0QFC+ANE+dOlURW5TBohYUK8iGDHxeYFRRUfkrIyNDVqZ68OABAwDuhIRQ92DTiAAAAABJRU5ErkJggg==",

        subMenuMarker: "data:image/gif;base64,R0lGODlhBAAHAPAAAAAAAP///yH5BAEAAAEALAAAAAAEAAcAAAIIRA4WaeyrVCgAOw==",

        dataGridColumnButton: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAICAYAAAArzdW1AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTAw9HKhAAAAP0lEQVQoU2NsaGjYwkAIgBT9//8/ChcGGwI1CWQaVgxXBDIFmyKQOIoidIUw6zEUwRQiuw+rInQPwBWBGPgwACtpkpAwaQ17AAAAAElFTkSuQmCC",
        dataGridColumnButtonHover: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAICAYAAAArzdW1AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTAw9HKhAAAAPklEQVQoU2NsaGj4z0AIgBQBAYjAisGGQE0CmYYVwxWBTMGmCCSOoghdIcx6DEUwhcjuw6oI3QNwRSAGPgwAytOhjjbmr7UAAAAASUVORK5CYII=",

        moveButton: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAADlSURBVHjapFLRDsIgDLxuU598WvgAfdXo/3+Xr7BaGDDoGDGxySUb9NrrFQLu2IIFSwEnB44EqGHDPbPFAMh9QCJzJp/My39zUTCT129gWjtXXSPJSfVMkH9Lmoy19a1VIMkV4kdyzmqEODCzV6CJSyN5T04xKdkNw6DJHE0LMcSuvCUdKaiCiwLe7Tcu2XGXcQ1nITljNk/M5pGLiBST9o3GCHI+klKQupM3MY7giVr6oXwoD9JuLfXcbpHjFlzzhf0aw0berSoYVhjYK5AeUC2TNh51RIw9hdy9lC2EVfwTXwEGAJ3OoklJmLc2AAAAAElFTkSuQmCC",

        nodeClosed: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuNtCDrVoAAABrSURBVDhP7ZI9CsAgDEY9fM7g6iReJYcIuAXUwSN8kkLHgj+FLs0cHo+XOPfPYwFmRu8d24lijEgpIee8BzFArRUhBIjIOsQApl9KgfcerbU1yA0wiKqCiC6j6SavGBw3OLrC8R9Mx/p8cQCaS2KwCQA20AAAAABJRU5ErkJggg==",
        nodeOpen: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuNtCDrVoAAABCSURBVDhPY2AYBfQJgV27dv3v6Oj4T5ZtIM1qampgTLIBMM2RkZGkG4CsmWQD0DWTbAAowGD+htFkByLJATcCNQAAuT01LwirJNQAAAAASUVORK5CYII=",
        nodeNoChildren: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuNtCDrVoAAABlSURBVDhP7ZAxCoAhCIW7/zl0ChcHIQiiwQt0IX9sCNoy+LcEF/F9Pl9Kr/5JgIgMAAwRV4uIHV9zYSllCcYYExQC+HKt1VR1Cq8ALmbmO0BrbVnuvcdeyDlvAbp9nx1n8BZjCXzXd1UGM4buRAAAAABJRU5ErkJggg==",

        down: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuM4zml1AAAAkJSURBVHhe7d3Pp99XHsfxyyyGMmQxlDKLEoYsSildlOxCCLMIJXQRSgmhdBFK6aIMpbuQRSghi1BKFkMpswhDmcUwf1Lfr+l0Ok1O76/v5/P9nPM5jwfPTRe533vv5zScT855nwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6/t99bfq35KGK2s3a/ggN6rWHy6p77J2F/F11foCkvrscbWYq9W/qtYXktRXWatZs4v6rGp9MUl9lbW6uCvVP6rWF5TUR1mjWaur+KBqfVFJfXSnWs3vqudV6wtL2raszazRVb1Xtb64pG17tzqKR1XrA0japofV0fyp8lpQ6qOsxazJo/qkan0YScft4+ro/lD9vWp9IEnHKWswa3ETt6vWh5J0nLIGN5NXDt9UrQ8mad2eVZt7u2p9OEnrlrXXhS+r1geUtE5Zc914o/pn1fqgkpYta+31qiv3q9aHlbRs96ru5Oqh76vWB5a0TN9VB1/ztZZbVetDS1qmm1XXnlatDy7psJ5U3btWtT68pMuXf++ftTWEL6rWNyHpcn1eDeOP1Q9V6xuRdLFyzVfW1FA+rFrfjKSLdbcajqlC0uFlDa1+zddaTBWSDut6NbRMKGl9Y5JOL1fvDc9UIeniZc28We2CqULSxXpQ7UauLDJVSDpfL6rNrvlaSyaWtL5ZSb/u/Wp3TBWSzu7batjXfmfJ5JLWNy3pp96pdi0TTFrfuDR7X1W7Z6qQ9Gq55itX600hk0xaPwRp1nKl3jRMFZJ+KWvhtWoqpgpJP5Wr9KaTVx2ZbNL6gUizlCv0pmWqkGbvrWpqpgpp1nJ13vRMFdKM5cq84a75WksmnbR+SNJe+6jiv0wV0kzlmq9up/tsxVQhzVKuyqMhk09aPzBpL+WKPH6DqULaczkDkyvyOEUmoLR+eNLo5Wo8zpBXI64P097KM32l4hxMFdLeypV4nJOpQtpTuQpvt9d8rSUTUVo/TGm0chUel2CqkEYvV+BxSaYKaeTy7OYKPA7wadX64Uq9l6vvOJCpQhqxXPO1u+k+WzFVSKOVK+9YSF6hZGJK6wct9VauumNhpgpplHLVHSswVUi9lyvuWEleqbg+TL2WZ/P1ihWZKqRey9V2rMxUIfXYd5Vrvo7EVCH11s2KIzJVSL2Uq+w4MlOF1EP59/65yo4N/LVq/VKkY5Ur7NhIXrl4LaityhkV0302ZqqQtupuxcby6iWvYFq/IGmtcmWda746kVcwrV+StFa5so6OmCqkY/WoojN5FeP6MK1dnrE3KzpkqpDW7kFFp0wV0pq9qFzz1TlThbRW71d0Lq9mTBXS0uVKOq/9BmGqkJbunYqBmCqkpfqqYjB5VeO1oA4tZ03eqBiQqUI6tPsVgzJVSIeUq+deqxhYXt20frnSWd2qGJypQrpMTyt2wlQhXbS3KnYkr3Jav2jp5b6o2BlThXSefqhc87VTpgrprD6q2Km80jFVSL9VzpCY7rNzf6lav3zpRsUETBXSy+XsCJPIK57WQ6A5y5mRqxUTMVVIP/dZxWRMFVLKWZErFRPKK5/WQ6F5ulMxKVOF5u555ZqvyZkqNG85IwKmCk3Ywwr+48+V68PmKb/rnA2B/zFVaJ5yJgR+xVShOcpZENN9aLpbtR4a7afbFTSZKrTvcgYETvVe1Xp4NH5vV3CmR1XrAdK4fVnBuZgqtK9y5iNnP+DcHlSth0njda+CC8mrohdV64HSOOWsh2u+uBRThcYvZz3gUkwVGruc8YCDvFO1Hi71XTZxr1VwMFOFxitnO2ARpgqNVc50mO7Dou5XrYdN/ZUzHbAoU4XGKGc5XPPFKkwV6r/rFazmadV68LR9OcMBqzJVqM/y2i9nOGB1pgr1V85uwFHkZNkPVetB1PHLmQ3XfHFUpgr1U85swFGZKtRHOavhtR+buFG1Hkodr5zVgM18XbUeTK1fzmjApkwV2qaczXijgs19VrUeUq1XzmZAF65Upgodr5zJyNkM6IapQsfrVgVdyauo51XrgdVy5SwGdMlUofXLWQzolqlC6/VFBV0zVWidcvbCNV8M4ZOq9RDr8uXsBQzBVKFlyzVfpvswFFOFlitnLmAoeS34TdV6oHX+HlcwJFOFDiubqVcrGJapQpcvZyxgaDmxZqrQxcvZipyxgOGZKnTx7lSwCzm59n3VetD1ajlT4ZovdiUn2FoPu17t3Qp2x1Shs3tYwS6ZKnR6ee2XUeywWznR1nr4dXLycQW7lhNtpgq9Wq75Mt2HKZgq9Gq3K5hCTrblhFtrIczYswqmYqrQL71dwXRMFTo5+bKCKeWk28zXh+WMREatw7Rmnip0r4KpzTpVKKPVXfMF5YOqtUj23M0KKLNNFXpSAf9nlqlC2fS8VgEvmWGq0OcV0JCTcHt+LZjNTtN94BR7niqUEerAKXIiLifjWgto5HL2wTVfcA45GddaRCN3vQLOYW9ThbK5CVxATsi1FtNoZVMzI9OBC8pJudaiGqkHFXAJo08Vyoh013zBAUaeKpQR6cABcmJuxKlC31Ze+8ECRpwqlNHowEJGmiqUkejAgnKCrrXYeiubltm8BBY2wlShbFoCK+h9qlDOMGQUOrCSD6vW4uuhbFYCK+p1qlA2KYEj6HGqUEafA0fyuGotxC3K5iRwRL1MFcqmpGu+YAM9TBXKqHNgAzlpt+VUoWxGmu4DG7pTtRbnMcpmJLChraYKZRMS6MC7VWuRrlU2H7MJCXTiYdVarGuUzUegI8eaKpRNx4w0BzrzcdVatEuWTUegQ2tPFcpmo2u+oGNrThXKZiPQsfwN/axqLeBDyiYjMIClpwplczGbjMAglpwqlM1FYCBLTRXKpqLpPjCge1VrUV+kbCoCAzp0qlA2E4GBHTJVKJuJwOCeVK0FflrZRAR24KJThbJ5+HoF7MTnVWuxt8rmIbAjubjzPNeHfVe55gt26DxThW5WwA6dNVUom4XAjl2vWos//94/m4XAzrWmCmWTEJjAy1OFsjloug9M5NPq5/8B3M1/AObx81ShbAq65gsmlAs+sykITMjf/AAAAAAAAAAAAAAAAAAAAAAAABs4OfkRfHZoUdIEJXsAAAAASUVORK5CYII=",
        minus: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuM4zml1AAAAXhSURBVHhe7dQxahhADEXBnN0nzI0cpxCkeM0mGCI0A6/53RbaH5+fn5KOlqOkG+Uo6UY5SrpRjpJulKOkG+Uo6UY5SrpRjpJulKOkG+Uo6UY5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOU4ATvVPVc5TsBOdc9VjhOwU91zleME7FT3XOX4HX35+OqnpL/qo+7qX8vxO/r9gD8eI+ktH4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHQ4H4B0OB+AdDgfgHS4//MDAHbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPut8SVgh7zfGl8Cdsj7rfElYIe83xpfAnbI+63xJWCHvN8aXwJ2yPutUdKNcpR0oxwl3ShHSTfKUdKNcpR0oxwl3ShHSTfKUdKNcpR0oxwl3ShHSTfKUdKNcpR0oxwlXejzxy+8PqQAvdktbgAAAABJRU5ErkJggg==",
        plus: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuM4zml1AAAAZsSURBVHhe7dTBCRBnFIVR67AoF5bkNkWkpXRknpBFJB+EoF4I/3lwNnc3M8z34evXr8CjcgTekCPwhhyBN+QIvCFH4A05Am/IEXhDjsAbcgTekCPwhhyBN+QIvCFH4A05Am/IEXhDjsAbcgTekCPwhhyBN+QIvCFH4A05Am/IEXhDjsAbcgTekCPwhhyBN+TIxt2n8wf/8LHeFz9fjmzcCUATgJEc2bgTgCYAIzmycScATQBGcmTjTgCaAIzkyMadADQBGMmRjTsBaAIwkiMbdwLQBGAkRzbuBKAJwEiObNwJQBOAkRzZuBOAJgAjObJxJwBNAEZyZONOAJoAjOTIxp0ANAEYyZGNOwFoAjCSIxt3AtAEYCRHNu4EoAnASI5s3AlAE4CRHNm4E4AmACM5snEnAE0ARnJk404AmgCM5MjGnQA0ARjJkY07AWgCMJIjG3cC0ARgJEc27gSgCcBIjmzcCUATgJEc2bgTgCYAIzmycScATQBGcmTjTgCaAIzkyMadADQBGMmRjTsBaAIwkiMbdwLQBGAkRzbuBKAJwEiObNwJQBOAkRzZuBOAJgAjObJxJwBNAEZyZONOAJoAjOTIxp0ANAEYyZGNOwFoAjCSIxt3AtAEYCRHNu4EoAnASI5s3AlAE4CRHNm4E4AmACM5snEnAE0ARnJk404AmgCM5MjGnQA0ARjJkY07AWgCMJIjG3cC0ARgJEc27gSgCcBIjmzcCUATgJEc2bgTgCYAIzmycScATQBGcmTjTgCaAIzkyMadADQBGMmRjTsBaAIwkiMbdwLQBGAkRzbuBKAJwEiObNwJQBOAkRzZuBOAJgAjObJxJwBNAEZyZONOAJoAjOTIxp0ANAEYyZGNOwFoAjCSIxt3AtAEYCRHNu4EoAnASI5s3AlAE4CRHNm4E4AmACM5snEnAE0ARnJk404AmgCM5Pgr3H0+X/jO76d+gNf9dup9vexz/Vc/Ksdf4a+HqI8N/Lsv9V/9qBx/hW8P8LeHAf4bAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA8TADgYQIADxMAeJgAwMMEAB4mAPAwAYCHCQA87H8fgM/fHoLv/H7qY7/ut1Pv62Wf67/6UTmycffp1A/wuo/1vvj5cmTjTgCaAIzkyMadADQBGMmRjTsBaAIwkiMbdwLQBGAkRzbuBKAJwEiObNwJQBOAkRzZuBOAJgAjObJxJwBNAEZyZONOAJoAjOTIxp0ANAEYyZGNOwFoAjCSIxt3AtAEYCRHNu4EoAnASI5s3AlAE4CRHNm4E4AmACM5snEnAE0ARnJk404AmgCM5MjGnQA0ARjJkY07AWgCMJIjG3cC0ARgJEc27gSgCcBIjmzcCUATgJEc2bgTgCYAIzmycScATQBGcmTjTgCaAIzkyMadADQBGMmRjTsBaAIwkiMbdwLQBGAkRzbuBKAJwEiObNwJQBOAkRzZuBOAJgAjObJxJwBNAEZyZONOAJoAjOTIxp0ANAEYyZGNOwFoAjCSIxt3AtAEYCRHNu4EoAnASI5s3AlAE4CRHNm4E4AmACM5snEnAE0ARnJk404AmgCM5MjGnQA0ARjJkY07AWgCMJIjG3cC0ARgJEc27gSgCcBIjmzcCUATgJEc2bgTgCYAIzmycScATQBGcmTjTgCaAIzkyMadADQBGMmRjTsBaAIwkiMbdwLQBGAkRzbuBKAJwEiObNwJQBOAkRzZuBOAJgAjObJxJwBNAEZyZONOAJoAjOTIxp0ANAEYyZGNOwFoAjCSIxt3AtAEYCRHNu4EoAnASI5s3AlAE4CRHNm4E4AmACM5snEnAE0ARnJk404AmgCM5MjGnQA0ARjJkY07AWgCMJIjG3cC0ARgJEfgDTkCb8gReEOOwBtyBN6QI/CGHIE35Ai8IUfgDTkCb8gReEOOwBtyBN6QI/CGHIE35Ai8IUfgDTkCb8gReEOOwAu+fvgTWMJbNXr94sMAAAAASUVORK5CYII=",
        up: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuM4zml1AAAAk4SURBVHhe7d3P5+5lHsfxmMUQw1kMh5hFxNAiIs4izi4OMYuIQ4tDxCGixSGiRQzR7tAiIlpERIshYhYxxCyG+ZN6vzrnzJzq+p5zf+/v/bmvH5/Hg6fJbPr++Fz5+lz3db2fAQAAAAAAAAAAAAAAAAAAAAAAYCB/ePi/wA7drm4++EdgT/5U/av6R+UvAdiZD6r/PuxO/g9gH16o/lM9+g9A/hL4cwXswOfVo8X/qI8qYHF56ffbxZ/yF8GLFbCoP1Z56df6D0D6sgIW9XbVWviPd6sCFpOXfHnZ11r0j/d9lb8UgIXkJV9rwbe6WwGLyMu91kK/qH9X1ytgAXm511roT+qTCpjc61VrgR/SyxUwqbzM+6FqLe5D+roCJpWXea2FfZneqIDJPFflZV5rUV+mf1Y5OQhMJC/xWgv6mN6rgEnk5V1rIR9bzgn8pQIGl8s98vKutZCv0v0KGFxe2rUW8Cm6UQGDysu6vLRrLd5T9F3l+jAYVF7WtRbuKctFosBg8pLu8Wu+tionCq9VwEDykq61YLfowwoYRF7OtRbqVuUvjVwsCnSWl3J5OddaqFuWi0WBzvJSrrVAz9FrFdDJo+k+rcV5jnLBqOvDoJO8jGstzHP2TgWc2W+n+/Tqp8pUITiz1nSfXn1cAWeSl2+thdizlypgY0+b7tOrrypgY4dM9+lVLiAFNpKXbXnp1lp8I5STiM9WwAbysq218Ebq3Qo4sctO9+lVLiLNhaTACeUlW2vBjdinFXAiV5nu06tXKuCKrjrdp1ffVq4PgyvKS7XWApuhNyvgSKea7tOrHytTheBIp5zu06t7FXBJp57u06ucWHy+Ag6Ul2ffVK0FNWOfVcCBtpzu06ubFfAUW0/36VVOMNoWhKd4v2otoBW6UwEXONd0n17lAlPXh8EF8rKstXBW6qMK+I1Xq9aCWa38hZOTjcBDvab79OrLCnjoraq1UFbuVgW7l1HbPaf79Or7ylQhdm+E6T69ulvBbo0y3adXOel4vYJd+qJqLYw9lROPsDsjTvfpVU4+wm6MOt2nV19XsBsZqd1aCHsuJyBheaNP9+lVTkC6PozlzTDdp1fvVbCsjNBuPfh6ULZEcyISljTTdJ9e3a9gOTNO9+nVjQqWkZHZM0736VVORro+jGXMPN2nV7crmN7s0316lROSOSkJU8uo7NYDrqeXk5IwrYzIbj3YOqxsC+bEJExntek+vfq8gulkNHbrgdbly8lJmEY+057R2K2HWZcvJyddH8Y0Vp7u06ucoIThZRT2nq/52qqcoDRViOHtYbpPr3KSEoa1l+k+PcuJShjO3qb79ConKmE4GX3demB1+nKyEoax1+k+vcr1YTlhCUPY83SfXuWEJXT318q23/nLCcuctISuTPfpV05aQjem+/QvJy7h7PLZ9Iy4bj2UOl/fVq4P4+xM9xmnnLyEs8lIa9N9xiknL00V4mz+XrUeRPXrXgWbM91nzLIVm5OYsCnTfcYtJzFhM3+rWg+exulmBSeXz57nM+ith07jlOvDbAtycqb7zFNOZsLJZGS16T7zlJOZrg/jZEz3ma+PKrgy033mLNuCL1ZwtLxMymfNWw+Yxu/LCo5mus/83arg0kz3WaOc2DRViEvLZ8tbD5Tm624FBzPdZ62yhZsTnHAQ033W65MKnsp0n3V7uYILZdsvnyVvPTyav68ruJDpPuv3RgW/k8+Om+6zfjnR6fowfiefHW89MFqv9yr4H9N99lV+1znhCb/IZ8ZbD4rW7X4Fv3xWvPWAaP1uVOyY6T777rvK9WE7ZrqPblfsUD4b7povZev3WsXOmO6jR31YsSOm++jxsi34QsVO5DPhrQdB++3zih0w3UcX9VrFwkz30ZPKSVDXhy0snwFv/eKlR2VrmAWZ7qND+qkyVWhBpvvo0D6uWEg+8936RUsXla1iFmC6j47pq4oFmO6jY3u9YmK5+sk1Xzq2bBln65hJfVC1frHSob1bMSHTfXSKsnX8XMVk8tnu1i9UumzZQmYiN6vWL1I6tlcqJmC6j7YoW8muD5vA21XrFyhdtWwpMzDTfbRlP1amCg3MdB9t3b2KAb1Y2fbT1uUZyxYzgzHdR+fqs4qBmO6jc5etZgZguo96lK1m24IDuFu1fkHS1t2p6Mh0H/UsW86uD+vIdB/1LlvPdPBy1fqFSOcs24LZgubMTPfRKGULmjN6o2r9IqReZSuaM8hnsU330WhlK9pUoTMw3Uejli1pNmS6j0Yuz2a2ptnI/ar1g5dG6ZOKDZjuo1nKFjUnZLqPZipb1JzQ7ar1g5ZGLVvVnIDpPpqxbFW7PuwETPfRrGXLmit4oXLNl2Ytz262rjmS6T6avWxdcwTTfbRK2cLmEvKZatN9tErfVa4PuwTTfbRa2crmAKb7aMXyTF+reArTfbRqH1Y8Qa5Wav3gpBXKtmC2trmA6T5avWxt0/B61fqBSav1WsVjsu33Q9X6YUmrlS1u14c9xnQf7a13KspzlWu+tLd+qkwVKrlCqfUDklbv42rXTPfR3nup2qV8Ntp0H+29r6pdMt1HelC2wHfFdB/p/2UtPFvthuk+0q97t9qFXJHkmi/p12UrPFviyzPdR2r3abU0032kJ/dKtaRs++VqpNY3LelBmYC15PVhpvtIh/VmtRTTfaTD+7FaaqpQrkJqfaOS2t2rlmC6j3T5smaer6Znuo90XJ9VU8vVR61vTNJhZULWlEz3ka5e1tCU24Km+0in6U41lVx1lCuPWt+MpMuVLfSprg/LVUetb0TScWVi1hRM95FOX7YFs7aGlyuOWt+ApKuVyVlDM91H2rZb1ZBM95G27/tqyKlCudKo9QVLOm2ZpDUU032k85W1dr0ahuk+0nnLmhuC6T5Sn7L2uspnlL+pWl+cpG3LZK2uTPeR+pY12IXpPlL/sga7XB/2ftX6giSdt0zaOivTfaRxylrMmjybXFXU+kIk9SkTt87i1ar1BUjqWyZvbcp0H2ncsjY3vT7srar1L5Y0RpnAtYlrlek+0thljWatnpzpPtIcZa2elOk+0jxlrWbNnswXVetfJGnMMpHrJEz3keYsa/dKTPeR5i1rd8jrwwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgQs888zP/xGhRUBjJvgAAAABJRU5ErkJggg=="
    }
};

/* JPVS
Module: utils
Classes: 
Depends: core
*/

(function () {

    var KEY_SESSIONID = "jpvs.SessionID";
    var sessionID;

    jpvs.getSessionID = function () {
        if (!sessionID) {
            //If not here, try to load it from sessionStorage
            try {
                sessionID = sessionStorage[KEY_SESSIONID];
            }
            catch (e) {
            }
        }

        if (!sessionID) {
            //If still not here, create a new one...
            sessionID = jpvs.randomString(50);

            //... and try to save it
            try {
                sessionStorage[KEY_SESSIONID] = sessionID;
            }
            catch (e) {
            }
        }

        //Now we certainly have it, although we might have not been able to save it into the sessionStorage in very old browsers
        return sessionID;
    };

})();

/*
*************************************************
Storage (backed by localStorage/sessionStorage)
*************************************************



EXAMPLE

var d1 = jpvs.Storage.getDomain(localStorage, "Domain 1");
var d2 = jpvs.Storage.getDomain(sessionStorage, "Domain 2");

d1.setItem(0, { col1: "Val 1", col2: "Val2", col3: [ "A", "B", "C" ] });
d1.setItem(1, { col1: "Val 1b", col2: "Val2b" });

d2.setItem(0, { A: "AAA", "B": "BBB" });

d1.each(function(item, i) {
...
});

d1.removeItem(0);

var first = d1.getItem(0);
var N = d1.getCount();
*/

/* JPVS
Module: storage
Classes: Storage
Depends: core, utils
*/
(function () {

    var KEY_PREFIX = "jpvs.Storage.";
    var KEY_PREFIX_LEN = KEY_PREFIX.length;

    function getObject(storage, key, defaultObj) {
        var objAsString = storage[KEY_PREFIX + key];
        if (!objAsString)
            return defaultObj;

        var obj = $.parseJSON(objAsString);
        return obj;
    }

    function setObject(storage, key, obj) {
        var objAsString = jpvs.toJSON(obj);
        storage[KEY_PREFIX + key] = objAsString;
    }

    function removeObject(storage, key) {
        storage.removeItem(KEY_PREFIX + key);
    }

    function eachObject(storage, action) {
        var N = storage.length;
        for (var i = 0; i < N; i++) {
            var entireKey = storage.key(i);
            if (entireKey.indexOf(KEY_PREFIX) != 0)
                continue;

            var key = entireKey.substring(KEY_PREFIX_LEN);
            var valueAsString = storage.getItem(key);
            var value = $.parseJSON(valueAsString);

            if (action(key, value) === false)
                return;
        }
    }

    function getItemKey(domainName, itemIndex) {
        return domainName + "." + itemIndex;
    }

    /*
    Domain class
    */
    function Domain(storage, domain) {
        this.storage = storage;
        this.id = domain.id;
        this.name = domain.name;
    }


    /*
    Get 1 + max(itemIndex)
    */
    Domain.prototype.getCount = function () {
        if (this.deleted)
            return 0;

        var prefix = this.name + ".";
        var prefixLen = prefix.length;

        var N = 0;
        eachObject(this.storage, function (key, value) {
            if (key.indexOf(prefix) == 0) {
                var index = key.substring(prefixLen);
                var nIndex = parseInt(index);
                if (isFinite(nIndex))
                    N = Math.max(N, nIndex + 1);
            }
        });

        return N;
    };

    Domain.prototype.getItem = function (itemIndex) {
        if (this.deleted)
            return null;

        var key = getItemKey(this.name, itemIndex);
        var item = getObject(this.storage, key, null);
        return item;
    };

    Domain.prototype.setItem = function (itemIndex, item) {
        if (this.deleted)
            return;

        var key = getItemKey(this.name, itemIndex);
        setObject(this.storage, key, item);
    };

    Domain.prototype.removeItem = function (itemIndex) {
        if (this.deleted)
            return;

        var key = getItemKey(this.name, itemIndex);
        removeObject(this.storage, key);
    };

    Domain.prototype.removeAllItems = function () {
        if (this.deleted)
            return;

        var N = this.getCount();
        for (var i = 0; i < N; i++)
            this.removeItem(i);
    };

    Domain.prototype.listItems = function () {
        if (this.deleted)
            return [];

        var list = [];
        this.each(function (i, item) {
            list.push(item);
        });
        return list;
    };

    Domain.prototype.each = function (action) {
        if (this.deleted)
            return;

        var N = this.getCount();
        for (var i = 0; i < N; i++) {
            if (action(i, this.getItem(i)) === false)
                return;
        }
    };

    Domain.prototype.deleteDomain = function () {
        if (this.deleted)
            return;

        this.removeAllItems();

        //Remove the entry from the list of domains
        var domains = getObject(this.storage, "Domains", {});
        delete domains[this.id];
        setObject(this.storage, "Domains", domains);

        //Deactivate this
        this.deleted = true;
    };

    jpvs.Storage = {
        listDomains: function (storage) {
            var domains = getObject(storage, "Domains", {});
            var objs = [];
            $.each(domains, function (key, d) {
                objs.push(new Domain(storage, d));
            });

            return objs;
        },

        getDomain: function (storage, domainName) {
            //See if the domain is already there
            var domains = getObject(storage, "Domains", {});
            var found;
            $.each(domains, function (id, d) {
                if (d.name == domainName) {
                    found = new Domain(storage, d);
                    return false;
                }
            });

            if (found)
                return found;

            //Not found in list, let's create it now
            var newD = {
                id: jpvs.randomString(20),
                name: domainName
            };

            var newDomObj = new Domain(storage, newD);

            //Let's add it back into the list of domains
            domains[newD.id] = newD;

            setObject(storage, "Domains", domains);

            return newDomObj;
        }
    };
})();

/* JPVS
Module: utils
Classes: 
Depends: core
*/

(function () {

    jpvs.addGestureListener = function (element, params, onGesture) {
        //Some sane defaults
        params = params || {};
        params.tapMaxDistance = params.tapMaxDistance || 15;
        params.longTapThreshold = params.longTapThreshold || 500;
        params.doubleTapThreshold = params.doubleTapThreshold || 250;
        params.rotationThreshold = params.rotationThreshold || (10 * Math.PI / 180);     //10deg

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        element = jpvs.getElementIfWidget(element);

        //Let's subscribe to touch events for the element
        element.on("touchstart", onTouch);
        element.on("touchmove", onTouch);
        element.on("touchend", onTouch);
        element.on("touchcancel", onTouch);

        //We want to track fingers
        var fingers = {};

        //We track shortTaps so we can decide if a shortTap is a doubleTap
        var lastShortTap = null;


        function onTouch(e) {
            var now = new Date().getTime();

            //Get the touch event from the jQuery event
            var te = e.originalEvent;

            //Let's track fingers
            trackFingers();

            //Now that we have the up-to-date finger situation, let's try to identify gestures
            identifyGestures();

            //We are handling touch, so we don't want the default behavior
            e.stopPropagation();
            e.preventDefault();
            return false;

            //Utilities
            function identifyGestures() {
                //Convert fingers to array
                var f = [];
                for (var i in fingers) {
                    var finger = fingers[i];
                    f.push(finger);
                }

                //Now look at fingers
                if (f.length == 1) {
                    //Single-finger gesture. See if it's dragging
                    var totalDx = f[0].current.clientX - f[0].start.clientX;
                    var totalDy = f[0].current.clientY - f[0].start.clientY;
                    var totalDistance = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
                    if (totalDistance > params.tapMaxDistance) {
                        //This finger is dragging (and will be until removed)
                        f[0].dragging = true;
                    }

                    //If dragging, then fire event
                    if (f[0].dragging) {
                        var evt = {
                            target: f[0].start.target,
                            isDrag: true,
                            dragX: f[0].current.clientX - f[0].previous.clientX,
                            dragY: f[0].current.clientY - f[0].previous.clientY,
                            totalDragX: f[0].current.clientX - f[0].start.clientX,
                            totalDragY: f[0].current.clientY - f[0].start.clientY
                        };

                        evt.toString = function () {
                            return "Drag: " + this.dragX + "; " + this.dragY + " - Total drag: " + this.totalDragX + "; " + this.totalDragY;
                        };

                        onGesture(evt);
                    }
                }
                else if (f.length == 2) {
                    //Double-finger gesture. See if it's zooming/rotating
                    //Let's measure the distance between the two fingers and the segment angle
                    var initialSegmentDx = f[0].start.clientX - f[1].start.clientX;
                    var initialSegmentDy = f[0].start.clientY - f[1].start.clientY;
                    var initialSegmentLength = Math.sqrt(initialSegmentDx * initialSegmentDx + initialSegmentDy * initialSegmentDy);
                    var initialSegmentAngle = Math.atan2(initialSegmentDy, initialSegmentDx);

                    var segmentDx = f[0].current.clientX - f[1].current.clientX;
                    var segmentDy = f[0].current.clientY - f[1].current.clientY;
                    var segmentLength = Math.sqrt(segmentDx * segmentDx + segmentDy * segmentDy);
                    var segmentAngle = Math.atan2(segmentDy, segmentDx);

                    var previousSegmentDx = f[0].previous.clientX - f[1].previous.clientX;
                    var previousSegmentDy = f[0].previous.clientY - f[1].previous.clientY;
                    var previousSegmentLength = Math.sqrt(previousSegmentDx * previousSegmentDx + previousSegmentDy * previousSegmentDy);
                    var previousSegmentAngle = Math.atan2(previousSegmentDy, previousSegmentDx);

                    //See if we must activate rotation/zooming
                    var deltaLength = segmentLength - initialSegmentLength;
                    var deltaAngle = segmentAngle - initialSegmentAngle;

                    if (Math.abs(deltaAngle) > params.rotationThreshold) {
                        //The two fingers are rotating (and will be until removed)
                        f[0].rotating = true;
                        f[1].rotating = true;

                        //Attach the same rotate tracker object
                        var rotateTracker = f[0].rotateTracker || f[1].rotateTracker || {};
                        f[0].rotateTracker = rotateTracker;
                        f[1].rotateTracker = rotateTracker;
                    }
                    else if (Math.abs(deltaLength) > params.tapMaxDistance) {
                        //The two fingers are zooming (and will be until removed)
                        f[0].zooming = true;
                        f[1].zooming = true;

                        //Attach the same zoom tracker object
                        var zoomTracker = f[0].zoomTracker || f[1].zoomTracker || {};
                        f[0].zoomTracker = zoomTracker;
                        f[1].zoomTracker = zoomTracker;
                    }

                    //If rotating, then fire event
                    if (f[0].rotating && f[1].rotating) {
                        var evt = {
                            target1: f[0].start.target,
                            target2: f[1].start.target,
                            isRotate: true,
                            angle: segmentAngle - previousSegmentAngle,
                            totalAngle: segmentAngle - initialSegmentAngle
                        };

                        evt.toString = function () {
                            return "Rotate: " + this.angle + " - Total angle: " + this.totalAngle;
                        };

                        //Track the total angle also on the finger object, so on end rotate we can signal the total angle applied
                        f[0].rotateTracker.totalAngle = evt.totalAngle;
                        f[0].rotateTracker.target1 = evt.target1;
                        f[0].rotateTracker.target2 = evt.target2;

                        onGesture(evt);
                    }

                    //If zooming, then fire event
                    if (f[0].zooming && f[1].zooming) {
                        var evt = {
                            target1: f[0].start.target,
                            target2: f[1].start.target,
                            isZoom: true,
                            zoomFactor: segmentLength / previousSegmentLength,
                            totalZoomFactor: segmentLength / initialSegmentLength
                        };

                        evt.toString = function () {
                            return "Zoom: " + this.zoomFactor + " - Total zoom: " + this.totalZoomFactor;
                        };

                        //Track the total zoom also on the finger object, so on end zoom we can signal the total zoom factor applied
                        f[0].zoomTracker.totalZoomFactor = evt.totalZoomFactor;
                        f[0].zoomTracker.target1 = evt.target1;
                        f[0].zoomTracker.target2 = evt.target2;

                        onGesture(evt);
                    }
                }
            }

            function trackFingers() {
                var identifiers = {};
                for (var i = 0; i < te.touches.length; i++) {
                    var touch = te.touches[i];
                    var finger = fingers[touch.identifier];
                    identifiers[touch.identifier] = true;

                    //If it's a new touch, let's create the finger
                    if (!finger) {
                        finger = {
                            start: {
                                target: touch.target,
                                time: now,
                                clientX: touch.clientX,
                                clientY: touch.clientY
                            },
                            current: {
                                target: touch.target,
                                time: now,
                                clientX: touch.clientX,
                                clientY: touch.clientY
                            }
                        };

                        fingers[touch.identifier] = finger;
                    }

                    //Save previous values
                    finger.previous = finger.current;

                    //Let's now set the current values
                    finger.current = {
                        target: touch.target,
                        time: now,
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    };
                }

                //Remove fingers that are no longer active
                for (var identifier in fingers) {
                    if (!identifiers[identifier]) {
                        //This finger is no longer on screen
                        var finger = fingers[identifier];
                        delete fingers[identifier];

                        if (finger.rotating) {
                            //End of rotate
                            var evt = {
                                target1: finger.rotateTracker.target1,
                                target2: finger.rotateTracker.target2,
                                isRotate: false,
                                isEndRotate: true,
                                totalAngle: finger.rotateTracker.totalAngle
                            };

                            evt.toString = function () {
                                return "End of rotation: total angle " + this.totalAngle;
                            };

                            onGesture(evt);
                        }
                        else if (finger.zooming) {
                            //End of zoom
                            var evt = {
                                target1: finger.zoomTracker.target1,
                                target2: finger.zoomTracker.target2,
                                isZoom: false,
                                isEndZoom: true,
                                totalZoomFactor: finger.zoomTracker.totalZoomFactor
                            };

                            evt.toString = function () {
                                return "End of zoom: total factor " + this.totalZoomFactor;
                            };

                            onGesture(evt);
                        }
                        else if (finger.dragging) {
                            //End of drag
                            var evt = {
                                target: finger.start.target,
                                isDrag: false,
                                isEndDrag: true,
                                totalDragX: finger.current.clientX - finger.start.clientX,
                                totalDragY: finger.current.clientY - finger.start.clientY
                            };

                            evt.toString = function () {
                                return "End of drag";
                            };

                            onGesture(evt);
                        }
                        else {
                            //Let's see if it was a tap (short/long)
                            if (te.touches.length == 0) {
                                var dx = finger.current.clientX - finger.start.clientX;
                                var dy = finger.current.clientY - finger.start.clientY;
                                var distance = Math.sqrt(dx * dx + dy * dy);
                                if (distance < params.tapMaxDistance) {
                                    //It's a tap because the finger didn't move away too much
                                    //Let's see if it was a short tap or a long tap
                                    var dt = now - finger.start.time;
                                    var evt = {
                                        target: finger.start.target,
                                        isTap: true,
                                        isLongTap: dt >= params.longTapThreshold
                                    };

                                    //Let's see if it's a double-tap
                                    if (!evt.isLongTap) {
                                        //Short tap
                                        if (lastShortTap) {
                                            dt = finger.start.time - lastShortTap.time;
                                            if (dt < params.doubleTapThreshold) {
                                                //It's close in time. For this short tap to be a double tap, it must also be close in space.
                                                dx = finger.start.clientX - lastShortTap.clientX;
                                                dy = finger.start.clientY - lastShortTap.clientY;
                                                var distance = Math.sqrt(dx * dx + dy * dy);
                                                if (distance < params.tapMaxDistance) {
                                                    //OK, this is a double tap
                                                    evt.isDoubleTap = true;
                                                    lastShortTap = null;
                                                }
                                            }
                                        }

                                        //If it is not a double tap, it is a simple short tap
                                        if (!evt.isDoubleTap) {
                                            //In this case, we keep track of it
                                            lastShortTap = {
                                                time: now,
                                                clientX: finger.start.clientX,
                                                clientY: finger.start.clientY
                                            };
                                        }
                                    }
                                    else {
                                        //Long tap, so let's forget the lastShortTap
                                        lastShortTap = null;
                                    }

                                    evt.toString = function () {
                                        return "Tap: " + (this.isLongTap ? "long" : "short") + " - " + (this.isDoubleTap ? "double" : "simple");
                                    };

                                    onGesture(evt);
                                }
                            }
                        }
                    }
                }
            }
        }
    };

})();

/* JPVS
Module: utils
Classes: 
Depends: core
*/

(function () {

    jpvs.equals = function (x, y) {
        //If the objects are strictly equal, no other work is required
        if (x === y)
            return true;

        //Nulls
        if (x === null && y === null)
            return true;
        else if (x === null && y !== null)
            return false;
        else if (x !== null && y === null)
            return false;

        //Undefineds
        if (x === undefined && y === undefined)
            return true;
        else if (x === undefined && y !== undefined)
            return false;
        else if (x !== undefined && y === undefined)
            return false;

        //Booleans
        if (x === true && y === true)
            return true;
        else if (x === true && y !== true)
            return false;
        else if (x !== true && y === true)
            return false;

        if (x === false && y === false)
            return true;
        else if (x === false && y !== false)
            return false;
        else if (x !== false && y === false)
            return false;

        //Object typeof: if different, the object can't be equal
        if (typeof (x) != typeof (y))
            return false;

        //Objects have the same typeof
        //Numbers
        if (typeof (x) == "number") {
            //NaNs
            if (isNaN(x) && isNaN(y))
                return true;
            else if (isNaN(x) && !isNaN(y))
                return false;
            else if (!isNaN(x) && isNaN(y))
                return false;

            return x == y;
        }

        //Strings
        if (typeof (x) == "string")
            return x == y;

        //Objects and arrays
        if (x.length !== undefined && y.length !== undefined) {
            //Arrays
            return arraysEqual(x, y);
        }
        else if (x.length !== undefined && y.length === undefined) {
            //Array and object
            return false;
        }
        else if (x.length === undefined && y.length !== undefined) {
            //Object and array
            return false;
        }
        else {
            //Objects
            return objectsEqual(x, y);
        }

    };

    function arraysEqual(x, y) {
        if (x.length != y.length)
            return false;

        //Same length, then all elements must be equal
        for (var i = 0; i < x.length; i++) {
            var xVal = x[i];
            var yVal = y[i];
            if (!jpvs.equals(xVal, yVal))
                return false;
        }

        //No reason to say x and y are different
        return true;
    }

    function objectsEqual(x, y) {
        //If dates, special treatment
        if (x.getTime && y.getTime) {
            //Both dates
            return x.getTime() == y.getTime();
        }
        else if (!x.getTime && y.getTime) {
            //Not "both dates"
            return false;
        }
        else if (x.getTime && !y.getTime) {
            //Not "both dates"
            return false;
        }

        //All members of x must exist in y and be equal
        var alreadyChecked = {};
        for (var key in x) {
            var xVal = x[key];
            var yVal = y[key];
            if (!jpvs.equals(xVal, yVal))
                return false;

            alreadyChecked[key] = true;
        }

        //Other way round; for speed, exclude those already checked
        for (var key in y) {
            if (alreadyChecked[key])
                continue;

            var xVal = x[key];
            var yVal = y[key];
            if (!jpvs.equals(xVal, yVal))
                return false;
        }

        //No reason to say x and y are different
        return true;
    }

})();

/* JPVS
Module: widgets
Classes: Button
Depends: core
*/

jpvs.Button = function (selector) {
    this.attach(selector);

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Button,
    type: "Button",
    cssClass: "Button",

    create: function (container) {
        var obj = document.createElement("button");
        $(obj).attr("type", "button");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.click(function () {
            return W.click.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("button,input[type=\"button\"]");
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.text(); },
            set: function (value) { this.element.text(value); }
        })
    }
});


jpvs.writeButtonBar = function (container, buttons) {
    if (!container)
        return;
    if (!buttons)
        return;

    //Handle the case when container is a jpvs widget
    container = jpvs.getElementIfWidget(container);

    //Create buttonbar
    var bar = $(document.createElement("div"));
    $(bar).addClass("ButtonBar").appendTo(container);

    //Add individual buttons
    $.each(buttons, function (i, btnDef) {
        var btn = jpvs.Button.create(bar);
        btn.text(btnDef.text || "OK").click.bind(btnDef.click);
    });

    return bar;
};

/* JPVS
Module: widgets
Classes: CheckBox
Depends: core
*/

jpvs.CheckBox = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.CheckBox,
    type: "CheckBox",
    cssClass: "CheckBox",

    create: function (container) {
        var obj = document.createElement("input");
        $(obj).attr("type", "checkbox");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        //Route both CLICK and CHANGE to out CHANGE event
        this.element.click(function () {
            return W.change.fire(W);
        });
        this.element.change(function () {
            return W.change.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("input[type=\"checkbox\"]");
    },

    prototype: {
        checked: jpvs.property({
            get: function () { return this.element.prop("checked"); },
            set: function (value) { this.element.prop("checked", value ? true : false); }
        }),

        text: jpvs.property({
            get: function () {
                this.ensureId();
                var lbl = $("label[for=\"" + this.id() + "\"]");
                return lbl.text();
            },
            set: function (value) {
                this.ensureId();
                var lbl = $("label[for=\"" + this.id() + "\"]");
                if (lbl.length == 0) {
                    lbl = $(document.createElement("label"));
                    lbl.attr("for", this.id());
                    lbl.insertAfter(this.element);
                }

                lbl.text(value);
            }
        })
    }
});



/* JPVS
Module: widgets
Classes: DataGrid
Depends: core
*/

(function () {

    jpvs.DataGrid = function (selector) {
        this.attach(selector);

        this.dataItemClick = jpvs.event(this);
        this.changedSortFilter = jpvs.event(this);
    };

    jpvs.DataGrid.allStrings = {
        en: {
            clickToSortAndFilter: "Click here for sorting/filtering options",
            clickToSort: "Click here for sorting options",
            clickToFilter: "Click here for filtering options",

            titleSortAndFilter: "Sorting/filtering options",
            titleSort: "Sorting options",
            titleFilter: "Filtering options",

            ok: "OK",
            cancel: "Cancel",

            orderBy: "Order by",
            thenBy: "Then by",
            descending: "Descending",

            op_EQ: "is equal to",
            op_NEQ: "is not equal to",
            op_CONTAINS: "contains",
            op_NCONTAINS: "does not contain",
            op_STARTS: "starts with",
            op_NSTARTS: "does not start with",
            op_LT: "is less than",
            op_LTE: "is less than or equal to",
            op_GT: "is greater than",
            op_GTE: "is greater than or equal to"
        },

        it: {
            clickToSortAndFilter: "Clicca qui per ordinare/filtrare i dati",
            clickToSort: "Clicca qui per ordinare i dati",
            clickToFilter: "Clicca qui per filtrare i dati",

            titleSortAndFilter: "Ordinamento/filtro",
            titleSort: "Ordinamento",
            titleFilter: "Filtro",

            ok: "OK",
            cancel: "Annulla",

            orderBy: "Ordina per",
            thenBy: "Poi per",
            descending: "Ordine inverso",

            op_EQ: "è uguale a",
            op_NEQ: "è diverso da",
            op_CONTAINS: "contiene",
            op_NCONTAINS: "non contiene",
            op_STARTS: "inizia per",
            op_NSTARTS: "non inizia per",
            op_LT: "è minore di",
            op_LTE: "è minore o uguale a",
            op_GT: "è maggiore di",
            op_GTE: "è maggiore o uguale a"
        }
    };

    jpvs.DataGrid.getFilteringOperands = function () {
        return [
            { value: "EQ", text: jpvs.DataGrid.strings.op_EQ },
            { value: "NEQ", text: jpvs.DataGrid.strings.op_NEQ },
            { value: "CONTAINS", text: jpvs.DataGrid.strings.op_CONTAINS },
            { value: "NCONTAINS", text: jpvs.DataGrid.strings.op_NCONTAINS },
            { value: "STARTS", text: jpvs.DataGrid.strings.op_STARTS },
            { value: "NSTARTS", text: jpvs.DataGrid.strings.op_NSTARTS },
            { value: "LT", text: jpvs.DataGrid.strings.op_LT },
            { value: "LTE", text: jpvs.DataGrid.strings.op_LTE },
            { value: "GT", text: jpvs.DataGrid.strings.op_GT },
            { value: "GTE", text: jpvs.DataGrid.strings.op_GTE }
        ];
    };

    jpvs.makeWidget({
        widget: jpvs.DataGrid,
        type: "DataGrid",
        cssClass: "DataGrid",

        create: function (container) {
            var obj = document.createElement("table");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            jpvs.DataGrid.strings = jpvs.DataGrid.allStrings[jpvs.currentLocale()];

            //Attach a click handler to all rows, even those we will add later
            this.element.on("click", "tr", function (e) {
                return onRowClicked(W, e.currentTarget);
            });

            //Attach a hovering effect on the header row, for handling sorting/filtering
            this.element.on("mouseenter", "thead > tr", function (e) {
                onHeaderRowMouseOver(W, e.currentTarget);
            });
            this.element.on("mouseleave", "thead > tr", function (e) {
                onHeaderRowMouseOut(W, e.currentTarget);
            });
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            template: jpvs.property({
                get: function () { return this.element.data("template"); },
                set: function (value) { this.element.data("template", value); }
            }),

            emptyRowTemplate: jpvs.property({
                get: function () { return this.element.data("emptyRowTemplate"); },
                set: function (value) { this.element.data("emptyRowTemplate", value); }
            }),

            binder: jpvs.property({
                get: function () { return this.element.data("binder"); },
                set: function (value) { this.element.data("binder", value); }
            }),

            caption: jpvs.property({
                get: function () {
                    var caption = this.element.children("caption");
                    if (caption.length != 0)
                        return caption.text();
                    else
                        return null;
                },
                set: function (value) {
                    var caption = this.element.children("caption");
                    if (caption.length == 0) {
                        caption = $(document.createElement("caption"));
                        this.element.prepend(caption);
                    }

                    caption.text(value);
                }
            }),

            enableEvenOdd: jpvs.property({
                get: function () {
                    var val = this.element.data("enableEvenOdd");
                    if (val === true || val === false)
                        return val;
                    else
                        return true;    //Default value
                },
                set: function (value) { this.element.data("enableEvenOdd", value); }
            }),

            enableSorting: jpvs.property({
                get: function () {
                    var val = this.element.data("enableSorting");
                    if (val === true || val === false)
                        return val;
                    else
                        return false;    //Default value
                },
                set: function (value) { this.element.data("enableSorting", value); }
            }),

            enableFiltering: jpvs.property({
                get: function () {
                    var val = this.element.data("enableFiltering");
                    if (val === true || val === false)
                        return val;
                    else
                        return false;    //Default value
                },
                set: function (value) { this.element.data("enableFiltering", value); }
            }),

            //This is used for filling the "order by" combos in the "Sorting/filtering options" popup
            sortAndFilterExpressions: jpvs.property({
                get: function () {
                    var val = this.element.data("sortAndFilterExpressions");
                    if (!val) {
                        //If not initialized, attempt to determine a list of expressions (the header texts)
                        val = [];
                        this.element.find("thead > tr > th").each(function () {
                            var txt = $(this).text();
                            val.push({ value: txt, text: txt });
                        });
                    }

                    return val;
                },
                set: function (value) {
                    this.element.data("sortAndFilterExpressions", value);
                }
            }),

            currentSort: jpvs.property({
                get: function () {
                    //We want to return null (not undefined) if the value has not been set
                    return this.element.data("currentSort") || null;
                },
                set: function (value) {
                    this.element.data("currentSort", value);
                }
            }),

            currentFilter: jpvs.property({
                get: function () {
                    //We want to return null (not undefined) if the value has not been set
                    return this.element.data("currentFilter") || null;
                },
                set: function (value) {
                    this.element.data("currentFilter", value);
                }
            }),

            clear: function () {
                this.element.find("tr").remove();
                return this;
            },

            dataBind: function (data) {
                dataBind(this, "tbody", data);
                return this;
            },

            dataBindHeader: function (data) {
                dataBind(this, "thead", data);
                return this;
            },

            dataBindFooter: function (data) {
                dataBind(this, "tfoot", data);
                return this;
            },

            addBodyRow: function (item, index) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item, index);
                return this;
            },

            addHeaderRow: function (item, index) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item, index);
                return this;
            },

            addFooterRow: function (item, index) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                var sectionName = decodeSectionName(section);
                addRow(this, sectionName, sectionElement, item, index);
                return this;
            },

            removeBodyRow: function (index) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index);
                return this;
            },

            removeHeaderRow: function (index) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index);
                return this;
            },

            removeFooterRow: function (index) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index);
                return this;
            },

            removeBodyRows: function (index, count) {
                var section = "tbody";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index, count);
                return this;
            },

            removeHeaderRows: function (index, count) {
                var section = "thead";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index, count);
                return this;
            },

            removeFooterRows: function (index, count) {
                var section = "tfoot";
                var sectionElement = getSection(this, section);
                removeRow(this, sectionElement, index, count);
                return this;
            }
        }
    });

    function dataBind(W, section, data) {
        //Get the current binder or the default one
        var binder = W.binder() || jpvs.DataGrid.defaultBinder;

        //Call the binder, setting this=WIDGET and passing section and data
        binder.call(W, section, data);
    }

    function getSection(W, section) {
        //Ensure the "section" exists (thead, tbody or tfoot)
        var sectionElement = W.element.children(section);
        if (sectionElement.length == 0) {
            sectionElement = $(document.createElement(section));
            W.element.append(sectionElement);
        }

        return sectionElement;
    }

    function addRow(W, sectionName, sectionElement, item, index) {
        //If item is null or undefined, continue anyway. We will add an empty row with a special "empty row template".
        //Add a new row
        var tr = $(document.createElement("tr"));

        if (index === null || index === undefined) {
            //Append, because no index was specified
            sectionElement.append(tr);

            //Only update the even/odd of the last row
            if (W.enableEvenOdd())
                updateEvenOdd(-1, sectionElement);
        }
        else {
            //An index was specified: insert the row at that index
            var trs = sectionElement.children("tr");
            if (trs.length == 0)
                sectionElement.append(tr);
            else
                trs.eq(index).before(tr);

            //Update the even/odd state of all rows from "index" on
            if (W.enableEvenOdd())
                updateEvenOdd(index, sectionElement);
        }

        //Create the cells according to the row template
        var tmpl = W.template();
        var emptyRowTmpl = W.emptyRowTemplate();
        if (tmpl)
            applyRowTemplate(tr, sectionName, tmpl, emptyRowTmpl, item);
    }

    function removeRow(W, sectionElement, index, count) {
        //By default, count = 1
        if (count === null || count === undefined)
            count = 1;

        if (count == 1)
            sectionElement.children("tr").eq(index).remove();
        else if (count > 1)
            sectionElement.children("tr").slice(index, index + count).remove();

        //Update the even/odd state of all rows from "index" on
        if (W.enableEvenOdd())
            updateEvenOdd(index, sectionElement);
    }

    function updateEvenOdd(start, sectionElement) {
        var rows = sectionElement.children("tr");

        if (start < 0)
            start += rows.length;

        var even = ((start % 2) == 0);

        for (var i = start; i < rows.length; i++) {
            var row = rows.eq(i);
            row.removeClass("Even Odd").addClass(even ? "Even" : "Odd");

            //Toggle "even"
            even = !even;
        }
    }

    function decodeSectionName(section) {
        if (section == "thead") return "header";
        else if (section == "tfoot") return "footer";
        else return "body";
    }

    function applyRowTemplate(tr, sectionName, tmpl, emptyRowTmpl, item) {
        //Remove the existing cells
        tr.empty();

        //Then write the new cells
        if (item) {
            //We have a record
            //The template is a collection of column templates. For each element, create a cell.
            $.each(tmpl, function (i, columnTemplate) {
                /*
                Determine the cell template, given the column template.
                The column template may be in the form:
                { header: headerCellTemplate, body: bodyCellTemplate, footer: footerCellTemplate } where any element may be missing.
                Or it may contain the cell template directly.
                */
                var cellTemplate = columnTemplate;
                if (columnTemplate.header || columnTemplate.body || columnTemplate.footer)
                    cellTemplate = columnTemplate[sectionName];

                //Determine if we have to create a TH or a TD
                var cellTag = "td";
                if ((cellTemplate && cellTemplate.isHeader) || sectionName == "header" || sectionName == "footer")
                    cellTag = "th";

                //Create the cell
                var cell = $(document.createElement(cellTag));
                tr.append(cell);

                //Populate the cell by applying the cell template
                jpvs.applyTemplate(cell, cellTemplate, item);
            });

            //Keep track of the fact we are NOT using the empty row template
            tr.data("fromEmptyRowTemplate", false);

            //Keep track of the data item (used for the dataItemClick event)
            tr.data("dataItem", item);
        }
        else {
            //We don't have a record. Let's use the empty row template, if any, or the default empty row template
            jpvs.applyTemplate(tr, emptyRowTmpl || createDefaultEmptyRowTemplate(tmpl.length), item);

            //Keep track of the fact we are using the empty row template
            tr.data("fromEmptyRowTemplate", true);
        }
    }

    function createDefaultEmptyRowTemplate(numCols) {
        return function (dataItem) {
            //Since it's an empty row template, we have no data, so we ignore the "dataItem" argument
            //Let's create a single cell that spans the entire row
            var singleTD = jpvs.writeTag(this, "td").attr("colspan", numCols);

            //Loading animated GIF
            jpvs.writeTag(singleTD, "img").attr("src", jpvs.Resources.images.loading);

            //Then let's create an invisible dummy text so the row has the correct height automagically
            jpvs.writeTag(singleTD, "span", ".").css("visibility", "hidden");
        };
    }

    function onRowClicked(grid, tr) {
        var dataItem = $(tr).data("dataItem");
        if (dataItem)
            return grid.dataItemClick.fire(grid, null, dataItem);
    }

    function onHeaderRowMouseOver(grid, tr) {
        //If neither sorting nor filtering are enabled, no hovering effect
        var enableSorting = grid.enableSorting();
        var enableFiltering = grid.enableFiltering();
        if (!enableSorting && !enableFiltering)
            return;

        var tooltip = "";
        if (enableSorting && enableFiltering)
            tooltip = jpvs.DataGrid.strings.clickToSortAndFilter;
        else if (enableSorting)
            tooltip = jpvs.DataGrid.strings.clickToSort;
        else if (enableFiltering)
            tooltip = jpvs.DataGrid.strings.clickToFilter;

        //Otherwise, let's give visual cues so the user can sort/filter
        //Let's add an unobtrusive button to each cell, unless the buttons are already displayed
        //Only add buttons on columns where sorting/filtering is required
        var exprs = grid.sortAndFilterExpressions();
        var buttons = $(tr).data("jpvsColButtons") || [];
        if (buttons.length == 0) {
            $(tr).find("td,th").each(function (index) {
                //Skip this column if this column is not listed as a sort/filter expression
                if (!exprs[index])
                    return;

                //Measure the cell
                var cell = $(this);
                var pos = cell.position();
                var x = pos.left;
                var y = pos.top;
                var w = cell.innerWidth();
                var h = cell.outerHeight();

                var imgTop = y;
                var imgLeft = x + w;

                var img = jpvs.ImageButton.create(cell).imageUrls({
                    normal: jpvs.Resources.images.dataGridColumnButton,
                    hover: jpvs.Resources.images.dataGridColumnButtonHover
                });

                imgLeft -= img.element.width();

                img.element.css({
                    position: "absolute",
                    left: imgLeft + "px",
                    top: imgTop + "px"
                }).attr("title", tooltip);

                img.click(onHeaderButtonClickFunc(grid, index));

                buttons.push(img);
            });

            //Keep track of the buttons
            $(tr).data("jpvsColButtons", buttons);
        }
    }

    function onHeaderRowMouseOut(grid, tr) {
        //Let's make the buttons disappear
        var buttons = $(tr).data("jpvsColButtons");
        if (buttons) {
            setTimeout(function () {
                $.each(buttons, function (i, button) {
                    button.destroy();
                });
            }, 5000);
        }
        $(tr).data("jpvsColButtons", null);
    }

    function onHeaderButtonClickFunc(grid, colIndex) {
        return function () {
            onHeaderButtonClick(grid, colIndex);
        };
    }

    function onHeaderButtonClick(grid, colIndex) {
        var enableSorting = grid.enableSorting();
        var enableFiltering = grid.enableFiltering();
        if (!enableSorting && !enableFiltering)
            return;

        var title = "";
        if (enableSorting && enableFiltering)
            title = jpvs.DataGrid.strings.titleSortAndFilter;
        else if (enableSorting)
            title = jpvs.DataGrid.strings.titleSort;
        else if (enableFiltering)
            title = jpvs.DataGrid.strings.titleFilter;

        //Open a popup with sorting/filtering options
        var pop = jpvs.Popup.create().title(title).show();

        var bothEnabled = enableSorting && enableFiltering;

        //If both are enabled, group fields together for clarity
        var pnlSort = pop;
        var pnlFilter = pop;
        if (bothEnabled) {
            pnlSort = jpvs.writeTag(pop, "fieldset");
            pnlFilter = jpvs.writeTag(pop, "fieldset");

            jpvs.writeTag(pnlSort, "legend", jpvs.DataGrid.strings.titleSort);
            jpvs.writeTag(pnlFilter, "legend", jpvs.DataGrid.strings.titleFilter);
        }

        //Sorting panel
        var sortControls = [];
        if (enableSorting) {
            var tblSort = jpvs.Table.create(pnlSort);

            sortControls.push(writeSortingRow(tblSort, jpvs.DataGrid.strings.orderBy));
            sortControls.push(writeSortingRow(tblSort, jpvs.DataGrid.strings.thenBy));
            sortControls.push(writeSortingRow(tblSort, jpvs.DataGrid.strings.thenBy));
            sortControls.push(writeSortingRow(tblSort, jpvs.DataGrid.strings.thenBy));

            //Set the combos to the current sort expression, if any, otherwise set only the first combo to the "colIndex" (the
            //clicked column)
            var sortExpr = grid.currentSort();
            if (!sortExpr) {
                var allExprs = grid.sortAndFilterExpressions();
                var colIndexName = allExprs && allExprs[colIndex] && allExprs[colIndex].value;
                if (colIndexName)
                    sortExpr = [{ name: colIndexName}];
                else
                    sortExpr = [];
            }

            //Set the combos to "sortExpr"
            for (var i = 0; i < sortControls.length; i++)
                setSortingRowValue(sortControls[i], sortExpr[i]);
        }

        //Filtering panel
        var filterControls = [];
        if (enableFiltering) {
            var tblFilter = jpvs.Table.create(pnlFilter);

            filterControls.push(writeFilteringRow(tblFilter));
            filterControls.push(writeFilteringRow(tblFilter));
            filterControls.push(writeFilteringRow(tblFilter));
            filterControls.push(writeFilteringRow(tblFilter));

            //Set the combos to the current filter expression, if any
            var filterExpr = grid.currentFilter() || [];

            //Set the combos to "filterExpr"
            for (var i = 0; i < filterControls.length; i++)
                setFilteringRowValue(filterControls[i], filterExpr[i]);
        }

        //Finally, button bar and close button
        jpvs.writeButtonBar(pop, [
            { text: jpvs.DataGrid.strings.ok, click: onOK },
            { text: jpvs.DataGrid.strings.cancel, click: onCancel }
        ]);
        pop.close(onCancel);

        //Events
        function onCancel() {
            pop.destroy();
        }

        function onOK() {
            //Save settings
            if (enableSorting) {
                //Save the sorting settings
                var sortExpr = [];
                for (var i = 0; i < sortControls.length; i++) {
                    var cmb = sortControls[i].cmbSort;
                    var chk = sortControls[i].chkDesc;

                    var name = cmb.selectedValue();
                    var desc = chk.checked();
                    if (name && name != "")
                        sortExpr.push({ name: name, descending: desc });
                }

                grid.currentSort(sortExpr);
            }

            if (enableFiltering) {
                //Save the filtering settings
                var filterExpr = [];
                for (var i = 0; i < filterControls.length; i++) {
                    var cmb1 = filterControls[i].cmbFilter;
                    var cmb2 = filterControls[i].cmbOp;
                    var txt = filterControls[i].txtValue;

                    var name = cmb1.selectedValue();
                    var op = cmb2.selectedValue();
                    var val = txt.text();
                    if (name && name != "" && op && op != "")
                        filterExpr.push({ name: name, operand: op, value: val });
                }

                grid.currentFilter(filterExpr);
            }

            //Finally, close the popup and fire event that sort/filter has just changed, so that binders
            //can take appropriate action (refresh grid/page)
            grid.changedSortFilter.fire(grid);
            pop.destroy();
        }

        //Utilities
        function writeSortingRow(tbl, caption) {
            //Order by: COMBO (field name) CHECKBOX (ascending/descending)
            var row = tbl.writeRow();
            row.writeCell(caption + ": ");
            var cmbSort = jpvs.DropDownList.create(row.writeCell());
            var chkDesc = jpvs.CheckBox.create(row.writeCell());
            chkDesc.text(jpvs.DataGrid.strings.descending);

            //Fill the combo with the header names
            cmbSort.addItem("");
            cmbSort.addItems(grid.sortAndFilterExpressions());

            return { cmbSort: cmbSort, chkDesc: chkDesc };
        }

        function setSortingRowValue(sortControl, sortPred) {
            if (sortPred) {
                sortControl.cmbSort.selectedValue(sortPred.name);
                sortControl.chkDesc.checked(sortPred.descending);
            }
        }

        function writeFilteringRow(tbl, caption) {
            //COMBO (field name) COMBO (operand), TEXTBOX (value)
            var row = tbl.writeRow();
            var cmbFilter = jpvs.DropDownList.create(row.writeCell());
            var cmbOp = jpvs.DropDownList.create(row.writeCell());
            var txtValue = jpvs.TextBox.create(row.writeCell());

            //Fill the combo with the header names
            cmbFilter.addItem("");
            cmbFilter.addItems(grid.sortAndFilterExpressions());

            //Fill the combo with the operands
            cmbOp.addItem("");
            cmbOp.addItems(jpvs.DataGrid.getFilteringOperands());

            return { cmbFilter: cmbFilter, cmbOp: cmbOp, txtValue: txtValue };
        }

        function setFilteringRowValue(filterControl, filterPred) {
            if (filterPred) {
                filterControl.cmbFilter.selectedValue(filterPred.name);
                filterControl.cmbOp.selectedValue(filterPred.operand);
                filterControl.txtValue.text(filterPred.value);
            }
        }

    }


    function getDataSourceOptions(W) {
        //Returns sorting/filtering options, as needed by the call to jpvs.readDataSource
        return {
            sort: W.currentSort(),
            filter: W.currentFilter()
        };
    }

    /*
    Default binder

    Displays all rows in the datasource
    */
    jpvs.DataGrid.defaultBinder = function (section, data) {
        var W = this;

        //Refresh the grid now...
        refresh();

        //...and whenever sorting/filtering options are changed by the user
        W.changedSortFilter.unbind("binder");
        W.changedSortFilter.bind("binder", refresh);

        function refresh() {
            //Remove all rows
            var sectionElement = getSection(W, section);
            var sectionName = decodeSectionName(section);

            //Read the entire data set...
            jpvs.readDataSource(data, null, null, getDataSourceOptions(W), next);

            //...and bind all the rows
            function next(ret) {
                sectionElement.empty();
                $.each(ret.data, function (i, item) {
                    addRow(W, sectionName, sectionElement, item);
                });
            }
        }
    };



    /*
    Paging binder

    Displays rows in the grid one page at a time
    */
    jpvs.DataGrid.pagingBinder = function (params) {
        var pageSize = (params && params.pageSize) || 10;
        var preserveCurrentPage = (params && params.preserveCurrentPage);

        var copyOfCurPage = 0;

        function binder(section, data) {
            var W = this;

            var sectionElement = getSection(W, section);
            var sectionName = decodeSectionName(section);

            var curPage = preserveCurrentPage ? copyOfCurPage : 0;
            copyOfCurPage = curPage;

            //Ensure the pager is present
            var pager = getPager();

            //Refresh the current page
            refreshPage();

            //Whenever the user changes sorting/filtering, refresh the current page
            W.changedSortFilter.unbind("binder");
            W.changedSortFilter.bind("binder", refreshPage);

            function getPager() {
                //Let's see if a pager has already been created for this datagrid
                var pagerId = W.element.data("pagerId");
                var pager;
                if (pagerId) {
                    //There is a pager
                    pager = jpvs.find("#" + pagerId);
                }
                else {
                    //No pager, let's create one
                    var pagerContainer = document.createElement("div");
                    W.element.before(pagerContainer);
                    pager = jpvs.Pager.create(pagerContainer);

                    pagerId = jpvs.randomString(20);
                    pager.element.attr("id", pagerId);
                    W.element.data("pagerId", pagerId);
                }

                //Bind events
                pager.change.unbind("DataGrid");
                pager.change.bind("DataGrid", onPageChange);

                return pager;
            }

            function onPageChange() {
                var newPage = this.page();
                curPage = newPage;
                copyOfCurPage = curPage;
                refreshPage(W, section, data, pager);
            }

            function refreshPage() {
                //Read the current page...
                var start = curPage * pageSize;
                jpvs.readDataSource(data, start, pageSize, getDataSourceOptions(W), next);

                //...and bind all the rows
                function next(ret) {
                    //Remove all rows
                    sectionElement.empty();

                    //Add rows
                    $.each(ret.data, function (i, item) {
                        addRow(W, sectionName, sectionElement, item);
                    });

                    //Update the pager, based on the current situation
                    var totPages = Math.floor((ret.total + pageSize - 1) / pageSize);
                    pager.totalPages(totPages);
                    pager.page(curPage);
                }
            }
        }

        function getCurrentPage() {
            return copyOfCurPage;
        }

        binder.currentPage = jpvs.property({
            get: getCurrentPage
        });


        return binder;
    };



    /*
    Scrolling binder

    Displays at most one page and allows up/down scrolling
    */
    jpvs.DataGrid.scrollingBinder = function (params) {
        var pageSize = (params && params.pageSize) || 10;
        var chunkSize = (params && params.chunkSize) || (5 * pageSize);
        var forcedWidth = (params && params.width);
        var forcedHeight = (params && params.height);

        //Keep a request queue to minimize calls to the datasource
        var requestQueue = [];
        var requestInProgress = false;

        //Here's the binder
        function binder(section, data) {
            var W = this;
            var sectionElement = getSection(W, section);
            var sectionName = decodeSectionName(section);

            var curScrollPos = null;

            var cachedData = [];
            var totalRecords = null;

            //In this variables we keep the maximum grid size encountered
            var maxGridWidth = 0;
            var maxGridHeight = 0;

            //Ensure the scroller is present
            var scroller = getScroller();

            //Load the first chunk of data (only the visible page for faster turnaround times)
            jpvs.readDataSource(data, 0, pageSize, getDataSourceOptions(W), onDataLoaded(function () {
                updateGrid(0);

                //After loading and displaying the first page, load some more records in background
                jpvs.readDataSource(data, pageSize, chunkSize, getDataSourceOptions(W), onDataLoaded(updateRows));
            }));

            //When sort/filter is changed, reload and empty the cache
            W.changedSortFilter.unbind("binder");
            W.changedSortFilter.bind("binder", function () {
                cachedData = [];
                totalRecords = null;

                jpvs.readDataSource(data, curScrollPos, pageSize, getDataSourceOptions(W), onDataLoaded(function () {
                    refreshPage(curScrollPos);
                }));
            });

            function ensurePageOfDataLoaded(newScrollPos) {
                //Let's make sure we have all the records in memory (at least for the page we have to display)
                var start = newScrollPos;
                var end = start + pageSize;
                var allPresent = true;
                var firstMissingIndex;
                for (var i = start; i < end && i < totalRecords; i++) {
                    var recordPresent = cachedData[i];
                    if (!recordPresent) {
                        allPresent = false;
                        firstMissingIndex = i;
                        break;
                    }
                }

                //If we don't have all records in memory, let's call the datasource
                if (allPresent)
                    updateRows();
                else {
                    //Read from firstMissingIndex - chunkSize up to firstMissingIndex + chunkSize
                    var start = Math.max(0, firstMissingIndex - chunkSize);
                    var end = Math.min(firstMissingIndex + chunkSize, totalRecords);
                    enqueueLoad(start, end);
                }
            }

            function enqueueLoad(start, end) {
                requestQueue.push({ start: start, end: end });
                ensureRequestInProgress();
            }

            function ensureRequestInProgress() {
                if (requestInProgress)
                    return;

                //If no request is in progress, let's start a request
                //Let's consolidate multiple requests into a single one
                if (requestQueue.length != 0) {
                    var minStart = requestQueue[0].start;
                    var maxEnd = requestQueue[0].end;
                    var lastStart, lastEnd;
                    for (var i = 0; i < requestQueue.length; i++) {
                        var req = requestQueue[i];
                        lastStart = req.start;
                        lastEnd = req.end;

                        minStart = Math.min(minStart, lastStart);
                        maxEnd = Math.max(maxEnd, lastEnd);
                    }

                    //Empty the queue and call the datasource
                    requestQueue = [];
                    requestInProgress = true;
                    jpvs.readDataSource(data, minStart, maxEnd - minStart, getDataSourceOptions(W), onDataLoaded(updateRows));
                }
            }


            function onDataLoaded(next) {
                //This function gets called whenever new records are returned from the data source
                return function (ret) {
                    //Keep track that no request is in progress
                    requestInProgress = false;

                    //Write to cache
                    if (totalRecords === null)
                        totalRecords = ret.total;

                    var start = ret.start;
                    var count = ret.count;

                    //Resize cache if necessary
                    while (cachedData.length < totalRecords)
                        cachedData.push(undefined);

                    //Now write into the array
                    var i = start, j = 0;
                    while (j < count)
                        cachedData[i++] = ret.data[j++];

                    //Call the next function
                    if (next)
                        next();
                };
            }

            function updateGrid(newScrollPos) {
                if (curScrollPos === null) {
                    //First time: write the entire page
                    refreshPage(newScrollPos);
                }
                else {
                    //Not first time. Determine if it's faster to refresh the entire page or to delete/insert selected rows
                    var delta = newScrollPos - curScrollPos;

                    //"delta" represents the number of rows to delete and the number of new rows to insert
                    //Refreshing the entire page requires deleting all rows and inserting the entire page (pageSize)
                    if (Math.abs(delta) < pageSize) {
                        //Incremental is better
                        scrollGrid(newScrollPos, delta);
                    }
                    else {
                        //Full redraw is better
                        refreshPage(newScrollPos);
                    }
                }

                //At the end, the new position becomes the current position
                curScrollPos = newScrollPos;
            }

            function refreshPage(newScrollPos) {
                //Remove all rows
                sectionElement.empty();

                //Add one page of rows
                var end = Math.min(newScrollPos + pageSize, totalRecords);
                for (var i = newScrollPos; i < end; i++)
                    addRow(W, sectionName, sectionElement, cachedData[i]);

                //Refresh the scroller
                refreshScroller();
            }

            function scrollGrid(newScrollPos, delta) {
                if (delta > 0) {
                    //Scroll forward: remove "delta" lines from the beginning and append "delta" lines at the end
                    W.removeBodyRows(0, delta);

                    var i = newScrollPos + pageSize - delta;
                    var j = 0;
                    while (j++ < delta) {
                        if (i < totalRecords)
                            addRow(W, sectionName, sectionElement, cachedData[i++]);
                    }
                }
                else if (delta < 0) {
                    delta = -delta;

                    //Scroll backwards: remove "delta" lines at the end and insert "delta" lines at the beginning
                    W.removeBodyRows(pageSize - delta, delta);

                    var i = newScrollPos;
                    var j = 0;
                    while (j < delta) {
                        if (i < totalRecords)
                            addRow(W, sectionName, sectionElement, cachedData[i++], j++);
                    }
                }

                //After the move, refresh the scroller
                refreshScroller();
            }

            function updateRows() {
                //Row templates
                var tmpl = W.template();
                var emptyRowTmpl = W.emptyRowTemplate();

                //See what records are displayed
                var visibleRows = sectionElement.children("tr");
                var start = curScrollPos;
                var end = start + visibleRows.length;

                //Update the rows, if we now have the data
                var updatedSomething = false;
                var j = 0;
                for (var i = start; i < end; i++) {
                    var item = cachedData[i];
                    var tr = visibleRows.eq(j++);

                    //Only if the row is empty, substitute the cells with up-to-date values
                    //If the row is not empty, leave it unchanged
                    if (item && tr.data("fromEmptyRowTemplate")) {
                        if (tmpl) {
                            applyRowTemplate(tr, sectionName, tmpl, emptyRowTmpl, item);
                            updatedSomething = true;
                        }
                    }
                }

                //Refresh the scroller
                if (updatedSomething)
                    refreshScroller();

                //Ensure the request queue is processed, if necessary
                ensureRequestInProgress();
            }

            function getScroller() {
                //Let's see if a scroller has already been created for this datagrid
                var scrollerId = W.element.data("scrollerId");
                var scroller;
                if (scrollerId) {
                    //There is a scroller
                    scroller = jpvs.find("#" + scrollerId);
                }
                else {
                    //No scroller, let's create one
                    var scrollerContainer = document.createElement("div");
                    W.element.after(scrollerContainer);
                    scroller = jpvs.Scroller.create(scrollerContainer);

                    scrollerId = jpvs.randomString(20);
                    scroller.element.attr("id", scrollerId);
                    W.element.data("scrollerId", scrollerId);

                    //Move the DataGrid inside the scroller
                    scroller.content.append(W.element);

                    //Setup the content area so that it's virtually unlimited and causes no text-wrapping or column-shrinking
                    //To do this, we just set it "wide enough"
                    //The height does not matter much, because the real scrolling only occurs horizontally (vertically, we only
                    //simulate scrolling by moving rows in the DataGrid)
                    scroller.contentSize({ width: "1000%", height: "200%" });

                    //Measure the grid
                    measureMaxGridSize();

                    //Set the scroller bounding box size
                    scroller.objectSize({
                        width: maxGridWidth + scroller.scrollbarW,
                        height: maxGridHeight + scroller.scrollbarH
                    });
                }

                //Bind events
                scroller.change.unbind("DataGrid");
                scroller.change.bind("DataGrid", onScrollChange);

                return scroller;
            }

            function onScrollChange() {
                //Current scroll position
                var scrollPos = this.scrollPosition();

                //Horizontal scrolling: connect scroll position to content position directly, so the horizontal scrollbar immediately
                //moves the grid on the horizontal axis
                //Vertical scrolling: don't move content here because we artificially scroll rows in the DataGrid
                var newHorzPos = scrollPos.left;
                var newVertPos = 0;
                this.contentPosition({ top: newVertPos, left: newHorzPos });

                //Now handle the vertical scrolling by artificially moving rows in the DataGrid
                //measureMaxGridSize();
                var maxST = maxGridHeight / pageSize * totalRecords - maxGridHeight;
                var newScrollPos = Math.min(totalRecords, Math.floor(scrollPos.top / maxST * (totalRecords - pageSize + 5)));

                //Update immediately scrolling the rows to "newScrollPos", even if no data is in cache (in that case,
                //the missing records are rendered by the grid's "emptyRowTemplate")
                updateGrid(newScrollPos);

                //Then, call the datasource and update the rows as soon as they arrive from the datasource, without scrolling
                //(because we already did the scrolling in "updateGrid")
                ensurePageOfDataLoaded(newScrollPos);
            }

            function measureMaxGridSize() {
                var gridSize = {
                    width: W.element.outerWidth(),
                    height: W.element.outerHeight()
                };

                maxGridHeight = Math.max(maxGridHeight, gridSize.height);
                maxGridWidth = Math.max(maxGridWidth, gridSize.width);
            }

            function refreshScroller() {
                if (!scroller)
                    return;

                //Let's adjust the scrollbars to reflect the content (the DataGrid)
                measureMaxGridSize();
                var totalGridHeight = maxGridHeight / pageSize * totalRecords;

                //The scrollable area is as wide as the grid and as high as the total grid height
                scroller.scrollableSize({ width: maxGridWidth, height: totalGridHeight });

                //Set the scroller bounding box size
                scroller.objectSize({
                    width: forcedWidth || (maxGridWidth + scroller.scrollbarW),
                    height: forcedHeight || (maxGridHeight + scroller.scrollbarH)
                });
            }
        }

        return binder;
    };
})();

/* JPVS
Module: widgets
Classes: DateBox
Depends: core
*/

/* Italian initialisation for the jQuery UI date picker plugin. */
/* Written by Antonello Pasella (antonello.pasella@gmail.com). */
jQuery(function ($) {
    $.datepicker.regional['it'] = {
        closeText: 'Chiudi',
        prevText: '&#x3c;Prec',
        nextText: 'Succ&#x3e;',
        currentText: 'Oggi',
        monthNames: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
			'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
        monthNamesShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
			'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
        dayNames: ['Domenica', 'Luned&#236', 'Marted&#236', 'Mercoled&#236', 'Gioved&#236', 'Venerd&#236', 'Sabato'],
        dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
        dayNamesMin: ['Do', 'Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa'],
        weekHeader: 'Sm',
        dateFormat: 'dd/mm/yy',
        firstDay: 1,
        isRTL: false,
        showMonthAfterYear: false,
        yearSuffix: ''
    };
});


(function () {

    jpvs.DateBox = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.makeWidget({
        widget: jpvs.DateBox,
        type: "DateBox",
        cssClass: "DateBox",

        create: function (container) {
            var obj = document.createElement("input");
            $(obj).attr("type", "text");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            this.element.datepicker({
                onSelect: function (dateText, inst) {
                    return W.change.fire(W);
                }
            });

            this.element.change(function () {
                return W.change.fire(W);
            });

            this.element.datepicker("option", $.datepicker.regional[jpvs.currentLocale()]);

            this.element.datepicker("hide");
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            date: jpvs.property({
                get: function () { return this.element.datepicker("getDate"); },
                set: function (value) { this.element.datepicker("setDate", value); }
            }),

            dateString: jpvs.property({
                get: function () {
                    return format(this.date());
                },
                set: function (value) {
                    this.date(parse(value));
                }
            })
        }
    });

    function format(date) {
        if (!date)
            return "";

        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        var d = date.getDate();

        return pad(y, 4) + pad(m, 2) + pad(d, 2);
    }

    function pad(s, len) {
        s = $.trim(s.toString());
        while (s.length < len)
            s = "0" + s;

        return s;
    }

    function parse(yyyymmdd) {
        yyyymmdd = $.trim(yyyymmdd);

        if (yyyymmdd == "" || yyyymmdd.length != 8)
            return null;

        var y = parseInt(yyyymmdd.substring(0, 4));
        var m = parseInt(yyyymmdd.substring(4, 6));
        var d = parseInt(yyyymmdd.substring(6, 8));

        return new Date(y, m - 1, d);
    }

})();

/* JPVS
Module: widgets
Classes: DocumentEditor
Depends: core, parsers
*/

(function () {

    jpvs.DocumentEditor = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.DocumentEditor.allStrings = {
        en: {
            clickToEdit: "Click here to edit",
            clickToEditField: "Click here to edit this field",
            clickToEditHeader: "Click here to edit the header",
            clickToEditFooter: "Click here to edit the footer",
            textEditor: "Text editor",
            fieldEditor: "Field editor",

            sectionOptions: "Options",
            sectionMargins: "Set margins",
            removeSection: "Remove section",
            removeSection_Warning: "The section will be removed. Do you wish to continue?",
            removeSection_Forbidden: "The section may not be removed. There must be at least one section in the document.",

            addSectionBefore: "Insert new section before",
            addSectionAfter: "Insert new section after",

            sortSections: "Reorder sections",
            sortSections_Prompt: "Please reorder the sections of the document by dragging them up and down.",

            invalidValuesFound: "Invalid values found. Please correct and try again.",

            bodyMargins: "Page margins",
            defaultMargin: "Default margin",
            defaultMargin_Notes: "Example: 2.5cm. Used only when any of left/right/bottom/top is missing.",
            topMargin: "Top margin",
            topMargin_Notes: "Example: 2cm. If missing, the default margin is used.",
            bottomMargin: "Bottom margin",
            bottomMargin_Notes: "Example: 2cm. If missing, the default margin is used.",
            leftMargin: "Left margin",
            leftMargin_Notes: "Example: 2cm. If missing, the default margin is used.",
            rightMargin: "Right margin",
            rightMargin_Notes: "Example: 2cm. If missing, the default margin is used.",

            headerMargins: "Header margins and height",
            footerMargins: "Footer margins and height",

            height: "Height",

            error: "Error",
            ok: "OK",
            cancel: "Cancel",
            apply: "Apply"
        },

        it: {
            clickToEdit: "Clicca qui per modificare",
            clickToEditField: "Clicca qui per modificare il campo",
            clickToEditHeader: "Clicca qui per modificare l'intestazione",
            clickToEditFooter: "Clicca qui per modificare il piè di pagina",
            textEditor: "Modifica testo",
            fieldEditor: "Modifica campo",

            sectionOptions: "Opzioni",
            sectionMargins: "Imposta margini",
            removeSection: "Elimina sezione",
            removeSection_Warning: "Confermi l'eliminazione della sezione?",
            removeSection_Forbidden: "La sezione non può essere rimossa. Il documento deve contenere almeno una sezione.",

            addSectionBefore: "Inserisci sezione prima",
            addSectionAfter: "Inserisci sezione dopo",

            sortSections: "Cambia ordine sezioni",
            sortSections_Prompt: "Riordinare le sezioni trascinandole su e giù.",

            invalidValuesFound: "Trovati valori non validi. Correggere e riprovare.",

            bodyMargins: "Margini pagina",
            defaultMargin: "Margine predefinito",
            defaultMargin_Notes: "Esempio: 2.5cm. Usato solo quando manca almeno uno dei margini sinistro/destro/inferiore/superiore.",
            topMargin: "Margine superiore",
            topMargin_Notes: "Esempio: 2cm. Se non specificato, viene usato il margine predefinito.",
            bottomMargin: "Margine inferiore",
            bottomMargin_Notes: "Esempio: 2cm. Se non specificato, viene usato il margine predefinito.",
            leftMargin: "Margine sinistro",
            leftMargin_Notes: "Esempio: 2cm. Se non specificato, viene usato il margine predefinito.",
            rightMargin: "Margine destro",
            rightMargin_Notes: "Esempio: 2cm. Se non specificato, viene usato il margine predefinito.",

            headerMargins: "Margini ed altezza dell'intestazione",
            footerMargins: "Margini ed altezza del piè di pagina",

            height: "Altezza",

            error: "Errore",
            ok: "OK",
            cancel: "Annulla",
            apply: "Applica"
        }
    };


    jpvs.makeWidget({
        widget: jpvs.DocumentEditor,
        type: "DocumentEditor",
        cssClass: "DocumentEditor",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            jpvs.DocumentEditor.strings = jpvs.DocumentEditor.allStrings[jpvs.currentLocale()];
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            document: jpvs.property({
                get: function () {
                    return this.element.data("document");
                },
                setTask: function (value) {
                    //Async setter.
                    //The document is saved immediately in zero time
                    this.element.data("document", value);

                    //Let's synchronously/immediately empty the content, so that the user can't interact until the task
                    //has created some of the content. We don't want the user to update things that might be related to the previous
                    //version of the displayed document. As soon as this property setter is invoked, the old version of the document
                    //disappears and can't be interacted with any longer. Then, in background, the new content is displayed and the user
                    //can start interacting with it even if the task is not finished yet. As soon as the first section is displayed, it
                    //is live and this does not interfere with the still-running refreshPreviewTask.
                    this.element.empty()

                    /*
                    Refresh the preview.
                    The preview has clickable parts; the user clicks on a part to edit it
                    */
                    //Let's return the task for updating the preview, so we work in background in case
                    //the document is complex and the UI remains responsive during the operation
                    return refreshPreviewTask(this);
                }
            }),

            fields: jpvs.property({
                get: function () {
                    var doc = this.document();
                    return doc && doc.fields;
                },
                set: function (value) {
                    //Value contains only the fields that we want to change
                    refreshFieldSet(this, value);
                }
            }),

            richTextEditor: jpvs.property({
                get: function () {
                    return this.element.data("richTextEditor");
                },
                set: function (value) {
                    this.element.data("richTextEditor", value);
                }
            }),

            fieldEditor: jpvs.property({
                get: function () {
                    return this.element.data("fieldEditor");
                },
                set: function (value) {
                    this.element.data("fieldEditor", value);
                }
            }),

            fieldDisplayMapper: jpvs.property({
                get: function () {
                    return this.element.data("fieldDisplayMapper");
                },
                set: function (value) {
                    this.element.data("fieldDisplayMapper", value);
                }
            })
        }
    });

    function refreshFieldSet(W, fieldChangeSet) {
        var doc = W.document();
        var fields = doc && doc.fields;

        //Refresh all occurrences of the fields; flash those highlighted
        var flashingQueue = $();
        W.element.find("span.Field").each(function () {
            var fld = $(this);

            //Check that this is a field
            var fieldInfo = fld.data("jpvs.DocumentEditor.fieldInfo");
            var thisFieldName = fieldInfo && fieldInfo.fieldName;
            if (thisFieldName) {
                //OK, this is a field
                //Let's see if we have to update it
                var newField = fieldChangeSet[thisFieldName];
                if (newField) {
                    //Yes, we have to update it
                    //Let's update the doc, without highlight
                    fields[thisFieldName] = { value: newField.value };

                    //Let's update the DOM element, optionally mapping the text that we render into the field area
                    //Optionally map the text that will be rendered into the field area
                    var defaultFieldDisplayMapper = function (text) { return text; };
                    var fieldDisplayMapper = W.fieldDisplayMapper() || defaultFieldDisplayMapper;
                    var fieldDisplayedValue = fieldDisplayMapper(newField.value);
                    jpvs.write(fld.empty(), fieldDisplayedValue);

                    //Let's enqueue for flashing, if requested
                    if (newField.highlight)
                        flashingQueue = flashingQueue.add(fld);
                }
            }
        });

        //Finally, flash the marked fields
        if (flashingQueue.length)
            jpvs.flashClass(flashingQueue, "Field-Highlight");
    }

    function refreshPreview(W) {
        //Launch the task synchronously
        var task = refreshPreviewTask(W);
        jpvs.runForegroundTask(task);
    }

    function refreshPreviewSingleSection(W, sectionNum) {
        var fieldHighlightList = getEmptyFieldHighlightList();
        refreshSingleSectionContent(W, sectionNum, fieldHighlightList);
        applyFieldHighlighting(W, fieldHighlightList);
    }

    function refreshPreviewAsync(W) {
        //Launch the task asynchronously
        var task = refreshPreviewTask(W);
        jpvs.runBackgroundTask(task);
    }

    function refreshPreviewTask(W) {
        //Let's return the task function
        //We use "ctx" for storing the local variables.
        return function (ctx) {
            //Init the state machine, starting from 1 (only when null)
            ctx.executionState = ctx.executionState || 1;

            //First part, init some local variables
            if (ctx.executionState == 1) {
                ctx.elem = W.element;
                ctx.doc = W.document();
                ctx.sections = ctx.doc && ctx.doc.sections;
                ctx.fields = ctx.doc && ctx.doc.fields;

                //List of fields that require highlighting (we start with an empty jQuery object that is filled during the rendering phase (writeContent))
                ctx.fieldHighlightList = getEmptyFieldHighlightList();

                //Yield control
                ctx.executionState = 2;
                return { progress: "0%" };
            }

            //Second part, create all blank pages with "loading" animated image
            if (ctx.executionState == 2) {
                //We save all elements by section here:
                ctx.domElems = [];

                //Delete all contents...
                //We already deleted it in the "document" property setter. We do this again, just to be sure that we start this
                //execution state with an empty object
                ctx.elem.empty()

                //Since it's fast, let's create all the blank pages all at a time and only yield at the end
                $.each(ctx.sections, function (sectionNum, section) {
                    //Every section is rendered as a pseudo-page (DIV with class="Section" and position relative (so we can absolutely position header/footer))
                    var sectionElement = jpvs.writeTag(ctx.elem, "div");
                    sectionElement.addClass("Section").css("position", "relative");

                    //Store the sectionNum within the custom data
                    sectionElement.data("jpvs.DocumentEditor.sectionNum", sectionNum);

                    //Apply page margins
                    applySectionPageMargins(sectionElement, section);

                    //Header (absolutely positioned inside the section with margins/height)
                    var headerElement = jpvs.writeTag(sectionElement, "div");
                    headerElement.addClass("Header");
                    applySectionHeaderMargins(headerElement, section);

                    //Footer (absolutely positioned inside the section with margins/height)
                    var footerElement = jpvs.writeTag(sectionElement, "div");
                    footerElement.addClass("Footer");
                    applySectionFooterMargins(footerElement, section);

                    var footerElementInside = jpvs.writeTag(footerElement, "div");
                    footerElementInside.css("position", "absolute");
                    footerElementInside.css("bottom", "0px");
                    footerElementInside.css("left", "0px");
                    footerElementInside.css("right", "0px");

                    //Body
                    var bodyElement = jpvs.writeTag(sectionElement, "div");
                    bodyElement.addClass("Body");
                    jpvs.writeTag(bodyElement, "img").attr("src", jpvs.Resources.images.loading);

                    //Now let's save all DOM elements for the remaining execution states
                    ctx.domElems.push({
                        sectionElement: sectionElement,
                        headerElement: headerElement,
                        bodyElement: bodyElement,
                        footerElementInside: footerElementInside,
                        footerElement: footerElement
                    });

                    //Save also something for later (refreshSingleSectionContent)
                    sectionElement.data("jpvs.DocumentEditor.domElem", {
                        headerElement: headerElement,
                        bodyElement: bodyElement,
                        footerElementInside: footerElementInside,
                        footerElement: footerElement
                    });
                });

                //Yield control
                ctx.executionState = 3;
                return { progress: "1%" };
            }

            //Third part: fill all sections with header/footer/body, one at a time
            if (ctx.executionState == 3) {
                //Loop over all sections one at a time
                if (ctx.sectionNum == null)
                    ctx.sectionNum = 0;
                else
                    ctx.sectionNum++;

                if (ctx.sectionNum >= ctx.sections.length) {
                    //Reset loop conter
                    ctx.sectionNum = null;

                    //Yield control and go to next execution state
                    ctx.executionState = 4;
                    return { progress: "90%" };
                }

                var section = ctx.sections[ctx.sectionNum];
                var domElem = ctx.domElems[ctx.sectionNum];

                //Write content, if any
                refreshSingleSectionContent(W, ctx.sectionNum, ctx.fieldHighlightList);

                //Switch off the highlight flags after rendering
                if (section.header)
                    section.header.highlight = false;
                if (section.body)
                    section.body.highlight = false;
                if (section.footer)
                    section.footer.highlight = false;

                //Yield control without changing execution state
                //Progress from 1 up to 90%
                var progr = 1 + Math.floor(ctx.sectionNum / (ctx.sections.length - 1) * 89);
                return { progress: progr + "%" };
            }

            //Fourth part: create section menus, one at a time
            if (ctx.executionState == 4) {
                //Loop over all sections one at a time
                if (ctx.sectionNum == null)
                    ctx.sectionNum = 0;
                else
                    ctx.sectionNum++;

                if (ctx.sectionNum >= ctx.sections.length) {
                    //Reset loop conter
                    ctx.sectionNum = null;

                    //Yield control and go to next execution state
                    ctx.executionState = 5;
                    return { progress: "99%" };
                }

                var section = ctx.sections[ctx.sectionNum];
                var domElem = ctx.domElems[ctx.sectionNum];

                //Every section has a small, unobtrusive menu
                var menuContainer = jpvs.writeTag(domElem.sectionElement, "div");
                menuContainer.addClass("MenuContainer").css({ position: "absolute", top: "0px", right: "0px", zIndex: (10000 - ctx.sectionNum).toString() });
                writeSectionMenu(W, menuContainer, ctx.sections, ctx.sectionNum, section);

                //Yield control without changing execution state
                //Progress from 90% to 99%
                var progr = 90 + Math.floor(ctx.sectionNum / (ctx.sections.length - 1) * 9);
                return { progress: progr + "%" };
            }

            //Fifth part: apply field highlighting and terminate the task
            if (ctx.executionState == 5) {
                applyFieldHighlighting(W, ctx.fieldHighlightList);

                //End of task
                return false;
            }
        };
    }

    function getEmptyFieldHighlightList() {
        return { list: $() };
    }

    function applySectionPageMargins(sectionElement, section) {
        //Apply page margins to the section (as internal padding, of course)
        var margins = section && section.margins;
        var leftMargin = getMarginProp(margins, "left", "2cm");
        var topMargin = getMarginProp(margins, "top", "2cm");
        var rightMargin = getMarginProp(margins, "right", "2cm");
        var bottomMargin = getMarginProp(margins, "bottom", "2cm");

        sectionElement.css("padding-left", leftMargin);
        sectionElement.css("padding-top", topMargin);
        sectionElement.css("padding-right", rightMargin);
        sectionElement.css("padding-bottom", bottomMargin);
    }

    function applySectionHeaderMargins(headerElement, section) {
        var margins = section && section.margins;
        var leftMargin = getMarginProp(margins, "left", "2cm");
        var rightMargin = getMarginProp(margins, "right", "2cm");

        var headerMargins = section && section.header && section.header.margins;
        var headerTopMargin = getMarginProp(headerMargins, "top", "0.5cm");
        var headerLeftMargin = getMarginProp(headerMargins, "left", leftMargin);
        var headerRightMargin = getMarginProp(headerMargins, "right", rightMargin);
        var headerHeight = (section && section.header && section.header.height) || "1cm";

        headerElement.css("position", "absolute");
        headerElement.css("overflow", "hidden");
        headerElement.css("top", headerTopMargin);
        headerElement.css("left", headerLeftMargin);
        headerElement.css("right", headerRightMargin);
        headerElement.css("height", headerHeight);
    }

    function applySectionFooterMargins(footerElement, section) {
        var margins = section && section.margins;
        var leftMargin = getMarginProp(margins, "left", "2cm");
        var rightMargin = getMarginProp(margins, "right", "2cm");

        var footerMargins = section && section.footer && section.footer.margins;
        var footerBottomMargin = getMarginProp(footerMargins, "bottom", "0.5cm");
        var footerLeftMargin = getMarginProp(footerMargins, "left", leftMargin);
        var footerRightMargin = getMarginProp(footerMargins, "right", rightMargin);
        var footerHeight = (section && section.footer && section.footer.height) || "1cm";

        footerElement.css("position", "absolute");
        footerElement.css("overflow", "hidden");
        footerElement.css("bottom", footerBottomMargin);
        footerElement.css("left", footerLeftMargin);
        footerElement.css("right", footerRightMargin);
        footerElement.css("height", footerHeight);
    }

    function refreshSingleSectionContent(W, sectionNum, fieldHighlightList) {
        var sectionElement = W.element.find("div.Section").eq(sectionNum);
        var domElem = sectionElement.data("jpvs.DocumentEditor.domElem");

        var doc = W.document();
        var sections = doc && doc.sections;
        var fields = doc && doc.fields;
        var section = sections && sections[sectionNum];

        //Refresh margins
        applySectionPageMargins(sectionElement, section);
        applySectionHeaderMargins(domElem.headerElement, section);
        applySectionFooterMargins(domElem.footerElement, section);

        //Refresh content
        writeContent(W, domElem.headerElement, domElem.headerElement, section && section.header && section.header.content, fields, "Header-Hover", section && section.header && section.header.highlight ? "Header-Highlight" : "", function (x) { section.header = section.header || {}; section.header.content = x; section.header.highlight = true; }, fieldHighlightList, jpvs.DocumentEditor.strings.clickToEditHeader);
        writeContent(W, domElem.bodyElement, domElem.bodyElement, section && section.body && section.body.content, fields, "Body-Hover", section && section.body && section.body.highlight ? "Body-Highlight" : "", function (x) { section.body = section.body || {}; section.body.content = x; section.body.highlight = true; }, fieldHighlightList, jpvs.DocumentEditor.strings.clickToEdit);
        writeContent(W, domElem.footerElementInside, domElem.footerElement, section && section.footer && section.footer.content, fields, "Footer-Hover", section && section.footer && section.footer.highlight ? "Footer-Highlight" : "", function (x) { section.footer = section.footer || {}; section.footer.content = x; section.footer.highlight = true; }, fieldHighlightList, jpvs.DocumentEditor.strings.clickToEditFooter);
    }

    function applyFieldHighlighting(W, fieldHighlightList) {
        if (fieldHighlightList.list.length) {
            jpvs.flashClass(fieldHighlightList.list, "Field-Highlight");

            //Switch off the field highlight flags after rendering
            var doc = W.document();
            var fields = doc && doc.fields;
            if (fields) {
                $.each(fields, function (i, field) {
                    field.highlight = false;
                });
            }
        }
    }

    function writeSectionMenu(W, container, sections, sectionNum, section) {
        var menu = jpvs.Menu.create(container);
        menu.template(["HorizontalMenuBar", "VerticalMenuBar"]);
        menu.itemTemplate(["HorizontalMenuBarItem", "VerticalMenuBarItem"]);
        menu.menuItems([
            {
                text: "...",
                tooltip: jpvs.DocumentEditor.strings.sectionOptions,
                items: [
                    { text: jpvs.DocumentEditor.strings.sectionMargins, click: onSectionMargins(W, section, sectionNum) },
                    jpvs.Menu.Separator,
                    { text: jpvs.DocumentEditor.strings.addSectionBefore, click: onAddSection(W, sections, sectionNum) },
                    { text: jpvs.DocumentEditor.strings.addSectionAfter, click: onAddSection(W, sections, sectionNum + 1) },
                    { text: jpvs.DocumentEditor.strings.removeSection, click: onRemoveSection(W, sections, sectionNum) },
                    jpvs.Menu.Separator,
                    { text: jpvs.DocumentEditor.strings.sortSections, click: onSortSections(W, sections) }
                ]
            }
        ]);
    }

    function getMarginProp(margins, which, defaultValue) {
        if (margins) {
            //Let's try the "which" margin or, if missing, the "all" margin
            var value = margins[which] || margins.all;
            if (value)
                return value;
        }

        //Value not yet determined, let's apply the default
        return defaultValue;
    }

    function writeContent(W, element, clickableElement, content, fields, hoverCssClass, highlightCssClass, newContentSetterFunc, fieldHighlightList, placeHolderText) {
        var contentToWrite = content;
        if (!content)
            contentToWrite = "";

        //Remove the "loading" image
        element.empty();

        //Get the sectionNum
        var sectionElement = clickableElement.parent();
        var sectionNum = sectionElement.data("jpvs.DocumentEditor.sectionNum");

        //Clean HTML "content" (becomes xhtml)...
        contentToWrite = jpvs.cleanHtml(contentToWrite);

        //Put a placeholder if missing content
        if ($.trim(contentToWrite) == "")
            contentToWrite = placeHolderText;

        //...make the element clickable (click-to-edit)...
        clickableElement.css("cursor", "pointer").attr("title", jpvs.DocumentEditor.strings.clickToEdit).unbind(".writeContent").bind("click.writeContent", function () {
            onEditFormattedText(W, content, newContentSetterFunc, sectionNum);
            return false;
        }).bind("mouseenter.writeContent", function () {
            clickableElement.parent().addClass("Section-Hover");
            clickableElement.addClass(hoverCssClass);
        }).bind("mouseleave.writeContent", function () {
            clickableElement.parent().removeClass("Section-Hover");
            clickableElement.removeClass(hoverCssClass);
        });

        //...and render the sanitized XHTML result, making sure fields are clickable too
        var contentAsXml = XmlParser.parseString("<root>" + contentToWrite + "</root>", null, true);
        renderXHtmlWithFields(W, element, contentAsXml, fields, fieldHighlightList);

        //At the end, do a flashing animation if required to do so
        if (highlightCssClass != "")
            jpvs.flashClass(element, highlightCssClass);
    }

    function renderXHtmlWithFields(W, curElem, xmlNode, fields, fieldHighlightList) {
        //Write the xmlNode into curElem. If the xmlNode is TEXT, then make sure ${FIELD} patterns are made clickable
        if (xmlNode.name == "#TEXT") {
            //This is plain text and it can contain ${FIELD} patterns that must be made clickable
            renderTextWithFields(W, curElem, xmlNode.value || "", fields, fieldHighlightList);
        }
        else if (xmlNode.name == "root") {
            //This is the dummy root node. Let's just write the content, recursively
            if (xmlNode.children) {
                $.each(xmlNode.children, function (i, childNode) {
                    renderXHtmlWithFields(W, curElem, childNode, fields, fieldHighlightList);
                });
            }
        }
        else {
            //This is a normal element. Let's write it, along with attributes and content
            var tagName = xmlNode.name;
            var newElem = jpvs.writeTag(curElem, tagName);

            //Apply attributes
            if (xmlNode.attributes) {
                $.each(xmlNode.attributes, function (attrName, attrValue) {
                    newElem.attr(attrName, attrValue);
                });
            }

            //Apply content recursively
            if (xmlNode.children) {
                $.each(xmlNode.children, function (i, childNode) {
                    renderXHtmlWithFields(W, newElem, childNode, fields, fieldHighlightList);
                });

                /*
                At the end of a "p" paragraph, we write a <br/> so we are sure that an empty paragraph is rendered
                as a blank line, while a non-empty paragraph is rendered as usual (because a <br/> at the end of a paragraph
                has non effects).
                */
                if (tagName == "p")
                    jpvs.writeTag(newElem, "br");
            }
        }
    }

    function renderTextWithFields(W, curElem, text, fields, fieldHighlightList) {
        //Look for ${FIELD} patterns and replace them with a clickable object
        var pattern = /\$\{(.*?)\}/g;
        var lastWrittenIndex = 0;
        for (var match = pattern.exec(text); match != null; match = pattern.exec(text)) {
            //Match found: analyze it
            var matchedString = match[0];
            var fieldName = match[1];
            var endIndex = pattern.lastIndex;
            var startIndex = endIndex - matchedString.length;

            //Now write the plain text between lastWrittenIndex and startIndex...
            var textBefore = text.substring(lastWrittenIndex, startIndex)
            renderText(curElem, textBefore);

            //Then render the clickable field...
            renderField(W, curElem, fields, fieldName, fieldHighlightList);

            //Then update the lastWrittenIndex
            lastWrittenIndex = endIndex;
        }

        //At the end, there is still the ending text missing
        var endingText = text.substring(lastWrittenIndex);
        renderText(curElem, endingText);
    }

    var entitiesToReplace = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": "\"",
        "&apos;": "'"
    };

    function renderText(curElem, text) {
        //Renders the text and replaces a few entities
        var text2 = text;
        $.each(entitiesToReplace, function (entity, replacedText) {
            text2 = text2.replace(entity, replacedText);
        });

        jpvs.write(curElem, text2);
    }

    function renderField(W, curElem, fields, fieldName, fieldHighlightList) {
        //Get info about the field
        var field = fields && fields[fieldName];
        var fieldValue = field && field.value;
        var fieldHighlighted = field && field.highlight;

        //Optionally map the text that will be rendered into the field area
        var defaultFieldDisplayMapper = function (text) { return text; };
        var fieldDisplayMapper = W.fieldDisplayMapper() || defaultFieldDisplayMapper;
        fieldValue = fieldDisplayMapper(fieldValue);

        //If empty, render a placeholder text instead
        if ($.trim(fieldValue) == "")
            fieldValue = jpvs.DocumentEditor.strings.clickToEditField;

        //Render the clickable thing
        var span = jpvs.writeTag(curElem, "span", fieldValue);
        span.addClass("Field").attr("title", jpvs.DocumentEditor.strings.clickToEditField).click(function () {
            onEditField(W, fields, fieldName);
            return false;
        }).hover(function () {
            span.addClass("Field-Hover");
        },
        function () {
            span.removeClass("Field-Hover");
        });

        //Mark as field also internally for security purposes
        //So if some span exists with class="Field" we don't get tricked into thinking it's a field
        span.data("jpvs.DocumentEditor.fieldInfo", {
            fieldName: fieldName
        });

        //Update the jQuery object with the list of all fields to be highlighted
        if (fieldHighlighted)
            fieldHighlightList.list = fieldHighlightList.list.add(span);
    }

    function onEditFormattedText(W, content, newContentSetterFunc, sectionNum) {
        //Let's use the formatted text editor supplied by the user in the richTextEditor property
        //Use a default one if none is set
        var rte = W.richTextEditor() || getDefaultEditor();

        //The richTextEditor gives us an object that defines how to edit rich text
        rte.editText.call(rte, content, onDone);

        function onDone(newContent) {
            //We have the new content. All we need to do is update the W.document property and refresh
            //We use the new content setter provided
            if (newContent !== undefined && newContent != content) {
                newContentSetterFunc(newContent);
                refreshPreviewSingleSection(W, sectionNum);

                //Fire the change event
                W.change.fire(W);
            }
        }
    }

    function onEditField(W, fields, fieldName) {
        //Let's use the field editor supplied by the user in the fieldEditor property
        //Use a default one if none is set
        var fe = W.fieldEditor() || getDefaultFieldEditor();

        //The fieldEditor gives us an object that defines how to edit fields
        var field = fields && fields[fieldName];
        var oldFieldValue = field && field.value;

        fe.editField.call(fe, fields, fieldName, onDone);

        function onDone(newFieldValue) {
            //We have the new field value. All we need to do is update the field and refresh and highlight
            if (newFieldValue !== undefined && newFieldValue != oldFieldValue) {
                //Field changed. Let's update with highlight
                //We use a change set with a single field
                var fieldChangeSet = {};
                fieldChangeSet[fieldName] = { value: newFieldValue, highlight: true };
                refreshFieldSet(W, fieldChangeSet);

                //Fire the change event
                W.change.fire(W);
            }
        }
    }

    function onSectionMargins(W, section, sectionNum) {
        return function () {
            //Open popup for editing margins
            var pop = jpvs.Popup.create().title(jpvs.DocumentEditor.strings.sectionMargins).close(function () { this.destroy(); });

            //Ensure missing properties are present, so we can read/write margins
            section.margins = section.margins || {};

            section.header = section.header || {};
            section.header.margins = section.header.margins || {};

            section.footer = section.footer || {};
            section.footer.margins = section.footer.margins || {};

            //Create fields
            var tbl = jpvs.Table.create(pop).caption(jpvs.DocumentEditor.strings.bodyMargins);
            var txtAll = writeTextBox(tbl, "defaultMargin", section.margins.all);
            var txtTop = writeTextBox(tbl, "topMargin", section.margins.top);
            var txtBot = writeTextBox(tbl, "bottomMargin", section.margins.bottom);
            var txtLft = writeTextBox(tbl, "leftMargin", section.margins.left);
            var txtRgt = writeTextBox(tbl, "rightMargin", section.margins.right);

            tbl = jpvs.Table.create(pop).caption(jpvs.DocumentEditor.strings.headerMargins);
            var txtHdrAll = writeTextBox(tbl, "defaultMargin", section.header.margins.all);
            var txtHdrTop = writeTextBox(tbl, "topMargin", section.header.margins.top);
            var txtHdrLft = writeTextBox(tbl, "leftMargin", section.header.margins.left);
            var txtHdrRgt = writeTextBox(tbl, "rightMargin", section.header.margins.right);
            var txtHdrHgt = writeTextBox(tbl, "height", section.header.height);

            tbl = jpvs.Table.create(pop).caption(jpvs.DocumentEditor.strings.footerMargins);
            var txtFtrAll = writeTextBox(tbl, "defaultMargin", section.footer.margins.all);
            var txtFtrBot = writeTextBox(tbl, "bottomMargin", section.footer.margins.bottom);
            var txtFtrLft = writeTextBox(tbl, "leftMargin", section.footer.margins.left);
            var txtFtrRgt = writeTextBox(tbl, "rightMargin", section.footer.margins.right);
            var txtFtrHgt = writeTextBox(tbl, "height", section.footer.height);

            //Button bar
            jpvs.writeButtonBar(pop, [
                { text: jpvs.DocumentEditor.strings.ok, click: onOK },
                { text: jpvs.DocumentEditor.strings.apply, click: onApply },
                { text: jpvs.DocumentEditor.strings.cancel, click: onCancel }
            ]);

            pop.show();

            function checkValues(list) {
                if (!list)
                    return checkValues([
                        txtAll, txtTop, txtBot, txtLft, txtRgt,
                        txtHdrAll, txtHdrTop, txtHdrLft, txtHdrRgt, txtHdrHgt,
                        txtFtrAll, txtFtrBot, txtFtrLft, txtFtrRgt, txtFtrHgt
                    ]);

                var error = false;
                var invalids = [];

                for (var i = 0; i < list.length; i++) {
                    var txt = list[i];
                    txt.removeState(jpvs.states.ERROR);
                    var val = readMarginTextBox(list[i]);
                    if (val === undefined) {
                        //Invalid value
                        txt.addState(jpvs.states.ERROR);
                        invalids.push(txt);
                        error = true;
                    }
                }
                if (error) {
                    //Notify the user and set focus on first invalid value
                    jpvs.alert(jpvs.DocumentEditor.strings.error, jpvs.DocumentEditor.strings.invalidValuesFound, invalids[0]);
                }

                return !error;
            }

            function onOK() {
                if (!checkValues())
                    return;

                pop.hide(function () {
                    //At the end of the animation, apply and destroy
                    onApply();
                    pop.destroy();
                });
            }

            function onApply() {
                if (!checkValues())
                    return;

                //Read all
                section.margins.all = readMarginTextBox(txtAll);
                section.margins.top = readMarginTextBox(txtTop);
                section.margins.bottom = readMarginTextBox(txtBot);
                section.margins.left = readMarginTextBox(txtLft);
                section.margins.right = readMarginTextBox(txtRgt);

                section.header.margins.all = readMarginTextBox(txtHdrAll);
                section.header.margins.top = readMarginTextBox(txtHdrTop);
                section.header.margins.left = readMarginTextBox(txtHdrLft);
                section.header.margins.right = readMarginTextBox(txtHdrRgt);
                section.header.height = readMarginTextBox(txtHdrHgt);

                section.footer.margins.all = readMarginTextBox(txtFtrAll);
                section.footer.margins.bottom = readMarginTextBox(txtFtrBot);
                section.footer.margins.left = readMarginTextBox(txtFtrLft);
                section.footer.margins.right = readMarginTextBox(txtFtrRgt);
                section.footer.height = readMarginTextBox(txtFtrHgt);

                //Update the preview
                refreshPreviewSingleSection(W, sectionNum);

                //Fire the change event
                W.change.fire(W);
            }

            function onCancel() {
                pop.destroy();
            }

        };

        function readMarginTextBox(txt) {
            //Strip all spaces
            var val = $.trim(txt.text().replace(" ", ""));

            //If missing, return null
            if (val == "")
                return null;

            //If invalid, return undefined
            var pattern = /^\+?[0-9]{1,2}(\.[0-9]{1,3})?(cm)?$/gi;
            if (!pattern.test(val))
                return undefined;

            //Append "cm" if missing unit
            if (val.indexOf("cm") < 0)
                val = val + "cm";

            txt.text(val);

            return val;
        }

        function writeTextBox(tbl, label, value) {
            var row = tbl.writeRow();
            row.writeCell(jpvs.DocumentEditor.strings[label]);
            var txt = jpvs.TextBox.create(row.writeCell());
            txt.text(value);

            var notes = jpvs.DocumentEditor.strings[label + "_Notes"];
            if (notes)
                row.writeCell(notes);

            return txt;
        }
    }

    function onAddSection(W, sections, newSectionNum) {
        return function () {
            //New empty section
            var newSection = {
                margins: {
                },
                header: {
                    margins: {}
                },
                footer: {
                    margins: {}
                },
                body: {
                    highlight: true
                }
            };

            //Add at specified index and refresh
            if (newSectionNum >= sections.length)
                sections.push(newSection);
            else
                sections.splice(newSectionNum, 0, newSection);

            refreshPreviewAsync(W);

            //Fire the change event
            W.change.fire(W);
        };
    }

    function onRemoveSection(W, sections, sectionNum) {
        return function () {
            if (sections.length < 2) {
                jpvs.alert(jpvs.DocumentEditor.strings.error, jpvs.DocumentEditor.strings.removeSection_Forbidden);
                return;
            }

            jpvs.confirm(jpvs.DocumentEditor.strings.removeSection, jpvs.DocumentEditor.strings.removeSection_Warning, onYes);
        };

        function onYes() {
            //Remove the section and refresh
            sections.splice(sectionNum, 1);
            refreshPreviewAsync(W);

            //Fire the change event
            W.change.fire(W);
        }
    }

    function onSortSections(W, sections) {
        return function () {
            //Open popup for sorting sections
            var pop = jpvs.Popup.create().title(jpvs.DocumentEditor.strings.sortSections).close(function () { this.destroy(); });

            jpvs.writeln(pop, jpvs.DocumentEditor.strings.sortSections_Prompt);
            jpvs.writeTag(pop, "hr");

            //Grid with list of sections
            var grid = jpvs.DataGrid.create(pop);
            grid.template([
                colSectionSorter,
                colSectionText
            ]);

            grid.dataBind(sections);

            //Make it sortable
            grid.element.sortable({ items: "tbody > tr" });

            jpvs.writeTag(pop, "hr");

            //Button bar
            jpvs.writeButtonBar(pop, [
                { text: jpvs.DocumentEditor.strings.ok, click: onOK },
                { text: jpvs.DocumentEditor.strings.apply, click: onApply },
                { text: jpvs.DocumentEditor.strings.cancel, click: onCancel }
            ]);

            pop.show();

            function colSectionSorter(section) {
                jpvs.writeTag(this, "img").attr("src", jpvs.Resources.images.moveButton);
                this.parent().css("cursor", "move").data("section", section);
            }

            function colSectionText(section) {
                jpvs.write(this, trunc(jpvs.stripHtml(section && section.body && section.body.content)));

                function trunc(x) {
                    if (x.length > 150)
                        return x.substring(0, 147) + "...";
                    else
                        return x;
                }
            }

            function onOK() {
                pop.hide(function () {
                    //At the end of the animation, apply and destroy
                    onApply();
                    pop.destroy();
                });
            }

            function onApply() {
                //Apply the new order
                var trs = grid.element.find("tbody > tr");

                //Empty the array...
                sections.splice(0, sections.length);

                //...and put the items back (in the correct order (they are saved in the TR's data)
                trs.each(function () {
                    var section = $(this).data("section");
                    sections.push(section);
                });

                //Update the preview
                refreshPreviewAsync(W);

                //Fire the change event
                W.change.fire(W);
            }

            function onCancel() {
                pop.destroy();
            }

        };
    }

    /*
    Here's a trivial default editor, merely intended for testing purposes or for very simple scenarios
    */
    function getDefaultEditor() {

        function editText(content, onDone) {
            //Create a popup with a simple textarea
            var pop = jpvs.Popup.create().title(jpvs.DocumentEditor.strings.textEditor).close(function () { this.destroy(); });
            var tb = jpvs.MultiLineTextBox.create(pop);
            tb.text(content);
            tb.element.attr({ rows: 10, cols: 50 });

            jpvs.writeButtonBar(pop, [
                { text: jpvs.DocumentEditor.strings.ok, click: onOK },
                { text: jpvs.DocumentEditor.strings.cancel, click: onCancel }
            ]);

            pop.show(function () { tb.focus(); });

            function onOK() {
                pop.hide(function () {
                    //At the end of the hiding animations, call the onDone function and destroy the popup
                    onDone(tb.text());
                    pop.destroy();
                });
            }

            function onCancel() {
                pop.destroy();
                onDone();
            }
        }

        //Let's return the object interface
        return {
            editText: editText
        };
    }

    /*
    Here's a trivial default field editor, merely intended for testing purposes or for very simple scenarios
    */
    function getDefaultFieldEditor() {

        function editField(fields, fieldName, onDone) {
            //Create a popup with a simple textbox
            var pop = jpvs.Popup.create().title(jpvs.DocumentEditor.strings.fieldEditor).close(function () { this.destroy(); });
            var tb = jpvs.TextBox.create(pop);

            var field = fields && fields[fieldName];
            var fieldValue = field && field.value;

            tb.text(fieldValue || "");

            jpvs.writeButtonBar(pop, [
                { text: jpvs.DocumentEditor.strings.ok, click: onOK },
                { text: jpvs.DocumentEditor.strings.cancel, click: onCancel }
            ]);

            pop.show(function () { tb.focus(); });

            function onOK() {
                pop.hide(function () {
                    //At the end of the hiding animations, call the onDone function and destroy the popup
                    onDone(tb.text());
                    pop.destroy();
                });
            }

            function onCancel() {
                pop.destroy();
                onDone();
            }
        }

        //Let's return the object interface
        return {
            editField: editField
        };
    }

})();

/* JPVS
Module: widgets
Classes: DropDownList
Depends: core
*/

jpvs.DropDownList = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.DropDownList,
    type: "DropDownList",
    cssClass: "DropDownList",

    create: function (container) {
        var obj = document.createElement("select");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.change(function () {
            return W.change.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("select");
    },

    prototype: {
        clearItems: function () {
            this.element.empty();
            return this;
        },

        addItem: function (value, text) {
            var V = value;
            var T = text != null ? text : value;

            if (V != null & T != null) {
                var opt = document.createElement("option");
                $(opt).attr("value", V).text(T).appendTo(this.element);
            }

            return this;
        },

        addItems: function (items) {
            var W = this;
            $.each(items, function (i, item) {
                if (item != null) {
                    if (item.value != null)
                        W.addItem(item.value, item.text);
                    else
                        W.addItem(item);
                }
            });

            return this;
        },

        count: function () {
            return this.element.find("option").length;
        },

        selectedValue: jpvs.property({
            get: function () { return this.element.val(); },
            set: function (value) { this.element.val(value); }
        })
    }
});


/* JPVS
Module: widgets
Classes: ImageButton
Depends: core
*/

jpvs.ImageButton = function (selector) {
    this.attach(selector);

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.ImageButton,
    type: "ImageButton",
    cssClass: "ImageButton",

    create: function (container) {
        var obj = document.createElement("img");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        //Image urls
        var normal = this.element.attr("src");
        var hover = this.element.data("jpvsHover");
        this.imageUrls({
            normal: normal,
            hover: hover
        });

        //Hovering effect
        this.element.hover(
            function () {
                W.element.attr("src", W.getHoverImage());
            },
            function () {
                W.element.attr("src", W.getNormalImage());
            }
        );

        //Click
        this.element.click(function () {
            return W.click.fire(W);
        });
    },

    canAttachTo: function (obj) {
        //No autoattach
        return false;
    },

    prototype: {
        imageUrls: jpvs.property({
            get: function () {
                return this.element.data("images");
            },
            set: function (value) {
                this.element.data("images", value);
                this.element.attr("src", this.getNormalImage());
            }
        }),

        getNormalImage: function () {
            var urls = this.imageUrls();
            if (urls) {
                if (typeof (urls) == "string")
                    return urls;
                else
                    return urls.normal || "";
            }

            return "";
        },

        getHoverImage: function () {
            var urls = this.imageUrls();
            if (urls) {
                if (typeof (urls) == "string")
                    return urls;
                else
                    return urls.hover || urls.normal || "";
            }

            return "";
        }
    }
});


/* JPVS
Module: widgets
Classes: LinkButton
Depends: core
*/

jpvs.LinkButton = function (selector) {
    this.attach(selector);

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.LinkButton,
    type: "LinkButton",
    cssClass: "LinkButton",

    create: function (container) {
        var obj = document.createElement("a");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        W.element.attr("href", "#");
        this.element.click(function (e) {
            //Prevent the link from being navigated to
            e.preventDefault();

            return W.click.fire(W);
        });
    },

    canAttachTo: function (obj) {
        //By default, we don't want to automatically attach a LinkButton widget to an "A" element, because
        //we cannot determine if it is used as a button or as a hyperlink
        return false;
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.text(); },
            set: function (value) { this.element.text(value); }
        })
    }
});


/* JPVS
Module: widgets
Classes: Menu
Depends: core, Table
*/

/// <reference path="../../libs/jquery-1.7.2.js" />
/// <reference path="../../docs/jpvs-doc.js" />

(function () {

    //Keep track of all menus
    var allMenus = {};

    //Attach global events for handling menus
    $(document).ready(function () {
        try {
            $(document).on("mouseover.jpvsMenu", ".Menu .Item", onItemMouseOver);
            $(document).on("mouseout.jpvsMenu", ".Menu .Item", onItemMouseOut);
            $(document).on("click.jpvsMenu", onGlobalClick);
        }
        catch (e) {
        }
    });


    //Menu object
    jpvs.Menu = function (selector) {
        this.attach(selector);

        this.click = jpvs.event(this);
    };

    //Special menu item: separator. Usually rendered as a line.
    jpvs.Menu.Separator = {};


    /*
    The MenuElement object is a special object that must be returned by the menu template functions.
    It allows the Menu object to show/hide all the menu levels.
    */
    jpvs.Menu.MenuElement = function (element, menuItems, level, isPopup, childrenAlignment) {
        this.element = element;
        this.menuItems = menuItems;
        this.level = level;
        this.isPopup = isPopup;
        this.childrenAlignment = childrenAlignment;

        this.itemElements = element.find(".Item");

        //This member is loaded just after the rendering function finishes
        this.parentElement = null;
    };

    jpvs.Menu.MenuElement.prototype.show = function () {
        //When showing a "MenuElement", first make sure all other non-root menus of all menus are hidden
        $.each(allMenus, function (i, menu) {
            closeAllNonRoot(menu);
        });

        //Then show this "MenuElement", its parent, ..., up to the root element
        var allLine = [];
        for (var x = this; x != null; x = x.parentElement)
            allLine.unshift(x);

        //allLine has all the MenuElements that we must show
        for (var i = 0; i < allLine.length; i++) {
            var me = allLine[i];
            if (me.isPopup) {
                //A popup menu must appear close to the parent menu item
                var parentElement = me.parentElement;

                //Find the item (in the parent menu element) that has "me" as submenu
                var parentMenuItem = findParentItem(parentElement, me);

                //Determine the coordinates and show
                var box = getBox(parentMenuItem);
                var coords = getPopupCoords(box, parentElement.childrenAlignment);

                me.element.show().css({
                    position: "absolute",
                    left: coords.x + "px",
                    top: coords.y + "px"
                });

                //Then fit in visible area
                jpvs.fitInWindow(me.element);
            }
            else {
                //A non-popup menu, must just appear
                me.element.show();
            }
        }

        function findParentItem(parentElement, menuElement) {
            for (var i = 0; i < parentElement.itemElements.length; i++) {
                var itemElement = $(parentElement.itemElements[i]);
                var subMenu = itemElement.data("subMenu");

                //If this item's submenu is the menuElement, we have found the parent menu item of the "menuElement"
                if (subMenu === menuElement)
                    return itemElement;
            }
        }

        function getBox(elem) {
            var pos = elem.offset();
            var w = elem.outerWidth();
            var h = elem.outerHeight();

            return { x: pos.left, y: pos.top, w: w, h: h };
        }

        function getPopupCoords(box, align) {
            if (align == "right")
                return { x: box.x + box.w, y: box.y };
            else if (align == "bottom")
                return { x: box.x, y: box.y + box.h };
            else
                return box;
        }
    };

    jpvs.Menu.MenuElement.prototype.hide = function () {
        this.element.hide();
    };

    jpvs.Menu.MenuElement.prototype.hideIfNonRoot = function () {
        if (this.level != 0)
            this.element.hide();
    };

    jpvs.Menu.MenuElement.prototype.getChildren = function () {
        //Each itemElement may have an associated submenu
        var subMenus = [];
        $.each(this.itemElements, function (i, itemElem) {
            //It may also be null/undefined if this menu item has no submenu
            var subMenu = $(itemElem).data("subMenu");
            subMenus.push(subMenu);
        });

        return subMenus;
    };



    /*
    Standard menu templates
    */
    jpvs.Menu.Templates = {

        HorizontalMenuBar: function (menuData) {
            //Data from the menu rendering function
            var menuItems = menuData.items;
            var menuItemTemplate = menuData.itemTemplate;
            var level = menuData.level;

            /*
            A horizontal menu bar is a horizontal table of items.
            Each menu item is a TD.
            */
            var tbl = jpvs.Table.create(this).addClass("HorizontalMenuBar").addClass("HorizontalMenuBar-Level" + level);
            var row = tbl.writeBodyRow();

            $.each(menuItems, function (i, item) {
                var cell = row.writeCell().addClass("Item");

                //Write the menu item using the menu item template
                jpvs.applyTemplate(cell, menuItemTemplate, item);
            });

            //The menu template must return a MenuElement
            return new jpvs.Menu.MenuElement(tbl.element, menuItems, level != 0, false, "bottom");
        },

        VerticalMenuBar: function (menuData) {
            //Data from the menu rendering function
            var menuItems = menuData.items;
            var menuItemTemplate = menuData.itemTemplate;
            var level = menuData.level;

            /*
            A vertical menu bar is a vertical table of items.
            Each menu item is a TR.
            */
            var tbl = jpvs.Table.create(this).addClass("VerticalMenuBar").addClass("VerticalMenuBar-Level" + level);

            $.each(menuItems, function (i, item) {
                var row = tbl.writeBodyRow();
                row.element.addClass("Item");

                //Write the menu item using the menu item template
                jpvs.applyTemplate(row, menuItemTemplate, item);
            });

            //The menu template must return a MenuElement
            return new jpvs.Menu.MenuElement(tbl.element, menuItems, level != 0, false, "right");
        },

        PopupMenu: function (menuData) {
            //Data from the menu rendering function
            var menuItems = menuData.items;
            var menuItemTemplate = menuData.itemTemplate;
            var level = menuData.level;

            /*
            A popup menu is a vertical table of items.
            Each menu item is a TR.
            */
            var tbl = jpvs.Table.create(this).addClass("PopupMenu").addClass("PopupMenu-Level" + level);

            $.each(menuItems, function (i, item) {
                var row = tbl.writeBodyRow();
                row.element.addClass("Item");

                //Write the menu item using the menu item template
                jpvs.applyTemplate(row, menuItemTemplate, item);
            });

            //The menu template must return a MenuElement
            return new jpvs.Menu.MenuElement(tbl.element, menuItems, level != 0, true, "right");
        }

    };


    /*
    Standard menu item templates
    */
    jpvs.Menu.ItemTemplates = {

        HorizontalMenuBarItem: function (menuItem) {
            //In the HorizontalMenuBar, "this" is a TD
            if (menuItem === jpvs.Menu.Separator) {
                //Separator
                this.addClass("Separator");
                jpvs.write(this, "|");
            }
            else {
                //Normal item
                jpvs.write(this, menuItem && menuItem.text);

                if (menuItem && menuItem.tooltip)
                    this.attr("title", menuItem.tooltip);
            }
        },

        VerticalMenuBarItem: function (menuItem) {
            //In the VerticalMenuBar, "this" is a TR
            //Render as a PopupMenuItem
            jpvs.Menu.ItemTemplates.PopupMenuItem.call(this, menuItem);
        },

        PopupMenuItem: function (menuItem) {
            //In the PopupMenu, "this" is a TR
            if (menuItem === jpvs.Menu.Separator) {
                //Separator
                this.addClass("Separator");
                var td = jpvs.writeTag(this, "td").attr("colspan", 3);
                jpvs.writeTag(td, "hr");
            }
            else {
                //Normal item: 3 cells (icon, text, submenu arrow)
                var td1 = jpvs.writeTag(this, "td").addClass("Icon");
                var td2 = jpvs.writeTag(this, "td", menuItem && menuItem.text).addClass("Text");
                var td3 = jpvs.writeTag(this, "td").addClass("SubMenu");


                if (menuItem && menuItem.tooltip)
                    td2.attr("title", menuItem.tooltip);

                if (menuItem && menuItem.icon) {
                    var icon = jpvs.writeTag(td1, "img");
                    icon.attr("src", menuItem.icon);
                }

                if (menuItem && menuItem.items && menuItem.items.length) {
                    var arrow = jpvs.writeTag(td3, "img");
                    arrow.attr("src", jpvs.Resources.images.subMenuMarker);
                }
            }
        }

    };

    //Defaults
    jpvs.Menu.Templates.Default_Level0 = jpvs.Menu.Templates.HorizontalMenuBar;
    jpvs.Menu.Templates.Default_OtherLevels = jpvs.Menu.Templates.PopupMenu;

    jpvs.Menu.ItemTemplates.Default_Level0 = jpvs.Menu.ItemTemplates.HorizontalMenuBarItem;
    jpvs.Menu.ItemTemplates.Default_OtherLevels = jpvs.Menu.ItemTemplates.PopupMenuItem;


    //Widget definition
    jpvs.makeWidget({
        widget: jpvs.Menu,
        type: "Menu",
        cssClass: "Menu",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            //There can be a content. Let's try to interpret it as a menu, using common-sense
            //semantic-like interpretation
            var menuItems = parseContent(this.element);

            //Then, let's empty the element...
            this.element.empty();

            //...and recreate the content
            this.menuItems(menuItems);

            //Register the menu
            this.ensureId();
            allMenus[this.id()] = this;
        },

        canAttachTo: function (obj) {
            //No autoattach
            return false;
        },

        prototype: {
            template: templateProperty("jpvsTemplate"),

            itemTemplate: templateProperty("jpvsItemTemplate"),

            menuItems: jpvs.property({
                get: function () {
                    return this.element.data("menuItems");
                },
                set: function (value) {
                    this.element.data("menuItems", value);
                    renderMenu(this, value);
                }
            })
        }
    });

    /*
    jpvs.property that stores a menu template or menu item template in this.element.data(dataName)
    */
    function templateProperty(dataName) {
        return jpvs.property({
            get: function () {
                var template = this.element.data(dataName);
                if (!template)
                    return [];

                if (typeof (template) == "string") {
                    //Split into substrings
                    var tpl = template.split(",");
                    return tpl;
                }
                else
                    return template;
            },
            set: function (value) {
                this.element.data(dataName, value);
            }
        })
    }

    function parseContent(elem) {
        //Parses the element recursively and fills a menu items tree
        var menuItems = [];
        process(elem, null, menuItems);

        //After filling the tree, process it recursively and replace items with no text and no subitems
        //with a jpvs.Menu.Separator
        lookForSeparators(menuItems);

        //Finally, return the menu items tree
        return menuItems;

        function process(curElem, curItem, curLevel) {
            //Look for menu items in curElem. Loop over children and see if anything can be considered a menu item
            var children = $(curElem).contents();
            children.each(function () {
                var child = this;
                var $child = $(this);

                if (child.nodeType == 3) {
                    //Child is a text node. We consider it part of the current item text
                    if (curItem)
                        curItem.text = concatTextNode(curItem.text, $child.text());
                }
                else if (child.nodeType == 1) {
                    //Child is an element. Let's see what type
                    var nodeName = child.nodeName.toLowerCase();
                    if (nodeName == "ul" || nodeName == "ol") {
                        //Child represents a list of items. Let's just go down the hierarchy as if this ul/ol didn't exist
                        process(child, null, curLevel);
                    }
                    else if (nodeName == "a") {
                        //Child is a link. We consider it part of the current item text and we take the href also
                        if (curItem) {
                            curItem.text = concatTextNode(curItem.text, $child.text());
                            curItem.href = $child.attr("href");
                        }
                    }
                    else if (nodeName == "button") {
                        //Child is a button. We consider it part of the current item text and we take the onclick also
                        if (curItem) {
                            curItem.text = concatTextNode(curItem.text, $child.text());
                            curItem.click = child.onclick;
                        }
                    }
                    else {
                        //Child is something else (div or li or anything)
                        //This marks the beginning of a new menu item. We get it and go down the hierarchy looking for
                        //the menu item textual content and the child items
                        var parkedItem = curItem;
                        curItem = { text: "", items: [] };
                        curLevel.push(curItem);
                        process(child, curItem, curItem.items);

                        //End of the newly created and processed item, go back to previous
                        curItem = parkedItem;
                    }
                }
            });
        }

        function lookForSeparators(menuItems) {
            if (!menuItems)
                return;

            for (var i = 0; i < menuItems.length; i++) {
                var item = menuItems[i];
                var hasText = (item.text != null && $.trim(item.text) != "");
                var hasChildren = (item.items != null && item.items.length != 0);

                if (!hasText && !hasChildren)
                    menuItems[i] = jpvs.Menu.Separator;

                //If has children, do the same on them
                lookForSeparators(item.items);
            }
        }

        function concatTextNode(text, textToAdd) {
            text = $.trim(text) + " " + $.trim(textToAdd);
            return $.trim(text);
        }
    }

    function renderMenu(W, menuItems) {
        //Empty everything
        W.element.empty();

        //Now recreate the items according to the template
        var template = W.template();
        var itemTemplate = W.itemTemplate();

        //template[0] is the template for the root level
        //template[1] is the template for the first nesting level
        //template[2] is the template for the second nesting level
        //...
        //itemTemplate[0] is the item template for the root level
        //itemTemplate[1] is the item template for the first nesting level
        //itemTemplate[2] is the item template for the second nesting level
        //...

        //Store the root element
        W.rootElement = render(W.element, template, itemTemplate, 0, menuItems);

        //Recursively navigate all the structure, starting from the root element and fill the MenuElement.parentElement of
        //all MenuElements
        recursivelySetParent(null, W.rootElement);

        function recursivelySetParent(parentElement, currentElement) {
            if (!currentElement)
                return;

            //Assign the parent to the currentElement
            currentElement.parentElement = parentElement;

            //Then do the same on currentElement's children
            var children = currentElement.getChildren();
            $.each(children, function (i, child) {
                recursivelySetParent(currentElement, child);
            });
        }

        function render(elem, tpl, itemTpl, level, items) {
            if (!items || items.length == 0)
                return;

            //If not specified, render as a PopupMenu
            var curLevelTemplate = getTemplate(tpl[level], level, jpvs.Menu.Templates);
            var curLevelItemTemplate = getTemplate(itemTpl[level], level, jpvs.Menu.ItemTemplates);

            //Apply the template. The menu templates must return a MenuElement, so we can hide/show it as needed by the menu behavior
            var levelElem = jpvs.applyTemplate(elem, curLevelTemplate, { items: items, itemTemplate: curLevelItemTemplate, level: level });

            //The root level is always visible. The inner levels are hidden.
            if (level == 0)
                levelElem.show();
            else
                levelElem.hide();

            //Get all items that have just been created (they have the "Item" class)...
            var itemElements = levelElem.element.find(".Item");

            //...and associate the corresponding menuitem to each
            //Then render the next inner level and keep track of the submenu of each item
            $.each(items, function (i, item) {
                var itemElement = itemElements[i];
                if (itemElement) {
                    var $itemElem = $(itemElement);
                    $itemElem.data("menuItem", item);

                    var subMenu = render(elem, tpl, itemTpl, level + 1, item && item.items);
                    if (subMenu)
                        $itemElem.data("subMenu", subMenu);
                }
            });

            return levelElem;
        }
    }

    function getTemplate(templateSpec, level, defaultTemplates) {
        var tpl;

        //Use templateSpec to determine a template function
        if (typeof (templateSpec) == "function") {
            //If templateSpec is already a function, then we have nothing to do
            tpl = templateSpec;
        }
        else if (typeof (templateSpec) == "string") {
            //If it is a string, then it must be a default template
            tpl = defaultTemplates[templateSpec];
        }

        //If we still don't have a template here, let's apply a default setting
        if (!tpl) {
            if (level == 0)
                tpl = defaultTemplates.Default_Level0;
            else
                tpl = defaultTemplates.Default_OtherLevels;
        }

        //Here we have a template
        return tpl;
    }

    function closeAllNonRoot(menu) {
        var root = menu.rootElement;

        recursivelyClosePopups(root);

        function recursivelyClosePopups(menuElement) {
            if (!menuElement)
                return;

            menuElement.hideIfNonRoot();

            var childMenuElements = menuElement.getChildren();
            $.each(childMenuElements, function (i, cme) {
                //Only menu elements with submenu have children. The others are undefined.
                recursivelyClosePopups(cme);
            });
        }
    }

    function onItemMouseOver(e) {
        var item = $(e.currentTarget);

        //Menu item clicked
        var menuItem = item.data("menuItem");

        //If separator, do nothing
        if (menuItem === jpvs.Menu.Separator)
            return;

        //Hovering effect
        item.addClass("Item-Hover");
    }

    function onItemMouseOut(e) {
        var item = $(e.currentTarget);

        //Hovering effect
        item.removeClass("Item-Hover");
    }

    function onGlobalClick(e) {
        var clickedElem = $(e.target);
        var clickedItem = clickedElem.closest(".Menu .Item");
        var clickedMenu = clickedItem.closest(".Menu");

        //If no menu item clicked, then hide all non-root menus
        if (clickedItem.length == 0) {
            $.each(allMenus, function (i, menu) {
                closeAllNonRoot(menu);
            });
        }
        else {
            //Menu item clicked
            var menuItem = clickedItem.data("menuItem");

            //If separator, do nothing
            if (menuItem === jpvs.Menu.Separator)
                return;

            //Menu clicked
            var menu = jpvs.find(clickedMenu);

            //Show the submenu, if any
            var subMenu = clickedItem.data("subMenu");
            if (subMenu)
                subMenu.show();
            else {
                //If no submenu, hide all non-root
                closeAllNonRoot(menu);
            }

            //Finally handle events
            //Trigger the click event
            menu.click.fire(menu, null, menuItem);

            //Call the menu item click function, if any.
            //Pass the menuItem as the "this" and as the first argument
            if (menuItem && menuItem.click)
                menuItem.click.call(menuItem, menuItem);

            //Follow the href, if any
            if (menuItem && menuItem.href)
                window.location = menuItem.href;
        }
    }

})();

/* JPVS
Module: widgets
Classes: MultiLineTextBox
Depends: core
*/

jpvs.MultiLineTextBox = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.MultiLineTextBox,
    type: "MultiLineTextBox",
    cssClass: "MultiLineTextBox",

    create: function (container) {
        var obj = document.createElement("textarea");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.change(function () {
            return W.change.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("textarea");
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.val(); },
            set: function (value) { this.element.val(value); }
        })
    }
});



/* JPVS
Module: widgets
Classes: MultiSelectBox
Depends: core
*/

(function () {

    jpvs.MultiSelectBox = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.MultiSelectBox.allStrings = {
        en: {
            selectAll: "Select all",
            unselectAll: "Unselect all"
        },

        it: {
            selectAll: "Seleziona tutto",
            unselectAll: "Deseleziona tutto"
        }
    };

    jpvs.makeWidget({
        widget: jpvs.MultiSelectBox,
        type: "MultiSelectBox",
        cssClass: "MultiSelectBox",

        create: function (container) {
            var obj = document.createElement("table");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            jpvs.MultiSelectBox.strings = jpvs.MultiSelectBox.allStrings[jpvs.currentLocale()];

            //Read items
            var items = [];
            this.element.find("option").each(function () {
                var opt = $(this);
                var value = opt.val();
                var text = opt.text();
                var selected = opt.prop("selected");

                items.push({ value: value, text: text, selected: selected });
            });

            //Remove this.element and substitute it with a table
            var newElem = jpvs.writeTag(this.element.parent(), "table");
            newElem.insertAfter(this.element);
            this.element.remove();
            newElem.attr("id", this.element.attr("id"));
            newElem.attr("class", this.element.attr("class"));
            this.element = newElem;

            //Attach the items collection
            setItems(W, items);

            //Create the label and the button
            var tbody = jpvs.writeTag(W, "tbody");
            var tr = jpvs.writeTag(tbody, "tr");

            this.label = jpvs.writeTag(tr, "td");
            this.label.addClass("Label");

            var buttonContainer = jpvs.writeTag(tr, "td");
            buttonContainer.addClass("ButtonContainer");

            this.button = jpvs.Button.create(buttonContainer).text("...").click(function () {
                showPopup(W);
            });

            //Update the label
            updateLabel(W);
        },

        canAttachTo: function (obj) {
            //No autoattach
            return false
        },

        prototype: {
            caption: jpvs.property({
                get: function () {
                    return this.element.data("caption");
                },
                set: function (value) {
                    this.element.data("caption", value);
                }
            }),

            prompt: jpvs.property({
                get: function () {
                    return this.element.data("prompt");
                },
                set: function (value) {
                    this.element.data("prompt", value);
                }
            }),

            containerTemplate: jpvs.property({
                get: function () {
                    return this.element.data("containerTemplate");
                },
                set: function (value) {
                    this.element.data("containerTemplate", value);
                }
            }),

            itemTemplate: jpvs.property({
                get: function () {
                    return this.element.data("itemTemplate");
                },
                set: function (value) {
                    this.element.data("itemTemplate", value);
                }
            }),

            clearItems: function () {
                setItems(this, []);
                updateLabel(this);
                return this;
            },

            addItem: function (value, text, selected) {
                var V = value;
                var T = text != null ? text : value;

                if (V != null & T != null) {
                    var items = getItems(this);
                    items.push({ value: V, text: T, selected: !!selected });
                    setItems(this, items);
                    updateLabel(this);
                }

                return this;
            },

            addItems: function (items) {
                var W = this;
                $.each(items, function (i, item) {
                    if (item != null) {
                        if (item.value != null)
                            W.addItem(item.value, item.text, item.selected);
                        else
                            W.addItem(item);
                    }
                });

                return this;
            },

            count: function () {
                var items = getItems(this);
                return items.length;
            },

            selectedValues: jpvs.property({
                get: function () { return getSelectedValues(this); },
                set: function (value) { setSelectedValues(this, value); }
            }),

            selectedValuesString: jpvs.property({
                get: function () { return this.selectedValues().join(","); },
                set: function (value) {
                    var x = $.trim(value);
                    if (x != "")
                        this.selectedValues(x.split(","));
                    else
                        this.selectedValues([]);
                }
            })
        }
    });

    function getItems(W) {
        return W.element.data("items");
    }

    function setItems(W, items) {
        W.element.data("items", items);
    }

    function getSelectedItems(W) {
        var items = getItems(W);
        var selItems = [];
        $.each(items, function (i, item) {
            if (item.selected)
                selItems.push(item);
        });

        return selItems;
    }

    function getSelectedTexts(W) {
        var selItems = getSelectedItems(W);
        var texts = [];
        $.each(selItems, function (i, item) {
            texts.push(item.text);
        });

        return texts;
    }

    function getSelectedValues(W) {
        var selItems = getSelectedItems(W);
        var values = [];
        $.each(selItems, function (i, item) {
            values.push(item.value);
        });

        return values;
    }

    function setSelectedValues(W, values) {
        var items = getItems(W);
        var mapItems = {};

        //Deselect all...
        $.each(items, function (i, item) {
            item.selected = false;
            mapItems[item.value] = item;
        });

        //... and select
        $.each(values, function (i, value) {
            var item = mapItems[value];
            if (item)
                item.selected = true;
        });

        setItems(W, items);
        updateLabel(W);
    }

    function updateLabel(W) {
        var texts = getSelectedTexts(W);
        jpvs.write(W.label.empty(), texts.join(", "));
    }

    function showPopup(W) {
        var items = getItems(W);

        //Create the popup with no title, not modal and below the label
        //Autoclose if the user clicks outside
        var pop = jpvs.Popup.create().addState("MultiSelectBox").title(null).modal(false).position({ my: "left top", at: "left bottom", of: W.label, collision: "fit", position: "absolute" });
        pop.autoDestroy(true);

        //Write the prompt string
        var prompt = W.prompt();
        if (prompt)
            jpvs.writeln(pop, prompt);

        //Select all/unselect all buttons
        jpvs.LinkButton.create(pop).text(jpvs.MultiSelectBox.strings.selectAll).click(onSelectAll);
        jpvs.write(pop, " ");
        jpvs.LinkButton.create(pop).text(jpvs.MultiSelectBox.strings.unselectAll).click(onUnselectAll);
        jpvs.writeln(pop);

        //Create the container, using a default container template (UL)
        //No data item is passed to this template
        var containerTemplate = W.containerTemplate() || defaultContainerTemplate;
        var ul = jpvs.applyTemplate(pop, containerTemplate);

        //Then create the data items (checkboxes), using the item template
        //Use a default item template that renders the item as an LI element with a checkbox inside
        //The item template must return an object with a "selected" property and a "change" event, so we can use it from here no
        //matter how the item is rendered
        var itemTemplate = W.itemTemplate() || defaultItemTemplate;
        var itemObjects = [];
        $.each(items, function (i, item) {
            var itemObject = jpvs.applyTemplate(ul, itemTemplate, item);
            itemObjects.push(itemObject);

            //Set the state and subscribe to the change event
            itemObject.selected(!!item.selected);
            itemObject.change(onItemSelectChange(itemObject, item));
        });

        pop.show();

        function onSelectAll() {
            selectAll(true);
        }

        function onUnselectAll() {
            selectAll(false);
        }

        function selectAll(value) {
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var itemObject = itemObjects[i];

                itemObject.selected(value);
                item.selected = value;
            }

            updateAndFire();
        }

        function onItemSelectChange(itemObject, item) {
            return function () {
                item.selected = itemObject.selected();
                updateAndFire();
            };
        }

        function updateAndFire() {
            setItems(W, items);
            updateLabel(W);

            //Fire the change event
            W.change.fire(W);
        }

        function defaultContainerTemplate() {
            return jpvs.writeTag(this, "ul");
        }

        function defaultItemTemplate(dataItem) {
            var li = jpvs.writeTag(this, "li");
            var chk = jpvs.CheckBox.create(li).text(dataItem.text).change(onCheckBoxChange);

            //Prepare the item object with the "selected" property and the "change" event
            var itemObject = {
                selected: jpvs.property({
                    get: function () {
                        return chk.checked();
                    },
                    set: function (value) {
                        chk.checked(value);
                    }
                }),

                change: jpvs.event(W)
            };

            return itemObject;

            function onCheckBoxChange() {
                //We just fire the change event
                itemObject.change.fire(itemObject);
            }
        }
    }

})();

/* JPVS
Module: widgets
Classes: Pager
Depends: core, LinkButton
*/

(function () {

    jpvs.Pager = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.Pager.allStrings = {
        en: {
            firstPage: "First page",
            previousPage: "Previous page",
            nextPage: "Next page",
            lastPage: "Last page",
            pag: "Page"
        },
        it: {
            firstPage: "Prima pagina",
            previousPage: "Pagina precedente",
            nextPage: "Pagina successiva",
            lastPage: "Ultima pagina",
            pag: "Pag."
        }
    };

    jpvs.makeWidget({
        widget: jpvs.Pager,
        type: "Pager",
        cssClass: "Pager",

        create: function (container) {
            var obj = document.createElement("table");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            var tbody = jpvs.writeTag(W.element, "tbody");
            var tr = jpvs.writeTag(tbody, "tr");

            var first = jpvs.writeTag(tr, "td");
            var prev = jpvs.writeTag(tr, "td");
            var combo = jpvs.writeTag(tr, "td");
            var next = jpvs.writeTag(tr, "td");
            var last = jpvs.writeTag(tr, "td");

            jpvs.Pager.strings = jpvs.Pager.allStrings[jpvs.currentLocale()];

            jpvs.LinkButton.create(first).text(jpvs.Pager.strings.firstPage).click(function () {
                W.page(Math.min(0, W.totalPages() - 1));
                W.change.fire(W);
            });

            jpvs.LinkButton.create(next).text(jpvs.Pager.strings.nextPage).click(function () {
                W.page(Math.min(W.page() + 1, W.totalPages() - 1));
                W.change.fire(W);
            });

            jpvs.LinkButton.create(prev).text(jpvs.Pager.strings.previousPage).click(function () {
                W.page(Math.max(0, W.page() - 1));
                W.change.fire(W);
            });

            jpvs.LinkButton.create(last).text(jpvs.Pager.strings.lastPage).click(function () {
                W.page(W.totalPages() - 1);
                W.change.fire(W);
            });

            var cmbPages = jpvs.DropDownList.create(combo).change(function () {
                var val = parseInt(this.selectedValue());
                W.page(Math.min(val, W.totalPages() - 1));
                W.change.fire(W);
            });

            this.element.data("cmbPages", cmbPages);
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            page: jpvs.property({
                get: function () { return this.element.data("page") || 0; },
                set: function (value) {
                    this.element.data("page", value);

                    var cmbPages = this.element.data("cmbPages");
                    cmbPages.selectedValue(value.toString());
                }
            }),

            totalPages: jpvs.property({
                get: function () { return this.element.data("totalPages") || 0; },
                set: function (value) {
                    var oldValue = this.totalPages();
                    if (oldValue != value) {
                        var cmbPages = this.element.data("cmbPages");
                        cmbPages.clearItems();
                        for (var i = 0; i < value; i++)
                            cmbPages.addItem(i.toString(), jpvs.Pager.strings.pag + " " + (i + 1) + " / " + value);
                    }

                    this.element.data("totalPages", value);
                }
            })
        }
    });
})();

/* JPVS
Module: widgets
Classes: Popup
Depends: core, ImageButton
*/

(function () {

    //Keep track of all popups
    var allPopups = {};

    //Attach global events for handling auto-hide/destroy popups and the ESC keystroke
    $(document).ready(function () {
        try {
            $(document).on("click.jpvsPopup", onGlobalClick).on("keydown.jpvsPopup", onGlobalKeyDown);
        }
        catch (e) {
        }
    });


    jpvs.Popup = function (selector) {
        this.attach(selector);

        this.close = jpvs.event(this);
    };

    jpvs.Popup.getTopMost = function () {
        var topMost, zIndex;
        $.each(allPopups, function (popId, popInfo) {
            if (!popInfo.open)
                return;

            var popZIndex = popInfo.widget.zIndex();

            if (!zIndex || popZIndex > zIndex) {
                topMost = popInfo;
                zIndex = popZIndex;
            }
        });

        return topMost ? topMost.widget : null;
    };

    jpvs.makeWidget({
        widget: jpvs.Popup,
        type: "Popup",
        cssClass: "Popup",

        create: function (container) {
            //Every popup created here must have a unique ID because it is put in allPopups[id]
            var obj = document.createElement("div");
            $(obj).attr("id", jpvs.randomString(20));
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            //Keep track
            allPopups[this.element.attr("id")] = { open: false, autoDestroy: false, autoHide: false, widget: this };

            //Wrap any current contents "xxxxxx" in structure: <div class="DimScreen"></div><div class="Contents">xxxxxx</div>
            var contents = this.element.contents();

            this.blanketElement = $(document.createElement("div"));
            this.blanketElement.addClass("DimScreen").css({ position: "fixed", top: "0px", left: "0px", width: "100%", height: "100%" });
            this.element.append(this.blanketElement);

            this.contentsElement = $(document.createElement("div"));
            this.contentsElement.addClass("Contents").append(contents);
            this.element.append(this.contentsElement);

            //All hidden initially
            this.element.hide();

            //Apply jpvsWidth
            var width = this.element.data("jpvsWidth");
            if (width)
                this.contentsElement.css({ width: width });

            //Treat H1 as popup title. Add <div class="Title"><h1>title</h1><img/></div><div class="Body"/> in Contents
            var h1 = this.contentsElement.children("h1").detach();
            var rest = this.contentsElement.contents();

            this.titleElement = $(document.createElement("div"));
            this.titleElement.addClass("Title");
            this.contentsElement.append(this.titleElement);

            this.bodyElement = $(document.createElement("div"));
            this.bodyElement.addClass("Body");
            this.contentsElement.append(this.bodyElement);

            this.bodyElement.append(rest);

            //Add closebutton and H1 in title
            this.closeButton = jpvs.ImageButton.create(this.titleElement);
            this.closeButton.imageUrls({
                normal: jpvs.Resources.images.closeButton,
                hover: jpvs.Resources.images.closeButtonHover
            });

            this.closeButton.click.bind(function () {
                W.hide();
                W.close.fire(W);
            });

            //Move H1 in title
            var newH1 = jpvs.writeTag(this.titleElement, "h1");
            newH1.append(h1.contents());

            //Make popup draggable by the H1
            if (this.contentsElement.draggable) {
                this.contentsElement.draggable({
                    addClasses: false,
                    containment: "window",
                    cursor: "move",
                    handle: newH1,
                    scroll: false
                });
            }

            //By default, the popup is modal
            this.modal(true);

            //When clicking on the popup, put it on top of the popup stack
            this.contentsElement.mousedown(onPopupClick(this));

            function onPopupClick(W) {
                return function () {
                    W.bringForward();
                };
            }
        },

        canAttachTo: function (obj) {
            //No auto attaching
            return false;
        },

        destroy: function () {
            var pop = this;

            //Hide the popup and, only at the end of the animation, destroy the widget
            this.hide(function () {
                //Keep track
                delete allPopups[pop.element.attr("id")];

                //Let's effect the default behavior here, AFTER the end of the "hide animation"
                pop.element.remove();
            });

            //Suppress the default behavior
            return false;
        },

        getMainContentElement: function () {
            return this.bodyElement;
        },

        prototype: {
            modal: jpvs.property({
                get: function () { return this.element.data("modal"); },
                set: function (value) { this.element.data("modal", !!value); }
            }),

            autoHide: jpvs.property({
                get: function () {
                    return !!allPopups[this.element.attr("id")].autoHide;
                },
                set: function (value) {
                    allPopups[this.element.attr("id")].autoHide = !!value;
                }
            }),

            autoDestroy: jpvs.property({
                get: function () {
                    return !!allPopups[this.element.attr("id")].autoDestroy;
                },
                set: function (value) {
                    allPopups[this.element.attr("id")].autoDestroy = !!value;
                }
            }),

            position: jpvs.property({
                get: function () {
                    return this.element.data("position");
                },
                set: function (value) {
                    this.element.data("position", value);
                }
            }),

            applyPosition: function (flagAnimate) {
                //First, if bigger than viewport, reduce the popup
                var W = this.contentsElement.outerWidth();
                var H = this.contentsElement.outerHeight();

                var wnd = $(window);
                var wndW = wnd.width();
                var wndH = wnd.height();

                //If bigger than screen, adjust to fit and put scrollbars on popup body
                var deltaH = H - wndH;
                var deltaW = W - wndW;

                var bodyW = this.bodyElement.width();
                var bodyH = this.bodyElement.height();

                if (deltaW > 0 || deltaH > 0) {
                    this.bodyElement.css("overflow", "auto");

                    if (deltaW > 0) {
                        bodyW -= deltaW;
                        this.bodyElement.css("width", bodyW + "px");
                    }

                    if (deltaH > 0) {
                        bodyH -= deltaH;
                        this.bodyElement.css("height", bodyH + "px");
                    }
                }

                //Finally, apply the desired position or, if no desired position was specified, center in viewport
                var pos = this.position() || {
                    my: "center",
                    at: "center",
                    of: $(window),
                    collision: "fit",
                    position: "fixed"
                };

                if (flagAnimate)
                    pos.using = function (css) { $(this).animate(css); };
                else
                    delete pos.using;

                this.contentsElement.css("position", pos.position || "fixed").position(pos);
                return this;
            },

            center: function () {
                //Default position (center in viewport)
                this.position(null);
                this.applyPosition();
                return this;
            },

            show: function (callback) {
                var pop = this;

                //Show popup
                this.element.show();

                //If never positioned before, then do it now with no animation
                var posType = this.contentsElement.css("position");
                if (posType != "absolute" && posType != "fixed")
                    this.applyPosition(false);

                this.contentsElement.hide();
                this.contentsElement.fadeIn(function () {
                    //Animate to desired position, if not already there
                    pop.applyPosition(true);

                    //Callback after the animation
                    if (callback)
                        callback();
                });

                //Dim screen if modal
                if (this.modal())
                    this.blanketElement.show();
                else
                    this.blanketElement.hide();

                //Keep track
                allPopups[this.element.attr("id")].open = true;
                allPopups[this.element.attr("id")].openTimestamp = new Date().getTime();

                //Put it on top of popup stack
                this.bringForward();

                return this;
            },

            hide: function (callback) {
                //Keep track
                allPopups[this.element.attr("id")].open = false;

                this.blanketElement.hide();
                this.contentsElement.fadeOut(callback);

                return this;
            },

            bringForward: function () {
                var topMost = jpvs.Popup.getTopMost();
                if (topMost) {
                    //Change zIndex only if not already on top
                    if (topMost !== this)
                        this.zIndex(topMost.zIndex() + 1);
                }
                else
                    this.zIndex(10000);

                return this;
            },

            title: jpvs.property({
                get: function () { return this.titleElement.children("h1").text(); },
                set: function (value) {
                    this.titleElement.children("h1").text(value);
                    if (value)
                        this.titleElement.show();
                    else
                        this.titleElement.hide();
                }
            }),

            width: jpvs.property({
                get: function () { return this.contentsElement.width(); },
                set: function (value) { this.contentsElement.css("width", value); }
            }),

            maxWidth: jpvs.property({
                get: function () { return this.contentsElement.css("max-width"); },
                set: function (value) { this.contentsElement.css("max-width", value); }
            }),

            zIndex: jpvs.property({
                get: function () {
                    var z = parseInt(this.contentsElement.css("zIndex"));
                    return isFinite(z) ? z : 10000;
                },
                set: function (value) {
                    this.blanketElement.css("zIndex", value);
                    this.contentsElement.css("zIndex", value);
                }
            })
        }
    });



    jpvs.alert = function () {
        //Variable argument list
        var params = {
            title: jpvs.alert.defaultTitle,
            text: "",
            onclose: null,
            buttons: [{ text: "OK"}]
        };

        //Read arguments and dispatch them to the appropriate field
        var okTitle = false, okText = false;
        for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i];
            if (!arg)
                continue;

            if (typeof (arg) == "string") {
                //First try (text) then (title, text)
                if (!okText) {
                    params.text = arg;
                    okText = true;
                }
                else if (!okTitle) {
                    params.title = params.text;
                    params.text = arg;
                    okTitle = true;
                }
            }
            else if (typeof (arg) == "function" || arg.__WIDGET__) {
                //It's an "onclose" ("function" or "widget to focus")
                params.onclose = arg;
            }
            else if (arg.length) {
                //Buttons array
                params.buttons = arg;
            }
        }

        //Create popup
        var pop = jpvs.Popup.create();

        //Set title and text and width
        pop.maxWidth("75%").title(params.title || null);
        jpvs.write(pop.bodyElement, params.text);

        //Buttons (with pop.close.fire() prepended in the event handlers)
        if (params.buttons) {
            $.each(params.buttons, function (i, btn) {
                if (btn)
                    btn.click = wrap(pop, btn.click);
            });
        }

        jpvs.writeButtonBar(pop.bodyElement, params.buttons);

        //Show
        pop.show();
        pop.center();

        //Close event --> give focus as requested and destroy
        pop.close.bind(function () {
            pop.hide();

            if (params.onclose) {
                if (typeof (params.onclose) == "function")
                    params.onclose();
                else if (params.onclose.__WIDGET__) {
                    //If widget, then set focus to it
                    params.onclose.focus();
                }
            }

            //Destroy after hide animation finished
            setTimeout(function () { pop.destroy(); }, 5000);
        });

        function wrap(pop, handler) {
            return function () {
                //First, call the button handler...
                if (handler)
                    handler();

                //Then, simulate a click on the close button to hide the popup and trigger the onclose event
                pop.close.fire();
            };
        }
    };


    jpvs.confirm = function (title, text, onYes, onNo, textYes, textNo) {
        var clickedYes = false;

        function onClose() {
            if (clickedYes) {
                if (onYes)
                    onYes();
            }
            else {
                if (onNo)
                    onNo();
            }
        }

        jpvs.alert(title, text, onClose, [
            { text: textYes || "OK", click: function () { clickedYes = true; } },
            { text: textNo || "Cancel", click: function () { clickedYes = false; } }
        ]);
    };



    function onGlobalKeyDown(e) {
        //ESC button must close the topmost popup currently open
        if (e.which == 27) {
            //ESC key pressed: search for the topmost popup
            var topMost = jpvs.Popup.getTopMost();

            //Now close it and do not propagate the ESC event
            //Simulate a click on the close button instead of simply hiding
            if (topMost) {
                topMost.closeButton.click.fire(topMost);
                return false;
            }
        }
    }

    function onGlobalClick(e) {
        //What did the user click?
        var clickedElem = $(e.target);
        var clickedPopup = clickedElem.closest(".Popup");

        //Close all "auto-close" (autohide or autodestroy) popups that are currently open, but leave clickedPopupId open
        //That is, if the user clicked on a popup, leave that one open and close all the others
        var clickedPopupId = clickedPopup.length ? clickedPopup.attr("id") : "";

        //Preserve newly-opened popups, so the button click that triggered the popup does not immediately trigger its destruction
        var threshold = new Date().getTime() - 500;

        $.each(allPopups, function (popId, pop) {
            if (pop.open && pop.openTimestamp < threshold && popId != clickedPopupId) {
                //If autohide, then hide
                if (pop.autoHide)
                    pop.widget.hide();

                //If autodestroy, then destroy
                if (pop.autoDestroy)
                    pop.widget.destroy();
            }
        });
    }

})();

/* JPVS
Module: widgets
Classes: Scroller
Depends: core
*/

(function () {

    jpvs.Scroller = function (selector) {
        this.attach(selector);

        this.change = jpvs.event(this);
    };

    jpvs.makeWidget({
        widget: jpvs.Scroller,
        type: "Scroller",
        cssClass: "Scroller",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            //Park the size
            var parkedSize = {
                width: W.element.width(),
                height: W.element.height()
            };

            //Make the div a container for scrolling
            W.element.css({ position: "relative", width: "200px", height: "200px" });

            //Park the content for later inclusion in the appropriate DIV
            var parkedContent = W.element.contents();

            //Create a scroller box DIV with overflow auto, same size as the widget
            W.scrollerBox = jpvs.writeTag(W.element, "div").css({
                position: "absolute",
                left: "0px", top: "0px",
                width: "100%", height: "100%",
                overflow: "scroll"
            });

            //Inside the scroller box, create a DIV that is used as a sizer for the scrollbars of the scroller box
            W.scrollerSizer = jpvs.writeTag(W.scrollerBox, "div").css({
                position: "absolute",
                left: "0px", top: "0px",
                width: "100%", height: "100%",
                overflow: "hidden"
            });

            //Create a content box DIV with overflow hidden, same size as the widget, overlapping the scroller box
            //Later, we reduce width and height so as to leave the scrollerBox's scrollbars uncovered
            W.contentBox = jpvs.writeTag(W.element, "div").css({
                position: "absolute",
                left: "0px", top: "0px",
                width: "100%", height: "100%",
                overflow: "hidden"
            });

            //Inside the content box, create a content DIV that will hold the actual content
            W.content = jpvs.writeTag(W.contentBox, "div").css({
                position: "absolute",
                left: "0px", top: "0px",
                width: "100%", height: "100%",
                overflow: "hidden"
            });

            //Measure scrollbars
            W.scrollbarW = scrollbarWidth();
            W.scrollbarH = W.scrollbarW;

            //Events
            W.scrollerBox.scroll(onScroll(W));
            $(window).resize(onResize(W));

            //Finally, copy the content into the "content" DIV and set sizes
            if (parkedContent.length) {
                W.content.append(parkedContent);
                parkedSize.height += W.scrollbarH;
                parkedSize.width += W.scrollbarW;
                W.scrollableSize(parkedSize).contentSize(parkedSize);
            }

            //Adjust the content box size
            onResize(W)();
        },

        canAttachTo: function (obj) {
            return false;
        },

        getMainContentElement: function () {
            return this.content;
        },

        prototype: {
            objectSize: jpvs.property({
                get: function () {
                    return {
                        width: this.element.width(),
                        height: this.element.height()
                    };
                },
                set: function (value) {
                    this.element.width(value.width).height(value.height);
                    onResize(this)();
                }
            }),

            scrollableSize: jpvs.property({
                get: function () {
                    return {
                        width: this.scrollerSizer.width(),
                        height: this.scrollerSizer.height()
                    };
                },
                set: function (value) {
                    this.scrollerSizer.width(value.width).height(value.height);
                    onResize(this)();
                }
            }),

            contentSize: jpvs.property({
                get: function () {
                    return {
                        width: this.content.width(),
                        height: this.content.height()
                    };
                },
                set: function (value) {
                    this.content.width(value.width).height(value.height);
                    onResize(this)();
                }
            }),

            scrollPosition: jpvs.property({
                get: function () {
                    var st = this.scrollerBox.scrollTop();
                    var sl = this.scrollerBox.scrollLeft();

                    return { top: st, left: sl };
                },
                set: function (value) {
                    this.scrollerBox.scrollTop(value.top).scrollLeft(value.left);
                }
            }),

            contentPosition: jpvs.property({
                get: function () {
                    var st = this.contentBox.scrollTop();
                    var sl = this.contentBox.scrollLeft();

                    return { top: st, left: sl };
                },
                set: function (value) {
                    this.contentBox.scrollTop(value.top).scrollLeft(value.left);
                }
            })
        }
    });


    function onScroll(W) {
        return function () {
            W.change.fire(W);
        };
    }

    function onResize(W) {
        return function () {
            //Adjust the content box size, so the scrollbars are not covered by the content
            var width = W.element.innerWidth() - W.scrollbarW;
            var height = W.element.innerHeight() - W.scrollbarH;
            W.contentBox.css({
                width: width + "px", height: height + "px"
            });
        };
    }

    function scrollbarWidth() {
        var $inner = $('<div style="width: 100%; height:200px;">test</div>');
        var $outer = $('<div style="width:200px;height:150px; position: absolute; top: 0px; left: 0px; visibility: hidden; overflow:hidden;"></div>').append($inner);
        var inner = $inner[0];
        var outer = $outer[0];

        $('body').append(outer);
        var width1 = inner.offsetWidth;
        $outer.css('overflow', 'scroll');
        var width2 = outer.clientWidth;
        $outer.remove();

        return (width1 - width2);
    }

})();

/* JPVS
Module: widgets
Classes: Table
Depends: core
*/

(function () {

    jpvs.Table = function (selector) {
        this.attach(selector);
    };

    jpvs.makeWidget({
        widget: jpvs.Table,
        type: "Table",
        cssClass: "Table",

        create: function (container) {
            var obj = document.createElement("table");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
        },

        canAttachTo: function (obj) {
            return $(obj).is("table");
        },

        prototype: {
            addClass: function (classNames) {
                //Proxy to jQuery method
                this.element.addClass(classNames);
                return this;
            },

            removeClass: function (classNames) {
                //Proxy to jQuery method
                this.element.removeClass(classNames);
                return this;
            },

            css: function () {
                //Proxy to jQuery method
                this.element.css.apply(this.element, arguments);
                return this;
            },

            writeHeaderRow: function () {
                return writeRow(this, "thead");
            },

            writeBodyRow: function () {
                return writeRow(this, "tbody");
            },

            writeRow: function () {
                return this.writeBodyRow();
            },

            writeFooterRow: function () {
                return writeRow(this, "tfoot");
            },

            caption: jpvs.property({
                get: function () {
                    var caption = this.element.children("caption");
                    if (caption.length != 0)
                        return caption.text();
                    else
                        return null;
                },
                set: function (value) {
                    var caption = this.element.children("caption");
                    if (caption.length == 0) {
                        caption = $(document.createElement("caption"));
                        this.element.prepend(caption);
                    }

                    caption.text(value);
                }
            }),

            clear: function () {
                this.element.find("tr").remove();
                return this;
            }
        }
    });

    function getSection(W, section) {
        //Ensure the "section" exists (thead, tbody or tfoot)
        var sectionElement = W.element.children(section);
        if (sectionElement.length == 0) {
            sectionElement = $(document.createElement(section));
            W.element.append(sectionElement);
        }

        return sectionElement;
    }

    function writeRow(W, section) {
        var sectionElement = getSection(W, section);

        //Add a new row
        var tr = $(document.createElement("tr"));
        sectionElement.append(tr);

        //Wrap the row in a row object
        return new RowObject(W, tr);
    }

    function RowObject(W, tr) {
        this.table = W;
        this.element = tr;
    }

    RowObject.prototype.writeHeaderCell = function (text) {
        return jpvs.writeTag(this.element, "th", text);
    };

    RowObject.prototype.writeCell = function (text) {
        return jpvs.writeTag(this.element, "td", text);
    };

    RowObject.prototype.getMainContentElement = function () {
        return this.element;
    };
})();

/* JPVS
Module: widgets
Classes: TextBox
Depends: core
*/

jpvs.TextBox = function (selector) {
    this.attach(selector);

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.TextBox,
    type: "TextBox",
    cssClass: "TextBox",

    create: function (container) {
        var obj = document.createElement("input");
        $(obj).attr("type", "text");
        $(container).append(obj);
        return obj;
    },

    init: function (W) {
        this.element.change(function () {
            return W.change.fire(W);
        });
    },

    canAttachTo: function (obj) {
        return $(obj).is("input[type=\"text\"],input[type=\"password\"]");
    },

    prototype: {
        text: jpvs.property({
            get: function () { return this.element.val(); },
            set: function (value) { this.element.val(value); }
        }),

        width: jpvs.property({
            get: function () { return this.element.css("width"); },
            set: function (value) { this.element.css("width", value); }
        })
    }
});



/* JPVS
Module: widgets
Classes: TileBrowser
Depends: core
*/

(function () {

    jpvs.TileBrowser = function (selector) {
        this.attach(selector);
    };

    jpvs.makeWidget({
        widget: jpvs.TileBrowser,
        type: "TileBrowser",
        cssClass: "TileBrowser",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            //Clear the drawing area
            W.element.empty();

            W.element.css({
                overflow: "hidden"
            });

            //Also create buttons for scrolling/zooming
            var buttonContainer = jpvs.writeTag(W, "div").addClass("Buttons").css({
                overflow: "hidden",
                position: "absolute",
                right: "0px",
                top: "0px",
                bottom: "0px",
                width: "3em",
                zIndex: 99999
            });

            jpvs.writeTag(buttonContainer, "img").addClass("Up").click(onClick(W, "up")).attr("src", jpvs.Resources.images.up).css({
                position: "absolute",
                right: "0px",
                top: "0px",
                width: "100%"
            });

            jpvs.writeTag(buttonContainer, "img").addClass("Down").click(onClick(W, "down")).attr("src", jpvs.Resources.images.down).css({
                position: "absolute",
                right: "0px",
                bottom: "0px",
                width: "100%"
            });

            jpvs.writeTag(buttonContainer, "img").addClass("Plus").click(onClick(W, "plus")).attr("src", jpvs.Resources.images.plus).css({
                position: "absolute",
                right: "0px",
                bottom: "50%",
                width: "100%"
            });

            jpvs.writeTag(buttonContainer, "img").addClass("Minus").click(onClick(W, "minus")).attr("src", jpvs.Resources.images.minus).css({
                position: "absolute",
                right: "0px",
                top: "50%",
                width: "100%"
            });

            W.element.on("wheel", onWheel(W));
            jpvs.addGestureListener(W.element, null, onGesture(W));
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            refresh: function (flagAnimate) {
                render(this);

                if (flagAnimate)
                    ensureAnimation(this);

                return this;
            },

            startingTile: jpvs.property({
                get: function () {
                    return this.element.data("startingTile");
                },
                set: function (value) {
                    this.element.data("startingTile", value);
                }
            }),

            width: jpvs.property({
                get: function () {
                    return this.element.width();
                },
                set: function (value) {
                    this.element.width(value);
                }
            }),

            height: jpvs.property({
                get: function () {
                    return this.element.height();
                },
                set: function (value) {
                    this.element.height(value);
                }
            }),

            tileWidth: jpvs.property({
                get: function () {
                    var x = this.element.data("tileWidth");
                    return x != null ? x : this.width() / 8;
                },
                set: function (value) {
                    this.element.data("tileWidth", value);
                }
            }),

            tileHeight: jpvs.property({
                get: function () {
                    var x = this.element.data("tileHeight");
                    return x != null ? x : this.tileWidth();
                },
                set: function (value) {
                    this.element.data("tileHeight", value);
                }
            }),

            desiredTileWidth: jpvs.property({
                get: function () {
                    var x = this.element.data("desiredTileWidth");
                    return x != null ? x : this.tileWidth();
                },
                set: function (value) {
                    this.element.data("desiredTileWidth", value);
                }
            }),

            desiredTileHeight: jpvs.property({
                get: function () {
                    var x = this.element.data("desiredTileHeight");
                    return x != null ? x : this.tileHeight();
                },
                set: function (value) {
                    this.element.data("desiredTileHeight", value);
                }
            }),

            tileSpacingHorz: jpvs.property({
                get: function () {
                    var x = this.element.data("tileSpacingHorz");
                    return x != null ? x : this.tileWidth() / 5;
                },
                set: function (value) {
                    this.element.data("tileSpacingHorz", value);
                }
            }),

            tileSpacingVert: jpvs.property({
                get: function () {
                    var x = this.element.data("tileSpacingVert");
                    return x != null ? x : this.tileHeight() / 5;
                },
                set: function (value) {
                    this.element.data("tileSpacingVert", value);
                }
            }),

            originX: jpvs.property({
                get: function () {
                    var x = this.element.data("originX");
                    return x != null ? x : this.width() / 2;
                },
                set: function (value) {
                    this.element.data("originX", value);
                }
            }),

            originY: jpvs.property({
                get: function () {
                    var x = this.element.data("originY");
                    return x != null ? x : this.height() / 2;
                },
                set: function (value) {
                    this.element.data("originY", value);
                }
            }),

            desiredOriginX: jpvs.property({
                get: function () {
                    var x = this.element.data("desiredOriginX");
                    return x != null ? x : this.originX();
                },
                set: function (value) {
                    this.element.data("desiredOriginX", value);
                }
            }),

            desiredOriginY: jpvs.property({
                get: function () {
                    var x = this.element.data("desiredOriginY");
                    return x != null ? x : this.originY();
                },
                set: function (value) {
                    this.element.data("desiredOriginY", value);
                }
            })

        }
    });


    function render(W) {
        //Starting tile; if null, then the tile browser has no tiles and no rendering is needed
        var tile0 = W.startingTile();
        if (!tile0) {
            W.element.children(".Tile").remove();
            return;
        }

        //Get shortcuts
        var w = W.width();
        var h = W.height();
        var tw = W.tileWidth();
        var th = W.tileHeight();
        var sx = W.tileSpacingHorz();
        var sy = W.tileSpacingVert();
        var dx = tw + sx;
        var dy = th + sy;

        var x0 = W.originX();
        var y0 = W.originY();

        //Let's determine the allowed x coordinates
        //We don't want tiles to be cut out by the right/left borders. We lay out tiles at fixed x coordinates
        //The tile browser is free to scroll vertically, however
        //Coordinates (x0, y0) are the coordinates of the tile center
        var x = x0 - tw / 2;
        while (x > 0)
            x -= dx;
        x += dx;

        var allowedXs = [];
        while (x + tw < w) {
            allowedXs.push(x);
            x += dx;
        }

        //Lay tiles over the surface
        var ix = 0;
        x = x0 - tw / 2;

        //Get the allowedX closest to x0
        var minDist = +Infinity;
        for (var j = 0; j < allowedXs.length && Math.abs(allowedXs[j] - x) < minDist; j++)
            minDist = Math.abs(allowedXs[j] - x);
        ix = j - 1;
        ix = Math.max(ix, 0);
        ix = Math.min(ix, allowedXs.length - 1);

        //At every rendering we assign a generation number, useful for cleaning up invisible tiles at the end
        var currentGeneration = 1 + (W.lastRenderedGeneration || 0);
        W.lastRenderedGeneration = currentGeneration;

        //Forward
        var y = y0 - th / 2;
        var tileIndex = 0;
        var ix2 = ix;
        var tileObject = tile0;
        while (tileObject) {
            //Ensure the tile is not clipped out by the right border
            if (ix2 >= allowedXs.length) {
                //Return to left
                ix2 = 0;
                y += dy;

                //We allow tiles to be clipped out by the bottom border, however
                //So, we stop when the tile is completely outside
                if (y >= h)
                    break;
            }

            //Draw the tile
            x = allowedXs[ix2];
            drawTile(W, x, y, tw, th, w, h, tileObject, tileIndex, currentGeneration);

            //Increment coordinates
            ix2++;
            tileIndex++;

            //Move to next tile object, if any
            tileObject = tileObject.getNextTile && tileObject.getNextTile();
        }

        //Backwards
        ix2 = ix - 1;
        y = y0 - th / 2;
        tileObject = tile0.getPreviousTile && tile0.getPreviousTile();
        tileIndex = -1;
        while (tileObject) {
            //Ensure the tile is not clipped out by the left border
            if (ix2 < 0) {
                //Return to right
                ix2 = allowedXs.length - 1;
                y -= dy;

                //We allow tiles to be clipped out by the top border, however
                //So, we stop when the tile is completely outside
                if (y + th <= 0)
                    break;
            }

            //Draw the tile
            x = allowedXs[ix2];
            drawTile(W, x, y, tw, th, w, h, tileObject, tileIndex, currentGeneration);

            //Decrement coordinates
            ix2--;
            tileIndex--;

            //Move to next tile object, if any
            tileObject = tileObject.getPreviousTile && tileObject.getPreviousTile();
        }

        //Now we must delete tiles that were visible during the last layout but that were not laid out during this one
        //We just delete tiles that do not belong to the current generation
        W.element.children(".Tile").each(function () {
            var $this = $(this);
            var tileObject = $this.data("tileObject");
            var jpvsTileBrowserInfo = tileObject && tileObject.jpvsTileBrowserInfo;
            if (!jpvsTileBrowserInfo || jpvsTileBrowserInfo.generation != currentGeneration) {
                $this.remove();
                tileObject.jpvsTileBrowserInfo = null;
            }
        });
    }

    function isTileVisible(x, y, tw, th, w, h) {
        var x2 = x + tw;
        var y2 = y + th;

        //If at least one of the four corners is visible, then the tile is visible
        function tlVisible() { return 0 <= x && x <= w && 0 <= y && y <= h; }
        function trVisible() { return 0 <= x2 && x2 <= w && 0 <= y && y <= h; }
        function blVisible() { return 0 <= x && x <= w && 0 <= y2 && y2 <= h; }
        function brVisible() { return 0 <= x2 && x2 <= w && 0 <= y2 && y2 <= h; }

        return tlVisible() || trVisible() || blVisible() || brVisible();
    }

    function drawTile(W, x, y, tw, th, w, h, tileObject, tileIndex, currentGeneration) {
        if (!tileObject)
            return;

        //If the tile already exists, then simply adjust its coordinates: it's way faster
        var info = tileObject.jpvsTileBrowserInfo;
        if (info) {
            if (isTileVisible(x, y, tw, th, w, h)) {
                var mustRedrawContent = false;

                //OK, let's show it
                if (info.x != x) {
                    info.x = x;
                    info.tile.css("left", x + "px");
                }

                if (info.y != y) {
                    info.y = y;
                    info.tile.css("top", y + "px");
                }

                if (info.tw != tw) {
                    info.tw = tw;
                    info.tile.css("width", tw + "px");

                    //It's not a simple translation, we must also redraw the content
                    mustRedrawContent = true;
                }

                if (info.th != th) {
                    info.th = th;
                    info.tile.css("height", th + "px");

                    //It's not a simple translation, we must also redraw the content
                    mustRedrawContent = true;
                }

                //Let's also redraw if the size has changed
                if (mustRedrawContent)
                    redrawTileContent(info.tile);

                //Also update the generation number
                info.generation = currentGeneration;
            }
            else {
                //The new position is not visible, let's remove the DOM object
                info.tile.remove();
                tileObject.jpvsTileBrowserInfo = null;
            }

            return;
        }

        //Otherwise, we must create the tile
        if (!isTileVisible(x, y, tw, th, w, h))
            return;

        var tile = jpvs.writeTag(W, "div");

        tile.data("tileObject", tileObject);
        tileObject.jpvsTileBrowserInfo = {
            tile: tile,
            x: x,
            y: y,
            tw: tw,
            th: th,
            tileIndex: tileIndex,
            generation: currentGeneration
        };

        tile.addClass("Tile").css({
            position: "absolute",
            left: x + "px",
            top: y + "px",
            width: tw + "px",
            height: th + "px",
            overflow: "hidden"
        });

        redrawTileContent(tile);
        return tile;

        function redrawTileContent(tile) {
            if (tileObject.template)
                jpvs.applyTemplate(tile.empty(), tileObject.template, { tileObject: tileObject, tileBrowser: W, tile: tile });
        }
    }

    function onClick(W, command) {
        var zoomFactor = 1.1;

        return function () {
            if (command == "up")
                W.desiredOriginY(W.desiredOriginY() + W.height() / 4);
            else if (command == "down")
                W.desiredOriginY(W.desiredOriginY() - W.height() / 4);
            else if (command == "plus")
                zoom(W, zoomFactor);
            else if (command == "minus")
                zoom(W, 1 / zoomFactor);

            //Refresh with an animation
            W.refresh(true);
        };
    }

    function zoom(W, zoomFactor) {
        var tw = W.desiredTileWidth() * zoomFactor;
        var th = W.desiredTileHeight() * zoomFactor;

        W.desiredTileWidth(tw);
        W.desiredTileHeight(th);

        //Determine the closest-to-center tile
        var w = W.width();
        var h = W.height();
        var xc = w / 2;
        var yc = h / 2;
        var minDist = +Infinity;
        var closestTile;
        var closestTileX, closestTileY;

        W.element.children(".Tile").each(function () {
            var $this = $(this);
            var tileObject = $this.data("tileObject");
            var jpvsTileBrowserInfo = tileObject && tileObject.jpvsTileBrowserInfo;
            if (jpvsTileBrowserInfo) {
                //Tile center
                var tx = jpvsTileBrowserInfo.x + jpvsTileBrowserInfo.tw / 2;
                var ty = jpvsTileBrowserInfo.y + jpvsTileBrowserInfo.th / 2;

                var tileToCenter = (xc - tx) * (xc - tx) + (yc - ty) * (yc - ty);
                if (tileToCenter < minDist) {
                    minDist = tileToCenter;
                    closestTile = tileObject;
                    closestTileX = tx;
                    closestTileY = ty;
                }
            }
        });

        //Change the starting tile to that tile and move originX and originY to the center of that tile, so that this zooming animation
        //is centered on that tile (when we zoom, we want the center tile to stand still)
        //We set both the origin and the desired origin, so that we stop any running scrolling animation 
        //(it could interfere with the zooming animation and the change in starting tile and origin)
        if (closestTile) {
            W.originX(closestTileX);
            W.desiredOriginX(closestTileX);
            W.originY(closestTileY);
            W.desiredOriginY(closestTileY);
            W.startingTile(closestTile);
        }
    }

    function onWheel(W) {
        return function (e) {
            var deltaY = e && e.originalEvent && e.originalEvent.deltaY || e.originalEvent.deltaX || 0;
            var oldOriginY = W.desiredOriginY();

            if (e.shiftKey) {
                //Zoom
                var zoomFactor = deltaY < 0 ? 1.1 : (1 / 1.1);
                zoom(W, zoomFactor);
            }
            else {
                //Move
                W.desiredOriginY(oldOriginY - deltaY);
            }

            //Refresh with an animation
            W.refresh(true);

            //Stop event propagation
            return false;
        };
    }

    function onGesture(W) {
        return function (e) {
            if (e.isDrag) {
                //Drag the touched tile to the touch coordinates
                //Find the touched tileObject (it might be the touch.target or a parent, depending on where the touch happened)
                var tile = $(e.target).closest(".Tile");
                var tileObject = tile && tile.length && tile.data("tileObject");
                var info = tileObject && tileObject.jpvsTileBrowserInfo;
                if (info) {
                    //Ensure the starting tile is the touched one (change also the origin, so we move nothing)
                    if (tileObject !== W.startingTile()) {
                        W.originX(info.x + info.tw / 2);
                        W.originY(info.y + info.th / 2);
                        W.startingTile(tileObject);
                    }

                    //Then have the desired origin follow dragX/dragY, so the touched tile follows the touch
                    //We want no animation because the moving finger is already an animation, so we set the origin equal to the desired origin
                    var orX = W.originX() + e.dragX;
                    var orY = W.originY() + e.dragY;
                    W.originX(orX);
                    W.originY(orY);
                    W.desiredOriginX(orX);
                    W.desiredOriginY(orY);

                    //No animation
                    W.refresh(false);
                }
            }
            else if (e.isZoom) {
                //Zoom as specified
                zoom(W, e.zoomFactor);
                W.tileWidth(W.desiredTileWidth());
                W.tileHeight(W.desiredTileHeight());

                //No animation
                W.refresh(false);
            }
            else if (e.isTap) {
                //If the user taps a button in the .Buttons div, then let's forward a click to it
                var clickedElem = $(e.target);
                if (clickedElem.is(".Buttons > *")) {
                    clickedElem.click();

                    //If long tap, then we simulate a long click by clicking multiple times
                    if (e.isLongTap) {
                        clickedElem.click();
                        clickedElem.click();
                        clickedElem.click();
                    }
                }
                else {
                    //Find the touched tileObject (it might be the touch.target or a parent, depending on where the touch happened)
                    var tile = $(e.target).closest(".Tile");
                    if (tile.length) {
                        //Tapped a tile. Let's forward a click to it
                        tile.click();
                    }
                }
            }
        };
    }

    function ensureAnimation(W) {
        //See if we must animate
        var deltas = getPixelDeltas();
        if (mustAnimate(deltas)) {
            //Yes, we have a mismatch greater than 1 pixel in origin/tile size, so we must animate
            //Let's determine the final values for our animation
            //If ensureAnimation is called during a running animation, the animation end time is simply moved away. The animation will end a fixed time
            //away from now
            var animationDuration = 500;
            var tNow = new Date().getTime();
            var tEnd = tNow + animationDuration;
            W.animationInfo = {
                x: { tEnd: tEnd, finalValue: W.desiredOriginX(), k: calcAnimationK(tNow, tEnd, W.originX(), W.desiredOriginX()) },
                y: { tEnd: tEnd, finalValue: W.desiredOriginY(), k: calcAnimationK(tNow, tEnd, W.originY(), W.desiredOriginY()) },
                tw: { tEnd: tEnd, finalValue: W.desiredTileWidth(), k: calcAnimationK(tNow, tEnd, W.tileWidth(), W.desiredTileWidth()) },
                th: { tEnd: tEnd, finalValue: W.desiredTileHeight(), k: calcAnimationK(tNow, tEnd, W.tileHeight(), W.desiredTileHeight()) }
            };

            //Now, let's schedule the animation. If already running, then, there's no need to do that
            if (!W.animating)
                jpvs.requestAnimationFrame(animate);
        }

        function mustAnimate(deltas) {
            return (Math.abs(deltas.originX) >= 1 || Math.abs(deltas.originY) >= 1 || Math.abs(deltas.tileWidth) >= 1 || Math.abs(deltas.tileHeight) >= 1);
        }

        function getPixelDeltas() {
            return {
                originX: W.desiredOriginX() - W.originX(),
                originY: W.desiredOriginY() - W.originY(),
                tileWidth: W.desiredTileWidth() - W.tileWidth(),
                tileHeight: W.desiredTileHeight() - W.tileHeight()
            };
        }

        function calcAnimationK(tNow, tEnd, currentValue, finalValue) {
            //Parabolic animation
            var delta = currentValue - finalValue;
            var dt = tEnd - tNow;
            var k = delta / dt / dt;
            return k;
        }

        function calcNewAnimatedValue(tNow, tEnd, k, finalValue) {
            if (tNow >= tEnd) {
                //We are past the end of the animation
                return finalValue;
            }
            else {
                //We are still animating
                var dt = tEnd - tNow;
                var currentDelta = k * dt * dt;
                var currentValue = finalValue + currentDelta;
                return currentValue;
            }
        }

        function animate() {
            //If end of animation, then no more work to do
            if (!W.animationInfo) {
                W.animating = false;
                return;
            }

            W.animating = true;

            //Let's apply the new values
            var tNow = new Date().getTime();
            W.originX(calcNewAnimatedValue(tNow, W.animationInfo.x.tEnd, W.animationInfo.x.k, W.animationInfo.x.finalValue));
            W.originY(calcNewAnimatedValue(tNow, W.animationInfo.y.tEnd, W.animationInfo.y.k, W.animationInfo.y.finalValue));
            W.tileWidth(calcNewAnimatedValue(tNow, W.animationInfo.tw.tEnd, W.animationInfo.tw.k, W.animationInfo.tw.finalValue));
            W.tileHeight(calcNewAnimatedValue(tNow, W.animationInfo.th.tEnd, W.animationInfo.th.k, W.animationInfo.th.finalValue));

            //Render the frame
            render(W);

            //See if the animation is done
            if (tNow > W.animationInfo.x.tEnd && tNow > W.animationInfo.y.tEnd && tNow > W.animationInfo.tw.tEnd && tNow > W.animationInfo.th.tEnd)
                W.animationInfo = null;

            //Schedule next animation frame (if done, the animation will stop)
            jpvs.requestAnimationFrame(animate);
        }
    }

})();

/* JPVS
Module: widgets
Classes: Tree
Depends: core
*/

(function () {

    jpvs.Tree = function (selector) {
        this.attach(selector);

        this.nodeClick = jpvs.event(this);
        this.nodeRightClick = jpvs.event(this);
        this.nodeRendered = jpvs.event(this);
    };


    jpvs.Tree.Templates = {
        StandardNode: function (node) {
            //Main node element
            var element = jpvs.writeTag(this, "div");
            element.addClass("Node");

            //NodeElement object, carrying all the information
            var nodeElement = new jpvs.Tree.NodeElement(node, element, refreshNodeState, selectNode);

            //Image button with the state (open/closed/not-openable)
            jpvs.ImageButton.create(element).click(function () {
                //Toggle on click
                nodeElement.toggle();
            });

            //Optional node marker
            if (node.marker) {
                var imgMarker = jpvs.writeTag(element, "img")
                imgMarker.addClass("Marker");
                imgMarker.attr("src", node.marker);
            }

            //Optional node icon
            if (node.icon) {
                var imgIcon = jpvs.writeTag(element, "img")
                imgIcon.addClass("Icon");
                imgIcon.attr("src", node.icon);
            }

            //Node text
            var txt = jpvs.writeTag(element, "span").addClass("Text");
            jpvs.write(txt, node.toString());

            //Events
            var mouseDownTime;
            var tree = nodeElement.getTree();
            txt.dblclick(function () {
                //Toggle on double click
                nodeElement.toggle();
            }).mousedown(function (e) {
                //Let's save the current time, so we can decide in "mouseup" when the sequence mousedown/up can
                //be considered a real click. We do this so we make drag & drop possible without triggering nodeClick and
                //nodeRightClick. We want our nodeClick and nodeRightClick events to be triggered only when a "real" click occurred.
                //A "real" click is a mousedown/up sequence shorter than 0.5 secs. If it's longer, then the user is probably not
                //clicking but dragging.
                mouseDownTime = new Date().getTime();
            }).mouseup(function (e) {
                //Let's determine if this is a "real" click
                var mouseUpTime = new Date().getTime();
                if (mouseUpTime > mouseDownTime + 500) {
                    //Not a "real" click
                    return;
                }

                //If it's a real click...
                if (e.button == 2) {
                    //...select and fire event on right-click
                    nodeElement.select();
                    tree.nodeRightClick.fire(tree, null, nodeElement, e);

                    //Prevent standard browser context-menu
                    return false;
                }
                else {
                    //...select and fire event on click
                    nodeElement.select();
                    tree.nodeClick.fire(tree, null, nodeElement, e);
                }
            });

            return nodeElement;

            //Function for refreshing the node's state (open/close image button)
            //This function will run with this set to the current NodeElement
            function refreshNodeState() {
                var imageButton = jpvs.find(this.element.find(".ImageButton"));

                if (this.childrenNodeElements && this.childrenNodeElements.length != 0) {
                    //Has children
                    if (this.isExpanded()) {
                        if (imageButton) {
                            imageButton.imageUrls({
                                normal: jpvs.Resources.images.nodeOpen
                            });
                        }
                    }
                    else {
                        if (imageButton) {
                            imageButton.imageUrls({
                                normal: jpvs.Resources.images.nodeClosed
                            });
                        }
                    }
                }
                else {
                    //Has no children
                    if (imageButton) {
                        imageButton.imageUrls({
                            normal: jpvs.Resources.images.nodeNoChildren
                        });
                    }

                    //Force invisibility anyway
                    this.childrenContainerElement.element.hide();
                }
            }

            //Function for selecting a node
            //This function will run with this set to the current NodeElement
            function selectNode() {
                var tree = this.getTree();

                //Unselect all
                tree.element.find(".Node > .Text").removeClass("Selected");

                //Select this
                this.element.find(".Text").addClass("Selected");
            }
        },

        StandardChildrenContainer: function (node) {
            var element = jpvs.writeTag(this, "div");
            element.addClass("ChildrenContainer");
            element.hide();

            var childrenContainerElement = new jpvs.Tree.ChildrenContainerElement(node, element);
            return childrenContainerElement;
        }
    };


    jpvs.Tree.NodeElement = function (node, element, refreshStateFunc, selectNodeFunc) {
        this.node = node;
        this.element = element;
        this.refreshState = refreshStateFunc;
        this.select = selectNodeFunc;

        this.parentNodeElement = null;              //Attached during rendering
        this.childrenContainerElement = null;       //Attached during rendering
        this.childrenNodeElements = null;           //Attached during rendering
    };

    jpvs.Tree.NodeElement.prototype.getTree = function () {
        //Find the tree
        return jpvs.find(this.element.parents(".Tree").first());
    };

    jpvs.Tree.NodeElement.prototype.isExpanded = function () {
        return this.childrenContainerElement.element.is(":visible");
    };

    jpvs.Tree.NodeElement.prototype.toggle = function () {
        if (this.isExpanded())
            this.collapse();
        else
            this.expand();
    };

    jpvs.Tree.NodeElement.prototype.collapse = function () {
        var nodeElem = this;
        this.childrenContainerElement.element.hide(100, function () { nodeElem.refreshState(); });
    };

    jpvs.Tree.NodeElement.prototype.expand = function (callback) {
        var nodeElem = this;
        var tree = this.getTree();

        //Let's load/reload/refresh children
        if (tree) {
            tree.refreshChildren(nodeElem, function () {
                if (nodeElem.childrenNodeElements && nodeElem.childrenNodeElements.length != 0) {
                    //Expand only if we have children
                    nodeElem.childrenContainerElement.element.show(100, function () {
                        nodeElem.refreshState();
                        if (callback)
                            callback();
                    });
                }
                else {
                    //Otherwise let's just refresh the state
                    nodeElem.refreshState();
                    if (callback)
                        callback();
                }
            });
        }
    };

    jpvs.Tree.NodeElement.prototype.setMarkerIcon = function (imgUrl) {
        var img = this.element.find("img.Marker");
        img.attr("src", imgUrl);
    };


    jpvs.Tree.ChildrenContainerElement = function (node, element) {
        this.node = node;
        this.element = element;
        this.nodeElement = null;                    //Attached during rendering
    };


    jpvs.makeWidget({
        widget: jpvs.Tree,
        type: "Tree",
        cssClass: "Tree",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            nodeTemplate: jpvs.property({
                get: function () {
                    return this.element.data("nodeTemplate");
                },
                set: function (value) {
                    this.element.data("nodeTemplate", value);
                }
            }),

            childrenContainerTemplate: jpvs.property({
                get: function () {
                    return this.element.data("childrenContainerTemplate");
                },
                set: function (value) {
                    this.element.data("childrenContainerTemplate", value);
                }
            }),

            childrenSelector: jpvs.property({
                get: function () {
                    return this.element.data("childrenSelector");
                },
                set: function (value) {
                    this.element.data("childrenSelector", value);
                }
            }),

            dataBind: function (data) {
                dataBind(this, data);
                return this;
            },

            refreshChildren: function (nodeElement, callback) {
                refreshChildren(this, nodeElement, callback);
                return this;
            },

            nodeElements: function () {
                return this.element.data("nodeElements");
            }
        }
    });


    function dataBind(W, data) {
        //Empty the object
        W.element.empty();

        //Then iterate over the data and populate the tree according to the templates that have been set
        var nodeElements = [];
        $.each(data, function (i, node) {
            var nodeElement = renderNode(W, W.element, node, null);
            nodeElements.push(nodeElement);
        });

        //Store nodeElements for later
        W.element.data("nodeElements", nodeElements);
    }

    function readChildren(W, node, callback) {
        //Let's use the default children selector, if none specified
        var childrenSelector = W.childrenSelector() || function (node) { return node.children || []; };

        //Let's call the selector, which might be either synchronous or asynchronous
        var ret = childrenSelector(node, internalCallback);

        //Let's see what happened within the selector
        if (ret === undefined) {
            //No return value. The selector is asynchronous and the internalCallback will receive the data
        }
        else if (ret === null) {
            //The selector is synchronous and returned no data
            callback([]);
        }
        else {
            //The selector is synchronous and returned some data
            callback(ret);
        }

        function internalCallback(data) {
            //null means no data, so let's return an empty array in that case
            callback(data || []);
        }
    }

    function renderNode(W, elem, node, parentNodeElement) {
        //Render the node itself
        var nodeTemplate = W.nodeTemplate() || jpvs.Tree.Templates.StandardNode;
        var nodeElement = jpvs.applyTemplate(elem, nodeTemplate, node);

        //Save for later
        nodeElement.element.data("nodeElement", nodeElement);

        //Render the children container
        //And leave it intentionally empty, so we can load it dynamically later
        var childrenContainerTemplate = W.childrenContainerTemplate() || jpvs.Tree.Templates.StandardChildrenContainer;
        var childrenContainerElement = jpvs.applyTemplate(elem, childrenContainerTemplate, node);

        //Attach elements to each other
        nodeElement.parentNodeElement = parentNodeElement;
        nodeElement.childrenContainerElement = childrenContainerElement;
        nodeElement.childrenNodeElements = [{}];      //We will load this dynamically later; let's leave a dummy node

        childrenContainerElement.nodeElement = nodeElement;

        //Refresh the node state so the icons are initially correct based on children/visibility/etc.
        nodeElement.refreshState();

        //Let's notify anyone who could be interested in modifying a newly-rendered node
        //It's a good chance to enable drag & drop on nodes, if necessary
        W.nodeRendered.fire(W, null, nodeElement);

        //Return the nodeElement
        return nodeElement;
    }

    function refreshChildren(W, nodeElement, callback) {
        //Reload children
        readChildren(W, nodeElement.node, function (children) {
            //When we have the children, we must re-populate the children container
            var childrenContainerElement = nodeElement.childrenContainerElement;

            //Let's empty it, without changing its visibility (expanded/collapsed state)
            childrenContainerElement.element.empty();

            //Then let's fill it again with the new data
            fillChildrenContainer(W, childrenContainerElement, children, nodeElement);

            //At the end, call the callback
            if (callback)
                callback();
        });
    }

    function fillChildrenContainer(W, childrenContainerElement, children, parentNodeElement) {
        var childrenNodeElements = [];
        $.each(children, function (i, childNode) {
            var childrenNodeElement = renderNode(W, childrenContainerElement.element, childNode, parentNodeElement);
            childrenNodeElements.push(childrenNodeElement);
        });

        //Attach the new list of children node elements
        parentNodeElement.childrenNodeElements = childrenNodeElements;
    }

})();

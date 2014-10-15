window.jpvs = window.jpvs || {};

/*
Can be called as: jpvs.animate(animationFunction) 
or as jpvs.animate(params, animationFunction)
*/
jpvs.animate = function (params, animationFunction) {
    /// <summary>Enqueues an animation.</summary>
    /// <param name="params" type="Object">Optional object with parameters: { t0: start time (default: 0), t1: end time (default: 1), step: time step for a discrete animation or zero for a continuous animation (default: 0), duration: duration in milliseconds of the animation (default: 1000), easingFunction: easing function (default: jpvs.animate.harmonicEasing) }.</param>
    /// <param name="animationFunction" type="Function">Animation function: function(t) {}. The "t" argument is the current time and is always between t0 and t1. This function defines the animation.</param>
};

jpvs.animate.harmonicEasing = function () { };
jpvs.animate.linearEasing = function () { };


jpvs.flashClass = function (element, cssClass, duration, count, leaveOnTime) {
    /// <summary>Flashes a CSS class on a DOM element. It can be used for attracting the user's attention after changing some content.</summary>
    /// <param name="element" type="Object">The DOM element or jQuery object to which the CSS class must be applied.</param>
    /// <param name="cssClass" type="String">CSS class name to apply/remove in a flashing manner (on and off several times).</param>
    /// <param name="duration" type="Number">Optional: duration of the flashing animation in milliseconds.</param>
    /// <param name="count" type="Number">Optional: number of flashes desired.</param>
    /// <param name="leaveOnTime" type="Number">Optional: Time (in ms). After the end of the animation, after this time, the CSS class is removed.</param>
};

jpvs.requestAnimationFrame = function (callback, element) {
    /// <summary>Shim layer for the requestAnimationFrame function.</summary>
};

window.jpvs = window.jpvs || {};



jpvs.runTask = function (flagAsync, task, onSuccess, onProgress, onError) {
    /// <summary>Runs a task function synchronously or asynchronously. Utility function that simply acts as a proxy to
    /// either jpvs.runBackgroundTask or jpvs.runForegroundTask.</summary>
    /// <param name="flagAsync" type="Boolean">Set to true for launching the task via jpvs.runBackgroundTask; set to false for 
    /// launching the task via jpvs.runForegroundTask.</param>
    /// <param name="task" type="Function">Must have this signature: function task(ctx) {}. It will be called multiple times. 
    /// On each call, it should execute a very small part of the job in order to yield control as soon as possible. 
    /// The ctx parameter can be freely used for storing execution state or any other data useful to the task itself. 
    /// At the end, the task function may set some value into ctx.returnValue and this value will be passed on to the
    /// onSuccess callback. The task function can return three types of values:
    /// null/undefined/false means the task is complete. In this case, the task function will never get called again. 
    /// If it returns true, it means the task is not complete. In this case, the task function will be called again with default
    /// settings of CPU usage and uninterrupted run time duration. 
    /// Otherwise, it can return an object like this (all is optional): 
    /// { cpu: a number between 0 and 1, minRunTimeMs: minimum number of milliseconds of uninterrupted run time before yielding 
    /// control back to the caller, progress: any object }. In this case, the task function will be called again. The "cpu" parameter 
    /// indicates the average desired CPU usage. For example, a value of 0.1 means the task must occupy 10% of the CPU. 
    /// A value of 30 for the "minRunTimeMs" parameter specifies that, for at least 30 ms, the task function must run without 
    /// interruptions (without yielding control). The "progress" parameter, if any, can be a string/number/object useful for 
    /// signaling progress to the onProgress callback.</param>
    /// <param name="onSuccess" type="Function">Optional callback function that will be called upon successful completion.
    /// Signature: function onSuccess(ret) {}, where "ret" is the final task return value, taken from ctx.returnValue.</param>
    /// <param name="onProgress" type="Function">Optional callback function that will receive progress information.
    /// Signature: function onProgress(progress) {}, where "progress" is the progress parameter optionally returned into the "task"
    /// return value along with "cpu" and "minRunTimeMs". This callback will be called only for non-null progress values.</param>
    /// <param name="onError" type="Function">Optional callback function that will receive exceptions in case of abnormal
    /// termination. Signature: function onError(e) {}, where "e" is the exception/error object thrown by the task function and
    /// can be an object of any type.</param>
};

jpvs.runBackgroundTask = function (task, onSuccess, onProgress, onError) {
    /// <summary>Runs a task function asynchronously. Calls the task function multiple times and with a desired level
    /// of CPU usage until the task function signals that the task is complete.</summary>
    /// <param name="task" type="Function">Must have this signature: function task(ctx) {}. It will be called multiple times. 
    /// On each call, it should execute a very small part of the job in order to yield control as soon as possible. 
    /// The ctx parameter can be freely used for storing execution state or any other data useful to the task itself. 
    /// At the end, the task function may set some value into ctx.returnValue and this value will be passed on to the
    /// onSuccess callback. The task function can return three types of values:
    /// null/undefined/false means the task is complete. In this case, the task function will never get called again. 
    /// If it returns true, it means the task is not complete. In this case, the task function will be called again with default
    /// settings of CPU usage and uninterrupted run time duration. 
    /// Otherwise, it can return an object like this (all is optional): 
    /// { cpu: a number between 0 and 1, minRunTimeMs: minimum number of milliseconds of uninterrupted run time before yielding 
    /// control back to the caller, progress: any object }. In this case, the task function will be called again. The "cpu" parameter 
    /// indicates the average desired CPU usage. For example, a value of 0.1 means the task must occupy 10% of the CPU. 
    /// A value of 30 for the "minRunTimeMs" parameter specifies that, for at least 30 ms, the task function must run without 
    /// interruptions (without yielding control). The "progress" parameter, if any, can be a string/number/object useful for 
    /// signaling progress to the onProgress callback.</param>
    /// <param name="onSuccess" type="Function">Optional callback function that will be called upon successful completion.
    /// Signature: function onSuccess(ret) {}, where "ret" is the final task return value, taken from ctx.returnValue.</param>
    /// <param name="onProgress" type="Function">Optional callback function that will receive progress information.
    /// Signature: function onProgress(progress) {}, where "progress" is the progress parameter optionally returned into the "task"
    /// return value along with "cpu" and "minRunTimeMs". This callback will be called only for non-null progress values.</param>
    /// <param name="onError" type="Function">Optional callback function that will receive exceptions in case of abnormal
    /// termination. Signature: function onError(e) {}, where "e" is the exception/error object thrown by the task function and
    /// can be an object of any type.</param>
};

jpvs.runForegroundTask = function (task, onSuccess, onProgress, onError) {
    /// <summary>Runs a task function synchronously. This function is primarily meant to allow executing a task function in
    /// foreground. In case a job is written as a task function but the task has to be run as an ordinary function call,
    /// this function is the way to go.</summary>
    /// <param name="task" type="Function">Must have this signature: function task(ctx) {}. It will be called multiple times. 
    /// On each call, it should execute a very small part of the job in order to yield control as soon as possible. 
    /// The ctx parameter can be freely used for storing execution state or any other data useful to the task itself. 
    /// At the end, the task function may set some value into ctx.returnValue and this value will be passed on to the
    /// onSuccess callback. The task function can return three types of values:
    /// null/undefined/false means the task is complete. In this case, the task function will never get called again. 
    /// If it returns true, it means the task is not complete. In this case, the task function will be called again with default
    /// settings of CPU usage and uninterrupted run time duration. 
    /// Otherwise, it can return an object like this (all is optional): 
    /// { cpu: a number between 0 and 1, minRunTimeMs: minimum number of milliseconds of uninterrupted run time before yielding 
    /// control back to the caller, progress: any object }. In this case, the task function will be called again. The "cpu" parameter 
    /// indicates the average desired CPU usage. For example, a value of 0.1 means the task must occupy 10% of the CPU. 
    /// A value of 30 for the "minRunTimeMs" parameter specifies that, for at least 30 ms, the task function must run without 
    /// interruptions (without yielding control). The "progress" parameter, if any, can be a string/number/object useful for 
    /// signaling progress to the onProgress callback.</param>
    /// <param name="onSuccess" type="Function">Optional callback function that will be called upon successful completion.
    /// Signature: function onSuccess(ret) {}, where "ret" is the final task return value, taken from ctx.returnValue.</param>
    /// <param name="onProgress" type="Function">Optional callback function that will receive progress information.
    /// Signature: function onProgress(progress) {}, where "progress" is the progress parameter optionally returned into the "task"
    /// return value along with "cpu" and "minRunTimeMs". This callback will be called only for non-null progress values.</param>
    /// <param name="onError" type="Function">Optional callback function that will receive exceptions in case of abnormal
    /// termination. Signature: function onError(e) {}, where "e" is the exception/error object thrown by the task function and
    /// can be an object of any type.</param>
    /// <returns type="any">The task's return value, taken from the ctx.returnValue. It is the same value passed to the
    /// optional onSuccess callback.</returns>
};

window.jpvs = window.jpvs || {};

jpvs.encodeUtf8Base64 = function (str) {
    /// <summary>Encodes a string as UTF-8 and then encodes the resulting byte array into a base-64 string.</summary>
    /// <param name="str" type="String">The string to encode.</param>
    /// <returns type="String">The encoded string.</returns>
};

jpvs.decodeBase64Utf8 = function (str) {
    /// <summary>Decodes a string from base-64 to a byte array and then interprets the array as UTF-8 and gets the corresponding string. This function decodes a string encoded by the jpvs.encodeUtf8Base64 function.</summary>
    /// <param name="str" type="String">The string to decode.</param>
    /// <returns type="String">The decoded string.</returns>
};

window.jpvs = window.jpvs || {};

jpvs.resetAllBindings = function () {
    /// <summary>Resets all bindings. After calling this function, all bindings set in place by bindContainer or bind are dropped.
    /// In order to reactivate them you have to call bindContainer or bind again.</summary>
};

jpvs.bindContainer = function (container, dataObject, onChangeDetected, dataBindingAttrName) {
    /// <summary>Sets up a two-way binding between all children of a given html container and a data object. 
    /// Databinding directives are expressed in html "data-bind" attributes and are in the form 
    /// "value=val1,className=val2,#text=val3,checked=!val4, ...". This means that attribute "value" is bound to dataObject.val1, 
    /// attribute "className" is bound to dataObject.val2, jQuery function "text" is bound to dataObject.val3, 
    /// "checked" is bound to the negated value of val4. 
    /// More in general, a databinding directive is a comma-separated list of elements in the form: LHS=RHS.
    /// The left-hand side (LHS) can be: 1) the name of a jpvs widget property (e.g.: selectedValue or text); 
    /// 2) the name of an HTML attribute (e.g.: value or className);
    /// 3) a jQuery function expressed as jQuery.xxxx (e.g.: jQuery.text); 
    /// 4) a pseudo-property expressed as #xxxxx (e.g.: #visible) (currently the only available pseudo-property is "visible").
    /// The right-hand side (RHS) can be: 1) the name of a data object member; 2) the name of a data object member prefixed by an
    /// exclamation mark (like !foo): this means the negated value is two-way bound rather than the value itself.</summary>
    /// <param name="container" type="Object">Container whose children have to be two-way bound: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="dataObject" type="Object">Data object whose members/properties have to be two-way bound.</param>
    /// <param name="onChangeDetected" type="Function">Callback that is called whenever one or more values are propagated between the container and the dataObject, in either direction. The signature is: function onChangeDetected(towardsElement, towardsDataObject) {}. The two arguments are boolean flags.</param>
    /// <param name="dataBindingAttrName" type="String">Optional: name of the attribute that will contain databinding directives. The default is "bind", meaning that the "data-bind" attribute will be used. If you pass "xxx", then the "data-xxx" attribute will be used.</param>
};

jpvs.bindElements = function (elements, dataObject, onChangeDetected, dataBindingAttrName) {
    /// <summary>Sets up a two-way binding between all given elements and a data object. 
    /// Databinding directives are expressed in html "data-bind" attributes and are in the form 
    /// "value=val1,className=val2,#text=val3,checked=!val4, ...". This means that attribute "value" is bound to dataObject.val1, 
    /// attribute "className" is bound to dataObject.val2, jQuery function "text" is bound to dataObject.val3, 
    /// "checked" is bound to the negated value of val4. 
    /// More in general, a databinding directive is a comma-separated list of elements in the form: LHS=RHS.
    /// The left-hand side (LHS) can be: 1) the name of a jpvs widget property (e.g.: selectedValue or text); 
    /// 2) the name of an HTML attribute (e.g.: value or className);
    /// 3) a jQuery function expressed as jQuery.xxxx (e.g.: jQuery.text); 
    /// 4) a pseudo-property expressed as #xxxxx (e.g.: #visible) (currently the only available pseudo-property is "visible").
    /// The right-hand side (RHS) can be: 1) the name of a data object member; 2) the name of a data object member prefixed by an
    /// exclamation mark (like !foo): this means the negated value is two-way bound rather than the value itself.</summary>
    /// <param name="elements" type="Array or jQuery object">Elements that have to be two-way bound: array of DOM elements or jQuery object.</param>
    /// <param name="dataObject" type="Object">Data object whose members/properties have to be two-way bound.</param>
    /// <param name="onChangeDetected" type="Function">Callback that is called whenever one or more values are propagated between the elements and the dataObject, in either direction. The signature is: function onChangeDetected(towardsElement, towardsDataObject) {}. The two arguments are boolean flags.</param>
    /// <param name="dataBindingAttrName" type="String">Optional: name of the attribute that will contain databinding directives. The default is "bind", meaning that the "data-bind" attribute will be used. If you pass "xxx", then the "data-xxx" attribute will be used.</param>
};

jpvs.bind = function (element, dataObject, dataBind, onChangeDetected) {
    /// <summary>Sets up a two-way binding between an element and a data object.</summary>
    /// <param name="element" type="Object">Element that has to be two-way bound: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="dataObject" type="Object">Data object whose members/properties have to be two-way bound.</param>
    /// <param name="dataBind" type="String">Value of the "data-bind" attribute to be used. See jpvs.bindContainer for additional information.</param>
    /// <param name="onChangeDetected" type="Function">Callback that is called whenever one or more values are propagated between the container and the dataObject, in either direction. The signature is: function onChangeDetected(towardsElement, towardsDataObject) {}. The two arguments are boolean flags.</param>
};

jpvs.findElementsBoundTo = function (dataObject, objectPropertyName) {
    /// <summary>Finds all elements/widgets bound to the specified property of the specified data object.
    ///  All elements/widgets bound to that property will be returned as an array.</summary>
    /// <param name="dataObject" type="Object">Data object.</param>
    /// <param name="objectPropertyName" type="Object">Name of a data object property.</param>
};



window.jpvs = window.jpvs || {};

jpvs.find = function (selector) {
    /// <summary>Finds jpvs widgets by selector.</summary>
    /// <param name="selector" type="String">jQuery selector or jQuery object.</param>
    /// <returns type="Array">Single jpvs widget or array of widgets</returns>
};

jpvs.states = {
    HOVER: "Hover",
    FOCUS: "Focus",
    ERROR: "Error",
    DISABLED: "Disabled"
};

jpvs.property = function (propdef) {
    /// <summary>Defines a property.</summary>
    /// <param name="propdef" type="Object">Property definition. It is an object that may contain fields "get" and "set" and/or "setTask". The "get" field defines the property getter, which is always synchronous. Its signature is: function get() { read and return the current property value; }. The setter may be specified as a synchronous function or as an asynchronous function (background task). The synchronous version is given by the "set" field, which has the following signature: function set(newValue) { set the property value to newValue; }. The asynchronous version is given by the "setTask" field, which has the following signature: function setTask(newValue) { return a task function that sets the property value to newValue; }. See jpvs.runTask for additional information about task functions. Example of a setTask function: function(newValue) { return function(ctx) { task function body that sets the property value to newValue }; }. A property can be called in three different ways. Getter: "var x = w.property();". Synchronous setter: "w.property(newValue);". Asynchronous setter: "w.property(newValue, true, onSuccess, onProgress, onError);". Or simply: "w.property(newValue, true);".</param>
    /// <returns type="Function">Property function</returns>
};

jpvs.currentLocale = function (loc) {
    /// <summary>Gets/sets the current locale.</summary>
    /// <param name="loc" type="String">Current locale.</param>
    /// <returns type="String">The current locale.</returns>
};

jpvs.event = function (widget) {
    /// <summary>Creates a new event for a widget.</summary>
    /// <param name="widget" type="Widget">Widget to which the new event must be attached.</param>
    /// <returns type="jpvs.Event">The event.</returns>
    return new jpvs.Event(widget);
};

jpvs.makeWidget = function (widgetDef) {
    /// <summary>Creates a new widget, given a widget definition.</summary>
    /// <param name="widgetDef" type="Object">Widget definition.</param>

    //Document all the common methods
    var fn = widgetDef.widget;

    //Static methods
    fn.create = create_static(widgetDef);
    fn.attach = attach_static(widgetDef);

    //Instance methods
    fn.prototype.toString = function () {
        /// <summary>Returns the widget name (e.g.: Button, TextBox, DataGrid...).</summary>
        /// <returns type="String">Widget name.</returns>
        return "";
    };
    fn.prototype.attach = attach(widgetDef);
    fn.prototype.destroy = destroy(widgetDef);
    fn.prototype.focus = focus(widgetDef);
    fn.prototype.addState = addState(widgetDef);
    fn.prototype.removeState = removeState(widgetDef);
    fn.prototype.getMainContentElement = getMainContentElement(widgetDef);

    fn.prototype.id = function (value) {
        /// <summary>Property: id of the widget.</summary>
        /// <param name="value" type="String"></param>
    };

    fn.prototype.ensureId = function () {
        /// <summary>Ensure the widget has an id. If no id is set, a new random id is automatically created for the widget.</summary>
    };

    fn.prototype.currentBrowserEvent = null;

    //Additional prototype methods defined in "widgetDef"
    if (widgetDef.prototype) {
        for (var memberName in widgetDef.prototype) {
            var member = widgetDef.prototype[memberName];
            fn.prototype[memberName] = member;
        }
    }

    function create_static(widgetDef) {
        return function (container) {
            /// <summary>Creates a new widget in the given container. If the container specifies more than one element, multiple widgets are created and an array of widgets is returned. Otherwise, the single widget just created is returned (this is the most common case).</summary>
            /// <param name="container" type="Object">Where to write the widget: jpvs widget or jQuery selector or jQuery object or DOM element. If not specified, the widget is created in the document body.</param>
            return new widgetDef.widget();
        };
    }

    function attach_static(widgetDef) {
        return function (selector) {
            /// <summary>Attaches a widget to an existing element.</summary>
            /// <param name="selector" type="Object">What to attach the widget to: jQuery selector or jQuery object or DOM element.</param>
            return new widgetDef.widget(selector);
        };
    }

    function attach(widgetDef) {
        return function (selector) {
            /// <summary>Attaches a widget to an existing element.</summary>
            /// <param name="selector" type="Object">What to attach the widget to: jpvs widget or jQuery selector or jQuery object or DOM element. If not specified, the widget is created in the document body.</param>
        };
    }

    function destroy(widgetDef) {
        return function () {
            /// <summary>Destroys the widget and removes it from the document.</summary>
        };
    }

    function getMainContentElement(widgetDef) {
        return function () {
            /// <summary>Gets the main content element.</summary>
            return $("*");
        };
    }

    function focus(widgetDef) {
        return function () {
            /// <summary>Sets the focus to the widget.</summary>
            return this;
        };
    }

    function addState(wd) {
        return function (state) {
            /// <summary>Add a "state" to the widget. A "state" is a special CSS class. For example, a Button has classes Widget and Button. Adding state "XYZ" means adding classes "Widget-XYZ" and "Button-XYZ" to the main element.</summary>
            return this;
        };
    }

    function removeState(wd) {
        return function (state) {
            /// <summary>Removes a "state" from the widget.</summary>
            return this;
        };
    }

};


jpvs.createAllWidgets = function () {
    /// <summary>Creates all widgets automatically.</summary>
};


jpvs.write = function (container, text) {
    /// <summary>Writes text.</summary>
    /// <param name="container" type="Object">Where to write the text: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="text" type="String">The text to write. Newlines in the string are handled correctly.</param>
};

jpvs.writeln = function (container, text) {
    /// <summary>Writes text and terminates the current line.</summary>
    /// <param name="container" type="Object">Where to write the text: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="text" type="String">The text to write. Newlines in the string are handled correctly.</param>
    return $("");
};

jpvs.writeTag = function (container, tagName, text) {
    /// <summary>Writes a tag with optional text inside.</summary>
    /// <param name="container" type="Object">Where to write the text: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="tagName" type="String">The tag name to write.</param>
    /// <param name="text" type="String">Optional: the text to write. Newlines in the string are handled correctly.</param>
    /// <returns type="jQuery">A jQuery object that wraps the element just written.</returns>
    return $("");
};

jpvs.applyTemplate = function (container, template, dataItem) {
    /// <summary>Writes content according to a template. If the template is a function, then applyTemplate returns whatever is returned by the template function call.</summary>
    /// <param name="container" type="Object">Where to write the text: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="template" type="Object">The template may be any of the following: (1) a string; (2) an object like this: { fieldName: "ABC", tagName: "TAG", css: {}, selector: function(fieldValue, dataItem) {} }; (3) a function(dataItem) {} that will receive the container as the "this" object.</param>
    /// <param name="dataItem" type="String">Optional: the data item that will be consumed by the template.</param>
};

jpvs.readDataSource = function (data, start, count, options, callback) {
    /// <summary>This function handles extraction of data from various types of data sources and returns data asynchronously to a callback.</summary>
    /// <param name="data" type="Array">Array of records or function(start, count, options) that returns the data or function(start, count, options, callback) that asynchronously fetches the data and passes it to the callback.</param>
    /// <param name="start" type="Number">Index of the first element desired. If null or undefined, 0 is implied.</param>
    /// <param name="count" type="Number">Number of elements desired. If null or undefined, the entire data set is fetched.</param>
    /// <param name="options" type="Object">Sorting/filtering options. It is an object in the form: { sort: [ { name: ..., descending: true/false }, ...], filter: [ { name: ..., operand: ..., value: ....}, ... ] }. It may be null. This parameter is passed to the datasource when the datasource is a function. If the datasource is an array, this parameter is not taken into account. Therefore, in order to support sorting/filtering, the datasource must be a function. This parameter is passed to the datasource function directly.</param>
    /// <param name="callback" type="Function">Function(obj) that gets the data. The object passed to the callback is as follows: { total: total number of records in the full data set, start: offset in the data set of the first record returned in the "data" field, count: number of records returned in the "data" field; this is &lt;= total, data: array with the returned records }</param>
};


jpvs.showDimScreen = function (delayMilliseconds, fadeInDuration, template) {
    /// <summary>Dims the screen with a DIV of class "DimScreen" that covers all the browser window.</summary>
    /// <param name="delayMilliseconds" type="Number">Delay in milliseconds (default: 500). The dimming appears if jpvs.hideDimScreen is not called within this delay.</param>
    /// <param name="fadeInDuration" type="Number">Duration in milliseconds (default: 250) of the fade-in animation used to dim the screen.</param>
    /// <param name="template" type="Object">Optional: template used for filling the DIV. It is passed to jpvs.applyTemplate.</param>
};

jpvs.hideDimScreen = function (fadeOutDuration) {
    /// <summary>Hides, if currently displayed, the screen-dimming DIV created by jpvs.showDimScreen.</summary>
    /// <param name="fadeOutDuration" type="Number">Duration in milliseconds (default: 250) of the fade-out animation used to undim the screen.</param>
};

jpvs.fitInWindow = function (element) {
    /// <summary>Takes an absolutely positioned element and makes sure it fits into the visible window.</summary>
    /// <param name="element" type="Object">jpvs widget or jQuery selector or jQuery object or DOM element.</param>
};

jpvs.fixTableHeader = function (element) {
    /// <summary>Takes a table and fixes its header so that it does not disappear when scrolling upwards.</summary>
    /// <param name="element" type="Object">jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <returns type="Object">An object containing the "refresh" function, that forces a repositioning of the header, and the "deactivate" function,
    /// that disables the header fixing. 
    /// Calling the refresh function after changing the table content ensures the header is properly repositioned. Calling the
    /// deactivate function, restores the header in the original position.</returns>
    return {
        refresh: function () { },
        deactivate: function () { }
    };
};

window.jpvs = window.jpvs || {};

jpvs.Event = function (widget) {
    /// <summary>Generic widget event. The result of "new jpvs.Event(...)" is the object "obj", which has props "widget" and "handlers" and can also be called as a function (the "bind" function).</summary>
    /// <param name="widget" type="Widget">The widget to which the event is to be attached.</param>
    /// <returns type="jpvs.Event">The newly-created event.</returns>
    var obj = function (handlerName, handler) {
        /// <summary>Binds a handler to this event.</summary>
        /// <param name="handlerName" type="String">Optional: the handler name. This argument may be omitted.</param>
        /// <param name="handler" type="Function">The event handler to bind to this event. The event handler is a function handler(widget) {} that receives the widget that received the event as the argument. Also, in the handler function body, "this" refers to the same widget that is passed as the argument. If the handler returns false, then the event is not bubbled up the document hierarchy.</param>
        /// <returns type="Widget">The widget.</returns>
    };

    obj.bind = jpvs.Event.prototype.bind;
    obj.unbind = jpvs.Event.prototype.unbind;
    obj.fire = jpvs.Event.prototype.fire;

    obj.widget = widget;
    obj.handlers = {};

    return obj;
};

jpvs.Event.prototype.bind = function (handlerName, handler) {
    /// <summary>Binds a handler to this event.</summary>
    /// <param name="handlerName" type="String">Optional: the handler name. This argument may be omitted.</param>
    /// <param name="handler" type="Function">The event handler to bind to this event. The event handler is a function handler(widget) {} that receives the widget that received the event as the argument. Also, in the handler function body, "this" refers to the same widget that is passed as the argument.</param>
    /// <returns type="Widget">The widget.</returns>
};

jpvs.Event.prototype.unbind = function (handlerName) {
    /// <summary>Unbinds a handler that has been bound by name.</summary>
    /// <param name="handlerName" type="String">Name of the handler to unbound.</param>
    /// <returns type="Widget">The widget.</returns>
};

jpvs.Event.prototype.fire = function (widget, handlerName, params, browserEvent) {
    /// <summary>Fires this event.</summary>
    /// <param name="widget" type="Widget">The widget that is generating the event.</param>
    /// <param name="handlerName" type="String">Optional: name of the handler to trigger, in case only a specific handler must be triggered. This argument may be omitted.</param>
    /// <param name="params" type="Object">Parameters that are passed to the handler. The handler is called as handler(params) and inside the handler "this" refers to the "widget".</param>
    /// <param name="browserEvent" type="jQuery Event">Event object passed by the browser. If passed, this will be available in the widget as widget.currentBrowserEvent.</param>
};

window.jpvs = window.jpvs || {};

jpvs.parseJSON = function (jsonString) {
    /// <summary>Parses a JSON string.</summary>
    /// <param name="jsonString" type="String">The string to decode.</param>
    /// <returns type="Object">The object whose JSON representation was passed.</returns>
};

jpvs.toJSON = function (obj) {
    /// <summary>Serializes an object as a JSON string.</summary>
    /// <param name="obj" type="Object">The object to convert into a JSON string.</param>
    /// <returns type="String">A JSON string representing the object that was passed.</returns>
};
    

window.jpvs = window.jpvs || {};

jpvs.cleanHtml = function (html, options) {
    /// <summary>Cleans an html string using the jquery-clean plugin. This function is merely a wrapper to that plugin.</summary>
    /// <param name="html" type="String">The html string to clean.</param>
    /// <param name="options" type="Object">Optional object with cleaning options. If not specified, the html is cleaned with default options (common tags and attributes found in javascript HTML editors are preserved (using a white-list approach)). If specified, it must be in the format specified by the jquery-clean plugin documentation. Please see it for detailed information.</param>
    /// <returns type="String">The cleaned html string. It is in xhtml format.</returns>
};

jpvs.stripHtml = function (html) {
    /// <summary>Strips all html tags from an html string using the jquery-clean plugin. This function is merely a wrapper to that plugin.</summary>
    /// <param name="html" type="String">The html string to clean.</param>
    /// <returns type="String">The text extracted from the html string.</returns>
};


window.jpvs = window.jpvs || {};

jpvs.randomString = function (len) {
    /// <summary>Creates a random string of a given length and containing uppercase letters and digits only.</summary>
    /// <param name="len" type="Number">The length of the string to be generated.</param>
    /// <returns type="String">A random string.</returns>
};

window.jpvs = window.jpvs || {};

jpvs.getSessionID = function () {
    /// <summary>Gets the current "jpvs session ID". When using the jpvs library, each browser session has a unique "jpvs session ID" that may be used instead of a session cookie.</summary>
    /// <returns type="String">The current session ID.</returns>
    return "ABCDEFG";
};

window.jpvs = window.jpvs || {};


function JPVS_Domain() {
}

JPVS_Domain.prototype.getCount = function () {
    /// <summary>Returns the number of items currently stored in this data domain.</summary>
    /// <returns type="Number">The number of items.</returns>
};

JPVS_Domain.prototype.getItem = function (itemIndex) {
    /// <summary>Returns a data item, given the item index.</summary>
    /// <param name="itemIndex" type="Number">The 0-based item index.</param>
    /// <returns type="Object">The data item, or null if no data item was found at the specified index.</returns>
};

JPVS_Domain.prototype.setItem = function (itemIndex, item) {
    /// <summary>Stores a data item at a given index.</summary>
    /// <param name="itemIndex" type="Number">The 0-based item index.</param>
    /// <param name="item" type="Object">The item to store.</param>
};

JPVS_Domain.prototype.removeItem = function (itemIndex) {
    /// <summary>Removes the data item at a given index.</summary>
    /// <param name="itemIndex" type="Number">The 0-based item index.</param>
};

JPVS_Domain.prototype.removeAllItems = function () {
    /// <summary>Removes all data items.</summary>
};

JPVS_Domain.prototype.listItems = function () {
    /// <summary>Returns all the items in the domain.</summary>
    /// <returns type="Array">Array of data items. Some elements may be null, if the corresponding item is missing or has been removed.</returns>
};

JPVS_Domain.prototype.each = function (action) {
    /// <summary>Iterates over all the data items and executes a callback on each item.</summary>
    /// <param name="action" type="Function">The callback to execute on each item. The callback is defined as follows: function(index, item) {}.</param>
};

JPVS_Domain.prototype.deleteDomain = function () {
    /// <summary>Removes all data items and deletes the domain.</summary>
};

jpvs.Storage = {
    listDomains: function (storage) {
        /// <summary>Returns a list of domains registered in a given storage object.</summary>
        /// <param name="storage" type="StorageObject">localStorage or sessionStorage.</param>
        /// <returns type="Array">Array of data domains.</returns>
        return [new JPVS_Domain(), new JPVS_Domain(), new JPVS_Domain()];
    },

    getDomain: function (storage, domainName) {
        /// <summary>Gets a domain by storage and name.</summary>
        /// <param name="storage" type="StorageObject">localStorage or sessionStorage.</param>
        /// <param name="domainName" type="String">Domain name. If no domain with this name is found in the given "storage", then a new domain is implicitly created and registered.</param>
        /// <returns type="JPVS_Domain">The requested data domain.</returns>
        return new JPVS_Domain();
    }
};


window.jpvs = window.jpvs || {};

jpvs.equals = function (x,y) {
    /// <summary>Determines if two objects are deeply equal.</summary>
    /// <param name="x" type="Object">The first object.</param>
    /// <param name="y" type="Object">The second object.</param>
    /// <returns type="Boolean">The result of the comparison.</returns>
};

window.jpvs = window.jpvs || {};

jpvs.Button = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    
    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Button,
    type: "Button",

    prototype: {
        text: function (value) {
            /// <summary>Property: text of the button.</summary>
            return this;
        }
    }
});


jpvs.writeButtonBar = function (container, buttons) {
    /// <summary>Writes a button bar (a DIV with class "ButtonBar" with buttons inside).</summary>
    /// <param name="container" type="Object">Where to write the button bar: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="buttons" type="Array">Array of button definitions. A button definition is like this: { text: "OK", click: eventHandler }</param>
    /// <returns type="jQuery">A jQuery object that wraps the element just written.</returns>

    return $("*");
};

window.jpvs = window.jpvs || {};

jpvs.CheckBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    
    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.CheckBox,
    type: "CheckBox",

    prototype: {
        checked: function (value) {
            /// <summary>Property: true if checked.</summary>
            return this;
        },

        text: function (value) {
            /// <summary>Property: checkbox label.</summary>
            return this;
        }
    }
});



window.jpvs = window.jpvs || {};


jpvs.DataGrid = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.dataItemClick = jpvs.event(this);
    this.changedSortFilter = jpvs.event(this);
};


jpvs.DataGrid.getFilteringOperands = function () {
    /// <summary>Returns the list of combobox items for the operand combobox in the filtering options popup.</summary>
    return [];
};


jpvs.makeWidget({
    widget: jpvs.DataGrid,
    type: "DataGrid",

    prototype: {
        template: function (value) {
            /// <summary>Property: grid template. The grid template specifies how data items must be rendered in the data grid. The grid template is an array of column templates (a column template is applied on each row to the corresponding TD element). A column template is in the form: { header: headerTemplate, body: bodyTemplate, footer: footerTemplate } or simply: bodyTemplate when only the body template needs to be specified. The headerTemplate/bodyTemplate/footerTemplate is in the form: TEMPLATE or { isHeader: true/false, template: TEMPLATE }. Here, TEMPLATE is a template in the form used by the jpvs.applyTemplate function. Example: { fieldName: "FirstName" } or function(dataItem) { ... }.</summary>
            return this;
        },

        emptyRowTemplate: function (value) {
            /// <summary>Property: empty row template. This template is used whenever a row with a null/undefined data item is added to the grid. This template, unlike the standard data grid template, is applied to the TR element.</summary>
            return this;
        },

        binder: function (value) {
            /// <summary>Property: binder. The binder specifies how binding is performed. Examples of binders are: defaultBinder (all rows are displayed), pagingBinder (rows are displayed one page at a time with paging enabled), scrollingBinder (rows are displayed one page at a time with a scrollbar on the right side of the data grid).</summary>
            return this;
        },

        caption: function (value) {
            /// <summary>Property: grid caption.</summary>
            return this;
        },

        enableEvenOdd: function (value) {
            /// <summary>Property: true to enable even/odd row styling. If enabled, even rows get an "Even" CSS class and odd rows get an "Odd" CSS class.</summary>
            return this;
        },

        enableSorting: function (value) {
            /// <summary>Property: true to enable sorting.</summary>
            return this;
        },

        enableFiltering: function (value) {
            /// <summary>Property: true to enable filtering.</summary>
            return this;
        },

        sortAndFilterExpressions: function (value) {
            /// <summary>Property: list of combobox items and/or null items used to prompt the user with a list of sort/filter expressions. Only non-null items are used for the combobox that is propmted to the user. The null items are meant to provide the user with visual cues as to which columns are sortable/filterable. More specifically, if the item at index K is null, then the column with index K will not have the sorting/filtering button. For example, if the first two columns should not be sortable while the others should, you can provide a list of items where the first two items are null and the others are not null. Typically, a sort/filter expression is a column name on which the user may perform sorting/filtering. The value of this property is an array of items in the form: { value: sort/filter expression name, text: textual representation of the sort/filter expression }. Example: grid.sortAndFilterExpressions([{ value: "FirstName", text: "First name" }]).</summary>
            return this;
        },

        currentSort: function (value) {
            /// <summary>Property: list of items that specify how the records of the datasource must be sorted. Array items must be in the form: { name: sort expression name, descending: true/false }. Example: grid.currentSort([{ name: "FirstName", descending: false }, { name: "LastName", descending: true }]).</summary>
            return this;
        },

        currentFilter: function (value) {
            /// <summary>Property: list of items that specify how the records of the datasource must be filtered. Array items must be in the form: { name: filter expression name, operand: LT|LTE|EQ|NEQ|GT|GTE|CONTAINS|NCONTAINS|STARTS|NSTARTS, value: ... }. Example: grid.currentFilter([{ name: "FirstName", operand: "GTE", value: "John" }, { name: "FirstName", operand: "LTE", value: "Tom" }]). This filter extracts all records whose FirstName is between "John" and "Tom".</summary>
            return this;
        },

        clear: function (value) {
            /// <summary>Removes all header, body and footer rows from the grid.</summary>
            return this;
        },

        dataBind: function (data) {
            /// <summary>Fills the body section with rows taken from a datasource.</summary>
            /// <param name="data" type="Object">The datasource. It can be an array of records or a function. See jpvs.readDataSource for details on how a datasource is expected to work.</param>
            return this;
        },

        dataBindHeader: function (data) {
            /// <summary>Fills the header section with rows taken from a datasource.</summary>
            /// <param name="data" type="Object">The datasource. It can be an array of records or a function. See jpvs.readDataSource for details on how a datasource is expected to work.</param>
            return this;
        },

        dataBindFooter: function (data) {
            /// <summary>Fills the footer section with rows taken from a datasource.</summary>
            /// <param name="data" type="Object">The datasource. It can be an array of records or a function. See jpvs.readDataSource for details on how a datasource is expected to work.</param>
            return this;
        },

        addBodyRow: function (item, index) {
            /// <summary>Adds a row to the body section.</summary>
            /// <param name="item" type="Object">The data item.</param>
            /// <param name="index" type="Number">Optional: the index where to add the row. If omitted, the row is added at the end. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        addHeaderRow: function (item, index) {
            /// <summary>Adds a row to the header section.</summary>
            /// <param name="item" type="Object">The data item.</param>
            /// <param name="index" type="Number">Optional: the index where to add the row. If omitted, the row is added at the end. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        addFooterRow: function (item, index) {
            /// <summary>Adds a row to the footer section.</summary>
            /// <param name="item" type="Object">The data item.</param>
            /// <param name="index" type="Number">Optional: the index where to add the row. If omitted, the row is added at the end. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        removeBodyRow: function (index) {
            /// <summary>Removes a row from the body section.</summary>
            /// <param name="index" type="Number">The index of the row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        removeHeaderRow: function (index) {
            /// <summary>Removes a row from the header section.</summary>
            /// <param name="index" type="Number">The index of the row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        removeFooterRow: function (index) {
            /// <summary>Removes a row from the footer section.</summary>
            /// <param name="index" type="Number">The index of the row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            return this;
        },

        removeBodyRows: function (index, count) {
            /// <summary>Removes rows from the body section.</summary>
            /// <param name="index" type="Number">The index of the first row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            /// <param name="count" type="Number">The number of rows to remove.</param>
            return this;
        },

        removeHeaderRows: function (index, count) {
            /// <summary>Removes rows from the header section.</summary>
            /// <param name="index" type="Number">The index of the first row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            /// <param name="count" type="Number">The number of rows to remove.</param>
            return this;
        },

        removeFooterRows: function (index, count) {
            /// <summary>Removes rows from the footer section.</summary>
            /// <param name="index" type="Number">The index of the first row to remove. If negative, indicates an offset from the end (i.e.: -1 is the last row).</param>
            /// <param name="count" type="Number">The number of rows to remove.</param>
            return this;
        }
    }
});


jpvs.DataGrid.defaultBinder = function (section, data) {
    /// <summary>This binder displays all the rows in the datasource. This function can be used directly as the value of the data grid "binder" property.</summary>
};

jpvs.DataGrid.pagingBinder = function (params) {
    /// <summary>This binder displays rows one page at a time with paging enabled. This function creates a paging binder with the specified parameters and returns it. The returned value can be used as the value of the data grid "binder" property.</summary>
    /// <param name="params" type="Object">{ pageSize: Number, preserveCurrentPage: Boolean }. The "preserveCurrentPage" specifies whether the current page must be preserved when the dataBind method is called again.</param>
    /// <returns type="Function">The paging binder.</returns>
};

jpvs.DataGrid.scrollingBinder = function (params) {
    /// <summary>This binder displays rows one page at a time with a scrollbar on the right side. This function creates a scrolling binder with the specified parameters and returns it. The returned value can be used as the value of the data grid "binder" property.</summary>
    /// <param name="params" type="Object">{ pageSize: Number, chunkSize: Number, forcedWidth: CSS value, forcedHeight: CSS value }. The "chunkSize" value specifies how many rows are read from the datasource for caching purposes. The forced width and height, if provided, are applied to the data grid.</param>
    /// <returns type="Function">The scrolling binder.</returns>
};

window.jpvs = window.jpvs || {};

jpvs.DateBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.DateBox,
    type: "DateBox",

    prototype: {
        date: function (value) {
            /// <summary>Property: date of the datebox.</summary>
            return this;
        },

        dateString: function (value) {
            /// <summary>Property: date of the datebox as a string in the YYYYMMDD format.</summary>
            return this;
        }

    }
});



window.jpvs = window.jpvs || {};



jpvs.DocumentEditor = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};


jpvs.makeWidget({
    widget: jpvs.DocumentEditor,
    type: "DocumentEditor",

    prototype: {
        document: function (value) {
            /// <summary>Property: document content to display in the editor. It is in the form: { sections: [ { margins: { all: "2cm", top: "...", left: "...", right: "...", bottom: "..." }, header: { margins: { all: "2cm", top: "...", left: "...", right: "..." }, height: "...", content: "(x)html content", highlight: true/false }, footer: { margins: { all: "2cm", bottom: "...", left: "...", right: "..." }, height: "...", content: "(x)html content", highlight: true/false }, body: { content: "(x)html content", highlight: true/false } }, ... ], fields: { fieldName1: { value: "...", highlight: true/false }, fieldName2: { ... } } }.</summary>
            return this;
        },

        fields: function (value) {
            /// <summary>Property: the getter returns the fields (it is equivalent to calling "document().fields"); the setter can change one or more fields and immediately updates the preview. The value is in the form { a: { value: ..., highlight: false }, xxx: { value: ..., highlight: true }, ... }. In this example, fields "a" and "xxx" would be updated (only "xxx" would be highlighted) and all the remaining document fields would be left untouched.</summary>
            return this;
        },

        richTextEditor: function (value) {
            /// <summary>Property: rich text editor. This property allows any rich text editor to be used. Just pass an object like this: { editText: function(content, onDone) {} }. The function is responsible for displaying the rich text editor and allows the user to change the content. The function takes two parameters: (1) "content" is the (X)HTML content to show; (2) onDone is a callback function like this: function onDone(newContent) {}. The editText function must call the onDone callback when the user is done editing the content.</summary>
            return this;
        },

        fieldEditor: function (value) {
            /// <summary>Property: field editor. This property allows any field editor to be used. Just pass an object like this: { editField: function(fields, fieldName, onDone) {} }. The function is responsible for displaying the field editor and allows the user to change the content. The function takes three parameters: (1) "fields" is the fields collection as passed to the "document" property; (2) "fieldName" is the field name that must be edited; (3) onDone is a callback function like this: function onDone(newValue) {}. The editField function must call the onDone callback when the user is done editing the field.</summary>
            return this;
        },

        fieldDisplayMapper: function (value) {
            /// <summary>Property: optional field display mapper. If present, changes the way the field is rendered in the document editor.
            /// It does not change the field value, only the way it is rendered in the document editor. It is a function(text) {} that
            /// must return the text to render. The default field display mapper is function(text) { return text; }. With the default
            /// field display mapper, field values are displayed. By changing this property, you can choose to display some other
            /// text instead of the field value.</summary>
            return this;
        }
    }
});


window.jpvs = window.jpvs || {};

jpvs.DropDownList = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.DropDownList,
    type: "DropDownList",

    prototype: {
        clearItems: function () {
            /// <summary>Removes all the items.</summary>
            return this;
        },

        addItem: function (value, text) {
            /// <summary>Adds an item.</summary>
            /// <param name="value" type="String">Value of the item.</param>
            /// <param name="text" type="String">Text of the item. If omitted, the "value" is used.</param>
            return this;
        },

        addItems: function (items) {
            /// <summary>Adds multiple items.</summary>
            /// <param name="items" type="Array">Array of items to add. Each item may be a string or an object like this: { value: String, text: String }.</param>
            return this;
        },

        count: function () {
            /// <summary>Returns the number of items.</summary>
            return 10;
        },

        selectedValue: function (value) {
            /// <summary>Property: selected value.</summary>
            return this;
        }
    }
});

window.jpvs = window.jpvs || {};

jpvs.ImageButton = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.ImageButton,
    type: "ImageButton",

    prototype: {
        imageUrls: function (value) {
            /// <summary>Property: image urls. It is in the form { normal: String, hover: String }. The two urls contain the two states of the image button: the normal state and the hovering state.</summary>
            return this;
        },

        getNormalImage: function (value) {
            /// <summary>Gets the normal state image url</summary>
            return "";
        },

        getHoverImage: function (value) {
            /// <summary>Gets the hovering state image url</summary>
            return "";
        }
    }
});


window.jpvs = window.jpvs || {};

jpvs.LinkButton = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.LinkButton,
    type: "LinkButton",

    prototype: {
        text: function (value) {
            /// <summary>Property: text of the link button.</summary>
            return this;
        }
    }
});


window.jpvs = window.jpvs || {};

jpvs.Menu = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.click = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Menu,
    type: "Menu",

    prototype: {
        template: function (value) {
            /// <summary>Property: menu template. The menu template is an array of strings or functions. Each array item represents the template to be used for each menu level. Calling "arr" the menu template array, the root level is arr[0], the first level of submenus is arr[1], ... Possible values for each item: "HorizontalMenuBar", "VerticalMenuBar", "PopupMenu", jpvs.Menu.Templates.HorizontalMenuBar, ..., a custom function.</summary>
            return this;
        },

        itemTemplate: function (value) {
            /// <summary>Property: menu item template. The menu item template is an array of strings or functions. Each array item represents the item template to be used for each menu level. Calling "arr" the menu item template array, the root level is arr[0], the first level of submenus is arr[1], ... Possible values for each item: "HorizontalMenuBarItem", "VerticalMenuBarItem", "PopupMenuItem", jpvs.Menu.ItemTemplates.HorizontalMenuBarItem, ..., a custom function.</summary>
            return this;
        },

        menuItems: function (value) {
            /// <summary>Property: array of menu items. Each menu item is in this form: { text: String, icon: Url, tooltip: String, click: Function, href: String, items: Array }. Every field is optional. A separator can be specified as jpvs.Menu.Separator.</summary>
            return this;
        }
    }
});

window.jpvs = window.jpvs || {};

jpvs.MultiLineTextBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.MultiLineTextBox,
    type: "MultiLineTextBox",

    prototype: {
        text: function (value) {
            /// <summary>Property: text of the multi-line textbox.</summary>
            return this;
        }
    }
});



window.jpvs = window.jpvs || {};

jpvs.MultiSelectBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.MultiSelectBox,
    type: "MultiSelectBox",

    prototype: {
        caption: function () {
            /// <summary>Property: caption of the widget. Used as the title of the selection popup.</summary>
            return this;
        },

        prompt: function () {
            /// <summary>Property: prompt string used in the selection popup. May be empty, which means "no prompt string".</summary>
            return this;
        },

        containerTemplate: function () {
            /// <summary>Property: container template. Must create a container and return it. If not specified, 
            /// a default container template is used which creates and returns a UL element. When used, no dataItem is passed to this template.</summary>
            return this;
        },

        itemTemplate: function () {
            /// <summary>Property: item template. Must create an item. If not specified, 
            /// a default item template is used which creates an LI element with a checkbox inside.
            /// The template must return an object that has a "selected" property and a "change" event. This object allows
            /// the MultiSelectBox to select/unselect the item, read its state and subscribe to its "change" event.</summary>
            return this;
        },

        clearItems: function () {
            /// <summary>Removes all the items.</summary>
            return this;
        },

        addItem: function (value, text, selected) {
            /// <summary>Adds an item.</summary>
            /// <param name="value" type="String">Value of the item.</param>
            /// <param name="text" type="String">Text of the item. If omitted, the "value" is used.</param>
            /// <param name="selected" type="Boolean">Specifies if the item must be initially selected.</param>
            return this;
        },

        addItems: function (items) {
            /// <summary>Adds multiple items.</summary>
            /// <param name="items" type="Array">Array of items to add. Each item may be a string or an object like this: { value: String, text: String, selected: Boolean }.</param>
            return this;
        },

        count: function () {
            /// <summary>Returns the number of items.</summary>
            return 10;
        },

        selectedValues: function (value) {
            /// <summary>Property: array of selected values.</summary>
            return this;
        },

        selectedValuesString: function (value) {
            /// <summary>Property: selected values as a comma-separated list.</summary>
            return this;
        }
    }
});

window.jpvs = window.jpvs || {};


jpvs.Pager = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Pager,
    type: "Pager",

    prototype: {
        page: function (value) {
            /// <summary>Property: current page index.</summary>
            return this;
        },

        totalPages: function (value) {
            /// <summary>Property: total number of pages.</summary>
            return this;
        }
    }
});

window.jpvs = window.jpvs || {};


jpvs.Popup = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.close = jpvs.event(this);
};

jpvs.Popup.getTopMost = function () {
    /// <summary>Returns the top-most popup at any given time. Returns null if no popup is currently active.</summary>
    return new jpvs.Popup();
};

jpvs.makeWidget({
    widget: jpvs.Popup,
    type: "Popup",

    prototype: {
        modal: function (value) {
            /// <summary>Property: modal flag (true/false).</summary>
            return this;
        },

        autoHide: function (value) {
            /// <summary>Property: auto-hide flag (true/false). 
            /// If true, when the user clicks outside the popup, the popup is hidden automatically</summary>
            return this;
        },

        autoDestroy: function (value) {
            /// <summary>Property: auto-destroy flag (true/false). 
            /// If true, when the user clicks outside the popup, the popup is destroyed automatically</summary>
            return this;
        },

        position: function (value) {
            /// <summary>Property: specifies how to position the popup when shown. By default, the popup is displayed
            /// centered in the browser viewport. In order to customize the positioning, pass an object like the
            /// following: { my: ..., at: ..., of: ..., collision: ..., position: ... }.
            /// Please see the jQuery UI Position utility for information about "my", "at", "of" and "collision". 
            /// As regards the "position" property, it is applied as a CSS property to the popup. You can pass either "absolute"
            /// or "fixed" depending on how the popup should behave on page scrolling. If "absolute", the popup will scroll together
            /// with the page. If "fixed", the popup will not move when the user scrolls the page.
            /// The default value is: { my: "center", at: "center", of: $(window), collision: "fit", position: "fixed" }, which
            /// means that the popup is centered in the viewport and must not move on page scrolling.</summary>
            return this;
        },

        applyPosition: function () {
            /// <summary>This function applies the positioning set into the "position" property and makes sure
            /// this popup is not bigger than the viewport. If bigger, it is automatically reduced and scrollbars
            /// are displayed.</summary>
            return this;
        },

        show: function (callback) {
            /// <summary>Shows the popup.</summary>
            /// <param name="callback" type="Function">Optional: Function that will be called at the end of the showing animation.</param>
            return this;
        },

        hide: function (callback) {
            /// <summary>Hides the popup.</summary>
            /// <param name="callback" type="Function">Optional: Function that will be called at the end of the hiding animation.</param>
            return this;
        },

        center: function () {
            /// <summary>Centers the popup in the browser window.</summary>
            return this;
        },

        bringForward: function () {
            /// <summary>Brings the popup on top.</summary>
            return this;
        },

        title: function (value) {
            /// <summary>Property: title of the popup. If false or null or empty, no title bar is displayed.</summary>
            return this;
        },

        width: function (value) {
            /// <summary>Property: width of the popup in CSS units (e.g.: 400px or 30em).</summary>
            return this;
        },

        maxWidth: function (value) {
            /// <summary>Property: maximum width of the popup in CSS units (e.g.: 400px or 30em).</summary>
            return this;
        },

        zIndex: function (value) {
            /// <summary>Property: z-index of the popup.</summary>
            return this;
        }
    }
});



jpvs.alert = function (title, text, onclose, buttons) {
    /// <summary>Displays an alert popup with a title, a text, an on-close action, and one or more buttons.</summary>
    /// <param name="title" type="String">Optional: Title of the popup.</param>
    /// <param name="text" type="String">Text of the popup.</param>
    /// <param name="onclose" type="Function">Optional: Function that will be called when the popup is closed or jpvs widget to be focused when the popup is closed.</param>
    /// <param name="buttons" type="Array">Optional: Array of button definitions. A button definition is like this: { text: "OK", click: eventHandler }. The jpvs.writeButtonBar is used; see it for additional info.</param>
};


jpvs.confirm = function (title, text, onYes, onNo, textYes, textNo) {
    /// <summary>Displays a confirmation popup with two customizable Yes/No buttons.</summary>
    /// <param name="title" type="String">Title of the popup.</param>
    /// <param name="text" type="String">Text of the popup.</param>
    /// <param name="onYes" type="Function">Optional: Function that will be called if the user clicks the Yes button.</param>
    /// <param name="onNo" type="Function">Optional: Function that will be called if the user clicks the No button.</param>
    /// <param name="textYes" type="String">Optional: Text of the Yes button (default = "OK").</param>
    /// <param name="textNo" type="String">Optional: Text of the No button (default = "Cancel").</param>
};

window.jpvs = window.jpvs || {};


jpvs.Scroller = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.Scroller,
    type: "Scroller",

    prototype: {
        objectSize: function (value) {
            /// <summary>Property: total object size { width: CSS units, height: CSS units }. This is the visible size of the widget, which looks like a box with scrollbars inside.</summary>
            return this;
        },

        scrollableSize: function (value) {
            /// <summary>Property: size of the scrollable area ({ width: CSS units, height: CSS units }). The scrollable area is used only for sizing the scrollbars. It is assumed that this area is the total area that will be scrolled inside the object's visible viewport (the object size property).</summary>
            return this;
        },

        contentSize: function (value) {
            /// <summary>Property: size of the content area ({ width: CSS units, height: CSS units }). It may be different from the scrollable size because the jpvs Scroller decouples the amount of scrolling set by the scrollbars from the actual amount of scrolling of the contents.</summary>
            return this;
        },

        scrollPosition: function (value) {
            /// <summary>Property: scroll position as specified by the scrollbars ({ top: pixels, left: pixels }). Setting this property only affects the scrollbars, not the content.</summary>
            return this;
        },

        contentPosition: function (value) {
            /// <summary>Property: content position ({ top: pixels, left: pixels }). Setting this property only affects the content, not the scrollbars.</summary>
            return this;
        }
    }
});

window.jpvs = window.jpvs || {};


jpvs.Table = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
};

jpvs.makeWidget({
    widget: jpvs.Table,
    type: "Table",

    prototype: {
        addClass: function (classNames) {
            /// <summary>Proxy to jQuery addClass function.</summary>
            return this;
        },

        removeClass: function (classNames) {
            /// <summary>Proxy to jQuery removeClass function.</summary>
            return this;
        },

        css: function () {
            /// <summary>Proxy to jQuery css function.</summary>
            return this;
        },

        writeHeaderRow: function () {
            /// <summary>Writes a new row in the header.</summary>
            return new JPVS_RowObject();
        },

        writeBodyRow: function () {
            /// <summary>Writes a new row in the body.</summary>
            return new JPVS_RowObject();
        },

        writeRow: function () {
            /// <summary>Writes a new row in the body.</summary>
            return new JPVS_RowObject();
        },

        writeFooterRow: function () {
            /// <summary>Writes a new row in the footer.</summary>
            return new JPVS_RowObject();
        },

        caption: function (value) {
            /// <summary>Property: table caption.</summary>
            return this;
        },

        clear: function () {
            /// <summary>Removes all rows from header, body and footer.</summary>
            return this;
        }
    }
});

function JPVS_RowObject() {
}

JPVS_RowObject.prototype.writeHeaderCell = function (text) {
    /// <summary>Writes a header cell (TH) and returns the jQuery object that represents the cell.</summary>
    /// <param name="text" type="String">Optional: text to write in the cell.</param>
    return $("");
};

JPVS_RowObject.prototype.writeCell = function (text) {
    /// <summary>Writes a cell (TD) and returns the jQuery object that represents the cell.</summary>
    /// <param name="text" type="String">Optional: text to write in the cell.</param>
    return $("");
};

window.jpvs = window.jpvs || {};

jpvs.TextBox = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.change = jpvs.event(this);
};

jpvs.makeWidget({
    widget: jpvs.TextBox,
    type: "TextBox",

    prototype: {
        text: function (value) {
            /// <summary>Property: text of the textbox.</summary>
            return this;
        },

        width: function (value) {
            /// <summary>Property: width in CSS units (e.g.: 200px or 25em).</summary>
            return this;
        }
    }
});



window.jpvs = window.jpvs || {};

jpvs.TileBrowser = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
};

jpvs.makeWidget({
    widget: jpvs.TileBrowser,
    type: "TileBrowser",

    prototype: {
        startingTile: function (value) {
            ///<summary>Property: starting tile object, from which tile layout and rendering will begin. Tile objects will be rendered into
            ///fixed sized tiles. A tile object must define at least three members: "template", "getNextTile", "getPreviousTile".
            ///The "template" member will be used for rendering the tile object into the tile area by calling jpvs.applyTemplate(template, { tileObject: XXX, tileBrowser: YYY }).
            ///The other two functions should return the next tile object and the previous tile object, if any, otherwise they must return nothing
            ///(null or undefined). If null is passed as the starting tile, then the tile browser will have no tiles.
            ///</summary>
        },

        width: function (value) {
            ///<summary>Property: gets the width in pixels, sets the width as CSS units (e.g.: 100px, 150pt, 6cm, 80%, ...).</summary>
        },

        height: function (value) {
            ///<summary>Property: gets the height in pixels, sets the height as CSS units (e.g.: 100px, 150pt, 6cm, 80%, ...).</summary>
        },

        tileWidth: function (value) {
            ///<summary>Property: gets/sets the tile width in pixels. If not specified or null, defaults to 1/8 of the TileBrowser width.</summary>
        },

        tileHeight: function (value) {
            ///<summary>Property: gets/sets the tile height in pixels. If not specified or null, defaults to the value of the tileWidth property.</summary>
        },

        desiredTileWidth: function (value) {
            ///<summary>Property: gets/sets the desired tile width in pixels. If different from the tileWidth, then the tileWidth will be animated to match.</summary>
        },

        desiredTileHeight: function (value) {
            ///<summary>Property: gets/sets the desired tile height in pixels. If different from the tileHeight, then the tileHeight will be animated to match.</summary>
        },

        tileSpacingHorz: function (value) {
            ///<summary>Property: gets/sets the horizontal spacing between tiles in pixels. If not specified or null, defaults to 1/5 of the tileWidth property.</summary>
        },

        tileSpacingVert: function (value) {
            ///<summary>Property: gets/sets the vertical spacing between tiles in pixels. If not specified or null, defaults to 1/5 of the tileHeight property.</summary>
        },

        originX: function (value) {
            ///<summary>Property: gets/sets the X coordinate of the origin. The origin is where the center of the starting tile is positioned.</summary>
        },

        originY: function (value) {
            ///<summary>Property: gets/sets the Y coordinate of the origin. The origin is where the center of the starting tile is positioned.</summary>
        },

        desiredOriginX: function (value) {
            ///<summary>Property: gets/sets the desired X coordinate of the origin. If different from originX, then originX will be animated to match.</summary>
        },

        desiredOriginY: function (value) {
            ///<summary>Property: gets/sets the desired Y coordinate of the origin. If different from originY, then originY will be animated to match.</summary>
        }
    }
});


window.jpvs = window.jpvs || {};

jpvs.Tree = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>

    this.nodeClick = jpvs.event(this);
    this.nodeRightClick = jpvs.event(this);
    this.nodeRendered = jpvs.event(this);
};

jpvs.Tree.Templates = {
    StandardNode: function (node) {
        /// <summary>Standard template for a tree node.</summary>
        return new jpvs.Tree.NodeElement();
    },

    StandardChildrenContainer: function (node) {
        /// <summary>Standard template for a tree children container.</summary>
        return new jpvs.Tree.ChildrenContainerElement();
    }
};


jpvs.Tree.NodeElement = function (node, element, refreshStateFunc, selectNodeFunc) {
    /// <summary>The node template returns an object of this type.</summary>
    /// <param name="node" type="Object">The node data item.</param>
    /// <param name="element" type="Object">The DOM element created by the node template.</param>
    /// <param name="refreshStateFunc" type="Function">Function that refreshes the state of the element (icons, etc.) based on whether the node has children and/or is open/close. The function will receive "this" set to the current node element.</param>
    /// <param name="selectNodeFunc" type="Function">Function that selects the current node. The function will receive "this" set to the current node element.</param>
    this.node = {};
    this.element = $();
    this.refreshState = function () { };
    this.select = function () { };

    this.parentNodeElement = new jpvs.Tree.NodeElement();
    this.childrenContainerElement = new jpvs.Tree.ChildrenContainerElement();
    this.childrenNodeElements = [];
};

jpvs.Tree.NodeElement.prototype.getTree = function () {
    /// <summary>Returns the current Tree widget.</summary>
    return new jpvs.Tree();
};

jpvs.Tree.NodeElement.prototype.isExpanded = function () {
    /// <summary>Returns true if this node element is expanded.</summary>
    return false;
};

jpvs.Tree.NodeElement.prototype.toggle = function () {
    /// <summary>Toggles the expanded/collapsed state of the node.</summary>
};

jpvs.Tree.NodeElement.prototype.collapse = function () {
    /// <summary>Collapses the node.</summary>
};

jpvs.Tree.NodeElement.prototype.expand = function (callback) {
    /// <summary>Expands the node.</summary>
    ///<param name="callback" type="Function">Function with no arguments that will be called at the end of the operation.</param>
};

jpvs.Tree.NodeElement.prototype.setMarkerIcon = function (imgUrl) {
    /// <summary>Changes the marker icon, if a marker icon is present.</summary>
    /// <param name="imgUrl" type="String">The new marker icon to set.</param>
};


jpvs.Tree.ChildrenContainerElement = function (node, element) {
    /// <summary>The children container template returns an object of this type.</summary>
    /// <param name="node" type="Object">The node data item.</param>
    /// <param name="element" type="Object">The DOM element created by the node template.</param>
    this.node = {};
    this.element = $();
    this.nodeElement = new jpvs.Tree.NodeElement();
};


jpvs.makeWidget({
    widget: jpvs.Tree,
    type: "Tree",

    prototype: {
        nodeTemplate: function (value) {
            ///<summary>Property: node template. The node template is the template used for every tree node. See
            ///jpvs.applyTemplate for information about templates. The jpvs.Tree.Templates.StandardNode is the default
            ///template used when a template is not explicitly set. The StandardNode template has an imagebutton for displaying
            ///the node state (open/closed), an optional icon (field "icon" of the node item) and a text (extracted by the toString method); nodes are
            ///clickable and expand/collapse accordingly.</summary>
        },

        childrenContainerTemplate: function (value) {
            ///<summary>Property: children container template. The children container template is used for every children
            ///container and is written just after the node template. The default children container template is
            ///jpvs.Tree.Templates.StandardChildrenContainer.</summary>
        },

        childrenSelector: function (value) {
            ///<summary>Property: children selector. The children selector is a function that extracts the children items from
            ///the node data item. The default behavior is to return the "children" data field. The children selector
            ///may be either synchronous or asynchronous.
            ///Synchronous version: function selector(node) { return node.xxx; }, where "xxx" is the field that contains
            ///the list of children. If it return null, it means no data and it is equivalent to "return [];".
            ///Asynchronous version: function asyncSelector(node, callback) { }; the function must return nothing (undefined).
            ///When data is ready, it must call the callback with the list of children as the first argument. If no data
            ///has to be returned, similarly to the synchronous version, "callback(null)" and "callback([])" are equivalent.</summary>
        },

        dataBind: function (data) {
            ///<summary>Fills the tree from an array of nodes. Only the root level is populated immediately.
            ///Lower levels in the hierarchy are populated on-demand, using the childrenSelector, which may be either
            ///synchronous or asynchronous.</summary>
            ///<param name="data" type="Object">The datasource. It can be an array of nodes or a function. 
            ///See jpvs.readDataSource for details on how a datasource is expected to work.</param>
        },

        refreshChildren: function (nodeElement, callback) {
            ///<summary>Given a NodeElement, uses the childrenSelector to load/reload the children and then updates 
            ///the ChildrenContainer with the newly-read nodes.</summary>
            ///<param name="nodeElement" type="jpvs.Tree.NodeElement">Node element whose children are to be reloaded.</param>
            ///<param name="callback" type="Function">Function with no arguments that will be called at the end of the operation.</param>
        },

        nodeElements: function () {
            ///<summary>Returns the root node elements after databinding.</summary>
            return [];
        }
    }
});


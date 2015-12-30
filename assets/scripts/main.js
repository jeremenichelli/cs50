/*
 * empty - v1.0.0
 * https://github.com/jeremenichelli/empty
 * 2015 (c) Jeremias Menichelli - MIT License
*/

(function(root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory;
    } else {
        root.empty = factory(root);
    }
})(this, function() {
    'use strict';
    return function(el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }

        if (el.innerText) {
            el.innerText = '';
        }
    };
});

/*
 * jabiru - v2.0.1
 * https://github.com/jeremenichelli/jabiru
 * 2014 (c) Jeremias Menichelli - MIT License
*/

(function(root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return factory(root);
        });
    } else if (typeof exports === 'object') {
        module.exports = factory;
    } else {
        root.jabiru = factory(root);
    }
})(this, function() {
    'use strict';

    var cName,
        cNumber,
        query,
        isGlobal = false,
        jabiru = {},
        _doc = document,
        ref = _doc.getElementsByTagName('script')[0] || _doc.head || _doc.body;

    jabiru.get = function(config) {
        // if config object doesn't contain url and
        // a success callback method throw an error
        if (!config || typeof config.url !== 'string' || typeof config.success !== 'function'
                || config.fail && typeof config.fail !== 'function') {
            throw new Error('Invalid option object argument');
        }

        var script = _doc.createElement('script'),
            callbackId = cName + cNumber,
            scope = isGlobal ? window : window.jabiru,
            scopeQuery = isGlobal ? '' : 'jabiru.';

        // increase callback number
        cNumber++;

        // make padding method global
        scope[callbackId] = config.success;

        function onScriptLoaded() { // eslint-disable-line func-style
            // unable callback and data ref
            scope[callbackId] = null;

            // erase script element
            script.parentNode.removeChild(script);
        }

        // attach events
        script.onload = onScriptLoaded;

        if (config.fail) {
            script.onerror = function() {
                config.fail();
                onScriptLoaded();
            };
        }

        script.src = config.url + query + '=' + scopeQuery + callbackId;

        // insert strategy supported on Paul Irish post:
        // http://www.paulirish.com/2011/surefire-dom-element-insertion/
        ref.parentNode.insertBefore(script, ref);
    };

    jabiru.naming = function(str) {
        if (typeof str !== 'string') {
            throw new Error('Callback name must be a string');
        } else {
            cName = str;
            cNumber = 0;
            return jabiru;
        }
    };

    jabiru.query = function(str) {
        if (typeof str !== 'string') {
            throw new Error('Query name must be a string');
        } else {
            query = str;
            return jabiru;
        }
    };

    jabiru.toGlobal = function() {
        isGlobal = true;
        return jabiru;
    };

    // set default configuration
    jabiru.naming('jabiruCallback');
    jabiru.query('?callback');

    return jabiru;
});

/*
 * mnster - v1.2.2
 * https://github.com/jeremenichelli/mnster
 * 2015 (c) Jeremias Menichelli - MIT License
*/

(function(root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory;
    } else {
        root.mnster = factory(root);
    }
})(this, function(root) {
    'use strict';

    var _bindings = {},
        prefixName = 'mns',
        prefix = /^(mns-)/,
        suffix = /(\-[a-zA-Z0-9]+)+/;

    /**
     * gets property given a dotted path or return null
     * @method _getFromModel
     * @param {Object} model
     * @param {String} str
     * @returns {null|*} prop
     */
    var _getFromModel = function(model, str) {
        var props = str.split('.'),
            prop = model;

        for (var i = 0, len = props.length; i < len; i++) {
            if (typeof prop[props[i]] !== 'undefined' && prop[props[i]] !== null) {
                prop = prop[props[i]];
            } else {
                return null;
            }
        }

        return prop;
    };

    /**
     * cleans node content (faster than innerHTML)
     * @method _empty
     * @param {Node} el
     * @returns {undefined}
     */
    var _empty = function(el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }

        if (el.innerText) {
            el.innerText = '';
        }
    };

    /**
     * view constructor
     * @constructor View
     * @param {Object} config
     * @returns {Object}
     */
    var View = function(config) {
        var v = this;

        v.template = config.template;
        v.model = {};
        v.model[config.context] = config.model;
        v.controller = config.controller || root;

        v.bindModel();
    };

    /**
     * gets child nodes from template and binds each one if it's valid
     * @method View.bindModel
     * @returns {undefined}
     */
    View.prototype.bindModel = function() {
        var v = this,
            nodesCount = 0;

        v.nodes = v.template.querySelectorAll('*');

        // check if template node has bindings
        v.bindNode(v.template);

        nodesCount = v.nodes.length;

        while (nodesCount) {
            v.bindNode(v.nodes[--nodesCount]);
        }

        nodesCount = null;
    };

    /**
     * goes through all attributes present in a node and apply bindings
     * @method View.bindNode
     * @param {Node} node
     * @returns {undefined}
     */
    View.prototype.bindNode = function(node) {
        var v = this,
            attrs = node.attributes,
            attrsCount = attrs && attrs.length ? attrs.length : 0,
            // while block variables
            attr,
            name,
            type;

        while (attrsCount) {
            attr = attrs[--attrsCount];
            name = attr.name;
            type = name.replace(prefix, '').replace(suffix, '');

            // applied only if attr starts with `mns` and binding type is supported
            if (prefix.test(name) && _bindings[type]) {
                // wrap binding in a try to not halt rest of the binding process
                try {
                    _bindings[type]({
                        node: node,
                        attribute: attr.name,
                        value: attr.value,
                        valueFromModel: _getFromModel(v.model, attr.value),
                        controller: v.controller
                    });
                } catch (err) {
                    console.log('mnster binding error: ' + err);
                }
            }
        }

        attrs = attrsCount = attr = name = type = null;
    };

    /**
     * goes through all nodes and re-binds everything
     * @method View.update
     * @returns {undefined}
     */
    View.prototype.update = function() {
        var v = this,
            nodesCount = 0;

        // check if template node has bindings
        v.bindNode(v.template);

        nodesCount = v.nodes.length;

        while (nodesCount) {
            v.bindNode(v.nodes[--nodesCount]);
        }

        nodesCount = null;
    };

    /**
     * goes through all attributes present in a node and apply bindings
     * @method _createView
     * @alias mnster.view
     * @param {Node} template
     * @param {Object} options
     * @returns {Object} view
     */
    var _createView = function(template, options) {
        // return if no template is passed
        if (!template || !template.nodeType) {
            throw new Error('mnster.view: You must pass a valid template as a first argument');
        }

        // return if no context and model is passed
        if (!options || !options.context || !options.model) {
            throw new Error('mnster.view: You must specify a context and a model');
        }

        // create and return a new view
        var view = new View({
            template: template,
            context: options.context,
            model: options.model,
            controller: options.controller
        });

        return view;
    };

    /**
     * creates new binding
     * @method _setNewBinding
     * @param {String} name
     * @param {Function} method
     * @returns {undefined}
     */
    var _createNewBinding = function(name, method) {
        if (typeof name !== 'string') {
            throw new Error('mnster.binding: name must be a string');
        }

        if (typeof method !== 'function') {
            throw new Error('mnster.binding: you must specify a method');
        }

        if (_bindings[name]) {
            throw new Error('mnster.binding: a binding with this name already exists');
        }

        _bindings[name] = method;
    };

    /**
     * erase existing binding
     * @method _deleteBinding
     * @param {String} name
     * @returns {undefined}
     */
    var _deleteBinding = function(name) {
        if (typeof name !== 'string') {
            throw new Error('mnster.clean: name must be a string');
        }

        if (_bindings[name]) {
            _bindings[name] = null;
        }
    };

    /**
     * change binding prefix
     * @method _setPrefix
     * @param {String} prfx
     * @returns {undefined}
     */
    var _setPrefix = function(prfx) {
        if (typeof prfx !== 'string' || prfx === '') {
            throw new Error('mnster.prefix: prefix must be a populated string');
        }

        prefixName = prfx;
        prefix = new RegExp('^(' + prfx + ')-');
    };

    // REGISTER BASIC BINDINGS
    _createNewBinding('text', function(context) {
        var node = context.node,
            content = context.valueFromModel,
            prop = node.innerText ? 'innerText' : 'textContent';

        node[prop] = content !== null ? content + '' : '';
    });

    _createNewBinding('html', function(context) {
        var node = context.node,
            content = context.valueFromModel;

        node.innerHTML = content !== null ? content + '' : '';
    });

    _createNewBinding('attr', function(context) {
        var node = context.node,
            attr = context.attribute.replace(prefixName + '-attr-', ''),
            value = context.valueFromModel;

        if (attr && value !== null) {
            node.setAttribute(attr, value + '');
        }
    });

    _createNewBinding('data', function(context) {
        var node = context.node,
            attr = context.attribute.replace(prefixName + '-', ''),
            value = context.valueFromModel;

        if (attr.replace('data-', '') && value !== null) {
            node.setAttribute(attr, value + '');
        }
    });

    _createNewBinding('show', function(context) {
        context.node.style.display = context.valueFromModel ? 'block' : 'none';
    });

    _createNewBinding('hide', function(context) {
        context.node.style.display = context.valueFromModel ? 'none' : 'block';
    });

    _createNewBinding('on', function(context) {
        var method = context.controller[context.value],
            ev = context.attribute.replace(prefixName + '-on-', '');

        function _addEvent (el, ev, fn) { // eslint-disable-line func-style
            if ('addEventListener' in document.body) {
                el.addEventListener(ev, fn, false);
            } else if ('attachEvent' in document.body) {
                el.attachEvent(ev, fn);
            } else {
                el['on' + ev] = fn;
            }
        }

        if (typeof method === 'function') {
            _addEvent(context.node, ev, method);
        }
    });

    _createNewBinding('each', function(context) {
        var node = context.node,
            data = context.valueFromModel,
            tempContext = context.attribute.replace(prefixName + '-each-', ''),
            tempView, // eslint-disable-line no-unused-vars
            tempData,
            tempNode;

        // creates buffer node
        if (!node.__mnsterEachTemplate__) {
            node.__mnsterEachTemplate__ = document.createElement('div');
            node.__mnsterEachTemplate__.innerHTML = node.innerHTML;
        }

        // clears content
        _empty(node);

        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                tempNode = document.createElement('div');
                tempNode.innerHTML = node.__mnsterEachTemplate__.innerHTML;

                // set temporary data
                tempData = data[i] || {};

                // set temporary view
                tempView = new View({
                    template: tempNode,
                    context: tempContext,
                    model: tempData
                });

                node.innerHTML += tempNode.innerHTML;
            }
        }

        tempView = tempData = tempNode = null;
    });

    return {
        view: _createView,
        binding: _createNewBinding,
        clean: _deleteBinding,
        prefix: _setPrefix
    };
});

(function(_win, _doc) {
    'use strict';

    /*
     * aliases
     *
     * _win window global object
     * _doc window.document
     *
     */

    var imgExtension = '.png',
        imgBasePath = 'assets/img/',
        geocoder,
        timer;

    jabiru
        .query('&callback')
        .naming('cs50project');

    mnster.binding('round', function(context) {
        context.node.textContent = parseInt(context.valueFromModel);
    });

    mnster.binding('fahr', function(context) {
        context.node.textContent = parseInt(APP.toFahrenheit(context.valueFromModel));
    });

    // APP NAMESPACE
    var APP = {};

    // TEMPLATES
    var templates = {
        message: _doc.getElementById('message-template'),
        searchResults: _doc.getElementById('search-results-template'),
        weather: _doc.getElementById('weather-template')
    };

    // VIEWS
    var views = {
        message: _doc.getElementById('message-view'),
        searchResults: _doc.getElementById('search-results-view'),
        weather: _doc.getElementById('weather-view')
    };

    // COMPONENTS
    var components = {
        body: _doc.body,
        searchInput: _doc.getElementById('search-input'),
        searchClear: _doc.getElementById('clear-search')
    };

    /*
     * Render content from template into view
     */
    APP.render = function(name, data) {
        var temp = _doc.importNode(templates[name].content, true);

        mnster.view(temp, { context: name, model: data, controller: APP });

        // clean previous content
        empty(views[name]);

        views[name].appendChild(temp);
    };

    /*
     * Search using Google Maps API and display results
     */
    APP.fetchCities = function(address) {
        if (address.length) {
            geocoder.geocode({ 'address': address }, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {                        
                    APP.render('searchResults', { list: results.filter(function(place) {
                        // parse coords
                        place.geometry.location.lat = place.geometry.location.lat();
                        place.geometry.location.lng = place.geometry.location.lng();

                        return ~place.types.indexOf('locality');
                    }) });

                }
            });
        } else {
            empty(views.searchResults);
        }
    };

    /*
     * Get forecast using Dark Sky API and display results
     */
    APP.fetchWeather = function() {
        var lat = this.dataset.lat,
            lng = this.dataset.lng,
            place = this.textContent;

        jabiru.get({
            url: 'https://api.forecast.io/forecast/d2f10d30cba4c573db84bdb9a65a34b6/' + lat + ',' + lng + '?units=si',
            success: function(data) {
                // add city name in data
                data.place = place;

                APP.processWeatherData(data);
                
                // render weather view and show panel
                APP.render('weather', data);
                APP.hideMessage()

                views.weather.classList.add('visible');
            }
        });
    };

    // Convert celsius to fahrenheit
    APP.toFahrenheit = function(num) {
        return num * 9 / 5 + 32;
    }

    /*
     * Toggle class on body to change temp units
     */
    APP.changeUnits = function(e) {
        e.preventDefault();
        // toggle classes on body
        components.body.classList.toggle('us');
    };

    /*
     * Prepares weather data for simpler binding
     */
    APP.processWeatherData = function(weather) {
        var d;

        // use only next four days
        weather.daily.data = weather.daily.data.slice(1, 5);

        // add extension to icon for currently weather
        weather.currently.icon = imgBasePath + weather.currently.icon + imgExtension;

        weather.currently.humidity = weather.currently.humidity * 100 + '%';
        weather.currently.precipProbability = weather.currently.precipProbability * 100 + '%';

        // set short day names
        weather.daily.data.forEach(function(item) {
            d = new Date();
            d.setTime(item.time * 1000);
            item.day = d.toUTCString().split(',')[0];

            // add extension to icon for item
            item.icon = imgBasePath + item.icon + imgExtension;
        });

        d = null;
    };

    /*
     * Displays message
     */
    APP.showMessage = function(content) {
        content.title = content.title || '';
        content.body = content.body || '';

        APP.render('message', content);
        views.message.classList.add('visible');
    };

    /*
     * Hides message
     */
    APP.hideMessage = function(content) {
        views.message.classList.remove('visible');
    };

    /*
     * Initialize app
     */
    function initApp() {
        geocoder = new google.maps.Geocoder();

        window.APP = APP;

        components.searchInput.addEventListener('keyup', function() {
            var action = this.value ? 'add' : 'remove';
            components.body.classList[action]('searching');

            // clear timer
            clearTimeout(timer);

            // fetch cities after 250ms without typing
            timer = setTimeout(APP.fetchCities.bind(APP, this.value), 200);
        });

        components.searchInput.addEventListener('blur', function(e) {
            components.body.classList.remove('searching');
        });

        components.searchInput.addEventListener('focus', function() {
            if (this.value) {
                components.body.classList.add('searching');
                APP.fetchCities(this.value);
            }
        });

        components.searchClear.addEventListener('click', function(e) {
            e.preventDefault();
            components.searchInput.value = '';
            empty(views.searchResults);
        });

        // listen to clicks over results
        components.body.addEventListener('click', function(e) {
            if (e.target.classList.contains('search-result-item')) {
                e.preventDefault();

                // hide weather panel and clear search results
                views.weather.classList.remove('visible');
                empty(views.searchResults);
                components.searchInput.value = '';

                components.body.classList.remove('searching');

                APP.showMessage({
                    title: 'Getting weather info for',
                    body: e.target.textContent
                });

                APP.fetchWeather.call(e.target);
            }
        }, false);
    }

    // init app on load
    window.addEventListener('load', initApp, false);

})(window, document);

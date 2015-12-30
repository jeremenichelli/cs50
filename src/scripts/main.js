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

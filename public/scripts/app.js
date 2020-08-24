(function () {
    'use strict';

    var app = {
        isLoading: true,
        visibleCards: {},
        selectedTimetables: [],
        spinner: document.querySelector('.loader'),
        cardTemplate: document.querySelector('.cardTemplate'),
        container: document.querySelector('.main'),
        addDialog: document.querySelector('.dialog-container'),
        timeExpiryCache: 5 // en Minutos
    };


    /*****************************************************************************
     *
     * Event listeners for UI elements
     *
     ****************************************************************************/

    document.getElementById('butRefresh').addEventListener('click', function () {
        // Refresh all of the metro stations
        app.updateSchedules();
    });

    document.getElementById('butAdd').addEventListener('click', function () {
        // Open/show the add new station dialog
        app.toggleAddDialog(true);
    });

    document.getElementById('butAddCity').addEventListener('click', function () {


        var select = document.getElementById('selectTimetableToAdd');
        var selected = select.options[select.selectedIndex];
        var key = selected.value;
        var label = selected.textContent;
        if (!app.selectedTimetables) {
            app.selectedTimetables = [];
        }
        console.log("PROCEDER a PINTAR otro CARD")
        app.getSchedule(key, label);
        app.selectedTimetables.push({key: key, label: label});
        app.toggleAddDialog(false);
    });

    document.getElementById('butAddCancel').addEventListener('click', function () {
        // Close the add new station dialog
        app.toggleAddDialog(false);
    });


    /*****************************************************************************
     *
     * Methods to update/refresh the UI
     *
     ****************************************************************************/

    // Toggles the visibility of the add new station dialog.
    app.toggleAddDialog = function (visible) {
        if (visible) {
            app.addDialog.classList.add('dialog-container--visible');
        } else {
            app.addDialog.classList.remove('dialog-container--visible');
        }
    };

    // Updates a timestation card with the latest weather forecast. If the card
    // doesn't already exist, it's cloned from the template.

    app.updateTimetableCard = function (data) {

        console.log("[updateTimetableCard] Iniciando")
        
        var key = data.key;

        var dataLastUpdated = new Date(data.created);
        var schedules = data.schedules;
        var card = app.visibleCards[key];

       

        if (!card) {
            var label = data.label.split(', ');
            var title = label[0];
            var subtitle = label[1];
            card = app.cardTemplate.cloneNode(true);
            card.classList.remove('cardTemplate');
            card.querySelector('.label').textContent = title;
            card.querySelector('.subtitle').textContent = subtitle;
            card.removeAttribute('hidden');
            app.container.appendChild(card);
            app.visibleCards[key] = card;
        }
        card.querySelector('.card-last-updated').textContent = data.created;

        var scheduleUIs = card.querySelectorAll('.schedule');
        for(var i = 0; i<4; i++) {
            var schedule = schedules[i];
            var scheduleUI = scheduleUIs[i];
            if(schedule && scheduleUI) {
                scheduleUI.querySelector('.message').textContent = schedule.message;
            }
        }

        if (app.isLoading) {
            app.spinner.setAttribute('hidden', true);
            app.container.removeAttribute('hidden');
            app.isLoading = false;
        }
    };

    /*****************************************************************************
     *
     * Methods for dealing with the model
     *
     ****************************************************************************/


    app.getSchedule = function (key, label) {
        var url = 'https://api-ratp.pierre-grimaud.fr/v3/schedules/' + key;
        console.log("[getSchedule] Iniciando")
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    console.log("[getSchedule] Estado de petición 200")
                    var response = JSON.parse(request.response);
                    var result = {};
                    result.key = key;
                    result.label = label;
                    result.created = response._metadata.date;
                    result.schedules = response.result.schedules;
                    
                    console.log("result")
                    console.log(result)
                    console.log("[getSchedule] pasando a [updateTimetableCard]")
                    
                    app.updateTimetableCard(result);
                    
                    app.visibleCards[key]=document.querySelector(".main").lastChild;

                    

                    // 1. Debo preguntar si hay caché para almacenar 
                    var historyCache=localStorage.getItem("visibleCards");
                    
                    if(historyCache!==null)
                    {
                        console.log("HAY CACHé")
                    // 1. Si hay caché, almaceno otro item card

                        // 2. Obtener caché
                        
                        // 2.1 Convertir a Array
                        var jsonHistoryCache=JSON.parse(historyCache)
                        // 2.2 Agregar nuevo card
                        jsonHistoryCache[key] = app.visibleCards[key].innerHTML;
                        // 2.3 Almacenar otra vez en caché 

                        var dato = {};
                        var dateCached = {};
                        dateCached["created_at"]=Date.now();
                        var contentCached = {};
                        contentCached["html"]=app.visibleCards[key].innerHTML;

                        jsonHistoryCache[key]={dateCached, contentCached}

                        localStorage.setItem("visibleCards",JSON.stringify(jsonHistoryCache))

                    } else {
                        // 1. Si no, almaceno uno solo
                        console.log("No caché")

                        var dato = {};
                        var dateCached = {};
                        dateCached["created_at"]=Date.now();
                        var contentCached = {};
                        contentCached["html"]=app.visibleCards[key].innerHTML;

                        dato[`${key}`] = { dateCached, contentCached }
                        
                        localStorage.setItem("visibleCards",JSON.stringify(dato))
                    }
                    
                    
                    
                }
            } else {
                // Return the initial weather forecast since no data is available.
                app.updateTimetableCard(initialStationTimetable);                
                 
            }
        };
        request.open('GET', url);
        request.send();
    };

    app.getScheduleFromCache = function(key) {
        //console.log(`key desde getScheduleFromCache ${key}`)
        var url = 'https://api-ratp.pierre-grimaud.fr/v3/schedules/' + key;
        if (!('caches' in window)) {
            return null;
        }
        //console.log("Continuando desde cache")
        return caches.match(url)
            .then((response)=>{
                //console.log("response")
                if(response) {
                    //console.log('retornando response.json')
                    return response.json()
                }
                return null;
            }).catch((err) => {
                //console.log(`${err}`)
                return null;
              });
    }

    app.getLabelOfKey = function (keyk) {
        var optionsSelect=document.querySelector("#selectTimetableToAdd").children;
        for(let key in optionsSelect) {
            if(optionsSelect[key].value===keyk)
                return optionsSelect[key].text;
        }
        return null;
    }

    // Iterate all of the cards and attempt to get the latest timetable data
    app.updateSchedules = function () {
        console.log('[updateSchedules] Iniciando')
        var dataCache = JSON.parse(localStorage.getItem("visibleCards"));
        // var divTemp = document.createElement("div");
        // divTemp.className="card"
        

        if(dataCache!==null) {           
            for(var item in dataCache) {  
                var divTemp = document.createElement("div");
                divTemp.className="card"

                var timestampCache = dataCache[item]['dateCached']['created_at'];
                
                divTemp.innerHTML=dataCache[item]['contentCached']['html']
                app.visibleCards[item] = divTemp; //JSON.parse(dataCache)[item]

                var minCached  = (Date.now()-timestampCache)/1000/60;
            
                if(minCached>app.timeExpiryCache) {
                    localStorage.removeItem("visibleCards")
                    app.visibleCards = {}
                } else {
                    app.container.appendChild(divTemp);
                }
            }
            
            
        }
        
        // if(dataCache!==null) {           
        //     for(var item in dataCache) {                
        //         var timestampCache = dataCache[item]['dateCached']['created_at'];
                
        //         divTemp.innerHTML=dataCache[item]['contentCached']['html']
        //         app.visibleCards[item] = divTemp; //JSON.parse(dataCache)[item]
        //     }
        //     var minCached  = (Date.now()-timestampCache)/1000/60;
            
        //     if(minCached>app.timeExpiryCache) {
        //         localStorage.removeItem("visibleCards")
        //         app.visibleCards = {}
        //     } else {
        //         app.container.appendChild(divTemp);
        //     }
            
        // }
            
        
        var keys = Object.keys(app.visibleCards);
        console.log(`keys ${keys}`)
        keys.forEach(function (key) {
            
            var label = app.getLabelOfKey(key);
            
            app.getScheduleFromCache(key)
                    .then(jsonCache=>{
                        
                        var result = {};
                        result.key = key;
                        result.label = label;
                        result.created = "";
                        result.schedules = jsonCache.result;
                        
                        app.updateTimetableCard(result);
                        
                    })
        });

        
        if(keys.length===0 && localStorage.getItem("visibleCards")===null){
            app.getSchedule('metros/1/bastille/A', 'Bastille, Direction La Défense'); 
        } 
       
    };

    /*
     * Fake timetable data that is presented when the user first uses the app,
     * or when the user has not saved any stations. See startup code for more
     * discussion.
     */

    var initialStationTimetable = {

        key: 'metros/1/bastille/A',
        label: 'Bastille, Direction La Défense',
        created: '2017-07-18T17:08:42+02:00',
        schedules: [
            {
                message: '0 mn'
            },
            {
                message: '2 mn'
            },
            {
                message: '5 mn'
            }
        ]


    };


    /************************************************************************
     *
     * Code required to start the app
     *
     * NOTE: To simplify this codelab, we've used localStorage.
     *   localStorage is a synchronous API and has serious performance
     *   implications. It should not be used in production applications!
     *   Instead, check out IDB (https://www.npmjs.com/package/idb) or
     *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c)
     ************************************************************************/

    
    
    app.updateSchedules();

    app.selectedTimetables = [
        {key: initialStationTimetable.key, label: initialStationTimetable.label}
    ];
})();
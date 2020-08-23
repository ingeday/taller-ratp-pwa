/*
 * @license
 * Your First PWA Codelab (https://g.co/codelabs/pwa)
 * Copyright 2019 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License
 */
'use strict';

// CODELAB: Update cache names any time any of the cached files change.
const CACHE_NAME = 'static-cache-v13';
const DATA_CACHE_NAME = 'data-cache-v11';

// CODELAB: Add list of files to cache here.
const FILES_TO_CACHE = [
   '/',
   '/offline.html',
   '/index.html',
   '/styles/inline.css',
   '/scripts/install.js',
   'scripts/app.js',
   '/images/ic_refresh_white_24px.svg',
   '/images/ic_add_white_24px.svg',
   '/manifest.json',
   '/images/android-launchericon-144-144.png'
];

self.addEventListener('install', (evt) => {
    console.log('[ServiceWorker] Installed');
    evt.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[ServiceWorker] Pre-caching offline page');
        return cache.addAll(FILES_TO_CACHE);
      })
    );
    
    self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
    console.log('[ServiceWorker] Activate');
    evt.waitUntil(
        caches.keys().then((keyList) => {
            
            return Promise.all(keyList.map((key) => {
                console.log(`Recorriendo ${key}`)
                if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                    console.log(`Eliminando ${key}`)
                    return caches.delete(key);
                } 
            }));
        })
    );
  
    self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  console.log('[ServiceWorker] Fetch', evt.request.url);

    if(evt.request.url.includes('/schedules')) {
        console.log('[ServiceWorker] Fetch (data)', evt.request.url);
        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then((cache) => {
                return fetch(evt.request)
                    .then((response)=>{
                        
                        if(response.status===200) {
                            cache.put(evt.request.url, response.clone())
                        }
                        return response;
                    }).catch(err=>{
                        return cache.match(evt.request)
                    })
            })
        );
        return;
    }

    evt.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Opening cache ",CACHE_NAME)
            
            return cache.match(evt.request)
                .then((response) => {
                    console.log('Return response o fetch')
                    return response || fetch(evt.request);
                }).catch(()=>{
                    console.log("Error")
                    return;
                });
        }).catch(err=>{
            console.log(`Error ${err}`);
        })
    );
  
});

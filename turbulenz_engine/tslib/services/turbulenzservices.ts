// Copyright (c) 2011-2013 Turbulenz Limited

/*global BadgeManager: false*/
/*global window: false*/
/*global GameSession: false*/
/*global TurbulenzBridge: false*/
/*global TurbulenzEngine: false*/
/*global Utilities: false*/
/*global MappingTable: false*/
/*global LeaderboardManager: false*/
/*global ServiceRequester: false*/
/*global MultiPlayerSessionManager: false*/
/*global Observer*/
/*global StoreManager: false*/
/*global NotificationsManager: false*/
/*global debug: false*/

interface UserProfile
{
    username    : string;
    displayname : string;
    language    : string;
    country     : string;
    age         : number;
    anonymous   : boolean;
    guest       : boolean;
};

interface UserProfileReceivedCB
{
    (userProfile: UserProfile): void;
};

/// Called when the user has upgraded from a guest or anonymous
/// account to a full one.  This callback does not guarantee that the
/// upgrade complete successfully, so TurbulenzServices should be
/// required for a new UserProfile object to check the updated status
/// of the user.
interface UserUpgradeCB
{
    (): void;
}

class CustomMetricEvent
{
    key: string;
    value: any;
    timeOffset: number;

    static create() : CustomMetricEvent
    {
        return new CustomMetricEvent();
    }
};

class CustomMetricEventBatch
{
    events: CustomMetricEvent[];

    push(key: string, value: any)
    {
        var event = CustomMetricEvent.create();
        event.key = key;
        event.value = value;
        event.timeOffset = TurbulenzEngine.time;
        this.events.push(event);
    }

    length() : number
    {
        return this.events.length;
    }

    clear()
    {
        this.events.length = 0;
    }

    static create() : CustomMetricEventBatch
    {
        var batch = new CustomMetricEventBatch();
        batch.events = [];
        return batch;
    }
};

interface ServiceResponse
{
    ok   : boolean;
    msg  : string;
    data : any;
};

interface ServiceRequestParams
{
    url                 : string;
    method              : string;
    data?               : any;
    callback            : { (response: ServiceResponse,
                             status: number): void; };
    requestHandler      : RequestHandler;
    neverDiscard?       : boolean;
};

interface ServiceErrorCB
{
    (errorMsg: string, httpStatus?: number): void;
}

// -----------------------------------------------------------------------------
// ServiceRequester
// -----------------------------------------------------------------------------

class ServiceRequester
{
    static locationOrigin : string;
    running               : boolean;
    discardRequests       : boolean;
    serviceStatusObserver : Observer;
    serviceName           : string;
    onServiceUnavailable  : { (service: ServiceRequester, callCtx?: any)
                              : void; };
    onServiceAvailable    : { (service: ServiceRequester, callCtx?: any)
                              : void; };

    // make a request if the service is available. Same parameters as an
    // Utilities.ajax call with extra argument:
    //     neverDiscard - Never discard the request. Always queues the request
    //                    for when the service is again available. (Ignores
    //                    server preference)
    request(params, serviceAction? : string)
    {
        // If there is a specific services domain set prefix any relative api urls
        var servicesDomain = TurbulenzServices.servicesDomain;
        if (servicesDomain)
        {
            if (params.url.indexOf('http') !== 0)
            {
                if (params.url[0] === '/')
                {
                    params.url = servicesDomain + params.url;
                }
                else
                {
                    params.url = servicesDomain + '/' + params.url;
                }
            }
            if (window.location)
            {
                if (servicesDomain !== ServiceRequester.locationOrigin)
                {
                    params.enableCORSCredentials = true;
                }
            }
        }

        // If the bridgeServices are available send to call
        if (TurbulenzServices.bridgeServices)
        {
            //TurbulenzServices.addSignature(dataSpec, url);
            var processed = TurbulenzServices.callOnBridge(serviceAction ? serviceAction : params.url, params,
                function unpackResponse(response)
                {
                    if (params.callback)
                    {
                        params.callback(response, response.status);
                    }
                });
            // Processed indicates we are offline and the bridge has fully dealt with the service call
            if (processed)
            {
                return true;
            }
        }

        var discardRequestFn = function discardRequestFn()
        {
            if (params.callback)
            {
                params.callback({'ok': false, 'msg': 'Service Unavailable. Discarding request'}, 503);
            }
        };

        var that = this;
        var serviceStatusObserver = this.serviceStatusObserver;

        var onServiceStatusChange;
        onServiceStatusChange = function onServiceStatusChangeFn(running, discardRequest)
        {
            if (discardRequest)
            {
                if (!params.neverDiscard)
                {
                    serviceStatusObserver.unsubscribe(onServiceStatusChange);
                    discardRequestFn();
                }
            }
            else if (running)
            {
                serviceStatusObserver.unsubscribe(onServiceStatusChange);
                that.request(params);
            }
        };

        if (!this.running)
        {
            if (this.discardRequests && !params.neverDiscard)
            {
                TurbulenzEngine.setTimeout(discardRequestFn, 0);
                return false;
            }

            // we check waiting so that we don't get into an infinite loop of callbacks
            // when a service goes down, then up and then down again before the subscribed
            // callbacks have all been called.
            if (!params.waiting)
            {
                params.waiting = true;
                serviceStatusObserver.subscribe(onServiceStatusChange);
            }
            return true;
        }

        var oldResponseFilter = params.responseFilter;
        params.responseFilter = function checkServiceUnavailableFn(callContext, makeRequest, responseJSON, status)
        {
            if (status === 503)
            {
                var responseObj = JSON.parse(responseJSON);
                var statusObj = responseObj.data;
                var discardRequests = (statusObj ? statusObj.discardRequests : true);
                that.discardRequests = discardRequests;

                if (discardRequests && !params.neverDiscard)
                {
                    discardRequestFn();
                }
                else
                {
                    serviceStatusObserver.subscribe(onServiceStatusChange);
                }
                TurbulenzServices.serviceUnavailable(that, callContext);
                // An error occurred so return false to avoid calling the success callback
                return false;
            }

            if (status === 403)
            {
                var responseObj = JSON.parse(responseJSON);
                var statusObj = responseObj.data;
                if (statusObj && statusObj.invalidGameSession)
                {
                    if (TurbulenzServices.onGameSessionClosed)
                    {
                        TurbulenzServices.onGameSessionClosed();
                    }
                    else
                    {
                        Utilities.log('Game session closed');
                    }
                    return false;
                }
            }

            // call the old custom error handler
            if (oldResponseFilter)
            {
                return oldResponseFilter.call(params.requestHandler, callContext, makeRequest, responseJSON, status);
            }
            return true;
        };

        Utilities.ajax(params);
        return true;
    }

    static create(serviceName: string, params?): ServiceRequester
    {
        // If the ServiceRequest locationOrigin hasn't been set yet then set it.
        if (typeof(ServiceRequester.locationOrigin) === undefined &&
            typeof(window.location) !== undefined)
        {
            ServiceRequester.locationOrigin = window.location.protocol + '//' + window.location.host;
        }

        var serviceRequester = new ServiceRequester();

        if (!params)
        {
            params = {};
        }

        // we assume everything is working at first
        serviceRequester.running = true;
        serviceRequester.discardRequests = false;
        serviceRequester.serviceStatusObserver = Observer.create();

        serviceRequester.serviceName = serviceName;

        serviceRequester.onServiceUnavailable = params.onServiceUnavailable;
        serviceRequester.onServiceAvailable = params.onServiceAvailable;

        return serviceRequester;
    }
};

//
// TurbulenzServices
//
class TurbulenzServices
{

    static onGameSessionClosed: { () : void; };

    static multiplayerJoinRequestQueue = {

        // A FIFO queue that passes events through to the handler when
        // un-paused and buffers up events while paused

        argsQueue: [],
        /* tslint:disable:no-empty */
        handler: function nopFn() {},
        /* tslint:enable:no-empty */
        context: <any>undefined,
        paused: true,
        onEvent: function onEventFn(handler, context) {
            this.handler = handler;
            this.context = context;
        },
        push: function pushFn(sessionId)
        {
            var args = [sessionId];
            if (this.paused)
            {
                this.argsQueue.push(args);
            }
            else
            {
                this.handler.apply(this.context, args);
            }
        },
        shift: function shiftFn()
        {
            var args = this.argsQueue.shift();
            return args ? args[0] : undefined;
        },
        clear: function clearFn()
        {
            this.argsQueue = [];
        },
        pause: function pauseFn()
        {
            this.paused = true;
        },
        resume: function resumeFn()
        {
            this.paused = false;
            while (this.argsQueue.length)
            {
                this.handler.apply(this.context, this.argsQueue.shift());
                if (this.paused)
                {
                    break;
                }
            }
        }
    };

    static bridgeServices : boolean;
    static mode : string;
    static servicesDomain : string;
    static offline : boolean;
    static syncing : boolean;

    static available() : boolean
    {
        return window.gameSlug !== undefined;
    }

    static responseHandlers: any[]; // TODO
    static responseIndex: number;

    static addBridgeEvents()
    {
        var turbulenz = window.Turbulenz;
        if (!turbulenz)
        {
            try
            {
                turbulenz = window.top.Turbulenz;
            }
            /* tslint:disable:no-empty */
            catch (e)
            {
            }
            /* tslint:enable:no-empty */
        }
        var turbulenzData = (turbulenz && turbulenz.Data) || {};
        var sessionToJoin = turbulenzData.joinMultiplayerSessionId;
        var that = this;

        var onJoinMultiplayerSession = function onJoinMultiplayerSessionFn(joinMultiplayerSessionId) {
            that.multiplayerJoinRequestQueue.push(joinMultiplayerSessionId);
        };

        var onReceiveConfig = function onReceiveConfigFn(configString) {
            var config = <TurbulenzBridgeConfig>(JSON.parse(configString));

            if (config.mode)
            {
                that.mode = config.mode;
            }

            if (config.joinMultiplayerSessionId)
            {
                that.multiplayerJoinRequestQueue.push(config.joinMultiplayerSessionId);
            }

            that.bridgeServices = !!config.bridgeServices;

            if (config.servicesDomain)
            {
                that.servicesDomain = config.servicesDomain;
            }

            if (config.syncing)
            {
                that.syncing = true;
            }
            if (config.offline)
            {
                that.offline = true;
            }
        };

        // This should go once we have fully moved to the new system
        if (sessionToJoin)
        {
            this.multiplayerJoinRequestQueue.push(sessionToJoin);
        }

        TurbulenzBridge.setOnMultiplayerSessionToJoin(onJoinMultiplayerSession);
        TurbulenzBridge.setOnReceiveConfig(onReceiveConfig);
        TurbulenzBridge.triggerRequestConfig();

        // Setup framework for asynchronous function calls
        this.responseHandlers = [null];
        // 0 is reserved value for no registered callback
        this.responseIndex = 0;
        TurbulenzBridge.on("bridgeservices.response", function (jsondata) { that.routeResponse(jsondata); });
        TurbulenzBridge.on("bridgeservices.sync.start", function () { that.syncing = true; });
        TurbulenzBridge.on("bridgeservices.sync.end", function () { that.syncing = false; });
        TurbulenzBridge.on("bridgeservices.offline.start", function () { that.offline = true; });
        TurbulenzBridge.on("bridgeservices.offline.end", function () { that.offline = false; });
    }

    static callOnBridge(event, data, callback) : boolean
    {
        var request = {
            data: data,
            key: undefined
        };
        if (callback)
        {
            this.responseIndex += 1;
            this.responseHandlers[this.responseIndex] = callback;
            request.key = this.responseIndex;
        }
        var resultJSON = TurbulenzBridge.emit('bridgeservices.' + event,
                                              JSON.stringify(request));
        return resultJSON && JSON.parse(resultJSON).fullyProcessed;
    }

    static addSignature(data, url)
    {
        var str;
        data.requestUrl = url;
        str = TurbulenzEngine.encrypt(JSON.stringify(data));
        data.str = str;
        data.signature = TurbulenzEngine.generateSignature(str);
        return data;
    }

    static routeResponse(jsondata)
    {
        var response = JSON.parse(jsondata);
        var index = response.key || 0;
        var callback = this.responseHandlers[index];
        if (callback)
        {
            this.responseHandlers[index] = null;
            callback(response.data);
        }
    }

    /* tslint:disable:no-empty */
    static defaultErrorCallback : ServiceErrorCB =
        function(errorMsg: string, httpStatus?: number)
    {
    };

    static onServiceUnavailable(serviceName: string, callContext?)
    {
    }

    static onServiceAvailable(serviceName: string, callContext?)
    {
    }
    /* tslint:enable:no-empty */

    static createGameSession(requestHandler, sessionCreatedFn, errorCallbackFn?, options?)
    {
        return GameSession.create(requestHandler, sessionCreatedFn,
                                  errorCallbackFn, options);
    }

    static createMappingTable(requestHandler, gameSession,
                              tableReceivedFn,
                              defaultMappingSettings?,
                              errorCallbackFn?) : MappingTable
    {
        var mappingTable;
        var mappingTableSettings = gameSession && gameSession.mappingTable;

        var mappingTableURL;
        var mappingTablePrefix;
        var assetPrefix;

        if (mappingTableSettings)
        {
            mappingTableURL = mappingTableSettings.mappingTableURL;
            mappingTablePrefix = mappingTableSettings.mappingTablePrefix;
            assetPrefix = mappingTableSettings.assetPrefix;
        }
        else if (defaultMappingSettings)
        {
            mappingTableURL = defaultMappingSettings.mappingTableURL ||
                (defaultMappingSettings.mappingTableURL === "" ? "" : "mapping_table.json");
            mappingTablePrefix = defaultMappingSettings.mappingTablePrefix ||
                (defaultMappingSettings.mappingTablePrefix === "" ? "" : "staticmax/");
            assetPrefix = defaultMappingSettings.assetPrefix ||
                (defaultMappingSettings.assetPrefix === "" ? "" : "missing/");
        }
        else
        {
            mappingTableURL = "mapping_table.json";
            mappingTablePrefix = "staticmax/";
            assetPrefix = "missing/";
        }

        // If there is an error, inject any default mapping data and
        // inform the caller.

        var mappingTableErr = function mappingTableErrFn(msg)
        {
            var mapping = defaultMappingSettings &&
                (defaultMappingSettings.urnMapping || {});
            var errorCallback = errorCallbackFn ||
                TurbulenzServices.defaultErrorCallback;

            mappingTable.setMapping(mapping);
            errorCallback(msg);
        };

        var mappingTableParams : MappingTableParameters = {
            mappingTableURL: mappingTableURL,
            mappingTablePrefix: mappingTablePrefix,
            assetPrefix: assetPrefix,
            requestHandler: requestHandler,
            onload: tableReceivedFn,
            errorCallback: mappingTableErr
        };

        mappingTable = MappingTable.create(mappingTableParams);
        return mappingTable;
    }

    static createLeaderboardManager(requestHandler, gameSession,
                                    leaderboardMetaReceived?,
                                    errorCallbackFn?) : LeaderboardManager
    {
        return LeaderboardManager.create(requestHandler, gameSession,
                                         leaderboardMetaReceived,
                                         errorCallbackFn);
    }

    static createBadgeManager(requestHandler: RequestHandler,
                              gameSession: GameSession) : BadgeManager
    {
        return BadgeManager.create(requestHandler, gameSession);
    }

    static createStoreManager(requestHandler, gameSession, storeMetaReceived?,
                              errorCallbackFn?) : StoreManager
    {
        return StoreManager.create(requestHandler,
                                   gameSession,
                                   storeMetaReceived,
                                   errorCallbackFn);
    }

    static createNotificationsManager(requestHandler, gameSession, successCallbackFn, errorCallbackFn)
    : NotificationsManager
    {
        return NotificationsManager.create(requestHandler, gameSession, successCallbackFn, errorCallbackFn);
    }

    static createMultiplayerSessionManager(requestHandler, gameSession)
    : MultiPlayerSessionManager
    {
        return MultiPlayerSessionManager.create(requestHandler, gameSession);
    }

    static createUserProfile(requestHandler: RequestHandler,
                             profileReceivedFn?: UserProfileReceivedCB,
                             errorCallbackFn?): UserProfile
    {
        var userProfile = <UserProfile><any>{};

        if (!errorCallbackFn)
        {
            errorCallbackFn = TurbulenzServices.defaultErrorCallback;
        }

        var loadUserProfileCallback =
            function loadUserProfileCallbackFn(userProfileData)
        {
            if (userProfileData && userProfileData.ok)
            {
                userProfileData = userProfileData.data;
                var p;
                for (p in userProfileData)
                {
                    if (userProfileData.hasOwnProperty(p))
                    {
                        userProfile[p] = userProfileData[p];
                    }
                }
            }
        };

        var url = '/api/v1/profiles/user';
        // Can't request files from the hard disk using AJAX
        if (TurbulenzServices.available())
        {
            this.getService('profiles').request({
                url: url,
                method: 'GET',
                callback: function createUserProfileAjaxErrorCheck(jsonResponse, status)
                {
                    if (status === 200)
                    {
                        loadUserProfileCallback(jsonResponse);
                    }
                    else if (errorCallbackFn)
                    {
                        errorCallbackFn("TurbulenzServices.createUserProfile error with HTTP status " + status + ": " +
                                        jsonResponse.msg, status);
                    }
                    if (profileReceivedFn)
                    {
                        profileReceivedFn(userProfile);
                    }
                },
                requestHandler: requestHandler
            }, 'profile.user');
        }
        else
        {
            // No Turbulenz services.  Make the error callback
            // asynchronously.

            TurbulenzEngine.setTimeout(function () {
                errorCallbackFn("Error: createUserProfile: Turbulenz Services "
                                + "unavailable");
            }, 0.001);
        }

        return userProfile;
    }

    // This should only be called if UserProfile.anonymous is true.
    static upgradeAnonymousUser(upgradeCB: UserUpgradeCB)
    {
        if (upgradeCB)
        {
            var onUpgrade = function onUpgradeFn(_signal: string)
            {
                upgradeCB();
            };
            TurbulenzBridge.on('user.upgrade.occurred', onUpgrade);
        }

        TurbulenzBridge.emit('user.upgrade.show');
    }

    static sendCustomMetricEvent(eventKey: string,
                                 eventValue: any,
                                 requestHandler: RequestHandler,
                                 gameSession: GameSession,
                                 errorCallbackFn?)
    {
        if (!errorCallbackFn)
        {
            errorCallbackFn = TurbulenzServices.defaultErrorCallback;
        }

        // defaultErrorCallback should never be null, so this should
        // hold.
        debug.assert(errorCallbackFn, "no error callback");

        if (!TurbulenzServices.available())
        {
            errorCallbackFn("TurbulenzServices.sendCustomMetricEvent " +
                            "failed: Service not available", 0);
            return;
        }

        // Validation

        if (('string' !== typeof eventKey) || (0 === eventKey.length))
        {
            errorCallbackFn("TurbulenzServices.sendCustomMetricEvent " +
                            "failed: Event key must be a non-empty string",
                            0);
            return;
        }

        if ('number' !== typeof eventValue ||
            isNaN(eventValue) ||
            !isFinite(eventValue))
        {
            if ('[object Array]' !== Object.prototype.toString.call(eventValue))
            {
                errorCallbackFn("TurbulenzServices.sendCustomMetricEvent " +
                                "failed: Event value must be a number or " +
                                "an array of numbers", 0);
                return;
            }

            var i, valuesLength = eventValue.length;
            for (i = 0; i < valuesLength; i += 1)
            {
                if ('number' !== typeof eventValue[i] || isNaN(eventValue[i]) ||
                    !isFinite(eventValue[i]))
                {
                    errorCallbackFn("TurbulenzServices.sendCustomMetricEvent " +
                                    "failed: Event value array elements must " +
                                    "be numbers", 0);
                    return;
                }
            }
        }

        this.getService('customMetrics').request({
            url: '/api/v1/custommetrics/add-event/' + gameSession.gameSlug,
            method: 'POST',
            data: {
                'key': eventKey,
                'value': eventValue,
                'gameSessionId': gameSession.gameSessionId
            },
            callback:
            function sendCustomMetricEventAjaxErrorCheck(jsonResponse, status)
            {
                if (status !== 200)
                {
                    errorCallbackFn("TurbulenzServices.sendCustomMetricEvent " +
                                    "error with HTTP status " + status + ": " +
                                    jsonResponse.msg, status);
                }
            },
            requestHandler: requestHandler,
            encrypt: true
        }, 'custommetrics.addevent');
    }

    static sendCustomMetricEventBatch(eventBatch: CustomMetricEventBatch,
                                      requestHandler: RequestHandler,
                                      gameSession: GameSession,
                                      errorCallbackFn?)
    {
        if (!errorCallbackFn)
        {
            errorCallbackFn = TurbulenzServices.defaultErrorCallback;
        }

        if (!TurbulenzServices.available())
        {
            if (errorCallbackFn)
            {
                errorCallbackFn("TurbulenzServices.sendCustomMetricEventBatch failed: Service not available",
                                0);
            }
            return;
        }

        // Validation

        // Test eventBatch is correct type
        var currentTime = TurbulenzEngine.time;
        var events = eventBatch.events;
        var eventIndex;
        var numEvents = events.length;
        for (eventIndex = 0; eventIndex < numEvents; eventIndex += 1)
        {
            var eventKey = events[eventIndex].key;
            var eventValue = events[eventIndex].value;
            var eventTime = events[eventIndex].timeOffset;

            if (('string' !== typeof eventKey) || (0 === eventKey.length))
            {
                if (errorCallbackFn)
                {
                    errorCallbackFn("TurbulenzServices.sendCustomMetricEventBatch failed: Event key must be a" +
                                    " non-empty string", 0);
                }
                return;
            }

            if ('number' !== typeof eventValue || isNaN(eventValue) || !isFinite(eventValue))
            {
                if ('[object Array]' !== Object.prototype.toString.call(eventValue))
                {
                    if (errorCallbackFn)
                    {
                        errorCallbackFn("TurbulenzServices.sendCustomMetricEventBatch failed: Event value must be a" +
                                        " number or an array of numbers", 0);
                    }
                    return;
                }

                var i, valuesLength = eventValue.length;
                for (i = 0; i < valuesLength; i += 1)
                {
                    if ('number' !== typeof eventValue[i] || isNaN(eventValue[i]) || !isFinite(eventValue[i]))
                    {
                        if (errorCallbackFn)
                        {
                            errorCallbackFn("TurbulenzServices.sendCustomMetricEventBatch failed: Event value array" +
                                            " elements must be numbers", 0);
                        }
                        return;
                    }
                }
            }

            // Check the time value hasn't been manipulated by the developer
            if ('number' !== typeof eventTime || isNaN(eventTime) || !isFinite(eventTime))
            {
                if (errorCallbackFn)
                {
                    errorCallbackFn("TurbulenzServices.sendCustomMetricEventBatch failed: Event time offset is" +
                                    " corrupted", 0);
                }
                return;
            }
            // Update the time offset to be relative to the time we're sending the batch,
            // the server will use this to calculate event times
            events[eventIndex].timeOffset = eventTime - currentTime;
        }

        this.getService('customMetrics').request({
            url: '/api/v1/custommetrics/add-event-batch/' + gameSession.gameSlug,
            method: 'POST',
            data: {'batch': events, 'gameSessionId': gameSession.gameSessionId},
            callback: function sendCustomMetricEventBatchAjaxErrorCheck(jsonResponse, status)
            {
                if (status !== 200 && errorCallbackFn)
                {
                    errorCallbackFn("TurbulenzServices.sendCustomMetricEventBatch error with HTTP status " + status +
                                    ": " + jsonResponse.msg, status);
                }
            },
            requestHandler: requestHandler,
            encrypt: true
        }, 'custommetrics.addeventbatch');
    }

    static services = {};
    static waitingServices = {};
    static pollingServiceStatus = false;
    // milliseconds
    static defaultPollInterval = 4000;

    static getService(serviceName): ServiceRequester
    {
        var services = this.services;
        if (services.hasOwnProperty(serviceName))
        {
            return services[serviceName];
        }
        else
        {
            var service = ServiceRequester.create(serviceName);
            services[serviceName] = service;
            return service;
        }
    }

    static serviceUnavailable(service, callContext)
    {
        var waitingServices = this.waitingServices;
        var serviceName = service.serviceName;
        if (waitingServices.hasOwnProperty(serviceName))
        {
            return;
        }

        waitingServices[serviceName] = service;

        service.running = false;

        var onServiceUnavailableCallbacks = function onServiceUnavailableCallbacksFn(service)
        {
            var onServiceUnavailable = callContext.onServiceUnavailable;
            if (onServiceUnavailable)
            {
                onServiceUnavailable.call(service, callContext);
            }
            if (service.onServiceUnavailable)
            {
                service.onServiceUnavailable();
            }
            if (TurbulenzServices.onServiceUnavailable)
            {
                TurbulenzServices.onServiceUnavailable(service);
            }
        };

        if (service.discardRequests)
        {
            onServiceUnavailableCallbacks(service);
        }

        if (this.pollingServiceStatus)
        {
            return;
        }

        var that = this;
        var pollServiceStatus;

        var serviceUrl = '/api/v1/service-status/game/read/' + window.gameSlug;
        var servicesStatusCB = function servicesStatusCBFn(responseObj, status)
        {
            if (status === 200)
            {
                var statusObj = responseObj.data;
                var servicesObj = statusObj.services;

                var retry = false;
                var serviceName;
                for (serviceName in waitingServices)
                {
                    if (waitingServices.hasOwnProperty(serviceName))
                    {
                        var service = waitingServices[serviceName];
                        var serviceData = servicesObj[serviceName];
                        var serviceRunning = serviceData.running;

                        service.running = serviceRunning;
                        service.description = serviceData.description;

                        if (serviceRunning)
                        {
                            if (service.discardRequests)
                            {
                                var onServiceAvailable = callContext.onServiceAvailable;
                                if (onServiceAvailable)
                                {
                                    onServiceAvailable.call(service, callContext);
                                }
                                if (service.onServiceAvailable)
                                {
                                    service.onServiceAvailable();
                                }
                                if (TurbulenzServices.onServiceAvailable)
                                {
                                    TurbulenzServices.onServiceAvailable(
                                        service);
                                }
                            }

                            delete waitingServices[serviceName];
                            service.discardRequests = false;
                            service.serviceStatusObserver.notify(serviceRunning, service.discardRequests);

                        }
                        else
                        {
                            // if discardRequests has been set
                            if (serviceData.discardRequests && !service.discardRequests)
                            {
                                service.discardRequests = true;
                                onServiceUnavailableCallbacks(service);
                                // discard all waiting requests
                                service.serviceStatusObserver.notify(serviceRunning, service.discardRequests);
                            }
                            retry = true;
                        }
                    }
                }
                if (!retry)
                {
                    this.pollingServiceStatus = false;
                    return;
                }
                TurbulenzEngine.setTimeout(pollServiceStatus, statusObj.pollInterval * 1000);
            }
            else
            {
                TurbulenzEngine.setTimeout(pollServiceStatus, that.defaultPollInterval);
            }
        };

        var params = <any>{
            url: serviceUrl,
            method: 'GET',
            callback: servicesStatusCB
        };

        var servicesDomain = TurbulenzServices.servicesDomain;
        if (servicesDomain)
        {
            if (serviceUrl.indexOf('http') !== 0)
            {
                if (serviceUrl[0] === '/')
                {
                    params.url = servicesDomain + serviceUrl;
                }
                else
                {
                    params.url = servicesDomain + '/' + serviceUrl;
                }
            }
            if (window.location)
            {
                if (servicesDomain !== ServiceRequester.locationOrigin)
                {
                    params.enableCORSCredentials = true;
                }
            }
        }

        pollServiceStatus = function pollServiceStatusFn()
        {
            Utilities.ajax(params);
        };

        pollServiceStatus();
    }
}

if (typeof TurbulenzBridge !== 'undefined')
{
    TurbulenzServices.addBridgeEvents();
}
else
{
    debug.log("No TurbulenzBridge object");
}

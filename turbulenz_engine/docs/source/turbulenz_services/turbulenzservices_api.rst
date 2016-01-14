.. index::
    single: TurbulenzServices

.. _turbulenzservices:

.. highlight:: javascript

----------------------------
The TurbulenzServices Object
----------------------------

The TurbulenzServices object provides a set of functions for creating objects that require communication with Turbulenz
Services in-order to be populated.
If the game is running in an environment without access to the Turbulenz Services then these objects will be created
with their default settings.

Turbulenz Services are only available when running in local, hub or game site.
All requests made by the Turbulenz Services are asynchronous.

**Required scripts**

The TurbulenzServices object requires::

    /*{{ javascript("jslib/utilities.js") }}*/
    /*{{ javascript("jslib/services/turbulenzbridge.js") }}*/
    /*{{ javascript("jslib/services/turbulenzservices.js") }}*/

You should look at the documentation for the each service to find its required scripts.

Each method uses a ServiceRequester object.

.. _turbulenzservices_security:

Security
========

Some of our services HTTP requests are protected against tampering.
If this is the case then the method will have one of the following notices:

.. note:: This is an :ref:`encrypted API call <turbulenzservices_security>`

.. note:: This is a :ref:`signed API call <turbulenzservices_security>`

This means that any HTTP requests made by the API are encrypted or signed to avoid simple alteration by malicious users.

If these notes are not included in the documentation for the API then the results of the API call can be easily
manipulated by an attacker.
Please keep this in mind when using the API.

**Example**

For example, when adding a "Most bullets fired" leaderboard a developer might try:

1. Read the current leaderboard score using the unprotected API :ref:`LeaderboardManager.get <leaderboardmanager_get>`.
2. Increment the score by the bullets fired in the current game.
3. Set the leaderboard score using the protected API :ref:`LeaderboardManager.set <leaderboardmanager_set>`.

However, the API call in step 1 is unprotected so an attacker can easily alter this value by changing the HTTP response.
This allows an attacker to set any score they like on the leaderboards.
Instead the developer should use a protected API to get the leaderboard scores.
In this case the developer should have used the protected API calls on the :ref:`UserDataManager <userdatamanager>` to
store the "Most bullets fired" score:

1. Read the current leaderboard score using the protected API :ref:`UserDataManager.get <userdatamanager_get>`.
2. Increment the score by the bullets fired in the current game.
3. Save the game data and update the saved leaderboard score using the protected API
   :ref:`UserDataManager.set <userdatamanager_set>`.
4. Set the leaderboard score using the protected API :ref:`LeaderboardManager.set <leaderboardmanager_set>`.

It is now not easy for an attacker to modify any of the HTTP requests without invalidating the signatures.

Methods
=======

.. index::
    pair: TurbulenzServices; createGameSession

.. _turbulenzservices_creategamesession:

`createGameSession`
-------------------

**Summary**

Create a :ref:`GameSession <gamesession>` object.

**Syntax** ::

    var options = {
        closeExistingSessions: false
    };
    function sessionCreatedFn(gameSession) {}
    var gameSession = TurbulenzServices.createGameSession(requestHandler, sessionCreatedFn, errorCallbackFn, options);

``requestHandler``
    A :ref:`RequestHandler <requesthandler>` object.

``sessionCreatedFn``
    A JavaScript function.
    This function is called once the game session identifier has been retrieved from the Turbulenz Services.
    Until this function is called the ``gameSession`` object is not valid and should not be used.

``errorCallbackFn`` :ref:`(Optional) <turbulenzservices_errorcallbackfn>`

``options`` (Optional)
    A JavaScript dictionary.
    This can contain the following keys:

    - ``closeExistingSessions`` (Optional) -
      A JavaScript boolean. Defaults to false.
      If the current user is playing the same game in another tab or on another device then their other games will
      not be able to make API requests that read or change server state once ``sessionCreatedFn`` is called.
      This can be useful to stop users accidentally overwriting save games (and losing progress) by playing the same game in more than one place.
      Any other instances of the game can detect that their session has been closed by assigning a function to the
      :ref:`TurbulenzServices.onGameSessionClosed <turbulenzservices_ongamesessionclosed>` callback.

The :ref:`GameSession <gamesession>` returned contains no information about the game session until ``sessionCreatedFn``
is called.
Once ``sessionCreatedFn`` is called the :ref:`GameSession <gamesession>` returned **must** be
:ref:`destroyed <gamesession_destroy>` before the game is closed.

.. index::
    pair: TurbulenzServices; createMappingTable

.. _turbulenzservices_createmappingtable:

`createMappingTable`
--------------------

**Summary**

Create a :ref:`MappingTable <mappingtable>` object.
The :ref:`MappingTable <mappingtable>` object retrieves the mapping table for the game.
See the :ref:`creating a mapping table <creating-a-mapping-table>` for more information on mapping tables.

**Syntax** ::

    function tableReceivedFn(mappingTable) {}
    var mappingTable = TurbulenzServices.createMappingTable(requestHandler,
                                                            gameSession,
                                                            tableReceivedFn,
                                                            defaultMappingSettings,
                                                            errorCallbackFn);

    // example usage:
    var tableReceived = function tableReceivedFn(mappingTable)
    {
        // load assets here
        textureManager.setPathRemapping(mappingTable.urlMapping, mappingTable.assetPrefix);
        shaderManager.setPathRemapping(mappingTable.urlMapping, mappingTable.assetPrefix);
        souindManager.setPathRemapping(mappingTable.urlMapping, mappingTable.assetPrefix);
        sceneLoader.setPathRemapping(mappingTable.urlMapping, mappingTable.assetPrefix);
    };

    var mappingTable;
    function gameSessionCreatedFn(gameSession)
    {
        mappingTable = TurbulenzServices.createMappingTable(requestHandler
                                                            gameSession,
                                                            tableReceived);
    }

    var gameSession = TurbulenzServices.createGameSession(requestHandler, gameSessionCreatedFn);

``requestHandler``
    A :ref:`RequestHandler <requesthandler>` object.

``gameSession``
    A :ref:`GameSession <gamesession>` object.

``tableReceivedFn``
    A JavaScript function.
    Once this function is called the :ref:`MappingTable <mappingtable>` object is ready to be used.

``defaultMappingSettings`` (Optional)
    A JavaScript object.
    Contains the mapping table settings to use when the GameSession is ``null``, the Turbulenz Services are unavailable
    or the MappingTable has not yet been received.
    Defaults to ::

        {
            mappingTablePrefix: "staticmax/",
            assetPrefix: "missing/",
            mappingTableURL: "mapping_table.json",
            urnMapping: {}
        }

    Here ``mappingTablePrefix`` is the relative path to the MappingTable's physical files,
    ``assetPrefix`` is the path to prepend to assets missing from the MappingTable,
    ``mappingTableURL`` is the relative path to the MappingTable file and
    ``urnMapping`` is the table to use in the case that the MappingTable file could not be found.

``errorCallbackFn`` :ref:`(Optional) <turbulenzservices_errorcallbackfn>`

Returns a :ref:`MappingTable <mappingtable>` object with ``defaultMappingSettings`` values.
The :ref:`MappingTable <mappingtable>` object methods cannot be called until the ``tableReceivedFn`` is called.


.. index::
    pair: TurbulenzServices; createMultiplayerSessionManager

.. _turbulenzservices_createmultiplayersessionmanager:

`createMultiplayerSessionManager`
---------------------------------

**Summary**

Creates a :ref:`MultiPlayerSessionManager <multiplayersessionmanager>` object.

**Syntax** ::

    var multiPlayerSessionManager = TurbulenzServices.createMultiplayerSessionManager(requestHandler,
                                                                                      gameSession);

``requestHandler``
    A :ref:`RequestHandler <requesthandler>` object to use for the lifetime of the MultiPlayerSessionManager.

``gameSession``
    A :ref:`GameSession <gamesession>` object to use for the lifetime of the MultiPlayerSessionManager.

Returns a :ref:`MultiPlayerSessionManager <multiplayersessionmanager>` object.
The :ref:`MultiPlayerSessionManager <multiplayersessionmanager>` object is ready to use upon creation.
You **must** dispose of this object by calling
:ref:`MultiPlayerSessionManager.destroy <multiplayersessionmanager_destroy>`, either when you finish using the object
or in :ref:`TurbulenzEngine.onunload <turbulenzengine_unload>`.
This will :ref:`destroy <multiplayersession_destroy>` any :ref:`MultiPlayerSession <multiplayersession>` objects which
have not yet been destroyed.

.. index::
    pair: TurbulenzServices; createLeaderboardManager

.. _turbulenzservices_createleaderboardmanager:

`createLeaderboardManager`
--------------------------

**Summary**

Create a :ref:`LeaderboardManager <leaderboardmanager>` object.
The :ref:`LeaderboardManager <leaderboardmanager>` object retrieves leaderboards meta data and provides an API for
querying the leaderboards.

**Syntax** ::

    function leaderboardsReceivedFn(leaderboardManager) {}
    var leaderboardManager = TurbulenzServices.createLeaderboardManager(requestHandler,
                                                                        gameSession,
                                                                        leaderboardsReceivedFn,
                                                                        errorCallbackFn);

    // example usage:
    var leaderboardsReady = false;
    var leaderboardsReceived = function leaderboardsReceivedFn(leaderboardManager)
    {
        leaderboardsReady = true;
    };

    var leaderboardManager;
    function gameSessionCreatedFn(gameSession)
    {
        leaderboardManager = TurbulenzServices.createLeaderboardManager(requestHandler,
                                                                        gameSession,
                                                                        leaderboardsReceived,
                                                                        errorCallbackFn);
    }

    var gameSession = TurbulenzServices.createGameSession(requestHandler, gameSessionCreatedFn);

``requestHandler``
    A :ref:`RequestHandler <requesthandler>` object.

``gameSession``
    A :ref:`GameSession <gamesession>` object.

``leaderboardsReceivedFn``
    A JavaScript function.
    Once this function is called the :ref:`LeaderboardManager <leaderboardmanager>` object is ready to be used.

``errorCallbackFn`` :ref:`(Optional) <turbulenzservices_errorcallbackfn>`

Returns a :ref:`LeaderboardManager <leaderboardmanager>` object.
The :ref:`LeaderboardManager <leaderboardmanager>` object methods cannot be called until the ``leaderboardsReceivedFn``
is called.

.. index::
    pair: TurbulenzServices; createBadgeManager

.. _turbulenzservices_createbadgemanager:

`createBadgeManager`
--------------------

**Summary**

Create a :ref:`BadgeManager <badgemanager>` object.
The :ref:`BadgeManager <badgemanager>` object provides an API for querying and awarding badges.

**Syntax** ::

    var badgeManager = TurbulenzServices.createBadgeManager(requestHandler, gameSession);

    // example usage:

    var badgeManager;
    function gameSessionCreatedFn(gameSession)
    {
        badgeManager = TurbulenzServices.createBadgeManager(requestHandler, gameSession);
    }

    var gameSession = TurbulenzServices.createGameSession(requestHandler, gameSessionCreatedFn);

``requestHandler``
    A :ref:`RequestHandler <requesthandler>` object.

``gameSession``
    A :ref:`GameSession <gamesession>` object.

Returns a :ref:`BadgeManager <badgemanager>` object.
The :ref:`BadgeManager <badgemanager>` object is ready upon creation.

.. index::
    pair: TurbulenzServices; createStoreManager

.. _turbulenzservices_createstoremanager:

`createStoreManager`
--------------------

**Summary**

Create a :ref:`StoreManager <storemanager>` object.
The :ref:`StoreManager <storemanager>` object retrieves store items meta data, user owned items and provides an API for
managing the game store basket.

**Syntax** ::

    function storeMetaReceivedFn(storeManager) {}
    var storeManager = TurbulenzServices.createStoreManager(requestHandler,
                                                            gameSession,
                                                            storeMetaReceivedFn,
                                                            errorCallbackFn);

    // example usage:
    var storeManagerReady = false;
    var storeManagerReceived = function storeManagerReceivedFn(storeManager)
    {
        storeManagerReady = true;
    };

    var storeManager;
    function gameSessionCreatedFn(gameSession)
    {
        storeManager = TurbulenzServices.createStoreManager(requestHandler,
                                                            gameSession,
                                                            storeManagerReceived,
                                                            errorCallbackFn);
    }

    var gameSession = TurbulenzServices.createGameSession(requestHandler, gameSessionCreatedFn);

``requestHandler``
    A :ref:`RequestHandler <requesthandler>` object.

``gameSession``
    A :ref:`GameSession <gamesession>` object.

``storeManagerReceivedFn``
    A JavaScript function.
    Once this function is called the :ref:`StoreManager <storemanager>` object is ready to be used.

``errorCallbackFn`` :ref:`(Optional) <turbulenzservices_errorcallbackfn>`

Returns a :ref:`StoreManager <storemanager>` object.
The :ref:`StoreManager <storemanager>` object methods cannot be called until the ``storeManagerReceivedFn`` is called.

.. index::
    pair: TurbulenzServices; createUserProfile

.. _turbulenzservices_createuserprofile:

`createUserProfile`
-------------------

**Summary**

Create a :ref:`UserProfile <userprofile>` object.
The :ref:`UserProfile <userprofile>` object contains user profile information.

**Syntax** ::

    function profileReceivedFn(userProfile)
    {
        // Use profile information here
    }

    var userProfile = TurbulenzServices.createUserProfile(requestHandler,
                                                          profileReceivedFn,
                                                          errorCallbackFn);

``requestHandler``
    A :ref:`RequestHandler <requesthandler>` object.

``profileReceivedFn``
    A JavaScript function.
    Once this function is called the :ref:`UserProfile <userprofile>` object is ready to be used.

``errorCallbackFn`` :ref:`(Optional) <turbulenzservices_errorcallbackfn>`

Returns a :ref:`UserProfile <userprofile>` object.
The :ref:`UserProfile <userprofile>` object cannot be used until ``profileReceivedFn`` is called.

.. index::
    pair: TurbulenzServices; upgradeAnonymousUser

.. _turbulenzservices_upgradeanonymoususer:

`upgradeAnonymousUser`
----------------------

**Summary**

Present the user with options for upgrading their account from
anonymous to a full user.  If supported a dialog or login screen will
be presented listing the options available to upgrade to a full
turbulenz account.


**Syntax** ::

    var accountUpgraded = function accountUpgradedFn()
    {
        // Re-request the UserProfile and check the 'anonymous'
        // property to determine the user's new status.
    }

    TurbulenzServices.upgradeAnonymousUser(accountUpgraded);


``accountUpgraded``
    A callback made only if the user upgrades the account.  If the
    user dismisses the upgrade dialog or otherwise cancels the upgrade
    process this callback may not be invoked.  Even if the callback is
    invoked, the game should re-request the UserProfile data
    :ref:`UserProfile <userprofile>` object via
    :ref:`createuserProfile <turbulenzservices_createuserprofile>` and
    check the value of the `anonymous` property.


.. index::
    pair: TurbulenzServices; sendCustomMetricEvent

.. _turbulenzservices_sendcustommetricevent:

`sendCustomMetricEvent`
-----------------------

**Summary**

Send a custom event to be tracked for the game.

The event contributes to the metrics for the game with the event value being saved as an aggregate for each unique key.

These metrics can be seen on the Hub once a game has been published, and the events themselves can be downloaded using
the :ref:`exportevents <exportevents>` tool.

**Syntax** ::

    TurbulenzServices.sendCustomMetricEvent(eventKey, eventValue, requestHandler, gameSession);

``eventKey``
    A JavaScript string.
    The event key you want to track this event occurrence against, e.g. 'levelOneCompleted'.

``eventValue``
    An JavaScript number or array of numbers.
    The event value you want to associate with this event occurrence, e.g. the time taken to complete the level.

``requestHandler``
    A :ref:`RequestHandler <requesthandler>` object.

``gameSession``
    A :ref:`GameSession <gamesession>` object.

``errorCallbackFn`` :ref:`(Optional) <turbulenzservices_errorcallbackfn>`

.. NOTE::
    Custom events are only recorded for the game on the game site and not on Turbulenz Local Server or the Hub.
    These events contribute to the custom metrics only when eventValue is a number and not an array.

.. NOTE::
    Turbulenz already provides a variety of metrics it tracks for your game by default.
    For more information see the :ref:`Hub User Guide <hub_metrics>`.

.. index::
    pair: TurbulenzServices; sendCustomMetricEventBatch

.. _turbulenzservices_sendcustommetriceventbatch:

`sendCustomMetricEventBatch`
----------------------------

**Summary**

Send a batch of custom events to be tracked for the game. Sending a custom metrics in a batch rather than individually
with :ref:`TurbulenzServices.sendCustomMetricEvent <turbulenzservices_sendcustommetricevent>` allows an application
to reduce the number of requests made to the servers.
This can reduce both cpu cost and bandwidth cost from an application.

Each event in the batch will preserve a timestamp based on the time it is added to the batch meaning metrics from
batches lose no information versus individual metrics.

Sending individual metrics may still be preferred in cases where you have high importance low frequency metrics
(started level, level complete) versus tracking high frequency metrics (such as collected pickup, killed enemy).
When higher frequency metrics are batched it's possible that some could be lost in situations where a user closes the
browser in the middle of a game session, as a result more important events may still want to be tracked immediately
when they happen.

The ideal number of events in a batch can vary depending on the size of the event data (e.g. large event arrays
vs single values). Batches of 10 to 20 metrics will normally be reasonable but consider looking at
:ref:`Working with HTTP requests<working_with_http>` for some comments on sizes of HTTP requests.

The events contribute to the metrics for the game with the event values being saved as aggregates for each unique key.

These metrics can be seen on the Hub once a game has been published, and the events themselves can be downloaded using
the :ref:`exportevents <exportevents>` tool.

**Syntax** ::

    TurbulenzServices.sendCustomMetricEventBatch(eventBatch, requestHandler, gameSession);

``eventBatch``
    A :ref:`CustomMetricEventBatch <customMetricEventBatch>` object.
    A batch of metrics to be sent to the server, for details on creating and adding metrics to the batch see
    :ref:`CustomMetricEventBatch <customMetricEventBatch>`

``requestHandler``
    A :ref:`RequestHandler <requesthandler>` object.

``gameSession``
    A :ref:`GameSession <gamesession>` object.

``errorCallbackFn`` :ref:`(Optional) <turbulenzservices_errorcallbackfn>`

.. NOTE::
    Custom events are only recorded for the game on the game site and not on Turbulenz Local Server or the Hub.
    Events from the batch contribute to the custom metrics only when eventValue is a number and not an array.

.. NOTE::
    Turbulenz already provides a variety of metrics it tracks for your game by default.
    For more information see the :ref:`Hub User Guide <hub_metrics>`.

.. index::
    pair: TurbulenzServices; getService

.. _turbulenzservices_getservice:

`getService`
------------

**Summary**

Get a :ref:`ServiceRequester object <servicerequester>` for a given service.

**Syntax** ::

    var serviceRequester = TurbulenzServices.getService('gameSessions');

You can find a list of currently supported service names :ref:`here <servicerequester_servicenames>`.

Properties
==========

.. index::
    pair: TurbulenzServices; onGameSessionClosed

.. _turbulenzservices_ongamesessionclosed:

`onGameSessionClosed`
---------------------

**Summary**

A JavaScript function.
Called if a closed or incorrect :ref:`GameSession <gamesession>` is being used.
This is normally triggered by another instance of the game calling
:ref:`TurbulenzServices.createGameSession <turbulenzservices_creategamesession>` with the ``closeExistingSessions`` option.

**Syntax** ::

    TurbulenzServices.onGameSessionClosed = function onGameSessionClosedFn() {};

    // example usage:
    var hasGameSessionClosed = false;
    TurbulenzServices.onGameSessionClosed = function onGameSessionClosedFn()
    {
        if (!hasGameSessionClosed)
        {
            Utilities.log('Game session closed. Looks like you have started playing somewhere else.')
        }
        var hasGameSessionClosed = true;
    };

Once this function is called the game will no longer be able to read or change the user's server state.
For example, you will not be able to:

- Load or save game using the :ref:`UserData <userdatamanager>` or :ref:`DataShares <datasharemanager>` API's.
- Update a :ref:`user's game profile <gameprofilemanager>`.
- Set :ref:`leaderboards <leaderboardmanager>` or :ref:`badges <badgemanager>` values.
- Send :ref:`custom metrics <turbulenzservices_sendcustommetricevent>`.
- :ref:`Consume store items <storemanager_consume>`.

So, it is recommended that once this function is called, the game should stop and display a message like
``"Game session closed. Looks like you have started playing somewhere else."``.

.. NOTE::
    This function can be called multiple times.

.. index::
    pair: TurbulenzServices; defaultErrorCallback

.. _turbulenzservices_errorcallbackfn:

`defaultErrorCallback`
----------------------

**Summary**

A JavaScript function.
The default error callback for the ``TurbulenzServices``.
Returns an error message and its HTTP status.

**Syntax** ::

    TurbulenzServices.defaultErrorCallback = function errorCallbackFn(errorMsg, httpStatus) {};

    // example usage:
    TurbulenzServices.defaultErrorCallback = function defaultErrorCallbackFn(msg)
    {
        var tmpConsole = window.console || console;
        if (tmpConsole)
        {
            tmpConsole.log(msg);
        }
    };

``errorMsg``
    A JavaScript string giving the reason for error.

``httpStatus``
    A JavaScript number.
    You can find a list of common status codes here - http://en.wikipedia.org/wiki/List_of_HTTP_status_codes

.. index::
    pair: TurbulenzServices; onServiceUnavailable

.. _turbulenzservices_onserviceunavailable:

`onServiceUnavailable`
----------------------

**Summary**

A JavaScript function.
This function is called when a service has been disabled.

**Syntax** ::

    TurbulenzServices.onServiceUnavailable = function onServiceUnavailableFn(serviceRequester) {
        Utilties.log(serviceRequester.serviceName + ' is unavailable');
    };

``serviceRequester``
    The :ref:`ServiceRequester object <servicerequester>` representing the service that has become unavailable.

.. index::
    pair: TurbulenzServices; onServiceAvailable

.. _turbulenzservices_onserviceavailable:

`onServiceAvailable`
--------------------

**Summary**

A JavaScript function.
This function is called when a service is re-enabled.

**Syntax** ::

    TurbulenzServices.onServiceAvailable = function onServiceAvailableFn(serviceRequester) {
        Utilties.log(serviceRequester.serviceName + ' is available');
    };

``serviceRequester``
    The :ref:`ServiceRequester object <servicerequester>` representing the service that has become available.

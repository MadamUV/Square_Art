// Copyright (c) 2012 Turbulenz Limited

/*global TurbulenzServices: false*/

//
// API
//
interface GameProfileErrorFn
{
    (msg: string, status: number, fn: any, cb: any[]): void;
}

class GameProfileManager
{
    /* tslint:disable:no-unused-variable */
    static version = 1;
    /* tslint:enable:no-unused-variable */

    maxValueSize = 1024;
    maxGetListUsernames = 64;

    requestHandler: RequestHandler;
    errorCallbackFn: GameProfileErrorFn;
    gameSessionId: string;
    service: ServiceRequester;

    set(value, callbackFn, errorCallbackFn): boolean
    {
        if (!value)
        {
            return this.remove(callbackFn, errorCallbackFn);
        }

        if (value.length > this.maxValueSize)
        {
            return false;
        }

        var that = this;
        var setCallback = function setCallbackFn(jsonResponse, status)
        {
            if (status === 200)
            {
                if (callbackFn)
                {
                    callbackFn();
                }
            }
            else
            {
                var errorCallback = errorCallbackFn || that.errorCallbackFn;
                errorCallback("GameProfileManager.set failed with status " + status + ": " + jsonResponse.msg,
                              status,
                              that.set,
                              [value, callbackFn]);
            }
        };

        var dataSpec = {
            value: value,
            gameSessionId: that.gameSessionId
        };

        var url = '/api/v1/game-profile/set';

        this.service.request({
            url: url,
            method: 'POST',
            data : dataSpec,
            callback: setCallback,
            requestHandler: this.requestHandler,
            encrypt: true
        }, 'gameprofile.set');

        return true;
    }

    remove(callbackFn, errorCallbackFn)
    {
        var that = this;
        function removeCallbackFn(jsonResponse, status)
        {
            if (status === 200 || status === 404)
            {
                if (callbackFn)
                {
                    callbackFn();
                }
            }
            else
            {
                var errorCallback = errorCallbackFn || that.errorCallbackFn;
                /* tslint:disable:no-trailing-comma */
                errorCallback("GameProfileManager.remove failed with status " + status + ": " + jsonResponse.msg,
                              status,
                              that.remove,
                              [callbackFn]);
                /* tslint:enable:no-trailing-comma */
            }
        }

        var dataSpec = {
            gameSessionId: that.gameSessionId,
        };

        var url = '/api/v1/game-profile/remove';

        this.service.request({
            url: url,
            method: 'POST',
            data: dataSpec,
            callback: removeCallbackFn,
            requestHandler: this.requestHandler,
            encrypt: true
        }, 'gameprofile.remove');

        return true;
    }

    get(username, callbackFn, errorCallbackFn): boolean
    {
        var callbackWrapper = function callbackWrapperFn(gameProfiles)
        {
            if (gameProfiles.hasOwnProperty(username))
            {
                callbackFn(username, gameProfiles[username]);
            }
            else
            {
                callbackFn(username, null);
            }
        };
        return this.getList([username], callbackWrapper, errorCallbackFn);
    }

    getList(usernames, callbackFn, errorCallbackFn): boolean
    {
        if (usernames.length > this.maxGetListUsernames)
        {
            return false;
        }

        var that = this;
        var getCallback = function getCallbackFn(jsonResponse, status)
        {
            if (status === 200)
            {
                callbackFn(jsonResponse.data.profiles);
            }
            else if (status === 404)
            {
                callbackFn(null);
            }
            else
            {
                var errorCallback = errorCallbackFn || that.errorCallbackFn;
                errorCallback("GameProfileManager.getList failed with status " + status + ": " + jsonResponse.msg,
                              status,
                              that.getList,
                              [callbackFn]);
            }
        };

        var dataSpec = {
            gameSessionId: that.gameSessionId,
            usernames: JSON.stringify(usernames)
        };

        this.service.request({
            url: '/api/v1/game-profile/read',
            method: 'GET',
            data: dataSpec,
            callback: getCallback,
            requestHandler: this.requestHandler
        }, 'gameprofile.read');

        return true;
    }

    // Constructor function
    static create(requestHandler: RequestHandler,
                  gameSession: GameSession,
                  errorCallbackFn?: GameProfileErrorFn): GameProfileManager
    {
        if (!TurbulenzServices.available())
        {
            return null;
        }

        var gameProfileManager = new GameProfileManager();
        gameProfileManager.requestHandler = requestHandler;
        gameProfileManager.errorCallbackFn = errorCallbackFn || TurbulenzServices.defaultErrorCallback;
        gameProfileManager.gameSessionId = gameSession.gameSessionId;

        gameProfileManager.service = TurbulenzServices.getService('gameProfile');

        return gameProfileManager;
    }
}

// Copyright (c) 2011-2012 Turbulenz Limited

/*global TurbulenzServices*/
/*global TurbulenzBridge*/
/*global Utilities*/

//
// Callback types
//

interface BadgeManagerErrorCB
{
    (errorMessage: string, status: number, parameters: any[]): void;
}

interface BadgeManagerUserBadgesCB
{
    (badgeProgressList: BadgeProgressList): void;
}

interface BadgeManagerAddProgressCB
{
    (badgeProgress: BadgeProgress): void;
}

interface BadgeManagerListBadgesCB
{
    (badgeDescriptions: BadgeDescriptionList): void;
}

//
// BadgeManager
//
// created by Turbulenzservices.createBadges
class BadgeManager
{
    /* tslint:disable:no-unused-variable */
    static version = 1;
    /* tslint:enable:no-unused-variable */

    gameSession: GameSession;
    gameSessionId: string;
    service: ServiceRequester;
    requestHandler: RequestHandler;

    //
    listUserBadges(callbackFn: BadgeManagerUserBadgesCB,
                   errorCallbackFn: BadgeManagerErrorCB)
    {
        var that = this;
        var cb = function cbFn(jsonResponse, status)
        {
            if (status === 200)
            {
                callbackFn(jsonResponse.data);
            }
            else if (status === 404)
            {
                callbackFn(null);
            }
            else
            {
                var errorCallback = errorCallbackFn || that._errorCallbackFn;
                errorCallback("Badges.listUserBadges failed with status " + status + ": " + jsonResponse.msg,
                              status,
                              [callbackFn]);
            }
        };

        this.service.request({
            url: '/api/v1/badges/progress/read/' + this.gameSession.gameSlug,
            method: 'GET',
            callback: cb,
            requestHandler: this.requestHandler
        }, 'badge.read');
    }

    awardUserBadge(badge_key: string,
                   callbackFn: BadgeManagerAddProgressCB,
                   errorCallbackFn: BadgeManagerErrorCB)
    {
        this._addUserBadge(badge_key, null, callbackFn, errorCallbackFn);
    }

    updateUserBadgeProgress(badge_key: string,
                            current: number,
                            callbackFn: BadgeManagerAddProgressCB,
                            errorCallbackFn: BadgeManagerErrorCB)
    {
        var that = this;
        if (current && typeof current === 'number')
        {
            this._addUserBadge(badge_key, current, callbackFn, errorCallbackFn);
        }
        else
        {
            var errorCallback = errorCallbackFn || that._errorCallbackFn;
            errorCallback("Badges.updateUserBadgeProgress expects a numeric value for current",
                          400,
                          [badge_key, current, callbackFn]);
        }
    }

    // add a badge to a user (gets passed a badge and a current level
    // over POST, the username is taken from the environment)
    private _addUserBadge(badge_key: string,
                          current: number,
                          callbackFn: BadgeManagerAddProgressCB,
                          errorCallbackFn: BadgeManagerErrorCB)
    {
        var that = this;
        var cb = function cbFn(jsonResponse, status)
        {
            if (status === 200)
            {
                var userbadge = jsonResponse.data;
                userbadge.gameSlug = that.gameSession.gameSlug;
                TurbulenzBridge.updateUserBadge(userbadge);
                callbackFn(userbadge);
            }
            else
            {
                var errorCallback = errorCallbackFn || that._errorCallbackFn;
                errorCallback("Badges._addUserBadge failed with status " + status + ": " + jsonResponse.msg,
                              status,
                              [badge_key, current, callbackFn]);
            }
        };

        var url = '/api/v1/badges/progress/add/' + this.gameSession.gameSlug;
        var dataSpec : BadgeAddProgressRequest = {
            gameSessionId: this.gameSessionId,
            badge_key: badge_key,
            current: current || undefined,
        };

        this.service.request({
            url: url,
            method: 'POST',
            data : dataSpec,
            callback: cb,
            requestHandler: this.requestHandler,
            encrypt: true
        }, 'badge.add');
    }

    // list all badges (just queries the yaml file)
    listBadges(callbackFn: BadgeManagerListBadgesCB,
               errorCallbackFn: BadgeManagerErrorCB)
    {
        var that = this;
        var cb = function cbFn(jsonResponse, status)
        {
            if (status === 200)
            {
                callbackFn(jsonResponse.data);
            }
            else if (status === 404)
            {
                callbackFn(null);
            }
            else
            {
                var errorCallback = errorCallbackFn || that._errorCallbackFn;
                errorCallback("Badges.listBadges failed with status " + status + ": " + jsonResponse.msg,
                              status,
                              [callbackFn]);
            }
        };

        this.service.request({
            url: '/api/v1/badges/read/' + that.gameSession.gameSlug,
            method: 'GET',
            callback: cb,
            requestHandler: this.requestHandler
        }, 'badge.meta');
    }

    private _errorCallbackFn()
    {
        var x = Array.prototype.slice.call(arguments);
        Utilities.log('BadgeManager error: ', x);
    }

    static create(requestHandler: RequestHandler,
                  gameSession: GameSession): BadgeManager
    {
        if (!TurbulenzServices.available())
        {
            return null;
        }

        var badgeManager = new BadgeManager();

        badgeManager.gameSession = gameSession;
        badgeManager.gameSessionId = gameSession.gameSessionId;
        badgeManager.service = TurbulenzServices.getService('badges');
        badgeManager.requestHandler = requestHandler;

        return badgeManager;
    }
}

// Copyright (c) 2011-2012 Turbulenz Limited

/*global Utilities: false*/
/*global TurbulenzBridge: false*/
/*global TurbulenzEngine: false*/
/*global TurbulenzServices: false*/

//
// API
//
interface GameSessionOptions
{
    closeExistingSessions?: boolean;
};

interface GameSessionInfo
{
    sessionData: any;
    playerSessionData: any;
}

interface GameSessionPlayerData
{
    team: string;
    color: string;
    status: string;
    rank: string;
    score: string;
    sortkey: string;
}

class GameSession
{
    /* tslint:disable:no-unused-variable */
    static version = 1;
    /* tslint:enable:no-unused-variable */

    post_delay = 1000;

    gameSessionId: string;
    gameSlug: string;

    mappingTable: GameSessionCreateResponseMappingTable;

    errorCallbackFn: { (response: string, status?: number) : void; };

    info: GameSessionInfo;
    templatePlayerData: GameSessionPlayerData;
    pendingUpdate: number;
    requestHandler: RequestHandler;
    service: ServiceRequester;
    status: number;
    destroyed: boolean;

    postData: { () : void; };

    setStatus(status)
    {
        if (this.destroyed || this.status === status)
        {
            return;
        }

        this.status = status;
        TurbulenzBridge.setGameSessionStatus(this.gameSessionId, status);
    }

    // callbackFn is for testing only!
    // It will not be called if destroy is called in TurbulenzEngine.onUnload
    destroy(callbackFn?)
    {
        var dataSpec : GameSessionDestroyRequest;
        if (this.pendingUpdate)
        {
            TurbulenzEngine.clearTimeout(this.pendingUpdate);
            this.pendingUpdate = null;
        }

        if (!this.destroyed && this.gameSessionId)
        {
            // we can't wait for the callback as the browser doesn't
            // call async callbacks after onbeforeunload has been called
            TurbulenzBridge.destroyedGameSession(this.gameSessionId);
            this.destroyed = true;

            dataSpec = {
                gameSessionId: this.gameSessionId
            };

            this.service.request({
                url: '/api/v1/games/destroy-session',
                method: 'POST',
                data: dataSpec,
                callback: callbackFn,
                requestHandler: this.requestHandler
            }, 'gamesession.destroy');
        }
        else
        {
            if (callbackFn)
            {
                TurbulenzEngine.setTimeout(callbackFn, 0);
            }
        }
    }

    /**
     * Handle player metadata
     */
    setTeamInfo(teamList)
    {
        var sessionData = this.info.sessionData;
        var oldTeamList = sessionData.teamList || [];
        if (teamList.join('#') !== oldTeamList.join('#'))
        {
            sessionData.teamList = teamList;
            this.update();
        }
    }

    setPlayerInfo(playerId, data)
    {
        var playerData = this.info.playerSessionData[playerId];
        var key;
        var dirty = false;

        if (!playerData)
        {
            playerData = {};
            this.info.playerSessionData[playerId] = playerData;
            dirty = true;
        }

        for (key in data)
        {
            if (data.hasOwnProperty(key))
            {
                if (!this.templatePlayerData.hasOwnProperty(key))
                {
                    throw "unknown session data property " + key;
                }
                if (playerData[key] !== data[key])
                {
                    playerData[key] = data[key];
                    dirty = true;
                }
            }
        }

        if (dirty)
        {
            this.update();
        }
    }

    removePlayerInfo(playerId)
    {
        delete this.info.playerSessionData[playerId];
        this.update();
    }

    clearAllPlayerInfo()
    {
        this.info.playerSessionData = {};
        this.update();
    }

    update()
    {
        if (!this.pendingUpdate)
        {
            // Debounce the update to pick up any other changes.
            this.pendingUpdate = TurbulenzEngine.setTimeout(this.postData, this.post_delay);
        }
    }

    static create(requestHandler, sessionCreatedFn,
                  errorCallbackFn?, options?: GameSessionOptions): GameSession
    {
        var gameSession = new GameSession();
        var gameSlug = window.gameSlug;
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
        var mode = turbulenzData.mode || TurbulenzServices.mode;
        var createSessionURL = '/api/v1/games/create-session/' + gameSlug;
        gameSession.info = {
            sessionData: {},
            playerSessionData: {}
        };

        gameSession.templatePlayerData = {
            team: null,
            color: null,
            status: null,
            rank: null,
            score: null,
            sortkey: null
        };

        gameSession.postData = function postDataFn()
        {
            TurbulenzBridge.setGameSessionInfo(JSON.stringify(gameSession.info));
            gameSession.pendingUpdate = null;
        };

        gameSession.pendingUpdate = null;

        gameSession.gameSlug = gameSlug;

        gameSession.requestHandler = requestHandler;
        gameSession.errorCallbackFn = errorCallbackFn || TurbulenzServices.defaultErrorCallback;
        gameSession.gameSessionId = null;
        gameSession.service = TurbulenzServices.getService('gameSessions');
        gameSession.status = null;

        if (!TurbulenzServices.available())
        {
            if (sessionCreatedFn)
            {
                // On a timeout so it happens asynchronously, like an
                // ajax call.

                TurbulenzEngine.setTimeout(function sessionCreatedCall() {
                    sessionCreatedFn(gameSession);
                }, 0);
            }
            return gameSession;
        }

        var gameSessionRequestCallback =
            function gameSessionRequestCallbackFn(jsonResponse, status)
        {
            if (status === 200)
            {
                var response = <GameSessionCreateResponse>(jsonResponse);
                gameSession.mappingTable = response.mappingTable;
                gameSession.gameSessionId = response.gameSessionId;

                if (sessionCreatedFn)
                {
                    sessionCreatedFn(gameSession);
                }

                TurbulenzBridge.createdGameSession(gameSession.gameSessionId);
            }
            else if (404 === status)
            {
                // Treat this case as the equivalent of services being
                // unavailable.

                window.gameSlug = undefined;
                gameSession.gameSlug = undefined;

                if (sessionCreatedFn)
                {
                    sessionCreatedFn(gameSession);
                }
            }
            else
            {
                gameSession.errorCallbackFn("TurbulenzServices.createGameSession error with HTTP status " +
                                            status + ": " + jsonResponse.msg, status);
            }
        };

        if (mode)
        {
            createSessionURL += '/' + mode;
        }

        var dataSpec: GameSessionCreateRequest = {};
        if (options)
        {
            if (options.closeExistingSessions)
            {
                dataSpec.closeExistingSessions = 1;
            }
        }

        gameSession.service.request({
            url: createSessionURL,
            method: 'POST',
            data: dataSpec,
            callback: gameSessionRequestCallback,
            requestHandler: requestHandler,
            neverDiscard: true
        }, 'gamesession.create');

        return gameSession;
    }
}

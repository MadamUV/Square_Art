// Copyright (c) 2009-2014 Turbulenz Limited

/*global Observer: false*/
/*global TurbulenzEngine: false*/

"use strict";

interface ShaderManagerShaders
{
    [path: string]: Shader;
}

//
// ShaderManager
//
class ShaderManager
{
    static version = 1;

    load: (path: string, callback?: { (shader: Shader): void; }) => Shader;
    map: (dst: string, src: string) => void;
    get(path: string) : Shader { debug.abort("abstract method"); return null; }
    getAll: () => ShaderManagerShaders;
    remove: (path: string) => void;
    reload: (path: string, callback: { (shader: Shader): void; }) => void;
    reloadAll: () => void;
    getNumPendingShaders: () => number;
    isShaderLoaded: (path: string) => boolean;
    isShaderMissing: (path: string) => boolean;
    setPathRemapping: (prm, assetUrl) => void;
    setAutomaticParameterResize: (name: string, size: number) => void;
    destroy: () => void;

    /**
       @constructs Constructs a ShaderManager object.

       @param {GraphicsDevice} gd Graphics device
       @param {RequestHandler} rh RequestHandler device
       @param {Shader} ds Default shader
       @param {Element} log Logging element

       @return {ShaderManager} object, null if failed
    */
    static create(gd: GraphicsDevice,
                  rh: RequestHandler,
                  ds?: Shader,
                  errorCallback?: { (msg: string): void; },
                  log?: HTMLElement): ShaderManager
    {
        if (!errorCallback)
        {
            /* tslint:disable:no-empty */
            errorCallback = function (/* e */) {};
            /* tslint:enable:no-empty */
        }

        var defaultShaderName = "default";

        var defaultShader;
        if (ds)
        {
            defaultShader = ds;
        }
        else
        {
            // Generates from assets/shaders/default.cgfx
            defaultShader = gd.createShader(default_cgfx);
            if (!defaultShader)
            {
                errorCallback("Default shader not created.");
            }
        }

        var shaders : ShaderManagerShaders = {};
        var loadingShader = {};
        var loadedObservers = {};
        var numLoadingShaders = 0;
        var pathRemapping = null;
        var pathPrefix = "";
        var doPreprocess = false;
        var resizeParameters = {};

        shaders[defaultShaderName] = defaultShader;

        function preprocessShader(shader)
        {
            var parameters = shader.parameters;
            var techniques = shader.techniques;
            var programs = shader.programs;
            var p, resize, programsToUpdate, t;
            var passes, numPasses, a, pass, passPrograms;
            var  length, n, reg, rep, u, program;
            for (p in parameters)
            {
                if (parameters.hasOwnProperty(p))
                {
                    resize = resizeParameters[p];
                    if (resize !== undefined)
                    {
                        parameters[p].rows = resize;

                        programsToUpdate = {};
                        for (t in techniques)
                        {
                            if (techniques.hasOwnProperty(t))
                            {
                                passes = techniques[t];
                                numPasses = passes.length;
                                for (a = 0; a < numPasses; a += 1)
                                {
                                    pass = passes[a];
                                    if (pass.parameters.indexOf(p) !== -1)
                                    {
                                        passPrograms = pass.programs;
                                        length = passPrograms.length;
                                        for (n = 0; n < length; n += 1)
                                        {
                                            programsToUpdate[passPrograms[n]] = true;
                                        }
                                    }
                                }
                            }
                        }

                        reg = new RegExp("uniform\\s+(\\w+)\\s+" + p + "\\s*\\[[^\\]]+\\]", "mg");
                        rep = "uniform $1 " + p + "[" + resize + "]";
                        for (u in programsToUpdate)
                        {
                            if (programsToUpdate.hasOwnProperty(u))
                            {
                                program = programs[u];
                                program.code = program.code.replace(reg, rep);
                            }
                        }
                    }
                }
            }
        }

        /**
           Creates shader from an cgfx file

           @memberOf ShaderManager.prototype
           @public
           @function
           @name load

           @param {string} path Path to the cgfx file

           @return {Shader} object, returns the default shader if the file at given path is not yet loaded
        */
        var loadShader = function loadShaderFn(path, onShaderLoaded?): Shader
        {
            if (path === undefined)
            {
                errorCallback("Invalid texture path passed to ShaderManager.Load");
            }
            var shader = shaders[path];
            if (!shader)
            {
                if (!loadingShader[path])
                {
                    loadingShader[path] = true;
                    numLoadingShaders += 1;

                    var observer = Observer.create();
                    loadedObservers[path] = observer;
                    if (onShaderLoaded)
                    {
                        observer.subscribe(onShaderLoaded);
                    }

                    var shaderLoaded = function shaderLoadedFn(shaderText /*, status, callContext */)
                    {
                        function shaderCreated(shader)
                        {
                            if (shader)
                            {
                                shaders[path] = shader;
                            }
                            else
                            {
                                delete shaders[path];
                            }

                            delete loadingShader[path];
                            delete loadedObservers[path];
                            numLoadingShaders -= 1;

                            observer.notify(shader);
                        }

                        if (shaderText)
                        {
                            var shaderParameters = JSON.parse(shaderText);
                            if (doPreprocess)
                            {
                                preprocessShader(shaderParameters);
                            }

                            gd.createShader(shaderParameters, shaderCreated);
                        }
                        else
                        {
                            if (log)
                            {
                                log.innerHTML += "ShaderManager.load:&nbsp;'" + path + "' failed to load<br>";
                            }
                            delete shaders[path];
                            delete loadingShader[path];
                            delete loadedObservers[path];
                            numLoadingShaders -= 1;

                            observer.notify(null);
                        }
                    };

                    rh.request({
                        src: ((pathRemapping && pathRemapping[path]) || (pathPrefix + path)),
                        onload: shaderLoaded
                    });
                }
                else if (onShaderLoaded)
                {
                    loadedObservers[path].subscribe(onShaderLoaded);
                }

                return defaultShader;
            }
            else if (onShaderLoaded)
            {
                // the callback should always be called asynchronously
                TurbulenzEngine.setTimeout(function shaderAlreadyLoadedFn()
                                           {
                                               onShaderLoaded(shader);
                                           }, 0);
            }

            return shader;
        };

        /**
           Alias one shader to another name

           @memberOf ShaderManager.prototype
           @public
           @function
           @name map

           @param {string} dst Name of the alias
           @param {string} src Name of the shader to be aliased
        */
        var mapShader = function mapShaderFn(dst, src)
        {
            shaders[dst] = shaders[src];
        };

        /**
           Get shader created from a given shader file or with the given name

           @memberOf ShaderManager.prototype
           @public
           @function
           @name get

           @param {string} path Path or name of the shader

           @return {Shader} object, returns the default shader if the shader is not yet loaded or
           the shader file didn't exist
        */
        var getShader = function getShaderFn(path)
        {
            var shader = shaders[path];
            if (!shader)
            {
                return defaultShader;
            }
            return shader;
        };

        /**
           Removes a shader from the manager

           @memberOf ShaderManager.prototype
           @public
           @function
           @name remove

           @param {string} path Path or name of the shader
        */
        var removeShader = function removeShaderFn(path)
        {
            if (typeof shaders[path] !== 'undefined')
            {
                delete shaders[path];
            }
        };

        /**
           Reloads a shader

           @memberOf ShaderManager.prototype
           @public
           @function
           @name reload

           @param {string} path Path or name of the shader
        */
        var reloadShader = function reloadShaderFn(path, callback?)
        {
            removeShader(path);
            loadShader(path, callback);
        };

        var sm = new ShaderManager();

        if (log)
        {
            sm.load = function loadShaderLogFn(path, callback?) : Shader
            {
                log.innerHTML += "ShaderManager.load:&nbsp;'" + path + "'<br>";
                return loadShader(path, callback);
            };

            sm.map = function mapShaderLogFn(dst, src)
            {
                log.innerHTML += "ShaderManager.map:&nbsp;'" + src + "' -> '" + dst + "'<br>";
                mapShader(dst, src);
            };

            sm.get = function getShaderLogFn(path)
            {
                log.innerHTML += "ShaderManager.get:&nbsp;'" + path + "'<br>";
                return getShader(path);
            };

            sm.remove = function removeShaderLogFn(path)
            {
                log.innerHTML += "ShaderManager.remove:&nbsp;'" + path + "'<br>";
                removeShader(path);
            };

            sm.reload = function reloadShaderLogFn(path, callback)
            {
                log.innerHTML += "ShaderManager. reload:&nbsp;'" + path + "'<br>";
                reloadShader(path, callback);
            };
        }
        else
        {
            sm.load = loadShader;
            sm.map = mapShader;
            sm.get = getShader;
            sm.remove = removeShader;
            sm.reload = reloadShader;
        }

        /**
           Reloads all shaders

           @memberOf ShaderManager.prototype
           @public
           @function
           @name reloadAll
        */
        sm.reloadAll = function reloadAllShadersFn()
        {
            for (var t in shaders)
            {
                if (shaders.hasOwnProperty(t) && t !== defaultShaderName)
                {
                    reloadShader(t);
                }
            }
        };

        /**
           Get object containing all loaded shaders

           @memberOf ShaderManager.prototype
           @public
           @function
           @name getAll

           @return {object}
        */
        sm.getAll = function getAllShadersFn(): ShaderManagerShaders
        {
            return shaders;
        };

        /**
           Get number of shaders pending

           @memberOf ShaderManager.prototype
           @public
           @function
           @name getNumLoadingShaders

           @return {number}
        */
        sm.getNumPendingShaders = function getNumPendingShadersFn()
        {
            return numLoadingShaders;
        };

        /**
           Check if a shader is not pending

           @memberOf ShaderManager.prototype
           @public
           @function
           @name isShaderLoaded

           @param {string} path Path or name of the shader

           @return {boolean}
        */
        sm.isShaderLoaded = function isShaderLoadedFn(path)
        {
            return !loadingShader[path];
        };

        /**
           Check if a shader is missing

           @memberOf ShaderManager.prototype
           @public
           @function
           @name isShaderMissing

           @param {string} path Path or name of the shader

           @return {boolean}
        */
        sm.isShaderMissing = function isShaderMissingFn(path)
        {
            return !shaders[path];
        };

        /**
           Set path remapping dictionary

           @memberOf ShaderManager.prototype
           @public
           @function
           @name setPathRemapping

           @param {string} prm Path remapping dictionary
           @param {string} assetUrl Asset prefix for all assets loaded
        */
        sm.setPathRemapping = function setPathRemappingFn(prm, assetUrl)
        {
            pathRemapping = prm;
            pathPrefix = assetUrl;
        };

        sm.setAutomaticParameterResize = function setAutomaticParameterResizeFn(name: string, size: number)
        {
            doPreprocess = true;
            resizeParameters[name] = size;
        };

        sm.destroy = function shaderManagerDestroyFn()
        {
            if (shaders)
            {
                var p;
                for (p in shaders)
                {
                    if (shaders.hasOwnProperty(p))
                    {
                        var shader = shaders[p];
                        if (shader)
                        {
                            shader.destroy();
                        }
                    }
                }
                shaders = null;
            }

            defaultShader = null;
            loadingShader = null;
            loadedObservers = null;
            numLoadingShaders = 0;
            pathRemapping = null;
            pathPrefix = null;
            rh = null;
            gd = null;
        };

        return sm;
    }
}

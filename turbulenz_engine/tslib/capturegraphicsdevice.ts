// Copyright (c) 2013-2014 Turbulenz Limited

var CaptureGraphicsCommand =
{
    setTechniqueParameters: 0,
    drawIndexed:            1,
    draw:                   2,
    setIndexBuffer:         3,
    setStream:              4,
    setTechnique:           5,
    setData:                6,
    setAllData:             7,
    beginRenderTarget:      8,
    clear:                  9,
    endRenderTarget:        10,
    beginEndDraw:           11,
    setScissor:             12,
    setViewport:            13,
    beginOcclusionQuery:    14,
    endOcclusionQuery:      15,
    updateTextureData:      16
};

class CaptureGraphicsDevice
{
    public static version = 1;

    public precision = 0.000001;

    gd:         any;
    current:    number[];
    frames:     any[];
    commands:   any[];
    numCommands: number;
    lastId:     number;
    recycledIds: number[];
    destroyedIds: number[];
    integerData:    {};
    floatData:      {};
    mixedData:      {};
    objects:    {};
    objectArray: any[];
    names:      {};
    numNames:   number;
    vertexBuffers: {};
    indexBuffers: {};
    techniqueParameterBuffers: {};
    semantics:  {};
    semanticsMap: {};
    formats:  {};
    formatsMap: {};
    textures:   {};
    shaders:    {};
    techniques: {};
    videos:     {};
    renderBuffers: {};
    renderTargets: {};
    occlusionQueries: {};
    reverseSemantic: string[];

    constructor(gd)
    {
        var reverseSemantic = [];
        var p;
        for (p in gd)
        {
            var value = gd[p];
            if (typeof value === "number" ||
                typeof value === "string" ||
                0 === p.indexOf('VERTEXFORMAT'))
            {
                this[p] = value;
                if (0 === p.indexOf('SEMANTIC_'))
                {
                    if (reverseSemantic.length <= value)
                    {
                        reverseSemantic[value] = p.slice(9);
                    }
                }
            }
        }
        this.gd = gd;
        this.current = [];
        this.frames = [];
        this.commands = [];
        this.numCommands = 0;
        this.lastId = -1;
        this.recycledIds = [];
        this.destroyedIds = [];
        this.integerData = {};
        this.floatData = {};
        this.mixedData = {};
        this.objects = {};
        this.objectArray = [];
        this.names = {};
        this.numNames = 0;
        this.vertexBuffers = {};
        this.indexBuffers = {};
        this.techniqueParameterBuffers = {};
        this.semantics = {};
        this.semanticsMap = {};
        this.formats = {};
        this.formatsMap = {};
        this.textures = {};
        this.shaders = {};
        this.techniques = {};
        this.videos = {};
        this.renderBuffers = {};
        this.renderTargets = {};
        this.occlusionQueries = {};
        this.reverseSemantic = reverseSemantic;
        return this;
    }

    private _getCommandId() : number
    {
        var id = this.numCommands;
        this.numCommands = (id + 1);
        return id;
    }

    private _getIntegerId() : number
    {
        if (this.recycledIds.length)
        {
            return this.recycledIds.pop();
        }
        var id = (this.lastId + 1);
        this.lastId = id;
        return id;
    }

    private _getStringId() : string
    {
        return this._getIntegerId().toString();
    }

    private _addData(data, length, integers) : string
    {
        var lowerIndex;

        var dataBins;
        if (data instanceof ArrayBuffer)
        {
            dataBins = this.mixedData;
        }
        else if (integers)
        {
            dataBins = this.integerData;
        }
        else
        {
            dataBins = this.floatData;
        }

        var dataBin = dataBins[length];
        if (dataBin === undefined)
        {
            dataBins[length] = dataBin = [];
            lowerIndex = 0;
        }
        else
        {
            if (data instanceof ArrayBuffer)
            {
                lowerIndex = this._lowerBoundGeneric(dataBin, new Uint8Array(data, 0, length), length, 0);
            }
            else if (integers)
            {
                lowerIndex = this._lowerBoundGeneric(dataBin, data, length, 0);
            }
            else
            {
                lowerIndex = this._lowerBoundFloat(dataBin, data, length);
            }

            // Check if we found an identical copy
            if (lowerIndex < 0)
            {
                lowerIndex = ((-lowerIndex) - 1);
                return dataBin[lowerIndex].toString();
            }
        }

        var clonedData;
        if (data instanceof ArrayBuffer)
        {
            clonedData = new Uint8Array(data.slice(0, length));
        }
        else if (integers)
        {
            if (data.BYTES_PER_ELEMENT)
            {
                // must be a typed array
                if (length < data.length)
                {
                    clonedData = new data.constructor(data.subarray(0, length));
                }
                else
                {
                    clonedData = new data.constructor(data);
                }
            }
            else
            {
                // Find extents to choose best container
                var min = data[0];
                var max = data[0];
                var n;
                for (n = 1; n < length; n += 1)
                {
                    var value = data[n];
                    if (min > value)
                    {
                        min = value;
                    }
                    else if (max < value)
                    {
                        max = value;
                    }
                }

                var typedConstructor;
                if (0 <= min && max <= 255)
                {
                    typedConstructor = Uint8Array;
                }
                else if (-128 <= min && max <= 127)
                {
                    typedConstructor = Int8Array;
                }
                else if (0 <= min && max <= 65535)
                {
                    typedConstructor = Uint16Array;
                }
                else if (-32768 <= min && max <= 32767)
                {
                    typedConstructor = Int16Array;
                }
                else if (0 <= min)
                {
                    typedConstructor = Uint32Array;
                }
                else
                {
                    typedConstructor = Int32Array;
                }

                if (length < data.length)
                {
                    clonedData = new typedConstructor(data.slice(0, length));
                }
                else
                {
                    clonedData = new typedConstructor(data);
                }
            }
        }
        else
        {
            if (length < data.length)
            {
                if (data.subarray)
                {
                    clonedData = new Float32Array(data.subarray(0, length));
                }
                else
                {
                    clonedData = new Float32Array(data.slice(0, length));
                }
            }
            else
            {
                clonedData = new Float32Array(data);
            }
        }

        var id = this._getIntegerId();

        if (lowerIndex < dataBin.length)
        {
            dataBin.splice(lowerIndex, 0, id, clonedData);
        }
        else
        {
            dataBin.push(id, clonedData);
        }

        return id.toString();
    }

    private _addCommand(method, arg1?, arg2?, arg3?, arg4?, arg5?, arg6?, arg7?, arg8?): void
    {
        var length = arguments.length;

        var lowerIndex;

        var commandsBin = this.commands[method];
        if (commandsBin === undefined)
        {
            this.commands[method] = commandsBin = [];
            lowerIndex = 0;
        }
        else if (0 < commandsBin.length)
        {
            if (length === 1)
            {
                // The method is the same for all the commands on the bin
                this.current.push(commandsBin[0]);
                return;
            }
            else
            {
                if (length === 2)
                {
                    lowerIndex = this._lowerBoundSimpleCommand(commandsBin, arguments);
                }
                else
                {
                    lowerIndex = this._lowerBoundGeneric(commandsBin, arguments, length, 1);
                }

                // Check if we found an identical copy
                if (lowerIndex < 0)
                {
                    lowerIndex = ((-lowerIndex) - 1);
                    this.current.push(commandsBin[lowerIndex]);
                    return;
                }
            }
        }
        else
        {
            lowerIndex = 0;
        }

        var command = new Array(length);
        var a;

        command[0] = method;
        for (a = 1; a < length; a += 1)
        {
            command[a] = arguments[a];
        }

        var cmdId = this._getCommandId();

        if (lowerIndex < commandsBin.length)
        {
            commandsBin.splice(lowerIndex, 0, cmdId, command);
        }
        else
        {
            commandsBin.push(cmdId, command);
        }

        this.current.push(cmdId);
    }

    private _objectToArray(object) : any[]
    {
        var objectArray = this.objectArray;
        objectArray.length = 0;

        var p, value;
        for (p in object)
        {
            if (object.hasOwnProperty(p))
            {
                value = object[p];
                if (value !== undefined && value !== null)
                {
                    objectArray.push(this._addName(p), this._clone(value));
                }
            }
        }

        return objectArray;
    }

    private _patchObjectArray(objectArray)
    {
        var length = objectArray.length;
        var n, value;
        for (n = 0; n < length; n += 2)
        {
            objectArray[n] = this._addName(objectArray[n]);
            value = objectArray[n + 1];
            if (value !== undefined && value !== null)
            {
                objectArray[n + 1] = this._clone(value);
            }
        }
        return objectArray;
    }

    // We need to implement our own sort because of the way data is stored
    private _sortObjectArray(data, length)
    {
        var k, v, i, j;
        for (i = 2; i < length; i += 2)
        {
            k = data[i];
            v = data[i + 1];

            for (j = (i - 2); j > -2 && data[j] > k; j -= 2)
            {
                data[j + 2] = data[j];
                data[j + 3] = data[j + 1];
            }

            data[j + 2] = k;
            data[j + 3] = v;
        }
    }

    private _addName(name: string) : number
    {
        var nameId = this.names[name];
        if (nameId === undefined)
        {
            nameId = this.numNames;
            this.numNames += 1;
            this.names[name] = nameId;
        }
        return nameId;
    }

    private _addObject(object) : string
    {
        var objectArray;
        if (object instanceof Array)
        {
            objectArray = this._patchObjectArray(object);
        }
        else
        {
            objectArray = this._objectToArray(object);
        }

        var length = objectArray.length;
        if (length === 0)
        {
            return null;
        }

        if (2 < length)
        {
            this._sortObjectArray(objectArray, length);
        }

        var lowerIndex;

        var objectsBin = this.objects[length];
        if (objectsBin === undefined)
        {
            this.objects[length] = objectsBin = [];
            lowerIndex = 0;
        }
        else
        {
            lowerIndex = this._lowerBoundGeneric(objectsBin, objectArray, length, 0);

            // Check if we found an identical copy
            if (lowerIndex < 0)
            {
                lowerIndex = ((-lowerIndex) - 1);
                return objectsBin[lowerIndex].toString();
            }
        }

        var id = this._getIntegerId();

        if (lowerIndex < objectsBin.length)
        {
            objectsBin.splice(lowerIndex, 0, id, objectArray.slice());
        }
        else
        {
            objectsBin.push(id, objectArray.slice());
        }

        return id.toString();
    }

    private _cloneObject(object, raw)
    {
        var length, index, result, value;

        // Check if it has an Id
        if (typeof object._id === "string")
        {
            return object._id;
        }

        if (object.BYTES_PER_ELEMENT)
        {
            length = object.length;
            if (raw || length === 0)
            {
                result = new Array(length);
                for (index = 0; index < length; index += 1)
                {
                    result[index] = object[index];
                }
                return result;
            }
            else
            {
                var integers = !(object instanceof Float32Array ||
                                 object instanceof Float64Array);
                return this._addData(object, length, integers);
            }
        }

        if (object instanceof Array)
        {
            length = object.length;
            if (!raw && length !== 0)
            {
                for (index = 0; index < length; index += 1)
                {
                    if (typeof object[index] !== "number")
                    {
                        break;
                    }
                }
                if (index === length)
                {
                    return this._addData(object, length, false);
                }
            }

            result = new Array(length);
            for (index = 0; index < length; index += 1)
            {
                value = object[index];
                if (value !== undefined &&
                    typeof value !== "function")
                {
                    if (!value || typeof value !== "object")
                    {
                        result[index] = value;
                    }
                    else
                    {
                        result[index] = this._cloneObject(value, raw);
                    }
                }
            }
            return result;
        }

        if (object instanceof ArrayBuffer)
        {
            return undefined;
        }

        if (object instanceof Date)
        {
            result = new Date(object.getTime());
            return result;
        }

        // This does not clone the prototype. See Object.create() if you want that behaviour
        result = {};
        var property;
        for (property in object)
        {
            if (object.hasOwnProperty(property))
            {
                value = object[property];
                if (value !== undefined &&
                    typeof value !== "function")
                {
                    if (!value || typeof value !== "object")
                    {
                        result[property] = value;
                    }
                    else
                    {
                        result[property] = this._cloneObject(value, raw);
                    }
                }
            }
        }
        return result;
    }

    private _clone(object)
    {
        // boolean, numbers, strings, undefined, null
        if (!object || typeof object !== "object")
        {
            // We are assuming that 'object' will never be a function
            return object;
        }

        return this._cloneObject(object, false);
    }

    private _cloneVertexFormats(formats)
    {
        var gd = this.gd;
        var numFormats = formats.length;
        var newFormats = new Array(numFormats);
        var n;
        for (n = 0; n < numFormats; n += 1)
        {
            var fmt = formats[n];
            if (typeof fmt === "string")
            {
                newFormats[n] = fmt;
            }
            else
            {
                if (fmt === gd.VERTEXFORMAT_BYTE4)
                {
                    newFormats[n] = 'BYTE4';
                }
                else if (fmt === gd.VERTEXFORMAT_BYTE4N)
                {
                    newFormats[n] = 'BYTE4N';
                }
                else if (fmt === gd.VERTEXFORMAT_UBYTE4)
                {
                    newFormats[n] = 'UBYTE4';
                }
                else if (fmt === gd.VERTEXFORMAT_UBYTE4N)
                {
                    newFormats[n] = 'UBYTE4N';
                }
                else if (fmt === gd.VERTEXFORMAT_SHORT2)
                {
                    newFormats[n] = 'SHORT2';
                }
                else if (fmt === gd.VERTEXFORMAT_SHORT2N)
                {
                    newFormats[n] = 'SHORT2N';
                }
                else if (fmt === gd.VERTEXFORMAT_SHORT4)
                {
                    newFormats[n] = 'SHORT4';
                }
                else if (fmt === gd.VERTEXFORMAT_SHORT4N)
                {
                    newFormats[n] = 'SHORT4N';
                }
                else if (fmt === gd.VERTEXFORMAT_USHORT2)
                {
                    newFormats[n] = 'USHORT2';
                }
                else if (fmt === gd.VERTEXFORMAT_USHORT2N)
                {
                    newFormats[n] = 'USHORT2N';
                }
                else if (fmt === gd.VERTEXFORMAT_USHORT4)
                {
                    newFormats[n] = 'USHORT4';
                }
                else if (fmt === gd.VERTEXFORMAT_USHORT4N)
                {
                    newFormats[n] = 'USHORT4N';
                }
                else if (fmt === gd.VERTEXFORMAT_FLOAT1)
                {
                    newFormats[n] = 'FLOAT1';
                }
                else if (fmt === gd.VERTEXFORMAT_FLOAT2)
                {
                    newFormats[n] = 'FLOAT2';
                }
                else if (fmt === gd.VERTEXFORMAT_FLOAT3)
                {
                    newFormats[n] = 'FLOAT3';
                }
                else if (fmt === gd.VERTEXFORMAT_FLOAT4)
                {
                    newFormats[n] = 'FLOAT4';
                }
            }
        }
        var hash = newFormats.join(',');
        var id = this.formatsMap[hash];
        if (id === undefined)
        {
            id = this._getStringId();
            this.formats[id] = newFormats;
            this.formatsMap[hash] = id;
        }
        return id;
    }

    private _cloneSemantics(semantics)
    {
        var gd = this.gd;
        var numSemantics = semantics.length;
        var newSemantics = new Array(numSemantics);
        var n, clonedSemantic;
        for (n = 0; n < numSemantics; n += 1)
        {
            var semantic = semantics[n];
            if (typeof semantic === "string")
            {
                clonedSemantic = semantic;
            }
            else
            {
                clonedSemantic = this.reverseSemantic[semantic];
            }
            if (clonedSemantic === 'TEXCOORD0')
            {
                clonedSemantic = 'TEXCOORD';
            }
            newSemantics[n] = clonedSemantic;
        }
        return newSemantics;
    }

    private _checkProperties(pass)
    {
        var techniqueParameters = {};
        var objectArray = this.objectArray;
        objectArray.length = 0;

        pass.dirty = false;
        var parameters = pass.parameters;
        for (var p in parameters)
        {
            if (parameters.hasOwnProperty(p))
            {
                var parameter = parameters[p];
                if (parameter.dirty)
                {
                    parameter.dirty = 0;
                    var paramInfo = parameter.info;
                    if (paramInfo &&
                        null !== location)
                    {
                        var parameterValues = paramInfo.values;
                        var value;
                        if (paramInfo.sampler !== undefined)
                        {
                            value = parameterValues;
                        }
                        else if (1 === paramInfo.numValues)
                        {
                            value = parameterValues[0];
                        }
                        else
                        {
                            value = parameterValues;
                        }
                        techniqueParameters[p] = value;
                        objectArray.push(p, value);
                    }
                }
            }
        }

        var objectId = this._addObject(objectArray);
        if (objectId !== null)
        {
            this._addCommand(CaptureGraphicsCommand.setTechniqueParameters, objectId);
        }

        this.gd.setTechniqueParameters(techniqueParameters);
    }

    private _lowerBoundGeneric(bin: any[], data: any, length: number, offset: number) : number
    {
        var first: number = 0;
        var count: number = (bin.length >>> 1); // Bin elements ocupy two slots, divide by 2
        var step: number, middle : number, binIndex:number;
        var n: number;
        var a, av, bv;

        while (0 < count)
        {
            step = (count >>> 1);
            middle = (first + step);
            binIndex = ((middle << 1) + 1); // Bin elements have the data on the second slot

            a = bin[binIndex];
            n = offset;
            for (;;)
            {
                av = a[n];
                bv = data[n];
                if (av === bv)
                {
                    n += 1;
                    if (n >= length)
                    {
                        // This would be a non-zero negative value to signal that we found an identical copy
                        return -binIndex;
                    }
                }
                else if (av < bv)
                {
                    first = (middle + 1);
                    count -= (step + 1);
                    break;
                }
                else //if (av > bv)
                {
                    count = step;
                    break;
                }
            }
        }

        return (first << 1); // Bin elements ocupy two slots, multiply by 2
    }

    private _lowerBoundSimpleCommand(bin: any[], data: any) : number
    {
        var first: number = 0;
        var count: number = (bin.length >>> 1); // Bin elements ocupy two slots, divide by 2
        var step: number, middle : number, binIndex:number;
        var av, bv;

        while (0 < count)
        {
            step = (count >>> 1);
            middle = (first + step);
            binIndex = ((middle << 1) + 1); // Bin elements have the data on the second slot

            // Simple commands only have one parameter after method
            av = bin[binIndex][1];
            bv = data[1];
            if (av === bv)
            {
                // This would be a non-zero negative value to signal that we found an identical copy
                return -binIndex;
            }
            else if (av < bv)
            {
                first = (middle + 1);
                count -= (step + 1);
            }
            else //if (av > bv)
            {
                count = step;
            }
        }

        return (first << 1); // Bin elements ocupy two slots, multiply by 2
    }

    private _lowerBoundFloat(bin: any[], data: any, length: number) : number
    {
        var first: number = 0;
        var count: number = (bin.length >>> 1); // Bin elements ocupy two slots, divide by 2
        var step: number, middle : number, binIndex:number, diff: number;
        var positiveThreshold: number = this.precision;
        var negativeThreshold: number = -positiveThreshold;
        var diff: number, n: number;
        var a;

        while (0 < count)
        {
            step = (count >>> 1);
            middle = (first + step);
            binIndex = ((middle << 1) + 1); // Bin elements have the data on the second slot

            n = 0;
            a = bin[binIndex];
            for (;;)
            {
                diff = (a[n] - data[n]);
                if (diff < negativeThreshold)
                {
                    first = (middle + 1);
                    count -= (step + 1);
                    break;
                }
                else if (diff > positiveThreshold)
                {
                    count = step;
                    break;
                }

                n += 1;
                if (n >= length)
                {
                    // This would be a non-zero negative value to signal that we found an identical copy
                    return -binIndex;
                }
            }
        }

        return (first << 1); // Bin elements ocupy two slots, multiply by 2
    }

    private _equalFloatArrays(a, b, length) : boolean
    {
        var n = 0;
        var threshold = this.precision;
        do
        {
            if (Math.abs(a[n] - b[n]) >= threshold)
            {
                return false;
            }
            n += 1;
        }
        while (n < length);
        return true;
    }

    private _equalIntegerArrays(a, b, length) : boolean
    {
        var n = 0;
        do
        {
            if (a[n] !== b[n])
            {
                return false;
            }
            n += 1;
        }
        while (n < length);
        return true;
    }

    private _setFilteredTechniqueParameters(techniqueParameters, validParameters, currentParameters)
    {
        var objectArray = this.objectArray;
        objectArray.length = 0;

        var p, value, currentValue;
        for (p in techniqueParameters)
        {
            if (validParameters[p] !== undefined)
            {
                value = techniqueParameters[p];
                currentValue = currentParameters[p];
                if (currentValue !== value)
                {
                    if (value !== undefined)
                    {
                        if (currentValue !== undefined &&
                            (value instanceof Float32Array ||
                             value instanceof Array) &&
                            value._id === undefined &&
                            value.length <= currentValue.length &&
                            this._equalFloatArrays(value, currentValue, value.length))
                        {
                            continue;
                        }
                        currentParameters[p] = value;
                        objectArray.push(p, value);
                    }
                    else
                    {
                        delete techniqueParameters[p];
                    }
                }
            }
        }

        if (0 < objectArray.length)
        {
            var objectId = this._addObject(objectArray);
            if (objectId !== null)
            {
                this._addCommand(CaptureGraphicsCommand.setTechniqueParameters, objectId);
            }

            this.gd.setTechniqueParameters(techniqueParameters);
        }
    }

    // GraphicsDevice API
    public drawIndexed(primitive, numIndices, first)
    {
        this.gd.drawIndexed(primitive, numIndices, first);

        this._addCommand(CaptureGraphicsCommand.drawIndexed, primitive, numIndices, first || 0);
    }

    public draw(primitive, numVertices, first)
    {
        this.gd.draw(primitive, numVertices, first);

        this._addCommand(CaptureGraphicsCommand.draw, primitive, numVertices, first || 0);
    }

    public setTechniqueParameters(unused?)
    {
        var numTechniqueParameters = arguments.length;
        for (var t = 0; t < numTechniqueParameters; t += 1)
        {
            var techniqueParameters = arguments[t];
            if (techniqueParameters)
            {
                var objectId = this._addObject(techniqueParameters);
                if (objectId !== null)
                {
                    this._addCommand(CaptureGraphicsCommand.setTechniqueParameters, objectId);
                }
            }
        }

        this.gd.setTechniqueParameters.apply(this.gd, arguments);
    }

    public setTechnique(technique)
    {
        if (technique.passes.length === 1)
        {
            var pass = technique.passes[0];
            if (pass.dirty)
            {
                this._checkProperties(pass);
            }
        }

        this.gd.setTechnique(technique);

        // Prevent technique from setting data directly, so we can check the dirty flag
        technique.device = null;

        // we need to do this AFTER the technique has been activated for the first time
        var id = technique._id;
        if (id === undefined)
        {
            id = this._getStringId();
            technique._id = id;
            this.techniques[id] = {
                shader: technique.shader._id,
                name: technique.name
            };

            if (technique.passes.length === 1)
            {
                var self = this;
                technique.checkProperties = function captureCheckProperties()
                {
                    var pass = this.passes[0];
                    if (pass.dirty)
                    {
                        self._checkProperties(pass);
                    }
                };
            }
        }
        this._addCommand(CaptureGraphicsCommand.setTechnique, id);
    }

    public setStream(vertexBuffer, semantics, offset)
    {
        if (offset === undefined)
        {
            offset = 0;
        }
        this._addCommand(CaptureGraphicsCommand.setStream, vertexBuffer._id, semantics._id, offset);

        this.gd.setStream(vertexBuffer, semantics, offset);
    }

    public setIndexBuffer(indexBuffer)
    {
        this._addCommand(CaptureGraphicsCommand.setIndexBuffer, indexBuffer._id);

        this.gd.setIndexBuffer(indexBuffer);
    }

    public drawArray(drawParametersArray, globalTechniqueParametersArray, sortMode)
    {
        var numDrawParameters = drawParametersArray.length;
        if (numDrawParameters <= 0)
        {
            return;
        }

        if (numDrawParameters > 1 && sortMode)
        {
            if (sortMode > 0)
            {
                drawParametersArray.sort(function drawArraySortPositive(a, b) {
                    return (b.sortKey - a.sortKey);
                });
            }
            else //if (sortMode < 0)
            {
                drawParametersArray.sort(function drawArraySortNegative(a, b) {
                    return (a.sortKey - b.sortKey);
                });
            }
        }

        var numGlobalTechniqueParameters = globalTechniqueParametersArray.length;

        var currentParameters = null;
        var validParameters = null;
        var activeIndexBuffer = null;
        var lastTechnique = null;
        var lastEndStreams = -1;
        var lastDrawParameters = null;
        var v = 0;
        var streamsMatch = false;
        var vertexBuffer = null;
        var offset = 0;
        var t = 0;

        var drawCommand = -1;
        var current = this.current;
        var gd = this.gd;

        for (var n = 0; n < numDrawParameters; n += 1)
        {
            var drawParameters = drawParametersArray[n];
            var technique = drawParameters.technique;
            var endTechniqueParameters = drawParameters._endTechniqueParameters;
            var endStreams = drawParameters._endStreams;
            var endInstances = drawParameters._endInstances;
            var indexBuffer = drawParameters._indexBuffer;
            var primitive = drawParameters.primitive;
            var count = drawParameters.count;
            var firstIndex = drawParameters.firstIndex;

            if (lastTechnique !== technique)
            {
                lastTechnique = technique;

                this.setTechnique(technique);

                if (technique.passes.length === 1)
                {
                    validParameters = technique.passes[0].parameters;
                }
                else
                {
                    validParameters = technique.shader.parameters;
                }

                currentParameters = {};

                for (t = 0; t < numGlobalTechniqueParameters; t += 1)
                {
                    this._setFilteredTechniqueParameters(globalTechniqueParametersArray[t],
                                                         validParameters,
                                                         currentParameters);
                }
            }

            for (t = (16 * 3); t < endTechniqueParameters; t += 1)
            {
                this._setFilteredTechniqueParameters(drawParameters[t],
                                                     validParameters,
                                                     currentParameters);
            }

            streamsMatch = (lastEndStreams === endStreams);
            for (v = 0; streamsMatch && v < endStreams; v += 3)
            {
                streamsMatch = (lastDrawParameters[v]     === drawParameters[v]     &&
                                lastDrawParameters[v + 1] === drawParameters[v + 1] &&
                                lastDrawParameters[v + 2] === drawParameters[v + 2]);
            }

            if (!streamsMatch)
            {
                lastEndStreams = endStreams;
                lastDrawParameters = drawParameters;

                for (v = 0; v < endStreams; v += 3)
                {
                    vertexBuffer = drawParameters[v];
                    if (vertexBuffer)
                    {
                        this.setStream(vertexBuffer, drawParameters[v + 1], drawParameters[v + 2]);
                    }
                }
            }

            /*jshint bitwise: false*/
            if (indexBuffer)
            {
                if (activeIndexBuffer !== indexBuffer)
                {
                    activeIndexBuffer = indexBuffer;
                    this.setIndexBuffer(indexBuffer);
                }

                t = ((16 * 3) + 8);
                if (t < endInstances)
                {
                    drawCommand = -1;
                    do
                    {
                        this._setFilteredTechniqueParameters(drawParameters[t],
                                                             validParameters,
                                                             currentParameters);
                        if (drawCommand === -1)
                        {
                            this.drawIndexed(primitive, count, firstIndex);
                            drawCommand = current[current.length - 1];
                        }
                        else
                        {
                            gd.drawIndexed(primitive, count, firstIndex);
                            current.push(drawCommand);
                        }

                        t += 1;
                    }
                    while (t < endInstances);
                }
                else
                {
                    this.drawIndexed(primitive, count, firstIndex);
                }
            }
            else
            {
                t = ((16 * 3) + 8);
                if (t < endInstances)
                {
                    drawCommand = -1;
                    do
                    {
                        this._setFilteredTechniqueParameters(drawParameters[t],
                                                             validParameters,
                                                             currentParameters);
                        if (drawCommand === -1)
                        {
                            this.draw(primitive, count, firstIndex);
                            drawCommand = current[current.length - 1];
                        }
                        else
                        {
                            gd.draw(primitive, count, firstIndex);
                            current.push(drawCommand);
                        }

                        t += 1;
                    }
                    while (t < endInstances);
                }
                else
                {
                    this.draw(primitive, count, firstIndex);
                }
            }
        }
    }

    public beginDraw(primitive, numVertices, formats, semantics)
    {
        var writer = this.gd.beginDraw(primitive, numVertices, formats, semantics);
        if (writer)
        {
            var self = this;
            var data = [];
            numVertices = 0;
            var captureWriter = function captureBeginDrawWriter()
            {
                var numArguments = arguments.length;
                for (var a = 0; a < numArguments; a += 1)
                {
                    var value = arguments[a];
                    if (typeof value === 'number')
                    {
                        data.push(value);
                    }
                    else
                    {
                        data.push.apply(data, value);
                    }
                }
                numVertices += 1;

                writer.apply(this, arguments);
            };
            captureWriter['end'] = function captureEndDrawWriter()
            {
                if (0 < numVertices)
                {
                    self._addCommand(CaptureGraphicsCommand.beginEndDraw,
                                     primitive,
                                     numVertices,
                                     self._cloneVertexFormats(formats),
                                     semantics._id,
                                     self._addData(data, data.length, false));
                }
            };
            captureWriter['proxy'] = writer;
            return captureWriter;
        }
        else
        {
            return writer;
        }
    }

    public endDraw(writer)
    {
        writer['end']();
        this.gd.endDraw(writer['proxy']);
    }

    public setViewport(x, y, w, h)
    {
        var gd = this.gd;

        gd.setViewport(x, y, w, h);

        if (w === gd.width &&
            h === gd.height)
        {
            w = -1;
            h = -1;
        }
        this._addCommand(CaptureGraphicsCommand.setViewport, x, y, w, h);
    }

    public setScissor(x, y, w, h)
    {
        var gd = this.gd;

        gd.setScissor(x, y, w, h);

        if (w === gd.width &&
            h === gd.height)
        {
            w = -1;
            h = -1;
        }
        this._addCommand(CaptureGraphicsCommand.setScissor, x, y, w, h);
    }

    public clear(color, depth, stencil)
    {
        if (depth === undefined && stencil === undefined)
        {
            this._addCommand(CaptureGraphicsCommand.clear, this._clone(color));
        }
        else
        {
            this._addCommand(CaptureGraphicsCommand.clear, this._clone(color), depth, stencil);
        }

        this.gd.clear(color, depth, stencil);
    }

    public beginFrame()
    {
        this['width'] = this.gd.width;
        this['height'] = this.gd.height;
        return this.gd.beginFrame();
    }

    public beginRenderTarget(renderTarget)
    {
        this._addCommand(CaptureGraphicsCommand.beginRenderTarget, renderTarget._id);

        return this.gd.beginRenderTarget(renderTarget);
    }

    public endRenderTarget()
    {
        this._addCommand(CaptureGraphicsCommand.endRenderTarget);

        this.gd.endRenderTarget();
    }

    public beginOcclusionQuery(query)
    {
        this._addCommand(CaptureGraphicsCommand.beginOcclusionQuery, query._id);

        return this.gd.beginOcclusionQuery(query);
    }

    public endOcclusionQuery(query)
    {
        this._addCommand(CaptureGraphicsCommand.endOcclusionQuery, query._id);

        this.gd.endOcclusionQuery(query);
    }

    public endFrame()
    {
        this.frames.push(this.current);
        this.current = [];

        this.gd.endFrame();

        this['fps'] = this.gd.fps;
    }

    public createTechniqueParameters(params)
    {
        return this.gd.createTechniqueParameters(params);
    }

    public createSemantics(attributes)
    {
        var semantics = this.gd.createSemantics(attributes);
        if (semantics)
        {
            var clonedAttributes = this._cloneSemantics(attributes);
            var hash = clonedAttributes.join(',');
            var id = this.semanticsMap[hash];
            if (id === undefined)
            {
                id = this._getStringId();
                this.semanticsMap[hash] = id;
                this.semantics[id] = clonedAttributes;
            }
            semantics._id = id;
        }
        return semantics;
    }

    public createVertexBuffer(params)
    {
        var vertexBuffer = this.gd.createVertexBuffer(params);
        if (vertexBuffer)
        {
            var id = this._getStringId();
            vertexBuffer._id = id;
            var self = this;
            var setData = vertexBuffer.setData;
            vertexBuffer.setData = function captureVBSetData(data, offset, numVertices)
            {
                if (offset === undefined)
                {
                    offset = 0;
                }
                if (numVertices === undefined)
                {
                    numVertices = this.numVertices;
                }

                var length;
                if (data instanceof ArrayBuffer)
                {
                    length = (numVertices * this.strideInBytes);
                }
                else
                {
                    length = (numVertices * this.stride);
                }

                if (offset === 0 && numVertices === this.numVertices)
                {
                    self._addCommand(CaptureGraphicsCommand.setAllData,
                                     id,
                                     self._addData(data, length, false));
                }
                else if (0 < numVertices)
                {
                    self._addCommand(CaptureGraphicsCommand.setData,
                                     id,
                                     offset,
                                     numVertices,
                                     self._addData(data, length, false));
                }

                setData.call(this, data, offset, numVertices);
            };
            var map = vertexBuffer.map;
            vertexBuffer.map = function captureVBmap(offset, numVertices)
            {
                if (offset === undefined)
                {
                    offset = 0;
                }
                if (numVertices === undefined)
                {
                    numVertices = this.numVertices;
                }
                var writer = map.call(this, offset, numVertices);
                if (writer)
                {
                    var data = [];
                    numVertices = 0;
                    var captureWriter = function captureVBWriter()
                    {
                        var numArguments = arguments.length;
                        for (var a = 0; a < numArguments; a += 1)
                        {
                            var value = arguments[a];
                            if (typeof value === 'number')
                            {
                                data.push(value);
                            }
                            else
                            {
                                data.push.apply(data, value);
                            }
                        }
                        numVertices += 1;

                        writer.apply(this, arguments);
                    };
                    captureWriter['end'] = function captureVBWriterEnd()
                    {
                        if (offset === 0 && numVertices === vertexBuffer.numVertices)
                        {
                            self._addCommand(CaptureGraphicsCommand.setAllData,
                                             id,
                                             self._addData(data, data.length, false));
                        }
                        else if (0 < numVertices)
                        {
                            self._addCommand(CaptureGraphicsCommand.setData,
                                             id,
                                             offset,
                                             numVertices,
                                             self._addData(data, data.length, false));
                        }
                    };
                    captureWriter['proxy'] = writer;
                    return captureWriter;
                }
                else
                {
                    return writer;
                }
            };
            var unmap = vertexBuffer.unmap;
            vertexBuffer.unmap = function captureVBunmap(writer)
            {
                writer['end']();
                unmap.call(this, writer['proxy']);
            };

            var destroy = vertexBuffer.destroy;
            vertexBuffer.destroy = function captureVBDestroy()
            {
                self.destroyedIds.push(parseInt(this._id, 10));
                destroy.call(this);
            };

            var attributes = params.attributes;
            params.attributes = this._cloneVertexFormats(attributes);
            if (params.dynamic === false || params['transient'])
            {
                delete params.dynamic;
            }
            if (params.data)
            {
                var data = params.data;
                this._addCommand(CaptureGraphicsCommand.setAllData,
                                 id,
                                 this._addData(data, data.length, false));
                delete params.data;
            }
            this.vertexBuffers[id] = this._cloneObject(params, true);
            params.attributes = attributes;
        }
        return vertexBuffer;
    }

    public createIndexBuffer(params)
    {
        var indexBuffer = this.gd.createIndexBuffer(params);
        if (indexBuffer)
        {
            var id = this._getStringId();
            indexBuffer._id = id;
            var self = this;
            var setData = indexBuffer.setData;
            indexBuffer.setData = function captureIBSetData(data, offset, numIndices)
            {
                if (offset === undefined)
                {
                    offset = 0;
                }
                if (numIndices === undefined)
                {
                    numIndices = this.numIndices;
                }

                if (offset === 0 && numIndices === this.numIndices)
                {
                    self._addCommand(CaptureGraphicsCommand.setAllData,
                                     id,
                                     self._addData(data, numIndices, true));
                }
                else if (0 < numIndices)
                {
                    self._addCommand(CaptureGraphicsCommand.setData,
                                     id,
                                     offset,
                                     numIndices,
                                     self._addData(data, numIndices, true));
                }

                setData.call(this, data, offset, numIndices);
            };
            var map = indexBuffer.map;
            indexBuffer.map = function captureIBmap(offset, numIndices)
            {
                if (offset === undefined)
                {
                    offset = 0;
                }
                if (numIndices === undefined)
                {
                    numIndices = this.numIndices;
                }
                var writer = map.call(this, offset, numIndices);
                if (writer)
                {
                    writer['end'] = function captureIBWriterEnd()
                    {
                        var data = writer.data;
                        var numIndices = writer.getNumWrittenIndices();
                        if (offset === 0 && numIndices === indexBuffer.numIndices)
                        {
                            self._addCommand(CaptureGraphicsCommand.setAllData,
                                             id,
                                             self._addData(data, numIndices, true));
                        }
                        else if (0 < numIndices)
                        {
                            self._addCommand(CaptureGraphicsCommand.setData,
                                             id,
                                             offset,
                                             numIndices,
                                             self._addData(data, numIndices, true));
                        }
                    };
                }
                return writer;
            };
            var unmap = indexBuffer.unmap;
            indexBuffer.unmap = function captureIBunmap(writer)
            {
                writer['end']();
                unmap.call(this, writer);
            };

            var destroy = indexBuffer.destroy;
            indexBuffer.destroy = function captureIBDestroy()
            {
                self.destroyedIds.push(parseInt(this._id, 10));
                destroy.call(this);
            };

            if (params.dynamic === false || params['transient'])
            {
                delete params.dynamic;
            }
            if (params.data)
            {
                var data = params.data;
                this._addCommand(CaptureGraphicsCommand.setAllData,
                                 id,
                                 this._addData(data, data.length, true));
                delete params.data;
            }
            var clonedParams = this._cloneObject(params, true);
            if (clonedParams.format === this.gd.INDEXFORMAT_USHORT)
            {
                clonedParams.format = 'USHORT';
            }
            else if (clonedParams.format === this.gd.INDEXFORMAT_UINT)
            {
                clonedParams.format = 'UINT';
            }
            else if (clonedParams.format === this.gd.INDEXFORMAT_UBYTE)
            {
                clonedParams.format = 'UBYTE';
            }
            this.indexBuffers[id] = clonedParams;
        }
        return indexBuffer;
    }

    public createTexture(params)
    {
        var texture = this.gd.createTexture(params);
        if (texture)
        {
            var id = this._getStringId();
            texture._id = id;
            var self = this;
            var setData = texture.setData;
            texture.setData = function captureTSetData(data)
            {
                var integers = !(data instanceof Float32Array ||
                                 data instanceof Float64Array);
                var clonedData = self._addData(data, data.length, integers);
                if (arguments.length === 1)
                {
                    self._addCommand(CaptureGraphicsCommand.setAllData, id, clonedData);

                    setData.call(this, data);
                }
                else
                {
                    self._addCommand(CaptureGraphicsCommand.updateTextureData, id, clonedData,
                                     arguments[1], arguments[2],
                                     arguments[3], arguments[4],
                                     arguments[5], arguments[6]);

                    setData.apply(this, arguments);
                }
            };
            if (params.data)
            {
                var data = params.data;
                var integers = !(data instanceof Float32Array ||
                                 data instanceof Float64Array);
                this._addCommand(CaptureGraphicsCommand.setAllData,
                                 id,
                                 this._addData(data, data.length, integers));
                delete params.data;
            }
            if (params.cubemap === false)
            {
                delete params.cubemap;
            }
            if (params.dynamic === false)
            {
                delete params.dynamic;
            }
            if (params.mipmaps === false)
            {
                delete params.mipmaps;
            }
            var clonedParams = this._cloneObject(params, true);
            if (clonedParams.renderable)
            {
                // special case for fullscreen renderables
                if (clonedParams.width === this.gd.width &&
                    clonedParams.height === this.gd.height)
                {
                    clonedParams.width = -1;
                    clonedParams.height = -1;
                }
            }
            this.textures[id] = clonedParams;
        }
        return texture;
    }

    public createVideo(params)
    {
        var video = this.gd.createVideo(params);
        if (video)
        {
            var id = this._getStringId();
            video._id = id;
            this.videos[id] = this._cloneObject(params, true);
        }
        return video;
    }

    public createShader(params: any, onload?: { (shader: Shader): void; })
    {
        // Need to clone before calling createShader because that function modifies the input object...
        var clonedParams = this._cloneObject(params, true);
        var shader = this.gd.createShader(params, onload);
        if (shader)
        {
            var id = this._getStringId();
            shader._id = id;
            this.shaders[id] = clonedParams;
        }
        return shader;
    }

    public createTechniqueParameterBuffer(params)
    {
        var techniqueParameterBuffer = new Float32Array(params.numFloats);
        var id = this._getStringId();
        techniqueParameterBuffer['_id'] = id;
        if (techniqueParameterBuffer['_id'] !== id)
        {
            // Firefox does not support adding extra properties to Float32Arrays
            // TechniqueParameterBuffers will be treated as regular Float32Arrays...
            return this.gd.createTechniqueParameterBuffer(params);
        }
        var self = this;
        techniqueParameterBuffer['setData'] = function captureTPBSetData(data, offset?, numValues?)
        {
            if (offset === undefined)
            {
                offset = 0;
            }
            if (numValues === undefined)
            {
                numValues = this.length;
            }

            var n = 0;
            while (n < numValues &&
                   this[offset] === data[n])
            {
                offset += 1;
                n += 1;
            }

            var end = (offset + numValues);
            while (n < numValues &&
                   this[end - 1] === data[numValues - 1])
            {
                end -= 1;
                numValues -= 1;
            }
            if (n >= numValues)
            {
                return;
            }

            if (0 < n)
            {
                numValues -= n;
                if (data.subarray)
                {
                    data = data.subarray(n, (n + numValues));
                }
                else
                {
                    data = data.slice(n, numValues);
                }
            }

            if (offset === 0 && numValues === this.length)
            {
                self._addCommand(CaptureGraphicsCommand.setAllData,
                                 id,
                                 self._addData(data, numValues, false));
            }
            else
            {
                self._addCommand(CaptureGraphicsCommand.setData,
                                 id,
                                 offset,
                                 numValues,
                                 self._addData(data, numValues, false));
            }

            n = 0;
            do
            {
                this[offset] = data[n];
                offset += 1;
                n += 1;
            }
            while (n < numValues);
        };
        techniqueParameterBuffer['map'] = function captureTPBmap(offset, numValues)
        {
            if (offset === undefined)
            {
                offset = 0;
            }
            if (numValues === undefined)
            {
                numValues = this.length;
            }
            var data = new Float32Array(numValues);
            var valuesWritten = 0;
            var captureWriter = function capturTPBWriter()
            {
                var numArguments = arguments.length;
                for (var a = 0; a < numArguments; a += 1)
                {
                    var value = arguments[a];
                    if (typeof value === 'number')
                    {
                        data[valuesWritten] = value;
                        valuesWritten += 1;
                    }
                    else
                    {
                        var length = value.length;
                        var n;
                        for (n = 0; n < length; n += 1)
                        {
                            data[valuesWritten] = value[n];
                            valuesWritten += 1;
                        }
                    }
                }
            };
            captureWriter['end'] = function captureTPBWriterEnd()
            {
                techniqueParameterBuffer['setData'](data, offset, valuesWritten);
            };
            return captureWriter;
        };
        techniqueParameterBuffer['unmap'] = function captureTPBunmap(writer)
        {
            writer['end']();
        };

        techniqueParameterBuffer['destroy'] = function captureTPBDestroy()
        {
            self.destroyedIds.push(parseInt(this._id, 10));
            this.length = 0;
        };

        if (params.dynamic === false)
        {
            delete params.dynamic;
        }
        if (params.data)
        {
            var data = params.data;
            this._addCommand(CaptureGraphicsCommand.setAllData,
                             id,
                             this._addData(data, data.length, false));
            delete params.data;
        }
        this.techniqueParameterBuffers[id] = this._cloneObject(params, true);
        return techniqueParameterBuffer;
    }

    public createRenderBuffer(params)
    {
        var renderBuffer = this.gd.createRenderBuffer(params);
        if (renderBuffer)
        {
            var id = this._getStringId();
            renderBuffer._id = id;
            var clonedParams = this._cloneObject(params, true);
            // special case for fullscreen buffers
            if (clonedParams.width === this.gd.width &&
                clonedParams.height === this.gd.height)
            {
                clonedParams.width = -1;
                clonedParams.height = -1;
            }
            this.renderBuffers[id] = clonedParams;
        }
        return renderBuffer;
    }

    public createRenderTarget(params)
    {
        var renderTarget = this.gd.createRenderTarget(params);
        if (renderTarget)
        {
            var id = this._getStringId();
            renderTarget._id = id;
            this.renderTargets[id] = this._cloneObject(params, true);
        }
        return renderTarget;
    }

    public createOcclusionQuery(params)
    {
        var query = this.gd.createOcclusionQuery(params);
        if (query)
        {
            var id = this._getStringId();
            query._id = id;
            this.occlusionQueries[id] = this._cloneObject(params, true);
        }
        return query;
    }

    public createDrawParameters(params)
    {
        return this.gd.createDrawParameters(params);
    }

    public isSupported(name)
    {
        return this.gd.isSupported(name);
    }

    public maxSupported(name)
    {
        return this.gd.maxSupported(name);
    }

    public loadTexturesArchive(params)
    {
        var clonedParams = this._cloneObject(params, true);
        clonedParams.archive = {};
        this.textures[this._getStringId()] = clonedParams;

        var self = this;
        var ontextureload = params.ontextureload;
        var onload = params.onload;
        params.ontextureload = function captureOnTextureLoad(texture)
        {
            if (texture)
            {
                var id = self._getStringId();
                clonedParams.archive[texture.name] = id;
                texture._id = id;
                ontextureload(texture);
            }
        };
        params.onload = function captureOnLoad(success, status)
        {
            params.ontextureload = ontextureload;
            params.onload = onload;
            if (onload)
            {
                params.onload(success, status);
            }
        };
        return this.gd.loadTexturesArchive(params);
    }

    public getScreenshot(compress, x?, y?, width?, height?)
    {
        return this.gd.getScreenshot(compress, x, y, width, height);
    }

    public flush()
    {
        this.gd.flush();
    }

    public finish()
    {
        this.gd.finish();
    }

    // Capture device API
    public getFramesString()
    {
        var framesString = '{"version":1,';

        framesString += '"width":' + this.gd.width + ',';
        framesString += '"height":' + this.gd.height + ',';

        framesString += '"names":[';
        var names = this.names;
        var numNames = this.numNames;
        var namesArray = new Array(numNames);
        var p;
        for (p in names)
        {
            if (names.hasOwnProperty(p))
            {
                namesArray[names[p]] = p;
            }
        }
        var n;
        for (n = 0; n < numNames; n += 1)
        {
            if (n)
            {
                framesString += ',';
            }
            framesString += '"' + namesArray[n] + '"';
        }

        framesString += '],"objects":[';
        var objects = this.objects;
        var addValuesComma = false;
        var objectsBin, object, binLength, id, j, value, valueInt;
        for (p in objects)
        {
            if (objects.hasOwnProperty(p))
            {
                objectsBin = objects[p];
                binLength = objectsBin.length;
                for (n = 0; n < binLength; n += 2)
                {
                    id = objectsBin[n];
                    object = objectsBin[n + 1];
                    length = object.length;
                    if (addValuesComma)
                    {
                        framesString += ',';
                    }
                    else
                    {
                        addValuesComma = true;
                    }
                    framesString += id + ',[';
                    for (j = 0; j < length; j += 1)
                    {
                        if (j)
                        {
                            framesString += ',';
                        }
                        value = object[j];
                        if (typeof value === "string")
                        {
                            framesString += '"' + value + '"';
                        }
                        else if (typeof value === "number")
                        {
                            valueInt = (value | 0);
                            if (valueInt === value)
                            {
                                framesString += valueInt;
                            }
                            else
                            {
                                framesString += value.toFixed(4).replace(/\.?0+$/, '');
                            }
                        }
                        else
                        {
                            framesString += value;
                        }
                    }
                    framesString += ']';
                }
            }
        }

        var commands = this.commands;
        var numMethods = commands.length;
        var numCommands = this.numCommands;
        var commandsArray = new Array(numCommands);
        var commandsBin, length;
        for (p = 0; p < numMethods; p += 1)
        {
            commandsBin = commands[p];
            if (commandsBin !== undefined)
            {
                length = commandsBin.length;
                for (n = 0; n < length; n += 2)
                {
                    commandsArray[commandsBin[n]] = commandsBin[n + 1];
                }
            }
        }

        framesString += '],"commands":[';
        for (n = 0; n < numCommands; n += 1)
        {
            if (n)
            {
                framesString += ',';
            }

            framesString += '[';
            var command = commandsArray[n];
            var numArguments = command.length;
            var a;
            for (a = 0; a < numArguments; a += 1)
            {
                value = command[a];
                if (a)
                {
                    framesString += ',';
                }

                if (typeof value === "string")
                {
                    framesString += value;
                }
                else if (typeof value === "number")
                {
                    valueInt = (value | 0);
                    if (valueInt === value)
                    {
                        framesString += valueInt;
                    }
                    else
                    {
                        framesString += value.toFixed(4).replace(/\.?0+$/, '');
                    }
                }
                else if (value === undefined || value === null)
                {
                    framesString += 'null';
                }
                else
                {
                    framesString += value;
                }
            }
            framesString += ']';
        }
        framesString += ']}';

        return framesString;
    }

    private _getDataBinSize(dataBins: {}, integers: boolean) : number
    {
        var totalSize = 0;
        var p, dataBin, binLength, n, data;
        for (p in dataBins)
        {
            if (dataBins.hasOwnProperty(p))
            {
                dataBin = dataBins[p];
                binLength = dataBin.length;
                if (binLength === 0)
                {
                    continue;
                }

                totalSize += 4; // number of arrays on this bin
                totalSize += 4; // length of each array on this bin

                for (n = 0; n < binLength; n += 2)
                {
                    data = dataBin[n + 1];

                    totalSize += 4; // id
                    if (integers)
                    {
                        totalSize += 4; // type
                    }

                    // pad element size to multiple of 4
                    totalSize += ((data.byteLength + 3) & 0x7ffffffc);
                }
            }
        }
        totalSize += 4; // sentinel
        return totalSize;
    }

    private _getDataBinBuffer(ints: any, offset: number, dataBins: {}, integers: boolean) : number
    {
        var p, dataBin, binLength, n, j;
        for (p in dataBins)
        {
            if (dataBins.hasOwnProperty(p))
            {
                dataBin = dataBins[p];
                binLength = dataBin.length;
                if (binLength === 0)
                {
                    continue;
                }

                ints[offset] = (binLength >>> 1);
                offset += 1;

                ints[offset] = parseInt(p, 10);
                offset += 1;

                var id, data, length, type, value, valueInt;
                for (n = 0; n < binLength; n += 2)
                {
                    ints[offset] = dataBin[n]; // id
                    offset += 1;

                    data = dataBin[n + 1];
                    length = data.length;

                    if (integers)
                    {
                        if (data instanceof Uint8Array)
                        {
                            type = 8;
                        }
                        else if (data instanceof Int8Array)
                        {
                            type = -8;
                        }
                        else if (data instanceof Uint16Array)
                        {
                            type = 16;
                        }
                        else if (data instanceof Int16Array)
                        {
                            type = -16;
                        }
                        else if (data instanceof Uint32Array)
                        {
                            type = 32;
                        }
                        else
                        {
                            type = -32;
                        }

                        ints[offset] = type;
                        offset += 1;
                    }

                    if (integers)
                    {
                        var out = new data.constructor(ints.buffer, (offset * 4), length);
                        for (j = 0; j < length; j += 1)
                        {
                            out[j] = data[j];
                        }

                        // pad element size to multiple of 4
                        offset += ((data.byteLength + 3) >>> 2);
                    }
                    else
                    {
                        data = new Int32Array(data.buffer, 0, data.length);
                        for (j = 0; j < length; j += 1)
                        {
                            ints[offset] = data[j];
                            offset += 1;
                        }
                    }
                }
            }
        }

        // sentinel
        ints[offset] = -1;
        offset += 1;

        return offset;
    }

    public getDataBuffer()
    {
        var totalSize = 4 + 4; // header + version
        totalSize += this._getDataBinSize(this.integerData, true);
        totalSize += this._getDataBinSize(this.floatData, false);
        totalSize += this._getDataBinSize(this.mixedData, true);

        // Frames command ids
        totalSize += 4 + 4; // Num frames + frame command size

        var frames = this.frames;
        var numFrames = frames.length;

        totalSize += (4 * numFrames);

        var numCommands = this.numCommands;
        var n;
        if (numCommands < 256)
        {
            for (n = 0; n < numFrames; n += 1)
            {
                // pad element size to multiple of 4
                totalSize += ((((1 * frames[n].length) + 3) >>> 2) << 2);
            }
        }
        else if (numCommands < 65536)
        {
            for (n = 0; n < numFrames; n += 1)
            {
                // pad element size to multiple of 4
                totalSize += ((((2 * frames[n].length) + 3) >>> 2) << 2);
            }
        }
        else
        {
            for (n = 0; n < numFrames; n += 1)
            {
                totalSize += (4 * frames[n].length);
            }
        }

        var buffer = new ArrayBuffer(totalSize);

        var bytes = new Uint8Array(buffer);

        var header = 'TZBD';
        bytes[0] = header.charCodeAt(0);
        bytes[1] = header.charCodeAt(1);
        bytes[2] = header.charCodeAt(2);
        bytes[3] = header.charCodeAt(3);

        var ints = new Int32Array(buffer);
        ints[1] = 2; // version

        var offset = 2;
        offset = this._getDataBinBuffer(ints, offset, this.integerData, true);
        offset = this._getDataBinBuffer(ints, offset, this.floatData, false);
        offset = this._getDataBinBuffer(ints, offset, this.mixedData, true);

        ints[offset] = numFrames;
        offset += 1;

        var frameCommands, numFrameCommands, f;
        if (numCommands < 256)
        {
            ints[offset] = 1;
            offset += 1;

            for (n = 0; n < numFrames; n += 1)
            {
                frameCommands = frames[n];
                numFrameCommands = frameCommands.length;

                ints[offset] = numFrameCommands;
                offset += 1;

                bytes.set(frameCommands, (offset << 2));

                // pad element size to multiple of 4
                offset += ((numFrameCommands + 3) >>> 2);
            }
        }
        else if (numCommands < 65536)
        {
            ints[offset] = 2;
            offset += 1;

            var words = new Uint16Array(buffer);
            for (n = 0; n < numFrames; n += 1)
            {
                frameCommands = frames[n];
                numFrameCommands = frameCommands.length;

                ints[offset] = numFrameCommands;
                offset += 1;

                words.set(frameCommands, (offset << 1));

                // pad element size to multiple of 4
                offset += ((numFrameCommands + 1) >>> 1);
            }
        }
        else
        {
            ints[offset] = 4;
            offset += 1;

            for (n = 0; n < numFrames; n += 1)
            {
                frameCommands = frames[n];
                numFrameCommands = frameCommands.length;

                ints[offset] = numFrameCommands;
                offset += 1;

                ints.set(frameCommands, offset);

                offset += numFrameCommands;
            }
        }

        debug.assert((offset << 2) === totalSize);

        return bytes;
    }

    public getResourcesString()
    {
        return JSON.stringify({
            version: 1,
            resources: {
                vertexBuffers: this.vertexBuffers,
                indexBuffers: this.indexBuffers,
                techniqueParameterBuffers: this.techniqueParameterBuffers,
                semantics: this.semantics,
                formats: this.formats,
                textures: this.textures,
                shaders: this.shaders,
                techniques: this.techniques,
                videos: this.videos,
                renderBuffers: this.renderBuffers,
                renderTargets: this.renderTargets
            }
        });
    }

    private _recycleDataBinIds(dataBins)
    {
        var recycledIds = this.recycledIds;
        var dataBin, binLength, p, n;
        for (p in dataBins)
        {
            if (dataBins.hasOwnProperty(p))
            {
                dataBin = dataBins[p];
                binLength = dataBin.length;
                for (n = 0; n < binLength; n += 2)
                {
                    recycledIds.push(dataBin[n]);
                }
                dataBin.length = 0;
            }
        }
    }

    public reset()
    {
        // Try forcing a memory release
        var frames = this.frames;
        var numFrames = frames.length;
        var n;
        for (n = 0; n < numFrames; n += 1)
        {
            frames[n].length = 0;
            frames[n] = null;
        }
        frames.length = 0;

        var commands = this.commands;
        var numMethods = commands.length;
        for (n = 0; n < numMethods; n += 1)
        {
            if (commands[n] !== undefined)
            {
                commands[n].length = 0;
            }
        }
        this.numCommands = 0;

        // Clean data bins and reclaim the ids for reuse
        this._recycleDataBinIds(this.integerData);
        this._recycleDataBinIds(this.floatData);
        this._recycleDataBinIds(this.mixedData);
        this._recycleDataBinIds(this.objects);

        var recycledIds = this.recycledIds;
        if (this.destroyedIds.length)
        {
            recycledIds.push.apply(recycledIds, this.destroyedIds);
            this.destroyedIds.length = 0;
        }

        // Sort higher to lower so we pop low ids first
        recycledIds.sort(function (a, b) { return (b - a); });

        // Try to release reclaimed ids that can be done with lastId
        var lastId = this.lastId;
        n = 0;
        while (lastId === recycledIds[n])
        {
            n += 1;
            lastId -= 1;
        }
        if (n)
        {
            this.lastId = lastId;
            if (n < recycledIds.length)
            {
                recycledIds.splice(0, n);
            }
            else
            {
                recycledIds.length = 0;
            }
        }

        this.names = {};
        this.numNames = 0;

        this.vertexBuffers = {};
        this.indexBuffers = {};
        this.techniqueParameterBuffers = {};
        this.semantics = {};
        this.formats = {};
        this.textures = {};
        this.shaders = {};
        this.techniques = {};
        this.videos = {};
        this.renderBuffers = {};
        this.renderTargets = {};
        this.occlusionQueries = {};
    }

    public destroy()
    {
        this.gd.destroy();
        this.gd = null;
        this.current = null;
        this.frames = null;
        this.commands = null;
        this.numCommands = 0;
        this.lastId = -1;
        this.recycledIds = null;
        this.destroyedIds = null;
        this.integerData = null;
        this.floatData = null;
        this.mixedData = null;
        this.objects = null;
        this.objectArray = null;
        this.names = null;
        this.numNames = 0;
        this.vertexBuffers = null;
        this.indexBuffers = null;
        this.techniqueParameterBuffers = null;
        this.semantics = null;
        this.semanticsMap = null;
        this.textures = null;
        this.shaders = null;
        this.techniques = null;
        this.videos = null;
        this.renderBuffers = null;
        this.renderTargets = null;
        this.occlusionQueries = null;
        this.reverseSemantic = null;
    }

    public static create(gd) : CaptureGraphicsDevice
    {
        return new CaptureGraphicsDevice(gd);
    }
};

// Playback
class PlaybackGraphicsDevice
{
    public static version = 1;

    black = [0, 0, 0, 1];

    gd:         any;
    nextFrameIndex: number;
    srcWidth:   number;
    srcHeight:  number;
    playWidth: number;
    playHeight: number;
    frames:     number[][];
    commands:   any[];
    writerData: any[];
    entities:   any[];
    numPendingResources: number;
    numResourcesAdded: number;
    onerror:    any;

    constructor(gd)
    {
        this.gd = gd;
        this.nextFrameIndex = 0;
        this.srcWidth = 0;
        this.srcHeight = 0;
        this.playWidth = 0;
        this.playHeight = 0;
        this.frames = [];
        this.commands = null;
        this.entities = [];
        this.writerData = [];
        this.numPendingResources = 0;
        this.numResourcesAdded = 0;
        this.onerror = null;
    }

    private _storeEntity(id, value)
    {
        if (value === null || value === undefined)
        {
            if (this.onerror)
            {
                this.onerror("Failed to create entity: " + id);
            }
        }
        if (typeof id === "string")
        {
            id = parseInt(id, 10);
        }
        var oldEntity = this.entities[id];
        if (oldEntity)
        {
            if (oldEntity.destroy)
            {
                oldEntity.destroy();
            }
        }
        this.entities[id] = value;
    }

    private _resolveEntity(id)
    {
        if (typeof id === "string")
        {
            id = parseInt(id, 10);
        }
        if (typeof id !== "number")
        {
            return id;
        }
        var entity = this.entities[id];
        if (!entity)
        {
            if (this.onerror)
            {
                this.onerror("Unknown entity: " + id);
            }
        }
        return entity;
    }

    public addResources(resourcesObject, baseURL)
    {
        var resources = resourcesObject.resources;
        var gd = this.gd;
        var self = this;
        var p, params, src;

        function makeResourceLoader(src)
        {
            self.numPendingResources += 1;
            self.numResourcesAdded += 1;
            return function resourceLoaded(resource, status)
            {
                if (resource)
                {
                    self.numPendingResources -= 1;
                }
                else
                {
                    if (self.onerror)
                    {
                        self.onerror('Failed to load resource: ' + src);
                    }
                }
            };
        }

        function makArchiveTextureLoader(archive)
        {
            return function archiveTextureLoaded(tex)
            {
                self.numPendingResources -= 1;
                self._storeEntity(archive[tex.name], tex);
            };
        }

        var shaders = resources.shaders;
        for (p in shaders)
        {
            if (shaders.hasOwnProperty(p))
            {
                params = shaders[p];
                this._storeEntity(p, gd.createShader(params));
            }
        }

        var videos = resources.videos;
        for (p in videos)
        {
            if (videos.hasOwnProperty(p))
            {
                params = videos[p];
                src = params.src;
                if (src)
                {
                    params.src = baseURL + src;
                    params.onload = makeResourceLoader(params.src);
                }
                this._storeEntity(p, gd.createVideo(params));
            }
        }

        var renderBuffers = resources.renderBuffers;
        for (p in renderBuffers)
        {
            if (renderBuffers.hasOwnProperty(p))
            {
                params = renderBuffers[p];
                if (params.width === -1)
                {
                    params.width = gd.width;
                }
                if (params.height === -1)
                {
                    params.height = gd.height;
                }
                this._storeEntity(p, gd.createRenderBuffer(params));
            }
        }

        var textures = resources.textures;
        for (p in textures)
        {
            if (textures.hasOwnProperty(p))
            {
                params = textures[p];
                src = params.src;
                if (src)
                {
                    params.src = baseURL + src;
                    params.onload = makeResourceLoader(params.src);
                }
                if (params.archive)
                {
                    var archive = params.archive;
                    var name;
                    for (name in archive)
                    {
                        if (archive.hasOwnProperty(name))
                        {
                            this.numPendingResources += 1;
                            this.numResourcesAdded += 1;
                        }
                    }
                    params.ontextureload = makArchiveTextureLoader(archive);
                    gd.loadTexturesArchive(params);
                }
                else
                {
                    if (params.width === -1)
                    {
                        params.width = gd.width;
                    }
                    if (params.height === -1)
                    {
                        params.height = gd.height;
                    }
                    this._storeEntity(p, gd.createTexture(params));
                }
            }
        }

        var renderTargets = resources.renderTargets;
        for (p in renderTargets)
        {
            if (renderTargets.hasOwnProperty(p))
            {
                params = renderTargets[p];
                if (typeof params.colorTexture0 === "string")
                {
                    params.colorTexture0 = this._resolveEntity(params.colorTexture0);
                }
                if (typeof params.colorTexture1 === "string")
                {
                    params.colorTexture1 = this._resolveEntity(params.colorTexture1);
                }
                if (typeof params.colorTexture2 === "string")
                {
                    params.colorTexture2 = this._resolveEntity(params.colorTexture2);
                }
                if (typeof params.colorTexture3 === "string")
                {
                    params.colorTexture3 =this._resolveEntity(params.colorTexture3);
                }
                if (typeof params.depthBuffer === "string")
                {
                    params.depthBuffer = this._resolveEntity(params.depthBuffer);
                }
                if (typeof params.depthTexture === "string")
                {
                    params.depthTexture = this._resolveEntity(params.depthTexture);
                }
                this._storeEntity(p, gd.createRenderTarget(params));
            }
        }

        var formats = resources.formats;
        for (p in formats)
        {
            if (formats.hasOwnProperty(p))
            {
                var formatArray = formats[p];
                var numFormats = formatArray.length;
                var n;
                for (n = 0; n < numFormats; n += 1)
                {
                    var format = formatArray[n];
                    formatArray[n] = gd['VERTEXFORMAT_' + format];
                    if (formatArray[n] === undefined)
                    {
                        if (this.onerror)
                        {
                            this.onerror("Unknown vertex format: " + format);
                        }
                        return;
                    }
                }
                this._storeEntity(p, formatArray);
            }
        }

        var vertexBuffers = resources.vertexBuffers;
        for (p in vertexBuffers)
        {
            if (vertexBuffers.hasOwnProperty(p))
            {
                params = vertexBuffers[p];
                params.attributes = this._resolveEntity(params.attributes);
                this._storeEntity(p, gd.createVertexBuffer(params));
            }
        }

        var indexBuffers = resources.indexBuffers;
        for (p in indexBuffers)
        {
            if (indexBuffers.hasOwnProperty(p))
            {
                params = indexBuffers[p];
                this._storeEntity(p, gd.createIndexBuffer(params));
            }
        }

        var techniqueParameterBuffers = resources.techniqueParameterBuffers;
        for (p in techniqueParameterBuffers)
        {
            if (techniqueParameterBuffers.hasOwnProperty(p))
            {
                params = techniqueParameterBuffers[p];
                this._storeEntity(p, gd.createTechniqueParameterBuffer(params));
            }
        }

        var semantics = resources.semantics;
        for (p in semantics)
        {
            if (semantics.hasOwnProperty(p))
            {
                params = semantics[p];
                this._storeEntity(p, gd.createSemantics(params));
            }
        }

        var techniques = resources.techniques;
        for (p in techniques)
        {
            if (techniques.hasOwnProperty(p))
            {
                params = techniques[p];
                this._storeEntity(p, this._resolveEntity(params.shader).getTechnique(params.name));
            }
        }

        resourcesObject.resources = {};
    }

    public addData(dataBuffer, append?)
    {
        var ints = new Int32Array(dataBuffer);

        // TODO: check endianness
        var version = ints[1];

        var offset = 2;
        var binLength, length, n, id, type, byteOffset, data;

        // Integers
        for (;;)
        {
            binLength = ints[offset];
            offset += 1;
            if (binLength < 0)
            {
                break;
            }

            length = ints[offset];
            offset += 1;

            for (n = 0; n < binLength; n += 1)
            {
                id = ints[offset];
                offset += 1;

                type = ints[offset];
                offset += 1;

                byteOffset = (offset << 2);

                if (type === 8)
                {
                    data = new Uint8Array(dataBuffer, byteOffset, length);
                }
                else if (type === -8)
                {
                    data = new Int8Array(dataBuffer, byteOffset, length);
                }
                else if (type === 16)
                {
                    data = new Uint16Array(dataBuffer, byteOffset, length);
                }
                else if (type === -16)
                {
                    data = new Int16Array(dataBuffer, byteOffset, length);
                }
                else if (type === 32)
                {
                    data = new Uint32Array(dataBuffer, byteOffset, length);
                }
                else
                {
                    data = new Int32Array(dataBuffer, byteOffset, length);
                }

                this._storeEntity(id, data);

                // pad element size to multiple of 4
                offset += ((data.byteLength + 3) >>> 2);
            }
        }

        // Floats
        for (;;)
        {
            binLength = ints[offset];
            offset += 1;
            if (binLength < 0)
            {
                break;
            }

            length = ints[offset];
            offset += 1;

            for (n = 0; n < binLength; n += 1)
            {
                id = ints[offset];
                offset += 1;

                byteOffset = (offset << 2);

                data = new Float32Array(dataBuffer, byteOffset, length);

                this._storeEntity(id, data);

                offset += length;
            }
        }

        // Mixed
        if (offset < ints.length)
        {
            for (;;)
            {
                binLength = ints[offset];
                offset += 1;
                if (binLength < 0)
                {
                    break;
                }

                length = ints[offset];
                offset += 1;

                for (n = 0; n < binLength; n += 1)
                {
                    id = ints[offset];

                    // add 2 for id and type (type is unused)
                    offset += 2;

                    byteOffset = (offset << 2);

                    data = dataBuffer.slice(byteOffset, (byteOffset + length));

                    this._storeEntity(id, data);

                    // pad element size to multiple of 4
                    offset += ((data.byteLength + 3) >>> 2);
                }
            }
        }

        if (version >= 2)
        {
            var frames = this.frames;
            var numFrames;
            if (!append)
            {
                numFrames = frames.length;
                for (n = 0; n < numFrames; n += 1)
                {
                    frames[n].length = 0;
                    frames[n] = null;
                }
                frames.length = 0;
                this.nextFrameIndex = 0;
            }

            numFrames = ints[offset];
            offset += 1;

            var commandsSize = ints[offset];
            offset += 1;

            var numFrameCommands;
            if (commandsSize === 1)
            {
                for (n = 0; n < numFrames; n += 1)
                {
                    numFrameCommands = ints[offset];
                    offset += 1;

                    byteOffset = (offset << 2);

                    data = new Uint8Array(dataBuffer, byteOffset, numFrameCommands);

                    frames.push(data);

                    // pad element size to multiple of 4
                    offset += ((data.byteLength + 3) >>> 2);
                }
            }
            else if (commandsSize === 2)
            {
                for (n = 0; n < numFrames; n += 1)
                {
                    numFrameCommands = ints[offset];
                    offset += 1;

                    byteOffset = (offset << 2);

                    data = new Uint16Array(dataBuffer, byteOffset, numFrameCommands);

                    frames.push(data);

                    // pad element size to multiple of 4
                    offset += ((data.byteLength + 3) >>> 2);
                }
            }
            else
            {
                for (n = 0; n < numFrames; n += 1)
                {
                    numFrameCommands = ints[offset];
                    offset += 1;

                    byteOffset = (offset << 2);

                    data = new Uint32Array(dataBuffer, byteOffset, numFrameCommands);

                    frames.push(data);

                    // pad element size to multiple of 4
                    offset += ((data.byteLength + 3) >>> 2);
                }
            }
        }

        debug.assert(offset === ints.length);
    }

    public addFrames(framesObject, reset?)
    {
        var gd = this.gd;
        var names = framesObject.names;
        var objects = framesObject.objects;
        var length = objects.length;
        var id, fileObject, object, objectLength, n, j, k, v, entity;
        for (n = 0; n < length; n += 2)
        {
            id = objects[n];
            fileObject = objects[n + 1];
            objectLength = fileObject.length;
            object = gd.createTechniqueParameters();
            for (j = 0; j < objectLength; j += 2)
            {
                k = names[fileObject[j]];
                v = fileObject[j + 1];
                if (typeof v === "string")
                {
                    object[k] = this._resolveEntity(v);
                }
                else
                {
                    object[k] = v;
                }
            }
            this._storeEntity(id, object);
        }
        objects.length = 0;
        names.length = 0;

        var commands = framesObject.commands;
        var numCommands = commands.length;
        for (n = 0; n < numCommands; n += 1)
        {
            var command = commands[n];
            var numArguments = command.length;
            var method = command[0];
            if (method === CaptureGraphicsCommand.setTechniqueParameters)
            {
                command[1] = this._resolveEntity(command[1]); // TechniqueParameters
            }
            else if (method === CaptureGraphicsCommand.drawIndexed)
            {
                // Nothing to resolve
            }
            else if (method === CaptureGraphicsCommand.draw)
            {
                // Nothing to resolve
            }
            else if (method === CaptureGraphicsCommand.setIndexBuffer)
            {
                command[1] = this._resolveEntity(command[1]); // IndexBuffer
            }
            else if (method === CaptureGraphicsCommand.setStream)
            {
                command[1] = this._resolveEntity(command[1]); // VertexBuffer
                command[2] = this._resolveEntity(command[2]); // Semantics
            }
            else if (method === CaptureGraphicsCommand.setTechnique)
            {
                command[1] = this._resolveEntity(command[1]); // Technique
            }
            else if (method === CaptureGraphicsCommand.setData)
            {
                command[1] = this._resolveEntity(command[1]); // Object
                command[4] = this._resolveEntity(command[4]); // Data
            }
            else if (method === CaptureGraphicsCommand.setAllData)
            {
                command[1] = this._resolveEntity(command[1]); // Object
                command[2] = this._resolveEntity(command[2]); // Data
            }
            else if (method === CaptureGraphicsCommand.beginRenderTarget)
            {
                command[1] = this._resolveEntity(command[1]); // RenderTarget
            }
            else if (method === CaptureGraphicsCommand.clear)
            {
                command[1] = this._resolveEntity(command[1]); // Color object
            }
            else if (method === CaptureGraphicsCommand.endRenderTarget)
            {
                // Nothing to resolve
            }
            else if (method === CaptureGraphicsCommand.beginEndDraw)
            {
                command[3] = this._resolveEntity(command[3]); // Formats
                command[4] = this._resolveEntity(command[4]); // Semantics
                command[5] = this._resolveEntity(command[5]); // Data
            }
            else if (method === CaptureGraphicsCommand.setViewport)
            {
                // Nothing to resolve
            }
            else if (method === CaptureGraphicsCommand.setScissor)
            {
                // Nothing to resolve
            }
            else if (method === CaptureGraphicsCommand.beginOcclusionQuery)
            {
                command[1] = this._resolveEntity(command[1]); // Query
            }
            else if (method === CaptureGraphicsCommand.endOcclusionQuery)
            {
                command[1] = this._resolveEntity(command[1]); // Query
            }
            else if (method === CaptureGraphicsCommand.updateTextureData)
            {
                command[1] = this._resolveEntity(command[1]); // Object
                command[2] = this._resolveEntity(command[2]); // Data
            }
            else
            {
                if (this.onerror)
                {
                    this.onerror('Unknown command: ' + method);
                }
                break;
            }
        }

        if (this.commands)
        {
            this.commands.length = 0;
        }
        this.commands = commands;

        var fileFrames = framesObject.frames;
        if (fileFrames)
        {
            var numFileFrames = fileFrames.length;
            var frames = this.frames;
            if (reset)
            {
                var numFrames = frames.length;
                for (n = 0; n < numFrames; n += 1)
                {
                    frames[n].length = 0;
                    frames[n] = null;
                }
                frames.length = 0;
                this.nextFrameIndex = 0;
            }
            for (n = 0; n < numFileFrames; n += 1)
            {
                frames.push(fileFrames[n]);
            }
            fileFrames.length = 0;
        }

        this.srcWidth = framesObject.width;
        this.srcHeight = framesObject.height;
    }

    private _beginEndDraw(primitive, numVertices, formats, semantics, data)
    {
        var writer = this.gd.beginDraw(primitive, numVertices, formats, semantics);
        if (writer)
        {
            var write = writer.write;
            var numTotalComponents = data.length;
            var numComponents = Math.floor(numTotalComponents / numVertices);
            var writerData = this.writerData;
            writerData.length = numComponents;
            var n = 0;
            while (n < numTotalComponents)
            {
                var i;
                for (i = 0; i < numComponents; i += 1)
                {
                    writerData[i] = data[n];
                    n += 1;
                }
                write.apply(writer, writerData);
            }
            this.gd.endDraw(writer);
        }
    }

    // This skip method would fail when updating the same data multiple times for next frame to use
    public skip(endIndex)
    {
        var nextIndex = this.nextFrameIndex;
        while (nextIndex < endIndex)
        {
            var frameCommands = this.frames[nextIndex];
            if (!frameCommands)
            {
                return false;
            }

            var commands = this.commands;
            var numCommands = frameCommands.length;
            var c, target;
            for (c = 0; c < numCommands; c += 1)
            {
                var command = commands[frameCommands[c]];
                var method = command[0];
                if (method === CaptureGraphicsCommand.setData)
                {
                    target = command[1];
                    if (!target['transient'])
                    {
                        target.setData(command[4],
                                       command[2],
                                       command[3]);
                    }
                }
                else if (method === CaptureGraphicsCommand.setAllData)
                {
                    target = command[1];
                    if (!target['transient'])
                    {
                        target.setData(command[2]);
                    }
                }
                else if (method === CaptureGraphicsCommand.updateTextureData)
                {
                    command[1].setData(command[2],
                                       command[3], command[4],
                                       command[5], command[6],
                                       command[7], command[8]);
                }
            }

            nextIndex += 1;
            this.nextFrameIndex = nextIndex;
        }

        return true;
    }

    public play(frameIndex)
    {
        if (this.nextFrameIndex < frameIndex)
        {
            this.skip(frameIndex);
        }

        var frameCommands = this.frames[frameIndex];
        if (!frameCommands)
        {
            return false;
        }

        // Adjust aspect ratio
        var gd = this.gd;
        var destWidth = gd.width;
        var destHeight = gd.height;
        var aspectRatioConversion = ((destWidth / destHeight) / (this.srcWidth / this.srcHeight));
        var offsetX, offsetY, width, height;
        if (aspectRatioConversion < (1 - (1 / destHeight)))
        {
            offsetX = 0;
            width = destWidth;
            height = ((destHeight * aspectRatioConversion) | 0);
            offsetY = ((destHeight - height) >> 1);

            gd.setScissor(0, 0, width, offsetY);
            gd.clear(this.black);
            gd.setScissor(0, (height - offsetY), width, offsetY);
            gd.clear(this.black);
        }
        else if (aspectRatioConversion > (1 + (1 / destWidth)))
        {
            offsetY = 0;
            height = destHeight;
            width = ((destWidth / aspectRatioConversion) | 0);
            offsetX = ((destWidth - width) >> 1);

            gd.setScissor(0, 0, offsetX, height);
            gd.clear(this.black);
            gd.setScissor((width - offsetX), 0, offsetX, height);
            gd.clear(this.black);
        }
        else
        {
            offsetY = 0;
            height = destHeight;
            width = destWidth;
            offsetX = 0;
        }

        if (offsetX || offsetY)
        {
            gd.setScissor(offsetX, offsetY, width, height);
            gd.setViewport(offsetX, offsetY, width, height);
        }

        this.playWidth = width;
        this.playHeight = height;

        var commands = this.commands;
        var numCommands = frameCommands.length;
        var c, x, y, w, h;
        for (c = 0; c < numCommands; c += 1)
        {
            var command = commands[frameCommands[c]];
            var method = command[0];
            if (method === CaptureGraphicsCommand.setTechniqueParameters)
            {
                gd.setTechniqueParameters(command[1]);
            }
            else if (method === CaptureGraphicsCommand.drawIndexed)
            {
                gd.drawIndexed(command[1],
                               command[2],
                               command[3]);
            }
            else if (method === CaptureGraphicsCommand.draw)
            {
                gd.draw(command[1],
                        command[2],
                        command[3]);
            }
            else if (method === CaptureGraphicsCommand.setIndexBuffer)
            {
                gd.setIndexBuffer(command[1]);
            }
            else if (method === CaptureGraphicsCommand.setStream)
            {
                gd.setStream(command[1],
                             command[2],
                             command[3]);
            }
            else if (method === CaptureGraphicsCommand.setTechnique)
            {
                gd.setTechnique(command[1]);
            }
            else if (method === CaptureGraphicsCommand.setData)
            {
                command[1].setData(command[4],
                                   command[2],
                                   command[3]);
            }
            else if (method === CaptureGraphicsCommand.setAllData)
            {
                command[1].setData(command[2]);
            }
            else if (method === CaptureGraphicsCommand.beginRenderTarget)
            {
                gd.beginRenderTarget(command[1]);
            }
            else if (method === CaptureGraphicsCommand.clear)
            {
                gd.clear(command[1],
                         command[2],
                         command[3]);
            }
            else if (method === CaptureGraphicsCommand.endRenderTarget)
            {
                gd.endRenderTarget();
            }
            else if (method === CaptureGraphicsCommand.beginEndDraw)
            {
                this._beginEndDraw(command[1],
                                   command[2],
                                   command[3],
                                   command[4],
                                   command[5]);
            }
            else if (method === CaptureGraphicsCommand.setViewport)
            {
                x = command[1];
                y = command[2];
                w = command[3];
                h = command[4];
                if (w === -1)
                {
                    x = offsetX;
                    w = width;
                }
                if (h === -1)
                {
                    y = offsetY;
                    h = height;
                }
                gd.setViewport(x, y, w, h);
            }
            else if (method === CaptureGraphicsCommand.setScissor)
            {
                x = command[1];
                y = command[2];
                w = command[3];
                h = command[4];
                if (w === -1)
                {
                    x = offsetX;
                    w = width;
                }
                if (h === -1)
                {
                    y = offsetY;
                    h = height;
                }
                gd.setScissor(x, y, w, h);
            }
            else if (method === CaptureGraphicsCommand.beginOcclusionQuery)
            {
                gd.beginOcclusionQuery(command[1]);
            }
            else if (method === CaptureGraphicsCommand.endOcclusionQuery)
            {
                gd.endOcclusionQuery(command[1]);
            }
            else if (method === CaptureGraphicsCommand.updateTextureData)
            {
                command[1].setData(command[2],
                                   command[3], command[4],
                                   command[5], command[6],
                                   command[7], command[8]);
            }
            else
            {
                if (this.onerror)
                {
                    this.onerror('Unknown command: ' + method);
                }
                break;
            }
        }

        this.nextFrameIndex = (frameIndex + 1);

        return true;
    }

    public destroy()
    {
        this.gd = null;
        this.frames = null;
        this.commands = null;
        this.entities = null;
    }

    public static create(gd) : PlaybackGraphicsDevice
    {
        return new PlaybackGraphicsDevice(gd);
    }
};

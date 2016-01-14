// Copyright (c) 2009-2014 Turbulenz Limited
/*global Utilities: false*/

"use strict";

//
// EffectPrepareObject
//
interface EffectPrepareObject
{
    prepare(renderable: Renderable);
    shaderName: string;
    techniqueName: string;
    shader?: Shader;
    technique?: Technique;
    techniqueIndex?: number;
    update(camera: Camera);
    loadTechniques(shaderManager: ShaderManager);
};

//
// Effect
//
class Effect
{
    /* tslint:disable:no-unused-variable */
    static version = 1;
    /* tslint:enable:no-unused-variable */

    name: string;
    geometryType: { [type: string]: EffectPrepareObject; }; // TODO
    numMaterials: number;
    materialsMap: { [hash: string]: number; };

    static create(name: string): Effect
    {
        var effect = new Effect();

        effect.name = name;
        effect.geometryType = {};
        effect.numMaterials = 0;
        effect.materialsMap = {};

        return effect;
    }

    hashMaterial(material: Material)
    {
        var texturesNames = material.texturesNames;
        var hashArray = [];
        var numTextures = 0;
        for (var p in texturesNames)
        {
            if (texturesNames.hasOwnProperty(p))
            {
                hashArray[numTextures] = texturesNames[p];
                numTextures += 1;
            }
        }
        if (1 < numTextures)
        {
            hashArray.sort();
            return hashArray.join(',');
        }
        else if (0 < numTextures)
        {
            return hashArray[0];
        }
        else
        {
            /* tslint:disable:no-string-literal */
            var materialColor = material.techniqueParameters['materialColor'];
            /* tslint:enable:no-string-literal */
            if (materialColor)
            {
                var length = materialColor.length;
                var n;
                for (n = 0; n < length; n += 1)
                {
                    hashArray[n] = materialColor[n].toFixed(3).replace('.000', '');
                }
                return hashArray.join(',');
            }
            else
            {
                return material.name;
            }
        }
    }

    prepareMaterial(material: Material)
    {
        var hash = this.hashMaterial(material);
        var index = this.materialsMap[hash];
        if (index === undefined)
        {
            index = this.numMaterials;
            this.numMaterials += 1;
            this.materialsMap[hash] = index;
        }
        material.meta.materialIndex = index;
        material.effect = this;
    }

    add(geometryType: string, prepareObject)
    {
        this.geometryType[geometryType] = prepareObject;
    }

    remove(geometryType: string)
    {
        delete this.geometryType[geometryType];
    }

    get(geometryType: string): EffectPrepareObject
    {
        return this.geometryType[geometryType];
    }

    prepare(renderable: Renderable)
    {
        var prepareObject = this.geometryType[renderable.geometryType];
        if (prepareObject)
        {
            prepareObject.prepare(renderable);
        }
        else
        {
            debug.abort("Unsupported or missing geometryType");
        }
    }
}

//
// EffectManager
//
class EffectManager
{
    /* tslint:disable:no-unused-variable */
    static version = 1;
    /* tslint:enable:no-unused-variable */

    effects: any; // { [effectName: string]: Effect; };

    static create(): EffectManager
    {
        var effectManager = new EffectManager();
        effectManager.effects = {};
        return effectManager;
    }

    add(effect: Effect)
    {
        debug.assert(this.effects[effect.name] === undefined);
        this.effects[effect.name] = effect;
    }

    remove(name: string)
    {
        delete this.effects[name];
    }

    map(destination: string, source: string)
    {
        this.effects[destination] = this.effects[source];
    }

    get(name: string): Effect
    {
        var effect = this.effects[name];
        if (!effect)
        {
            /* tslint:disable:no-string-literal */
            return this.effects["default"];
            /* tslint:enable:no-string-literal */
        }
        return effect;
    }
}

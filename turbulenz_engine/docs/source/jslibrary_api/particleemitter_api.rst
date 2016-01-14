.. index::
    single: ParticleEmitter

.. highlight:: javascript

.. _particleemitter:

=============================
The ParticleEmitter Interface
=============================

**Added SDK 0.28.0**

An emitter is added to a particular synchronizer to emit particles when the synchronizer synchronizes a particle system.

.. note::
    This is a low-level particle system API.

Methods
=======

.. index::
    pair: ParticleEmitter; sync

`sync`
------

**Summary**

Called by synchronizer to synchronize this particular emitter. This may be called multiple times by a synchronizer if it implements for example: fixed time steps.

**Syntax** ::

    emitter.sync(synchronizer, system, timeStep);

``synchronizer``
    The :ref:`ParticleSynchronizer <particlesynchronizer>` invoking this emitter.

``system``
    The :ref:`ParticleSystem <particlesystem>` being synchronized.

``timeStep``
    The amount of time to synchronize emitter for.

.. index::
    pair: ParticleEmitter; reset

`reset`
-------

**Summary**

Reset this emitter, ready for re-use.

**Syntax** ::

    emitter.reset();

.. index::
    pair: ParticleEmitter; enable

`enable`
--------

**Summary**

Enable this emitter.

**Syntax** ::

    emitter.enable();

.. index::
    pair: ParticleEmitter; disable

`disable`
---------

**Summary**

Disable this emitter.

**Syntax** ::

    emitter.disable();

.. index::
    pair: PartileEmitter; burst

`burst`
-------

**Summary**

Enable emitter for a specific set of spawn events.

**Syntax** ::

    emitter.burst(count);

``count`` (Optional)
    The number of spawn events to enable emitter for.

.. index::
    pair: ParticleEmitter; timeout

`timeout`
---------

**Summary**

Enable emitter for a specific amount of time.

The emitter should behave so that after `timeout` seconds have passed, the last emitted particle has just finished its life time.

**Syntax** ::

    emitter.timeout(timeout);

.. index::
    pair: ParticleEmitter; applyArchetype

`applyArchetype`
----------------

**Summary**

Apply emitter specific archetype parameters to this emitter. This is used by the :ref:`ParticleManager <particlemanager>`.

**Syntax** ::

    emitter.applyArchetype(archetype, particleDefn, renderer, updater);

``archetype``
    The emitter specific archetype parameters to be applied.

``particle``
    The definition objects for the particles in an archetype. This is the dictionary returned by :ref:`ParticleBuilder.compile <particlebuilder>`.

``renderer``
    The :ref:`ParticleRenderer <particlerenderer>` this emitter will be used with to be used to convert userData object property of archetype to its integer value.

``updater``
    The :ref:`ParticleUpdater <particleupdater>` this emitter will be used with to be used to convert userData object property of archetype to its integer value.

.. index::
    pair: ParticleEmitter; getMaxLifeTime

`getMaxLifeTime`
----------------

**Summary**

Get the maximum life time required to fully support the intended behavior of this emitter.

**Syntax** ::

    var maxLifeTime = emitter.getMaxLifeTime();

.. index::
    pair: ParticleEmitter; getMaxParticles

`getMaxParticles`
-----------------

**Summary**

Get the maximum amount of particles required to fully support the intended behavior of this emitter.

**Syntax** ::

    var maxParticles = emitter.getMaxParticles();

.. index::
    pair: ParticleEmitter; getMaxSpeed

`getMaxSpeed`
-------------

**Summary**

Get the maximum speed required for particles to fully support the intended behavior of this emitter.

**Syntax** ::

    var maxSpeed = emitter.getMaxSpeed();

.. index::
    pair: ParticleEmitter; getBurstCount

`getBurstCount`
---------------

**Summary**

Static function to compute the amount of bursts required (in a call to `emitter.burst(N)`) so that the emitter will be automatically disabled after the given time period has passed.

**Syntax** ::

    var burstCount = EmitterType.getBurstCount(parsedEmitterArchetype, activeTime);

.. index::
    pair: ParticleEmitter; getTotalLifeTime

`getTotaLifeTime`
-----------------

**Summary**

Static function to compute the maximum possible life time of all particles emitted by the emitter for a given number of bursts, should be used to set a suitable `timeout` when creating a new `ParticleInstance` in `particleManager.createInstance` calls.

**Syntax** ::

    var lifeTime = EmitterType.getTotalLifeTime(parsedParticleArchetype, parsedEmitterArchetype, burstCount);

Properties
==========

.. index::
    pair: ParticleEmitter; enabled

`enabled`
---------

Whether this emitter is currently enabled.

.. note :: Read Only

.. index::
    single: DefaultParticleEmitter

.. _defaultparticleemitter:

The DefaultParticleEmitter Object
=================================

An emitter, compatible with the `DefaultParticleSynchronizer` and assuming usage of the :ref:`DefaultParticleUpdater <defaultparticleupdater>` in the sense that the emitter assumes a standard euclidean simulation space with no specific userData set on the particles.

This emitter will emit continuous streams of particles with a set rate, with particles emitted in a specific direction in an optional combination of a flat angular spread, and a conical spread using either a uniform or normal distribution.

Particles will be emitted from within a random radius of a position in either a flat disc or spherical spread with some distribution, or within a rotated box, with randomized lifetimes and speeds.

**Prediction**

This emitter will make use of the system updater's `predict` method so that particles can be emitted at exactly the rate specified, regardless of update time-steps. This also means that if the particle system was not updated for a period of time due to being outside the camera's view frustum, when made visible again it will appear as though the particle system was always being updated with particles retrospectively created.

Methods
-------

.. index::
    pair: DefaultParticleEmitter; create

`create`
--------

**Summary**

Create a new emitter.

**Syntax** ::

    var emitter = DefaultParticleEmitter.create();

.. _defaultparticleemitter_archetype:

Properties
----------

This list of properties is the same as the list of parameters supported by a :ref:`ParticleArchetype <particlearchetype>` using this synchronizer unless otherwise specified.

.. index::
    pair: DefaultParticleEmitter; forceCreation

`forceCreation`
---------------

Value of `forceCreation` when creating particles. See :ref:`ParticleSystem.createParticle <particlesystem_createparticle>`.

Default value is `false`.

.. index::
    pair: DefaultParticleEmitter; usePrediction

`usePrediction`
---------------

If true, then particles will have their position and velocity predicted using the system updater, this enables (at a small overhead) more accurate creation of particles whose creation time does not exactly overlap with system updates, and to improve behavior when looking back onto a previously invisible particle system.

Default value is `true`.

.. index::
    pair: DefaultParticleEmitter; emittance

`emittance`
-----------

Parameters controlling the emittance of particles.

**Fields**

``rate`` (Default `4`)
    How often particles are emitted, a rate of `3` specifies 3 emittance events every second.

``delay`` (Default `0`)
    A delay in seconds from when the emitter is enabled, to when it first emits particles.

``burstMin`` (Default `1`)
    The minimum amount of particles emitted at each emittance event.

``burstMax`` (Default `1`)
    The maximum amount of particles emitted at each event. The actual amount emitted varies uniformly between the min and max values.

.. index::
    pair: DefaultParticleEmitter; particle

`particle`
----------

Parameters about the particles appearances and life times. This object is vastly different for the :ref:`ParticleArchetype <particlearchetype>` and is described separately.

**Object Fields**

``animationRange`` (Default `[0, 1]`)
    The range of the animation texture used by this particle, this should be accessed from the :ref:`ParticleBuilder <particlebuilder>` compilation result.

``lifeTimeMin`` (Default `1`)
    The minimum life time of the emitted particles.

``lifeTimeMax`` (Default `1`)
    The maximum life time of the emitted particles. The actual life time varies uniformly between the min and max values.

``userData`` (Default `0`)
    The `userData` applied when creating particles from this emitter.

.. note :: This field should not contain randomized seed values, as these will be added automatically by the emitters.

**Archetype Fields**

``name``
    `not-optional`. The name of the particle to be emitted, must exist in the :ref:`ParticleArchetype <particlearchetype>`.

``useAnimationLifeTime`` (Default `true`)
    If true, then the particle animation's life time will be used as a basis of setting the `lifeTimeMin` and `lifeTimeMax` parameters of the emitter when using this emitter with the :ref:`ParticleManager <particlemanager>`.

``lifeTimeScaleMin`` (Default `1`)
    If `useAnimationLifeTime` is true, then this scale will be applied to the animations life time to compute the required value of `lifeTimeMin`.

``lifeTimeScaleMax`` (Default `1`)
    If `useAnimationLifeTime` is true, then this scale will be applied to the animations life time to compute the required value of `lifeTimeMax`.

``lifeTimeMin`` (Default `1`)
    The minimum life time of the emitted particles when `useAnimationLifeTime` is false.

``lifeTimeMax`` (Default `1`)
    The maximum life time of the emitted particles when `useAnimationLifeTime` is false.

``renderUserData`` (Default `{}`)
    An object with fields and values matching those expected by the :ref:`ParticleRenderer <particlerenderer>` createUserData method in use for the archetype.

``updateUserData`` (Default `{}`)
    An object with fields and values matching those expected by the :ref:`ParticleUpdater <particleupdater>` createUserData method in use for the archetype.

.. index::
    pair: DefaultParticleEmitter; position

`position`
----------

Parameters about the spawn positions of particles in this emitter.

**Fields**

``position`` (Default `[0, 0, 0]`)
    The base position of particles emitted in the particle system.

``spherical`` (Default `false`)
    If true, then particle position will be selected from within a sphere.

    If false, then particle positions will be selected from within a disc unless `box` is `true`.

``box`` (Default `false`)
    If true, and `spherical` is false, then particle position will be selected from within a box.

``normal`` (Default `[0, 1, 0]`)
    The normal vector of the disc to select particle positions from if appropriate.

    The vector to orient the `y`-axis of the box with if appropriate.

``radiusMin`` (Default `0`)
    The minimum radius at which to select particle positions from if appropriate.

``radiusMax`` (Default `0`)
    The maximum radius at which to select particle positions from if appropriate.

``radiusDistribution`` (Default `"uniform"`)
    The distribution to use when selecting the radius to use when selecting particle positions if appropriate.

    * `"uniform"`
        A uniform distribution.
    * `"normal"`
        A normal (Gaussian) distribution.

``radiusSigma`` (Default `0.25`)
    The `sigma` parameter of the normal distribution.

``halfExtentsMax`` (Default `[1, 1, 1]`)
    The maximum half-extents of the box in which to spawn particles if appropriate.

``halfExtentsMin`` (Default `[0, 0, 0]`)
    The minimum half-extents of the box in which to spawn particles if appropriate.

    Actual particle positions will be selected between the minimum and maximum half-extents.

.. index::
    pair: DefaultParticleEmitter; velocity

`velocity`
----------

Parameters about the spawn velocities of particles in this emitter.

**Fields**

``theta`` (Default `0`)
    `theta` spherical coordinate for target particle directions in emitter. This is the spherical elevation, with `0` pointing along y-axis, and `Math.PI` pointing along the negative y-axis.

``phi`` (Default `0`)
    `phi` spherical coordinate for target particle directions in emitter. This is the clockwise spherical azimuth, with `0` pointing along the x-axis.

``speedMin`` (Default `1`)
    The minimum speed to emit particles with.

``speedMax`` (Default `1`)
    The maximum speed to emit particles with. The actual speed will vary uniformly between the min and max values.

``flatSpread`` (Default `0`)
    The flat spread angle about the target direction to emit particles in. `Math.PI` radians would specify the flat spread is a full circle.

``flatSpreadAngle`` (Default `0`)
    The angle of the flat spread about the target direction, varying this parameter rotates the entire spread about the target direction (Example; if target direction is in direction of x-axis, then varying this parameter would allow selection of a horizontal or vertically orientated flat spread).

``flatSpreadDistribution`` (Default `"uniform"`)
    The distribution to use when selecting angles into the flat spread.

    * `"uniform"`
        A uniform distribution.
    * `"normal"`
        A normal (Gaussian) distribution.

``flatSpreadSigma`` (Default `0.25`)
    The `sigma` parameter of the normal distribution.

``conicalSpread`` (Default `0`)
    The conical spread angle about the target direction to emit particles in. `Math.PI` radians would specify the conical spread is a full sphere.

``conicalSpreadDistribution`` (Default `"uniform"`)
    The distribution to use when selecting angles into the conical spread.

    * `"uniform"`
        A uniform distribution.
    * `"normal"`
        A normal (Gaussian) distribution.

``conicalSpreadSigma`` (Default `0.25`)
    The `sigma` parameter of the normal distribution.



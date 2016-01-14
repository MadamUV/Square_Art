.. index::
    single: SharedRenderContext

.. highlight:: javascript

.. _sharedrendercontext:

==============================
The SharedRenderContext Object
==============================

**Added SDK 0.28.0**

The SharedRenderContext object provides a utility for handling the sharing of particle state textures, and mapping table textures between many particle systems.

The context can be used to allocate new regions of the double-buffered renderable textures required by a :ref:`ParticleSystem <particlesystem>` and a :ref:`ParticleView <particleview>` which is z-sorted.

This object does not expose any way of releasing previously allocated regions, as the underlying allocation algorithm (`OnlineTexturePacker`) does not support this. The intention is that these shared textures are used where systems are either permanent, or short-lived and recycled.

.. note::
    This is a low-level particle system API.

Methods
=======

.. index::
    pair: SharedRenderContext; create

`create`
--------

**Summary**

Create a new SharedRenderContext object.

**Syntax** ::

    var sharedRenderContext = SharedRenderContext.create({
        graphicsDevice: graphicsDevice
    });

.. index::
    pair: SharedRenderContext; allocate

`allocate`
----------

**Summary**

Allocate a new region of the shared textures. May return null in the case that an attempt is made to allocate a texture region larger than is supported by the :ref:`GraphicsDevice <graphicsdevice>`.

**Syntax** ::

    function setCallbackFn(newRegion)
    {
        // The shared render context was resized by some later allocations
        // and the uvRectangle and renderTargets have been changed.
        // .. handle changes here.
    }
    var region = sharedRenderContext.allocate({
        width: 64,
        height: 64,
        set: setCallbackFn
    });
    var renderTargets = region.renderTargets;
    var uvRectangle = region.uvRectangle;

``width``
    The width of the region required.

``height``
    The height of the region required.

``set``
    A function to be called when resizing the shared textures from which the region was allocated, and the uv-rectangle of the region has changed.

The region object returned has the following fields:

    ``renderTargets``
        The pair of :ref:`RenderTargets <rendertarget>` representing the double buffer texture store region is allocated from.

    ``uvRectangle``
        A :ref:`Vector4 <v4object>` object representing the texture coordinate rectangle of the region in the shared textures. This is of the form `[x0, y0, x1, y1]` in normalize coordinates.

.. index::
    pair: SharedRenderContext; release

`release`
---------

**Summary**

Release an allocated region for re-use.

**Note**

The intention is that these shared textures are used where systems are either permanent, or short-lived and recycled. The underlying algorithm responsible for allocating regions does not perform any defragmentation or merging of free regions, and as such releasing an allocated region should be done with care.

**Syntax** ::

    sharedRenderContext.release(region);

``region``
    The region returned by `allocate`, or passed to the `set` callback.

.. index::
    pair: SharedRenderContext; destroy

`destroy`
---------

**Summary**

Destroy all render targets and textures owned by this shared context. The shared context, nor any of its previously allocated regions can be used following this call.

**Syntax** ::

    sharedRenderContext.destroy();

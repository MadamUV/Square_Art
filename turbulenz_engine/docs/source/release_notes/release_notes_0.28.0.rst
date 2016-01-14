--------------------
Turbulenz SDK 0.28.0
--------------------

.. highlight:: javascript

Summary
=======

Turbulenz SDK 0.28.0 is an update for both the Turbulenz Engine
Installer and SDK components.

Packaged Components
===================

The following versions of Turbulenz products are packaged in this SDK:

* turbulenz_engine - 1.3.1
* turbulenz_tools - 1.0.5
* turbulenz_local - 1.1.4

Change List
===========

New Features
------------

* (**BETA**) Added an API for particle effects running on the GPU.
  Includes a :ref:`high-level <highlevelparticles_api>`, data-driven API
  exposed through the :ref:`ParticleManager <particlemanager>`
  object with verified data-input reporting semantic errors.
  The GPU particle API has support (for adventurous coders) to plug-in new
  modules to customize
  rendering, simulation and emittance of particles using the
  :ref:`low-level <lowlevelparticles_api>` API. See :ref:`Particle System
  <particlesystem>` for more information.
  The GPU particle API Works together with existing :ref:`Scene <scene>`
  and rendering objects.

* Added a sample *gpu_particles* demonstrating the high-level usage of the
  GPU particle API.

* Support for IE11. Work-around fixes have been added to allow the Turbulenz Engine to work due to an incomplete WebGL implementation. Once the WebGL 1.0 specification is completely implemented in IE11, the fixes will be removed.

* Added a sample *subtitles* demonstrating the use of different language fonts to render subtitles.

* Payment support added for iOS/Android Turbulenz apps.
  Apps built using Turbulenz now allow in-app purchases to be triggered from the game.

* Minor features:

  - Added viewBox transforms to svg implementation
  - Added support for proposed canvas API resetTransform to canvas.js
  - Added support for tar files to deps.yaml and build process
  - Added support to the Camera for specifying the near/far plane to getFrustumFarPoints, getFrustumPoints, getFrustumExtents query
  - Exposed the ability for the Graphics Device to be created with disabled stencil and depth buffers
  - Added scene extents to the viewer scene metrics
  - Added check when using Workers for processing DDS textures on unsupported platforms
  - Added support for non-ascii characters in makehtml and maketzjs
  - Added support for tslint and fixed basic errors on tslib
  - Added support for building tools with Visual Studio 2013

Changes
-------

* The *plugin-debug* build mode has been deprecated.  The SDK no
  longer contains the *plugin-debug* version of any samples or apps,
  and developers should not rely upon support for this build mode in
  any tools.  The *canvas-debug* mode is the recommended way to use
  the browser debugging tools.

* Mac OS X 10.6 and Safari 5 are no longer officially supported.  This
  removes the need for any browser plugin on Mac OS X platforms, and
  so the *TurbulenzEngine* binary installers are no longer bundled
  with SDKs or available for download.

* Updated to Protolib (0.2.1).
  Minor changes include:

  - Corrected the rendering order of the :ref:`drawText <protolib-drawText>` function to occur after :ref:`draw2DSprite <protolib-draw2dsprite>` function.
  - Added new callback :ref:`setPreRendererDraw <protolib-setprerendererdraw>` and updated behavior of :ref:`setPreDraw <protolib-setpredraw>`

.. _sdk_0_28_0_fontmanager:

* Modified FontManager to support multiple pages:

  - New property *glyphCounts* added to the object returned by :ref:`fontManager.calculateTextDimensions <fontmanager_calculatetextdimensions>`
  - Added argument *dimensions* to :ref:`font.calculateTextDimensions <font_calculatetextdimensions>`
  - Added argument *lineSpacing* to :ref:`font.calculateTextDimensions <font_calculatetextdimensions>`
  - New properties *linesWidth* and *glyphCounts* added to the object returned by :ref:`font.calculateTextDimensions <font_calculatetextdimensions>`
  - Replaced generateTextVertices function by :ref:`generatePageTextVertices <font_generatepagetextvertices>`, now with page
    compatibility
  - Added argument *pageIdx* to :ref:`font.drawTextVertices <font_drawtextvertices>`
  - Added argument *dimensions* to :ref:`font.drawTextRect <font_drawtextrect>`
  - Added argument *lineSpacing* to :ref:`font.drawTextRect <font_drawtextrect>`

* Modified FontManager to use tri-strip instead of fan for single characters.
  Temporary fix for IE11.

* General improvements to the soundDevice for stability and the process of incorrectly loaded files

* Updated documentation about developer clients.
  More information about the :ref:`iOS/Android Developer Client <developer_client_readme>` offerings.

* Various PhysicsManager optimizations

.. _assetcache_v2:

* Updated :ref:`AssetCache <assetcache>` to version 2:

  - Includes a new :ref:`get <assetcache_get>` function
  - Modified :ref:`request <assetcache_request>` behavior to include a callback
  - Improved speed and memory allocations
  - Improved handling of the case where assets are forced out during loading

* Minor changes:

  - Added debug assertion for draw2D when npot textures are used with mipmaps not supported
  - Request handler now retries if 504 responses are encountered instead of failing immediately
  - Improved handling of non-JSON responses to API requests
  - Updated device_initialization to output to console for fullscreen apps
  - Improvements to fullscreen implementation (also supports IE11)
  - Improvements to DDS loader image processing
  - Removed usage of deprecated event property "event.keyLocation" in the Input Device
  - Changed default materialColor and uvTransform setting behaviour in the renderers to set on the sharedMaterial
    instead of each renderable
  - Modified MIME types for tar/mp3 files required for IE11
  - Added node pool and extents to reduce number of ArrayBuffers in AABBTree
  - Various memory saving optimizations for scenes, sounds, physics, forward rendering
  - SoundDevice improvements for playing/stoping sources

Fixed
-----

* Fixed an issue in draw2D where sprites were incorrectly scaled around the origin

* Fixed missing urllib3 from tools/local packages

* Fixed missing copyright comments

* Fixed the handling of gamesession create to treat 404s as if services are unavailable

* Fix for jointMax being infinity in Physics2D Debug Draw

* Fixed an animation issue in addTime() for animations with zero length

* Fixed an processing issue for cubemaps with a single mipmap level

* Fixed support for multiple animation elements targeting the same attribute

* Fixed scale animation export when stored as separate axis components

* Fix dae2json referencing a legacy flat effect in the shaders

* Fixed WebGL extension checking to avoid warnings in Firefox

* Fixed mipmap initialization and debug checking

* Fixed an issue in the SoundDevice when gain was ignored on a source before playing


Known Issues
============

New
---

* The GPU particle API depends on non-standard WebGL feature
  (MAX_VERTEX_TEXTURE_IMAGE_UNITS)
  to be available. It is supported on most devices (with the exception of iOS).
  In order to use the GPU particle API, check if
  *graphicsDevice.maxSupported("VERTEX_TEXTURE_UNITS") >= 4*.
  There is currently no fallback available for unsupported platforms.

* IE11 has an issue attempting to play sound sources multiple times.
  This sometimes manifests in sounds partially playing or failing to play at all and sometimes can be experienced in the sound sample.

Unchanged
---------

For a list of current known issues see the :ref:`known issues section
<known_issues>`.

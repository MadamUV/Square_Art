BUILDDIR := external/tzbuild
ifeq (,$(wildcard $(BUILDDIR)/config.mk))
  $(error Have you updated all submodules to include tzbuild?)
endif

include $(BUILDDIR)/config.mk

# $(warning TARGET=$(TARGET))
# $(warning TARGETNAME=$(TARGETNAME))
# $(warning CONFIG=$(CONFIG))
# $(warning MAKEFLAGS=$(MAKEFLAGS))
# $(warning MAKECMDGOALS=$(MAKECMDGOALS))

############################################################

help:
	@echo ""
	@echo "Usage:"
	@echo ""
	@echo "  make [<flags>] <targets>"
	@echo ""
	@echo "Targets:"
	@echo ""
	@echo "jslib"

############################################################
# TSLIB build modules
############################################################

TSC := tsc

MODULAR ?= 0
REFCHECK ?= 0
ONESHOT ?= 0

TS_MODULAR ?= $(MODULAR)
TS_REFCHECK ?= $(REFCHECK)
TS_ONESHOT ?= $(ONESHOT)
TS_OUTPUT_DIR := jslib$(if $(filter $(MODULAR),1),-modular)
TS_OUTPUT_DIR := $(TS_OUTPUT_DIR)$(if $(filter $(REFCHECK),1),-refcheck)
TS_SRC_DIR := tslib

ifeq (win32,$(BUILDHOST))
  CGFX2JSON ?= tools\bin\$(BUILDHOST)\cgfx2json.exe
else
  CGFX2JSON ?= tools/bin/$(BUILDHOST)/cgfx2json
endif
CGFX2JSONFLAGS := -j 4

# platform
platform_src := $(TS_SRC_DIR)/base.d.ts $(TS_SRC_DIR)/turbulenz.d.ts

# debug
debug_src := $(TS_SRC_DIR)/debug.ts
debug_deps := platform

# vmath
vmath_src := $(TS_SRC_DIR)/vmath.ts
vmath_deps := platform debug

# AABBTree
aabbtree_src := $(TS_SRC_DIR)/aabbtree.ts
aabbtree_deps := vmath debug

# physics_canvas
physics_canvas_src := $(TS_SRC_DIR)/webgl/physicsdevice.ts
physics_canvas_deps := aabbtree vmath platform
physics_canvas_nodecls := 1

# platform_canvas - everything in webgl except the physicsdevice
platform_canvas_src := \
  $(filter-out %physicsdevice.ts,$(wildcard $(TS_SRC_DIR)/webgl/*.ts))
platform_canvas_deps := vmath platform
platform_canvas_nodecls := 1

# utilities
utilities_src = $(addprefix $(TS_SRC_DIR)/, \
  observer.ts requesthandler.ts utilities.ts)
utilities_deps := platform

# servicestypes
servicedatatypes_src := $(TS_SRC_DIR)/services/servicedatatypes.d.ts

# services
services_src := $(wildcard $(TS_SRC_DIR)/services/*.ts)
services_deps := utilities debug servicedatatypes

# tzdraw2d
tzdraw2d_src := $(TS_SRC_DIR)/draw2d.ts assets/shaders/draw2D.cgfx
tzdraw2d_deps = platform debug

# physics2d
physics2d_src := $(TS_SRC_DIR)/physics2ddevice.ts $(TS_SRC_DIR)/boxtree.ts
physics2d_deps := platform debug

# physics2ddebugdraw
physics2ddebugdraw_src := \
  $(TS_SRC_DIR)/physics2ddebugdraw.ts assets/shaders/debugphys2d.cgfx
physics2ddebugdraw_deps := physics2d

# fontmanager
fontmanager_src := $(TS_SRC_DIR)/fontmanager.ts
fontmanager_deps := platform utilities debug

# canvas
canvas_src := $(TS_SRC_DIR)/canvas.ts assets/shaders/canvas.cgfx
canvas_deps := platform fontmanager

# svg
svg_src := $(TS_SRC_DIR)/svg.ts
svg_deps := canvas

# spatialgrid
spatialgrid_src := $(TS_SRC_DIR)/spatialgrid.ts
spatialgrid_deps := debug

# sparsegrid
sparsegrid_src := $(TS_SRC_DIR)/sparsegrid.ts
sparsegrid_deps := debug

# jsengine_base
jsengine_base_src := $(addprefix $(TS_SRC_DIR)/, \
  assetcache.ts assettracker.ts camera.ts charactercontroller.ts \
  indexbuffermanager.ts soundmanager.ts texturemanager.ts \
  vertexbuffermanager.ts)
jsengine_base_deps := platform utilities debug

# shadermanager
shadermanager_src := $(TS_SRC_DIR)/shadermanager.ts assets/shaders/default.cgfx
shadermanager_deps := jsengine_base

# jsengine
jsengine_src := $(addprefix $(TS_SRC_DIR)/,                                   \
  animation.ts animationmanager.ts defaultrendering.ts effectmanager.ts       \
  material.ts geometry.ts light.ts mouseforces.ts physicsmanager.ts           \
  posteffects.ts renderingcommon.ts resourceloader.ts scene.ts scenenode.ts   \
  shadowmapping.ts cascadedshadows.ts                                         \
)
jsengine_deps := services aabbtree jsengine_base shadermanager

# floor
floor_src := $(TS_SRC_DIR)/floor.ts assets/shaders/floor.cgfx
floor_deps := jsengine_base

# loadingscreen
loadingscreen_src := \
  $(TS_SRC_DIR)/loadingscreen.ts assets/shaders/loadingscreen.cgfx
loadingscreen_deps := jsengine_base

# textureeffects
textureeffects_src := \
  $(TS_SRC_DIR)/textureeffects.ts assets/shaders/textureeffects.cgfx
textureeffects_deps := jsengine_base

# jsengine_simplerendering
jsengine_simplerendering_src := $(TS_SRC_DIR)/simplerendering.ts
jsengine_simplerendering_deps := jsengine

# jsengine_deferredrendering
jsengine_deferredrendering_src := $(TS_SRC_DIR)/deferredrendering.ts
jsengine_deferredrendering_deps := jsengine

# jsengine_forwardrendering
jsengine_forwardrendering_src := $(TS_SRC_DIR)/forwardrendering.ts
jsengine_forwardrendering_deps := jsengine

# jsengine_debug
jsengine_debug_src := $(addprefix $(TS_SRC_DIR)/,                  \
  drawprimitives.ts debuggingtools.ts networklatencysimulator.ts   \
  scenedebugging.ts)                                               \
  $(wildcard $(TS_SRC_DIR)/dump*.ts)
jsengine_debug_deps := jsengine

# capturedevices
capturedevices_src := tslib/capturegraphicsdevice.ts
capturedevices_deps := platform debug

# particlesystem
particlesystem_src := tslib/particlesystem.ts  \
  assets/shaders/particles-copy.cgfx           \
  assets/shaders/particles-packer.cgfx         \
  assets/shaders/particles-sort.cgfx
particlesystem_deps := platform debug jsengine

TSLIBS += platform debug vmath aabbtree physics_canvas platform_canvas        \
  utilities services tzdraw2d physics2d physics2ddebugdraw fontmanager canvas \
  jsengine_base shadermanager floor loadingscreen textureeffects jsengine     \
  jsengine_simplerendering jsengine_deferredrendering                         \
  jsengine_forwardrendering jsengine_debug capturedevices svg spatialgrid     \
  particlesystem sparsegrid

# Check we haven't forgotten any tslib files
ifeq (macosx,$(TARGET))
  all_ts_files := $(shell find tslib -iname '[^\.]*.ts' | grep -v external)
  all_ts_src_files := \
    $(TS_BASE_FILES) $(foreach tsl,$(TSLIBS),$($(tsl)_src))
  forgotten_ts_files := $(filter-out $(all_ts_src_files),$(all_ts_files))
  ifneq (,$(forgotten_ts_files))
    $(error THESE FILES ARE NOT USED: $(forgotten_ts_files))
  endif
endif

############################################################

# Temporary hack to prevent C rules being included since they don't
# work under pymake.
ifeq (jslib,$(MAKECMDGOALS))
  APPS:=
  LIBS:=
  DLLS:=
endif

# EXT, LIBS, APPS are used to set up all build rules ...
include $(BUILDDIR)/rules.mk

############################################################
# Single file with all code
############################################################

ifeq (1,$(TS_MODULAR))

UGLIFY := node $(BUILDDIR)/../uglifyjs/bin/uglifyjs
AIO_ALL_INPUT := $(foreach t,$(TSLIBS),$(_$(t)_out_js))
turbulenz-all-min.js : $(AIO_ALL_INPUT)
	$(CMDPREFIX)$(CAT) $^ | $(UGLIFY) -o $@

AIO_ALL_DECLS := $(foreach t,$(TSLIBS),			\
  $(if $($(t)_nodecls),,$(_$(t)_out_d_ts))		\
)
turbulenz-all.d.ts : $(AIO_ALL_DECLS)
	$(CAT) $^ > $@

.PHONY: allinone
allinone : turbulenz-all-min.js turbulenz-all.d.ts

endif

AppTitle = "Square art"

Graphics 800,600,0,2

SeedRnd (MilliSecs())
rectbeginx = a
rectbeginy = b
rectwidth = m
rectheight = m
addToLocalCoordinates = Rand (0,50)
a = Rand(0,700)
b = Rand(0,500)
m = Rand(300,310)
Type point
    Field x,y
End Type
Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect a,b,m,m
Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect a,b,m/2,m/2
Rect a + m/2,b + m/2,m/2,m/2
point1.point = New point
point2.point = New point
point3.point = New point
point4.point = New point
point5.point = New point
;Upper left point.x
;relative to local x coordinateU
;is -1 times m (rectwidth,height) divided by two

;Upper right point.x
;relative to local x coordinate
;is m (rectwidth,height) divided by two

;Lower left point.x
;relative to local x coordinate
;is -1 times m (rectwidth,height) divided by two

;Lower right point.x
;relative to local x coordinate
;is m (rectwidth,height) divided by two

;next

;Upper left point.y
;relative to local y coordinate
;is -1 times m (rectwidth,height) divided by two

;Upper right point.y
;relative to local y coordinate
;is -1 times m (rectwidth,height) divided by two

;Lower left point.y
;relative to local y coordinate
;is m (rectwidth,height) divided by two

;Lower right point.y
;relative to local y coordinate
;is m (rectwidth,height) divided by two

point1\x = (-1 * m / 2) + addToLocalCoordinates
point2\x = (m/2) + addToLocalCoordinates
point3\x = (-1 * m / 2) + addToLocalCoordinates
point4\x = (m/2) + addToLocalCoordinates
point5\x = 0 + addToLocalCoordinates
point1\y = (-1 * m / 2) + addToLocalCoordinates
point2\y = (-1 * m / 2) + addToLocalCoordinates
point3\y = (m / 2) + addToLocalCoordinates
point4\y = (m / 2) + addToLocalCoordinates
point5\y = (m/2) + addToLocalCoordinates

Color Rand(0,255), Rand(0,255), Rand(0,255)
Line point1\x + a, point1\y + b, point2\x + a, point2\y + b
Line point2\x + a, point2\y + b, point4\x + a, point4\y + b
Line point4\x + a, point4\y + b, point3\x + a, point3\y + b
Line point3\x + a, point3\y + b, point5\x + a, point5\y + b

;End of first drawing checkerboard.

rectbeginx = aa
rectbeginy = ba
rectwidth = ma
rectheight = ma
aa = Rand(100,700)
ba = Rand(100,500)
ma = Rand(30,300)

Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect aa,ba,ma,ma
Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect aa,ba,ma/2,ma/2
Rect aa + ma/2,ba + ma/2,ma/2,ma/2
point1a.point = New point
point2a.point = New point
point3a.point = New point
point4a.point = New point

point1a\x = (-1 * ma / 2) + addToLocalCoordinates
point2a\x = (ma/2) + addToLocalCoordinates
point3a\x = (-1 * ma / 2) + addToLocalCoordinates
point4a\x = (ma/2) + addToLocalCoordinates
point1a\y = (-1 * ma / 2) + addToLocalCoordinates
point2a\y = (-1 * ma / 2) + addToLocalCoordinates
point3a\y = (ma / 2) + addToLocalCoordinates
point4a\y = (ma / 2) + addToLocalCoordinates

Line point1a\x + aa, point1a\y + ba, point2a\x + aa, point2a\y + ba
Line point2a\x + aa, point2a\y + ba, point4a\x + aa, point4a\y + ba
Line point4a\x + aa, point4a\y + ba, point3a\x + aa, point3a\y + ba
Line point3a\x + aa, point3a\y + ba, point1a\x + aa, point1a\y + ba

;End of second drawing

rectbeginx = ab
rectbeginy = bb
rectwidth = mb
rectheight = mb
ab = Rand(0,800)
bb = Rand(0,600)
mb = Rand(30,300)

Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect ab,bb,mb,mb
Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect ab,bb,mb/2,mb/2
Rect ab + mb/2,bb + mb/2,mb/2,mb/2
point1b.point = New point
point2b.point = New point
point3b.point = New point
point4b.point = New point

point1b\x = (-1 * mb / 2) + addToLocalCoordinates
point2b\x = (mb/2) + addToLocalCoordinates
point3b\x = (-1 * mb / 2) + addToLocalCoordinates
point4b\x = (mb/2) + addToLocalCoordinates
point1b\y = (-1 * mb / 2) + addToLocalCoordinates
point2b\y = (-1 * mb / 2) + addToLocalCoordinates
point3b\y = (mb / 2) + addToLocalCoordinates
point4b\y = (mb / 2) + addToLocalCoordinates

Line point1b\x + ab, point1b\y + bb, point2b\x + ab, point2b\y + bb
Line point2b\x + ab, point2b\y + bb, point4b\x + ab, point4b\y + bb
Line point4b\x + ab, point4b\y + bb, point3b\x + ab, point3b\y + bb
Line point3b\x + ab, point3b\y + bb, point1b\x + ab, point1b\y + bb

;End of third drawing.

rectbeginx = ac
rectbeginy = bc
rectwidth = mc
rectheight = mc
ac = Rand(100,700)
bc = Rand(0,500)
mc = Rand(30,300)

Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect ac,bc,mc,mc
Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect ac,bc,mc/2,mc/2
Rect ac + mc/2,bc + mc/2,mc/2,mc/2

point1c.point = New point
point2c.point = New point
point3c.point = New point
point4c.point = New point

point1c\x = (-1 * mc / 2) + addToLocalCoordinates
point2c\x = (mc/2) + addToLocalCoordinates
point3c\x = (-1 * mc / 2) + addToLocalCoordinates
point4c\x = (mc/2) + addToLocalCoordinates
point1c\y = (-1 * mc / 2) + addToLocalCoordinates
point2c\y = (-1 * mc / 2) + addToLocalCoordinates
point3c\y = (mc / 2) + addToLocalCoordinates
point4c\y = (mc / 2) + addToLocalCoordinates

Line point1c\x + ac, point1c\y + bc, point2c\x + ac, point2c\y + bc
Line point2c\x + ac, point2c\y + bc, point4c\x + ac, point4c\y + bc
Line point4c\x + ac, point4c\y + bc, point3c\x + ac, point3c\y + bc
Line point3c\x + ac, point3c\y + bc, point1c\x + ac, point1c\y + bc

;End of fourth drawing.

rectbeginx = ad
rectbeginy = bd
rectwidth = md
rectheight = md
ad = Rand(0,700)
bd = Rand(100,500)
md = Rand(30,300)

Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect ad,bd,md,md
point1d.point = New point
point2d.point = New point
point3d.point = New point
point4d.point = New point

point1d\x = (-1 * md / 2) + addToLocalCoordinates
point2d\x = (md/2) + addToLocalCoordinates
point3d\x = (-1 * md / 2) + addToLocalCoordinates
point4d\x = (md/2) + addToLocalCoordinates
point1d\y = (-1 * md / 2) + addToLocalCoordinates
point2d\y = (-1 * md / 2) + addToLocalCoordinates
point3d\y = (md / 2) + addToLocalCoordinates
point4d\y = (md / 2) + addToLocalCoordinates

Line point1d\x + ad, point1d\y + bd, point2d\x + ad, point2d\y + bd
Line point2d\x + ad, point2d\y + bd, point4d\x + ad, point4d\y + bd
Line point4d\x + ad, point4d\y + bd, point3d\x + ad, point3d\y + bd
Line point3d\x + ad, point3d\y + bd, point1d\x + ad, point1d\y + bd

;End of fifth drawing.

rectbeginx = ae
rectbeginy = be
rectwidth = me
rectheight = me
ae = Rand(0,700)
be = Rand(100,500)
me = Rand(30,300)

Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect ae,be,me,me
point1e.point = New point
point2e.point = New point
point3e.point = New point
point4e.point = New point
point5e.point = New point

point1e\x = (-1 * me / 2) + addToLocalCoordinates
point2e\x = (me/2) + addToLocalCoordinates
point3e\x = (-1 * me / 2) + addToLocalCoordinates
point4e\x = (me/2) + addToLocalCoordinates
point5e\x = 0 + addToLocalCoordinates
point1e\y = (-1 * me / 2) + addToLocalCoordinates
point2e\y = (-1 * me / 2) + addToLocalCoordinates
point3e\y = (me / 2) + addToLocalCoordinates
point4e\y = (me / 2) + addToLocalCoordinates
point5e\y = (me/2) + addToLocalCoordinates

Color Rand(0,255), Rand(0,255), Rand(0,255)
Line point1e\x + ae, point1e\y + be, point2e\x + ae, point2e\y + be
Line point2e\x + ae, point2e\y + be, point4e\x + ae, point4e\y + be
Line point4e\x + ae, point4e\y + be, point3e\x + ae, point3e\y + be
Line point3e\x + ae, point3e\y + be, point5e\x + ae, point5e\y + be

;End of fifth drawing

rectbeginx = af
rectbeginy = bf
rectwidth = mf
rectheight = mf
af = Rand(100,700)
bf = Rand(0,500)
mf = Rand(30,300)

Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect af,bf,mf,mf
Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect af,bf,mf/2,mf/2
Rect af + mf/2,bf + mf/2,mf/2,mf/2

point1f.point = New point
point2f.point = New point
point3f.point = New point
point4f.point = New point

point1f\x = (-1 * mf / 2) + addToLocalCoordinates
point2f\x = (mf/2) + addToLocalCoordinates
point3f\x = (-1 * mf / 2) + addToLocalCoordinates
point4f\x = (mf/2) + addToLocalCoordinates
point1f\y = (-1 * mf / 2) + addToLocalCoordinates
point2f\y = (-1 * mf / 2) + addToLocalCoordinates
point3f\y = (mf / 2) + addToLocalCoordinates
point4f\y = (mf / 2) + addToLocalCoordinates

Line point1f\x + af, point1f\y + bf, point2f\x + af, point2f\y + bf
Line point2f\x + af, point2f\y + bf, point4f\x + af, point4f\y + bf
Line point4f\x + af, point4f\y + bf, point3f\x + af, point3f\y + bf
Line point3f\x + af, point3f\y + bf, point1f\x + af, point1f\y + bf

;End of sixth drawing checkerboard.

rectbeginx = ag
rectbeginy = bg
rectwidth = mg
rectheight = mg
ag = Rand(100,700)
bg = Rand(0,500)
mg = Rand(30,300)

Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect ag,bg,mg,mg
Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect ag,bg,mg/2,mg/2
Rect ag + mg/2,bg + mg/2,mg/2,mg/2

point1g.point = New point
point2g.point = New point
point3g.point = New point
point4g.point = New point

point1g\x = (-1 * mg / 2) + addToLocalCoordinates
point2g\x = (mg/2) + addToLocalCoordinates
point3g\x = (-1 * mg / 2) + addToLocalCoordinates
point4g\x = (mg/2) + addToLocalCoordinates
point1g\y = (-1 * mg / 2) + addToLocalCoordinates
point2g\y = (-1 * mg / 2) + addToLocalCoordinates
point3g\y = (mg / 2) + addToLocalCoordinates
point4g\y = (mg / 2) + addToLocalCoordinates

Line point1g\x + ag, point1g\y + bg, point2g\x + ag, point2g\y + bg
Line point2g\x + ag, point2g\y + bg, point4g\x + ag, point4g\y + bg
Line point4g\x + ag, point4g\y + bg, point3g\x + ag, point3g\y + bg
Line point3g\x + ag, point3g\y + bg, point1g\x + ag, point1g\y + bg

;End of seventh drawing checkerboard.

rectbeginx = ah
rectbeginy = bh
rectwidth = mh
rectheight = mh
ah = Rand(100,700)
bh = Rand(0,500)
mh = Rand(30,300)

Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect ah,bh,mh,mh
Color Rand(0,255), Rand(0,255), Rand(0,255)
Rect ah,bh,mh/2,mh/2
Rect ah + mh/2,bh + mh/2,mh/2,mh/2

point1h.point = New point
point2h.point = New point
point3h.point = New point
point4h.point = New point

point1h\x = (-1 * mh / 2) + addToLocalCoordinates
point2h\x = (mh/2) + addToLocalCoordinates
point3h\x = (-1 * mh / 2) + addToLocalCoordinates
point4h\x = (mh/2) + addToLocalCoordinates
point1h\y = (-1 * mh / 2) + addToLocalCoordinates
point2h\y = (-1 * mh / 2) + addToLocalCoordinates
point3h\y = (mh / 2) + addToLocalCoordinates
point4h\y = (mh / 2) + addToLocalCoordinates

Line point1h\x + ah, point1h\y + bh, point2h\x + ah, point2h\y + bh
Line point2h\x + ah, point2h\y + bh, point4h\x + ah, point4h\y + bh
Line point4h\x + ah, point4h\y + bh, point3h\x + ah, point3h\y + bh
Line point3h\x + ah, point3h\y + bh, point1h\x + ah, point1h\y + bh

;End of eigth drawing checkerboard.




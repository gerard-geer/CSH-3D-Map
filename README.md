CSH-3D-Map
==========

A video-game style, interactive floor map.

How it works
------------

The graphical portion is rather tidy in concept. There are two copies of the geometry data that are loaded 
into GPU memory. One has each room colored an unique shade of gray. This coloring serves as each room's ID.

A second model ie essentially what is seen on screen. It is color coded roughly based on the room type.

Each frame both models are rendered, with the same geometry transformations applied to each, into their 
own framebuffers.

After the two models are rendered, we shift focus back to the main rendering surface (the one on screen) and
render a full-screen quad. We supply the textures of both framebuffers to the fragment shader of this 
quadrilateral.

The shader takes and bidirectionally differentiates the ID-buffer texture. With this differentiation it is able
to tell the boundaries between rooms by simply performing a (very forgiving) high-band filter of the 
differentiated texels. When these filtered texels are drawn to the screen we tint them green, and it creates a
wireframe effect. For texels that don't pass the high-band filter, we sample the colored-buffer texture at the
same coordinate. This "fills in" the wireframe with the coloring from the colored model.

The reason we this bipartisan technique is so that we can know which room the user selects. When a mousedown
event is triggered, we take the coordinates of the mouse at the event, transform them to the dimensions of
the ID framebuffer, and sample the texel at the point. 

Since the rooms are greyscale, if all three channels are equal, it can be known if the user has clicked a room
or the background by simply testing for equality. If the color channels are homologous, we store the red
channel value as the ID of the room selected.

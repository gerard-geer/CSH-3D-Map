CSH-3D-Map
==========

A video-game style, interactive floor map.

How it works
------------

The graphical portion is rather tidy in concept. There are two copies of the geometry data that are loaded 
into GPU memory. One has each room colored an unique shade of gray. This coloring serves as each room's ID.

The second model ie essentially what is seen on screen. It is color coded roughly based on the room type.

Every frame both models are rendered, with the same geometry transformations applied to each, into their 
own framebuffers (I'll call them the ID buffer and the diffuse buffer, respectively).

Next we render the colored model (it's ever-so-slightly smaller) into two more framebuffers. 

In the first of these two passes we record the dFdx and dFdy of the depth of each fragment, effectively 
storing a normal-map of the scene in the framebuffer we were using.

In the second framebuffer we output the depth of each fragment, storing a depth-map of the scene in the 
framebuffer used.

The next step in the rendering pipeline renders the wireframe seen in the final output of each frame. This
step is rather tricky. The central technique to the step is a rather cheap method of Sobel filtering. We sample the 
texture a small distance away from the current fragment's UV coordinate in each cardinal direction, and 
compute the absolute difference through both axes. If this difference is greater than a prescribed amount,
we set the current fragment's color to the color of the wireframe. The tricky part revolves around the fact
that based on which framebuffer we perform the Sobel operation on, we will extract different edges for the
wireframe.

Performing this on the ID framebuffer gives us the edges between rooms and along edges (in image-space)
between the model and the background. If we use the normal map, we can get the edges between the model and
background and between differences in surface normal, but not between rooms. This means we must do the operation
on both buffers, and combine the results. I additionally do this operation to the depth buffer, because overlapping
edges between parallel faces disappear in every other buffer. This does, however, cause the "sheen" artifacts
when looking nearly perpendicular to a surface.

Another thing that happens at the wireframe stage is room-highlighting. The ID of the currently selected room
is passed to the shader, and if the texel sampled from the ID buffer matches the color described by the ID, we
output the color of the corresponding texel from the diffuse buffer. That is, if it isn't already determined
to be a wireframe texel. We do this here, so when we combine the wireframe framebuffer with the diffuse framebuffer,
the selected room appears to be highlighted and glowing a tad bit.

The next step performed was actually an attempt to anti-alias the wireframe that immediately went a different route.
We take the wireframe framebuffer, and render it into a framebuffer I'll call "horizBlurBuffer", performing,
as you would expect, the horizontal component of a Gaussian style blur. We then take that buffer and render
it into another framebuffer, performing a vertical blur on the already horizontally blurred image.

We've now completed all the components of the final frame. All that's left to do is combine them. At the current stage,
all that is done is the combination of the blurred wireframe with the original wireframe, atop the diffuse buffer.
This gives the final output seen. However, in the future SSAO will be performed here. Don't forget that this is
a CSH project, and you have to learn shit. I've learned PHP and some Tao d'LDAP, but I still want to learn how
to implement SSAO, since I've been fascinated with the algorithm since middle school.

Disclaimers: The dFdx and dFdy GLSL functions aren't done in hardware on all cards. If yours doesn't support this luxury,
your framerate will tumble hard.

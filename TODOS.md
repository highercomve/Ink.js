### Ink.js TODOS


Clear background per animation, per figure
------------------------------------------

Clearing the background of a full resolution canvas
gets harder as the resolution is wider; the solution
is to carefully clear the box in which each object is drawn.

_Possible issues:_
-   Does this have to be made before drawing all the figures? I think yes.
-   Optional per figure or an option once Ink.js is initialized? (I think the second method is the wiser, but I could be wrong)


Redraw the canvas only when figure are moving
---------------------------------------------

Currently, the canvas is being refreshed no matter if all the figures
are still, this consumes resources unnecessarily, it could be better if
we managed to make it refresh only if a figure animation function is triggered,
or only if any of the attributes of possition or style are being changed.

_Possible issues:_
-   The analysis or operation detection should take less resources than the redraw itself.


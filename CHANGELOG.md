# Changelog

## Unreleased

**New licence: free to use, but no longer open source.** From the next version
on, In-Person Tools is released under its own licence instead of MIT. Nothing
changes for using it: installing, playing, running paid games and adapting it
for your own table stay allowed and free. What now needs written permission is
redistributing it, bundling it into another package and selling it. Versions up
to and including 14.2611.74 stay under the MIT License. The full terms are in
`LICENSE`.

## 14.2611.74 - 2026-09-10

**The edit pen on journal pages stays visible.** Foundry only brings it out when
the mouse pointer comes near it (`.journal-entry-page:hover
.edit-container button`). A finger triggers no hover, so on the tablet it simply
was not there: whoever wanted to create a recap through FANG had to tap blindly
at the spot where it sits. In the sheet view it now stays in place permanently,
for every journal.

New in the sheet view settings: **"Always show the edit pen"**, on by default.
Whoever does not like the fixed spot switches it off there.

## 14.2611.73 - 2026-09-09

**Other modules' windows stay on screen, even without Shops.** A dialog whose
edge nobody can reach any more is broken, no matter who built it: at the table,
dnd5e's hit dice window opened larger than the tablet, with no edge to drag and
no close cross. The fix for that was first written in Ninjo's DnD Shops & Trade,
because it was needed there when the trade moved over. But a window that is too
large is a problem of the table, and the table module is this one. Whoever did
not have Shops installed was left without it.

Now both modules carry it, and a fixed order decides who does the work: In-Person
Tools first, Shops when it runs alone. Deliberately a fixed list rather than
"whoever loads first": otherwise the same installation would behave differently
by chance, and a window would be moved by two of our modules one after the other.

Nothing is ever **enlarged** on another module's window, and no minimum size is
forced either: whoever built a window knows its content. We only make it smaller
when it runs past the screen, and move it inside. It can be switched off with
**"Also keep other windows on screen"** in the settings.

## 14.2611.72 - 2026-09-09

**The evening at the tablet.** Everything here comes from one session in which
the sheet view was really operated with fingers for the first time, and with
fingers came what never showed with a mouse.

- **The on-screen keyboard no longer covers the field.** It now pushes the whole
  page up, as Sheet Only does. Foundry does not shrink the page when the keyboard
  opens, and a sheet filling the whole screen has nothing left to scroll, which is
  why you used to type blind.
- **Windows can be dragged with a finger.** Foundry sets no `touch-action` on its
  title bars; the browser took the movement for a swipe and cancelled the drag
  after a few pixels.
- **The stage follows the player.** Whoever opens another character of their own
  gets it in full screen; the device remembers the choice. Before, it was stuck on
  the assigned character and reported missing permissions on every change after a
  switch.
- **Roll dialogs no longer become the stage.** "Hit Dice" opened full screen and
  without a close cross. The dialog carries the same actor as the sheet, and that
  is how we had recognised it.
- **The sheet view settings window opens again.** A cut-off string in the template
  had silently prevented it; the validator now catches this error by itself.

Plus, invisible but important: our rules no longer touch other modules' windows,
every window of ours fits on the screen, and fonts and colours come from one shared
file instead of six times from the module.

## 14.2611.71 - 2026-09-08

### Changed
- **The trade has moved to Ninjo's DnD Shops & Trade.** It and trading with a
  merchant are the same thing from two directions; two trade windows that looked
  and worked differently depending on the installed module helped nobody. The table
  there can do everything this one could, and keeps a running trade across a
  reload.
- **The way there stays here.** Both buttons are where they were, above the player
  list and in the sheet view bar, and now open the other module's table. If it is
  not enabled, the button says where the feature lives instead of doing nothing:
  this module has users who have never heard of the other one.
- **Of three switches, one remains**: whether this module offers the way at all.
  Whether the gamemaster trades too and whether trades are written down are
  settings of the other module.

### Removed
- `trade.js`, `trade-window.js`, `trade-mover.js`, `trade-log.js` and their two
  templates, plus 52 language keys only they used. The three helpers for "which
  character does this account play" were never the trade's business and are
  needed by the sheet view; they now live in `figuren.js`.

## 14.2611.69 - 2026-09-06

**Maintenance release.** Nothing changes on the dome, the bars or the settings;
the release repeats 14.2611.68, whose entry in the Foundry catalogue got stuck on
a server error at foundryvtt.com.

Plus two things outside the module: the class check in `tools/validate.mjs` now
only looks at names that are really written as a class. Element ids live in the
same namespace and showed up as a warning on every run, which hid the actual
purpose of the check. And the analysis records what will definitely not be built
for this table.


## 14.2611.68 - 2026-09-06

**The weather now colours the sky.** That was the real difference from
Calendaria's dome: not the drops, but the sky behind them. Ours always stayed
blue, and everything hung in front of it as if stuck on. Now it turns grey in the
rain, ochre in a sandstorm, almost black in a thunderstorm, deep green under the
aurora; with its own strength per weather, from 15 % for wind to 95 % for the
null front.

The colours are our own: a handful of moods, each with one base colour from which
top and bottom follow mechanically, darkened at the top and lightened towards the
horizon, because that is where the remaining light is. Keeping three values for
each of the 41 weathers would mean 123 numbers nobody can follow any more; this way
you change one.

**The gamemaster's own sky colours are taken over.** Whoever creates their own
weather in Calendaria or overrides the colours of a built-in one sees that in our
dome too; both ways live in world settings we can read.

## 14.2611.66 - 2026-09-06

**The finer moon phase in the tooltip.** Where Calendaria knows it, it now says
"Waxing Waning Moon" rather than only "Waning Moon", but only with one moon. With
several it stays with the short name; four moons times the long version would make
a line nobody reads any more.

## 14.2611.65 - 2026-09-06

**All the moons of a world, not only the first.** Faerûn has one, but a calendar
may carry as many as it likes, and whoever plays a world with two moons wants to
see both. They now stand one behind the other on the same track, each with its own
phase and colour; with several, each gets a little smaller so they do not overlap
on 160 pixels. One that has not risen yet stays below the horizon. The tooltip
names each one.

**Hiding is now respected.** Calendaria can hide moons from players. Our dome sits
on a player's tablet and ignored that until now; it would have given away what the
gamemaster had hidden. Without permission the sky now stays moonless.

`tools/test-sky.mjs` checks both with an invented world of two moons.

## 14.2611.64 - 2026-09-06

**On an Android tablet the dome stood still.** The reason was not in the module:
Android reports "reduced motion" in power-saving mode and in the accessibility
settings too, and our stylesheet dutifully obeyed. That is correct, but nobody at
the table suspects the cause lies in the operating system. The "Time & Weather"
page now has **Motion in the dome**: "As the device wants" (as before), "Always
move" or "Never move".

Plus a safeguard for weak devices: if the browser cannot do WebGL, Calendaria's
dome is not borrowed at all, since an empty area would stand there otherwise. Ours
comes instead.

## 14.2611.63 - 2026-09-06

**Sun times can be switched off.** The "Time & Weather" page now says whether
players may read off when the sun rises and sets by tapping the dome. Off means:
they see from the arc how far the day has gone, but no clock time. Sometimes "dusk
is coming" is a better answer than "04:41". The moon phase stays in any case; it
is in the sky.

## 14.2611.62 - 2026-09-06

**Every dome gets its own colour ids.** Gradients in SVG are addressed by a name,
and that name applies to the whole document. When two domes stood side by side,
both took the gradient of the first; in the test image every night dome was
therefore bright as day. Only one sits in the bar, but it was wrong all the same.

That finally made it possible to check what the table had asked for: **all 41
weathers by day and by night.** Both versions show their weather: rain falls in the
dark too, the aurora only comes into its own at night, and the night domes are dark
blue with twinkling stars instead of bright as day.

## 14.2611.61 - 2026-09-06

**Calendaria's dome did not appear at all, and then without weather.** Two errors
on top of each other, both fixed.

The first: our time bar rebuilds itself every minute and takes out every child in
the process, including the borrowed dome. For Calendaria it had not disappeared,
it was just no longer in view; so it built no new one. After the first change of
minute, it stayed with ours for the rest of the evening.

The second went deeper: Calendaria looks for its drawing surface **inside its own
window**. Whoever takes out only the dome lets that search run into nothing: sky
and sun were there, but not a drop ever fell, because the weather was never applied
again. Now the whole window moves into the bar, everything except the dome is
pushed out of view, and Calendaria keeps managing its surface as if nothing had
happened.

If the borrowing fails after all (a visible calendar window of another module, for
instance), our own dome stands there at once instead of a gap.

## 14.2611.60 - 2026-09-06

**The gamemaster chooses who draws the dome.** The "Time & Weather" page now
offers a choice: our own dome (a few dozen moving shapes, runs on any tablet) or
Calendaria's own, with all its particle effects. That one looks better and needs
the device's graphics unit; on a tablet whose game canvas we have just switched
off, that is a real difference. Without Calendaria the choice does not appear at
all.

Its dome is not rebuilt but borrowed: Calendaria builds it, and we hang exactly
that element into our bar. A visible dome of the other module is never touched; if
the gamemaster has its HUD open, ours stays.

**Our dome closer to the original.** Held side by side, our daytime sky was too
saturated, the sun too large and its glow so wide that it bleached half the sky;
the autumn leaves drifted in three thick leaves instead of a dozen small ones. All
four adjusted.

**At night something finally moves.** The stars twinkle, each at its own rhythm,
and the halo around the moon breathes. Before, the night picture stood still while
the sun moved by day.

## 14.2611.59 - 2026-09-06

**All 41 of Calendaria's weathers now have their own picture.** Until now there
were 21, and a sandstorm came out as a snow flurry. New: heat wave, ice storm,
tornado and hurricane, aurora, cherry blossom and autumn leaves, wildfire smoke,
dust devil, black sun, ley surge, ethereal haze, null front, permafrost wave,
grave wind, veilfall, arcane winds, acid rain (green), blood rain (red), meteor
shower, spore cloud, divine light and plague fog.

Calendaria's density, speed and colour settings are applied too: a blizzard drifts
denser and faster than snowfall, and whoever creates their own weather still gets
a picture through precipitation type and wind.

New: `tools/test-sky.mjs` checks the coverage and the direction of the crescent
moon, which was mirrored for two releases without anything noticing.

## 14.2611.58 - 2026-09-06

**"Your turn!"** In the sheet view it stands on the tablet while your own character
has the turn in combat (red, with a short buzz where the device can do it), and
"You're up next" one place before. Nothing else.

**Settings tidied up.** The control window is no longer in the settings list (Alt+T,
the status pill or the button on the table mode page); "Replace Sheet Only's actor
picker" only appears when Sheet Only is active; the two device switches are called
"This device: …"; the pages are in the order table mode, displays, sheet view, time
& weather, trading.

The README and the catalogue text now also describe the sheet view, time & weather
and trading.

## 14.2611.57 - 2026-09-06

**Weather in the dome.** Rain, drizzle, snow, sleet, hail, fog, clouds and
thunderstorms, following Calendaria's effect template, as moving strokes, flakes and
wisps in SVG. No canvas, no graphics engine; whoever has switched motion off gets the
weather standing still. Wind tilts rain and snow.

## 14.2611.56 - 2026-09-06

**The dome has dawn and dusk.** An hour before sunrise the sky begins to turn blue,
with a red glow on the horizon; the stars fade, so does the moon, and the sun rises
with its glow from behind the horizon. The same in reverse in the evening. Before,
the dome switched hard at sunrise; at 05:00 Calendaria's dome was still dark and ours
already day.

Also: sunrise and sunset now come from the world calendar (`sunrise()`/`sunset()`,
when Calendaria attaches them) instead of our own approximation, 04:41 instead of
04:34. And the dome has Calendaria's dimensions (160 × 80), its night blue, an inner
shadow and a border in the colour of the pill.

What deliberately does not come: rain, snow, fog and the other particles. In
Calendaria that is a PixiJS scene; on a tablet whose game canvas we switch off, a
second graphics engine for a dome would be the wrong price.

## 14.2611.55 - 2026-09-06

**In portrait the bars start 80 px higher.** At the very bottom of the inventory is
the coin row, and the menu bar lay exactly on it.

## 14.2611.54 - 2026-09-06

**The sheet's edit toggle is back.** Tidy's play/edit sits in the window header and
was hidden along with everything by the rule "all header buttons except ⋮ go".

## 14.2611.53 - 2026-09-06

**"Keep position" as a toggle switch.** The dark checkbox could not be recognised as
one on the dark field.

## 14.2611.52 - 2026-09-06

**No more ghost after the cross.** Whoever closed characters or notes with the
window's cross kept the frame as a ghost; through the menu bar never. Closing through
Foundry now takes the same route: invisible at once, then clean up.

**Pin the bars.** A switch in the size field: pinned bars can no longer be dragged.
Per device; the gamemaster's ↺ button lifts it too.

**Smaller starting size.** Both bars start at 90 % instead of 100 % (80 % below 1100
px, 70 % below 850 px).

## 14.2611.51 - 2026-09-06

**The size slider no longer flickers.** The slider field zoomed along with the menu
bar's factor and was repositioned at every step, so the slider slid away under the
finger. The field now only takes the screen step and is only repositioned on
release.

## 14.2611.50 - 2026-09-06

**Flicker while dragging, second attempt.** During the drag the bar carried a scale
and a `drop-shadow` filter; on a zoomed element the tablet re-rasterises every frame
with that. Now just a light border. Also, the context menu that Android opens after a
long press, and that cancels the touch exactly at the start of a drag, is suppressed.

## 14.2611.49 - 2026-09-06

**No more fluttering when dragging the menu bar.** On the tablet `resize` fires when
the browser bar folds in or out during the drag, and both bars were rearranged on
that, mid-drag. Now: nothing happens while dragging, and nothing without a change
between portrait and landscape either.

The button bar is now called the **menu bar** everywhere.

## 14.2611.48 - 2026-09-06

**The size field lists the time bar first**, then the button bar, the way both stand
on the screen.

**No fluttering when dragging.** Each bar now hangs in an unzoomed anchor; only that
is moved, and the zoom acts inside. Before, the zoomed bar itself was positioned, and
its pixels were not those of the screen; Chrome and Safari even interpret that
differently.

**Tooltips by tapping.** A finger on the weather or the dome shows the box for six
seconds; mouse hover could not be relied on at the tablet.

## 14.2611.47 - 2026-09-06

**Size per bar, and no more fluttering.** The button bar and the time bar now each
have their own slider; with a shared one they looked uneven. And a dragged position
stays put while the slider moves: before, its coordinates were in zoomed pixels and
wandered with every step.

Fixed: weather and moon no longer showed a tooltip in the sheet view (`#tooltip` had
been hidden along with the rest).

## 14.2611.46 - 2026-09-06

**The moon now shows the right phase.** The calculation was right (Calendaria and we
both said "Waning Moon"), the drawing was not: the shadow edge curved the wrong way,
so 82 % lit on the left became a crescent on the right. Calendaria's own answer is now
the source when it runs, so players and gamemaster are guaranteed to see the same.
Without Calendaria we keep calculating ourselves, now with `referencePhase` as an index
and `cycleDayAdjust`.

**Positions and size per orientation.** Portrait and landscape remember separately
where the bars were dragged and how large they are; on rotation the device fetches the
values of the new orientation. Everything lives in device storage and survives a
reload and a new login.

**Reset by the gamemaster.** On the "Sheet view (beta)" page every account has a ↺
button: position, size and font of the bars go back to the start values on this
account, on all its devices, at once if it is logged in, otherwise on the next load.

## 14.2611.45 - 2026-09-06

**Hold time setting removed again.** It stood on the gamemaster's page for one day and
was a developer's knob there: whoever sets up the view does not want to decide about
milliseconds. Fixed at 400 ms, as it worked at the table.

## 14.2611.44 - 2026-09-06

**Bar size adjustable by the player.** A slider in the second button group (60 to 140
%), remembered per device. The automatic steps by screen width (85 % below 1100 px, 72
% below 850 px) are now only the starting point: in portrait the full size was just
right, in landscape too large, and whoever holds the tablet decides that better.

Fixed: on the first drag after loading, the button bar jumped sideways by half its
width (the grip was measured after the change of transform).

## 14.2611.42 - 2026-09-06

**Portrait: bars at the bottom.** In portrait the attributes sit in the sheet header
exactly where the bars float above the banner in landscape; measured, the button bar lay
on STR, DEX and CON. In portrait both now stand at the bottom centre, the time bar above
the button bar; on rotation they rearrange. Dragged positions still win.

**The sheet comes back when it is closed.** Escape closes the topmost window in
Foundry, which in this view is the sheet, and the screen was black. Now it reopens at
once; Escape in the volume field stays with the field.

**Settings page slimmed down.** Three explanation boxes are gone, the texts sit behind
(i); the account list is the first thing you see.

## 14.2611.41 - 2026-09-06

**Volume in the bar.** A button in the second group opens three sliders (music,
ambience, interface) below the bar. They are Foundry's device settings; the tablet next
to the television can be silent without the table noticing.

Decided: side windows stay **above** the sheet (no narrowing), Sheet Only stays
installed for now, no account gets both.

## 14.2611.40 - 2026-09-05

**The sheet view gets its own page, and chooses accounts individually.** The beta
switch alone hit every player with a character, including the one at the laptop who
needs their scene list. Now: a master switch plus a list of player accounts with
checkboxes, as for table mode. Gamemasters are not in the list.

Also on the same page: **switch off the game canvas** (the same machinery as in table
mode; the tablet asks once for a reload), **open the chat when rolling** (only for your
own messages) and the **hold time** for moving the bars.

**Buttons of other modules.** The bar accepts buttons through
`game.modules.get("ninjos-inperson-tools").api.sheetView.registerButton()`; whoever is
ready before us gets the hook `ninjosInPersonTools.ready`. No element with a foreign id
that someone would have to search for in the DOM. FANG and NDRS register through it from
their next releases.

New in the second button group: **reset font** and **settings** (Foundry's settings
window: volume, language, module settings, which a player could not reach otherwise).

**The moon is drawn again.** The calendar module's phase image was neither round nor
sharp at 28 pixels. Now a vector disc with the real phase from the calendar, a light
gradient and a halo.

## 14.2611.39 - 2026-09-05

**The dome stands behind the time bar**, its base disappearing under the pill, as in
the original. Laid on top it looked like a sticker. A child cannot go behind its
parent's background; so the pill's background now lies on a pseudo-element above the
dome, with the text above that. Plus two positioning errors that only showed on the
screen: the dome stood 66 pixels above the top edge (wrong reference), and the pill had
slipped to the right (an inherited `left: 50%` as an offset).

New as well: `ANALYSE-blattansicht-vs-sheet-only.md`, what Sheet Only can do, where we
stand, what is missing, and the open question of whether a side window makes the sheet
narrower or covers it.

## 14.2611.38 - 2026-09-05

**The dome sits centred on the time bar, the text below it**, as in the original.
Before, it stood on the left and the text next to it; that was the wrong arrangement,
not only the wrong size. Also larger (152 × 78), and the sky in dark night blue instead
of turquoise.

## 14.2611.37 - 2026-09-05

**The bars start at the top centre**, above the sheet's banner: the time bar with the
dome on top, the button bar directly below, the way the table had moved them. On start
the button bar places itself under the time bar, because with the dome it is much taller
than without. Moved positions still win.

## 14.2611.36 - 2026-09-05

**The sheet's header buttons are gone in the sheet view**, except the ⋮ with the sheet
settings. Copy image path, pop out the window, portrait/token, copy UUID: desk tools,
and on a tablet without a clipboard and a second window only targets for mistakes.

## 14.2611.35 - 2026-09-05

**The sheet fills the screen edge to edge, as with Sheet Only.** Two detours are gone
again. At the top I had removed the window header entirely and then left ten pixels of
air so the portrait would not stick to the edge; the blue page background showed in the
gap. Sheet Only keeps the header and only hides the close button; the header gives the
sheet its dark edge at the top by itself. Exactly that now. At the bottom lay a red
plinth: a `padding-bottom` on the window content that exposed its background. Gone: the
bars simply lie above the sheet, as their models do.

**No gold on the bars.** This is a HUD over the sheet, not the D&D window design; the
gold border was far too loud there. Both bars now carry the same quiet border the time
bar had from the start, and the dome's rim is dimmed by half.

## 14.2611.34 - 2026-09-05

**The button bar is opaque, dark and matches the time bar.** Before, it was a
semi-transparent light pill with a blur, pretty on a plain ground, but here it sat over
the edge between the sheet's red plinth and the dark blue page background, and both
shimmered through: red at the top, blue at the bottom, mush in between. Plus square
buttons in a round shape that clipped them at the ends.

Now opaque, so the ground does not matter; dark with a gold border like the time bar
next to it, so the two read as a pair; and rounded squares in a bar that is only a
little rounder, so nothing is clipped. The time bar got the same gold border.

## 14.2611.33 - 2026-09-05

**The sky dome now sits on the time bar, not in it.** Three times I had put the arc into
the bar and blown it up to 86 pixels that way. In the original the bar is thin and the
dome stands on top like a watch glass. That is exactly how it is now: a pill 34 pixels
flat, on the left a half dome with a gold rim that rises above it, the moon clearly
recognisable inside.

**The sheet has air at the top.** With `inset: 0` the portrait sat on the first pixel
and the header looked cut off. A ten-pixel margin, as Sheet Only leaves for the same
reason.

**What Sheet Only changes on the sheet for the finger applies here too:** thin scroll
bars, no resize handle, tighter tab margins in Tidy5e, and room at the bottom for the
two bars so the last row does not disappear under them.

**The flash on closing is gone, measured, not assumed.** `close()` is asynchronous; until
it finished, the frame stood there for one or two frames. Hiding now happens
synchronously in the click itself, closing afterwards. Checked every 16 milliseconds for
700 milliseconds, three surfaces: zero samples in which a frame could still be seen.
Before, the very first sample showed it. A sidebar window is only visible in the sheet
view at all if we opened it; everything else, ghosts included, stays invisible. The actors
button in Sheet Only mode also hides the frame before closing it.

## 14.2611.32 - 2026-09-05

**Everything flew along when dragging.** Whoever grabbed the button bar moved the time
bar too. The reason was a beginner's mistake of mine: the function that makes a bar
draggable runs **twice**, once per bar, but the grip point and the grabbed element sat
next to it as shared variables. So one read what the other had just set, and both moved.

Each bar now has its own state. Only the one piece of information that belongs shared
stays shared: whether a drag just happened, so the click after it does not also trigger
a button.

## 14.2611.31 - 2026-09-05

**The phantom page is gone, and it was three errors, not one.** Found because this time
every path was tried instead of only the one that already worked.

*A race.* Opening and closing are both asynchronous and take different lengths of time;
whoever taps twice in quick succession starts the second before the first has finished.
Measured: twelve rounds of quick open and close left **two windows open**. The toggles now
run one after the other.

*A frame without an application.* Foundry reported `rendered: false` for the notes
directory and still left its element in the document. My check looked for *empty* frames;
this one had content and slipped through. Now we ask what the application says about
itself, which is the more reliable answer.

*And one of our own making.* We build the actor directory ourselves, because Monk's Little
Details intercepts `renderPopout`; it therefore does **not** hang on `app.popout`, and that
is exactly where I tried to close it. It stayed open and cheerfully reported `rendered:
true`. We now remember what we opened.

Checked: open and closed singly, twelve rounds at a 450-millisecond rhythm, fifteen at 60,
twenty-five at 30. Zero open windows afterwards every time.

## 14.2611.30 - 2026-09-05

Three errors in the sheet view that I should have seen instead of reading numbers from the
DOM.

**The font buttons did nothing.** They set a font size, and Tidy5e sets its own
dimensions; our variable reached none of them. Measured: a button stayed at 140 × 28 pixels
however often you pressed. Now through `zoom`, which makes it 196 × 39. And because `zoom`
also scales the box (at a factor of 1.4, `100vw` became three thousand pixels on a
two-thousand-pixel screen), the sheet's size is calculated against the zoom. It now fills
exactly the window at every factor.

**The two bars lay on top of each other.** A saved position from earlier releases put the
buttons right on the clock. A remembered position is now discarded if it covers the other
bar.

**And they cut off the top of the sheet.** That is where every character sheet has its
header with name, image and values. Both are moved to the bottom edge: the buttons on the
left, the time on the right. It is the emptiest part of every sheet, and on a tablet the
one the thumb reaches.

## 14.2611.29 - 2026-09-05

**Icons instead of words** in the sheet view bar. Words make it wide and are a different
length in every language; the icon stays the same size, and the name is in the tooltip and
the accessibility label. Plus a round, translucent frame and a set-off toggle in module red.

**The bar no longer sticks to the time bar.** It stood at the top centre with the time
directly below, two things that looked like one block. Now top left and top right, with
space between.

**The ghost window is gone.** Whoever opened and closed an area left an empty frame
behind, the same problem the actor panel had once before. Its solution was buried there; it
now lives in `shells.js`, and both use it. Foundry clears the shell at no fixed moment, so
we look several times.

**And an error when moving:** whoever sets `left` without clearing `right` has set both,
and the element is stretched instead of moved. Measured: 107 pixels hung over the right
edge although the code clamps.

## 14.2611.28 - 2026-09-05

**Time bar and button bar are separate.** With the sky arc in it, the button bar became 833
pixels wide and 96 tall, anything but small. They are also two different things: one is
operated, the other looked at. Now 277 × 54 for the buttons, the time next to them, both
movable on their own with their own remembered position.

## 14.2611.27 - 2026-09-05

**The sheet view bar is now small, translucent and movable.** My first version put nine
buttons side by side and stuck to the top centre, wrong on all three counts.

*Small, because it switches:* it shows one group at a time, and a ☰ switches. In front is
what you need all the time (who, chat, note, trade), behind it what you do once an evening
(font size, full screen, log out). Nothing is dropped, it just does not all stand there at
once.

*Movable by long press:* on a touchscreen every touch is a tap first. If the bar dragged at
once, no button could be hit any more. So hold briefly, then it follows, and whoever dragged
triggers no button on release. The position is remembered per device, but only restored if
it actually lies on this screen: whoever pushes the bar outwards on the large monitor should
find it again on the tablet.

*Translucent*, because it lies on the sheet and should not cover what is underneath.

## 14.2611.26 - 2026-09-05

**The sky arc now uses Calendaria's own moon images.** At first I drew the crescent myself
so as not to depend on someone else's files. At the table that looked worse than the
original, and the original *is* the image whose path is in the phase data anyway. So it is
used when it is there, and drawn when not.

Also, the arc is a **dome** instead of a flat strip and is shown one to one: 190 × 76 pixels.
Twice it came out too small, both times from the same thinking error: I had thought of it as
part of the bar and squeezed it to the bar's height. But it is an image and sets its own
size.

## 14.2611.25 - 2026-09-05

**First version of our own sheet view, as a beta, off by default.** It gives players the
whole screen for their character sheet and replaces Foundry's interface with a floating bar:
who, chat, note, trade, font smaller and larger, full screen, log out, plus the time bar.
Design and reasoning in `KONZEPT-blattansicht.md`.

**Cover rather than rebuild.** Foundry's interface stays completely there and working; it is
just not shown. Modules that rely on parts of it keep running, and the way back is one class
on the `body`.

**The notifications stay visible**, the one point where we deliberately differ. Whoever hides
`#notifications` too takes away any way of telling the player anything; that is exactly why
Sheet Only mode needed a strip of its own.

Gamemasters are never affected: they need the interface that disappears here.

## 14.2611.24 - 2026-09-05

**A sun and moon arc in the time bar.** It shows where the sun or moon stands right now, with
the moon's phase; one glance says "the sun has been gone for an hour", which you would
otherwise have to work out. Switched on under "Time & Weather"; off by default.

**Calculated, not copied.** Everything comes from the world calendar every client has:
`daylight` supplies the longest and shortest day with the solstices, and from that the day
length for today; `moons` supplies cycle length, reference date and the eight phases. Checked
against this world's values: day 171 gives 16 hours, day 354 exactly 8. We draw the moon
crescents ourselves instead of loading another module's image files; otherwise the bar would
depend on that module being there. Without calendar data the arc falls back to 06:00/18:00 and
leaves the moon out instead of disappearing.

The calculation test found an error straight away: 19.99993 hours became "19:60", because the
minutes, rounded on their own, came to 60. Now we round to minutes first and divide afterwards.

## 14.2611.23 - 2026-09-05

**The actors button no longer opened the directory.** The cause is not ours, but it lands on
our button: Monk's Little Details wraps `ActorDirectory.prototype.renderPopout` and, with the
"open-actor" option on, opens the user's own character sheet instead, without calling the
original and without returning anything (its line 293). For a player with an assigned
character in Sheet Only mode that sheet is the only thing on the screen anyway. So visibly
nothing happened.

For its sidebar tab that is a defensible idea: a click on "Actors" plausibly means "my
character" there. Not for our button: it says Actors and has to show the directory. If the
polite route comes back empty, we now build the window ourselves, exactly as Foundry's own
code does, and leave that module's setting alone.

## 14.2611.22 - 2026-09-05

**Sheet Only's journal button looked as if it did nothing.** It does something: it opens
Foundry's notes directory as a narrow column on the right edge. Only it was **201 pixels
tall**, a small box in the top right corner that you simply overlook on a tablet.

The reason is ours: in this mode we pin the actor directory to the right edge ourselves,
because Foundry calculates the position of an expanded sidebar from the position of its tab,
and in Sheet Only that sits in the hidden `#interface`. We had solved this for our own
directory, not for the neighbours'. That was the wrong half of a repair.

Now the same anchoring applies to **every** expanded sidebar window while Sheet Only runs:
right edge, full height. Outside this mode nothing changes; Foundry's own placement is right
there.

## 14.2611.21 - 2026-09-05

**Trading now has its own page**, like table mode, displays and the time bar. Its three
switches were the only ones still flat in the settings list and made it look like the table
mode settings with strangers in them.

The page also has the way into the **trade ledger**. The journal is in the sidebar, but
whoever looks up "where did the sword go" looks in these settings and not in a list of
journals, so the door is where the question is asked. If Item Piles is active, the page points
out that its trade button is better switched off.

## 14.2611.20 - 2026-09-05

**The bar is a gamemaster matter, not a device matter.** The four switches were meant per
device, the idea being that everyone decides about their own screen. The table decided
otherwise, and rightly: what the bar carries is a display question for the whole group, like
the scene everyone looks at. All five now apply to the world, only the gamemaster opens the
page, and a player does not have to be led through a settings page mid-game. The duplicate
weather switch is gone again; the old one keeps the job it always had.

**The wind now shows with Calendaria's own word and speed band**: "Wind from S · Strong, 41-60
km/h". The *single* number from its HUD ("58 km/h") is deliberately not taken over, and the
reason is in its source code: `getWindSpeedKph` rolls it anew between the limits of the level on
every call and stores it nowhere. It changes when you move the pointer away and back, and two
people looking at the same wind get two different values. The band is the same information,
only without the dice, and everyone sees the same. If Calendaria is set to miles, the bar
converts along.

## 14.2611.19 - 2026-09-05

**Every part of the bar can be shown or hidden individually.** Date, time, weather, season, on
a page of their own, "Time & Weather", not as five more lines in the settings list. Two groups,
because there are two kinds of switch: four belong to the device in your hand, one to the whole
group. Side by side as identical checkboxes, nothing would have given away that one of them
changes the evening for everyone. Only the gamemaster sees the world row, and it is not touched
on save if it was not in the form at all; otherwise any player could quietly switch the weather
off for the table.

**The chips now show what the calendar module really knows.** The bar has room for one word;
the tooltip carries the long description, the temperature and the wind: "Windy / Strong winds /
11 °C / Wind from S · Force 3". The wind direction is converted from degrees into a compass
point, which is stable arithmetic. The wind strength stays a level and is not converted into
km/h: that would mean copying a table that belongs to another module.

**And the grabbing hand is gone.** The bar had `pointer-events: none`, which sounded right,
since it is a label. Only that passes the pointer on to whatever lies beneath, which is Sheet
Only's draggable button bar: a grabbing hand that could grab nothing, and tooltips that could
never trigger.

## 14.2611.18 - 2026-09-05

**The bar also runs without Calendaria**, checked, not assumed. Foundry's own "Simplified
Gregorian" calendar writes its seasons exclusively through `monthStart`/`monthEnd`, 1-based,
and its winter runs from month 12 to month 2, across the turn of the year. Nine cases against
both calendars now run as `tools/test-clock-seasons.mjs`, both turns of the year included.
Without a calendar module only the weather is missing; date, time and season are still there.
The setting text claimed the opposite and has been corrected.

**The wrong date no longer stands for ten seconds on load.** The check runs every second in the
first quarter minute and slowly after that. It is a string comparison; building still only
happens on a real change of minute.

## 14.2611.17 - 2026-09-05

**The time bar was there, just not visible.** Sheet Only puts only the actor list and its own
button bar into its container; the character sheet is an ordinary Foundry application on the
`body` and is painted over it. A bar that stays in that container's flex flow lands where flex
puts it: measured on a real client, left 1001, top 538 of a 2333×1104 window. In the middle of
the screen and behind the sheet. Present, 34 pixels tall, right in every respect, except that
nobody could see it.

It now stands at the top centre, on the same layer as Sheet Only's own buttons, and takes no
taps: it is a label, not a control, and must not take anything away from the sheet below.

## 14.2611.16 - 2026-09-05

**The time bar showed a wrong date all evening.** On the first real Sheet Only client it said
"31 July, -9" while the world stood at "1 Eleasis, 1492". Calendaria installs its Harptos
calendar *after* our `ready` has run, so the first drawing still used Foundry's default
Gregorian calendar. It never corrected itself: the bar redraws on `updateWorldTime`, and the
game was paused.

A date that is wrong and does not move is worse than none: nobody doubts a display that looks
like a clock. Now the bar looks again every ten seconds. That is only a comparison; building
still only happens when the displayed minute has really changed.

## 14.2611.15 - 2026-09-04

**Notifications never reached the players this module is built for.** Sheet Only does not hide
the interface partially but entirely, Foundry's `#notifications` included (its index.js:902).
Every "Roxy declined", every "no gamemaster logged in", every "trade completed" was created,
logged and seen by nobody.

**The trade now ends with a picture instead of a notification.** The window no longer
disappears without a word but becomes the answer: the other person's portrait, one sentence,
one button. Whoever declined reads what they did; the other side reads what happened to them.
"Roxy declined" is the wrong sentence for Roxy. After twelve seconds it closes by itself,
except when something went wrong: that is the one message that must have been read.

**Warnings before trading** (no character assigned, no gamemaster there, already in a trade)
now appear in Sheet Only mode as a strip in its own container, the only part of the page still
visible there. Outside it, Foundry's notifications remain.

## 14.2611.14 - 2026-09-04

**The trade window could not be brought back.** Whoever tapped beside it in Sheet
Only mode pushed it into the background, and there is no bar there, no window list,
no visible interface at all to bring it forward again. A dead end, not a cosmetic
flaw. Sheet Only knows the problem itself and solves it with a fixed `z-index` (its
style.css 65 and 173); its container sets children to 1000 and the actor list to
1001, and exactly that lay above us. The trade window now stands at 9000, above all
of that but below the dice resolver, which blocks a roll and has to win. In addition,
the trade button brings a running window forward again.

**On the tablet it hung out at the bottom.** 640 pixels tall with the browser bar
above it, and at the very bottom the two buttons that end the trade. They were simply
not there. The size is now a wish that is scaled down to the actual screen, also when
the device is rotated.

Below 620 pixels of width the two sides of the table stand one above the other rather
than side by side.

## 14.2611.13 - 2026-09-04

**The item icons are really there now.** The last attempt, using the SVG as a CSS
mask, did not hold. dnd5e solves the same problem for itself by fetching the file and
inserting the SVG into the page, where `--icon-fill` takes effect (`dnd5e.mjs:64044`,
its `<dnd5e-icon>`). We now take exactly that route too: fetched once per path, scripts
thrown out, drawn in our red. It does not need dnd5e; it works for any system.

**Pictures of those involved.** Which column belonged to whom was a grey row with a
name in it. Now the character's portrait stands above it, in the partner list, and
large on the request, recognisable across the table without reading. Name and account
stand one above the other so two similar names stay distinguishable.

**Agreement shows on the whole column**, not as a word in the header: a gold border, a
warm ground. It is the one piece of information on this screen that decides whether the
next tap moves someone else's property.

## 14.2611.12 - 2026-09-04

Three errors, two of which could have moved things without anyone agreeing.

**A gamemaster could not answer anything.** All messages go through the gamemaster's
client, but a socket never delivers back to its own sender. If the gamemaster was one of
the two trading, they were talking into the void: their "decline" was never processed,
no window closed, nobody got a message. The same applied to agreeing, changing and
cancelling.

**Two logged-in gamemasters would have carried out every trade twice.** Every item
created twice, every coin moved twice. This world has two gamemaster accounts, so both
being present would have been enough. Now exactly one is responsible:
`game.users.activeGM`, which every client determines the same way without consultation.

**Money in containers was not shown on the table.** It travelled with the container,
which is right, but only the items inside were displayed. So money changed hands that
neither side had ever seen, which is exactly what this window is meant to prevent. It
now stands in the row below the container, nested containers included.

Also: a refusal now names whoever declined.

The state machine is now tested without a browser: three Foundry clients are simulated,
including the rule that a socket does not deliver back to the sender. That very rule was
the error above, and a test that does not reproduce it would never have found it.

## 14.2611.11 - 2026-09-04

Four things about the trade, after it ran at the table for the first time.

**The item icons were invisible, not absent.** dnd5e draws them as SVG with `fill:
var(--icon-fill, #fff)`. An `<img>` is a document of its own, our variables do not reach
it, so the fallback wins: white on parchment. SVGs are now used as a mask instead of
being loaded as an image, and the colour comes from us. That works for any system and
colours the icons in our red on the side, instead of whatever the system happens to
bring.

**Quantities for items as for money.** Before, coins had 0/-10/-/+/+10/all and items only
minus and plus. Handing over eight of twenty arrows is the same act as eight of twenty
gold coins; now they are the same buttons. For things that exist only once, a tap
remains.

**The window frame is now D&D too.** Until now only the inside of our windows was styled,
and the frame around it stayed Foundry's dark grey: a sheet of parchment in a black box.
The header is dark red with a gold line, gold around the whole window, as FANG does it.
It applies to **all** of the module's windows, not only the trade's; two looks in one
module was exactly the problem.

**Drag and drop** comes later. On the tablet it cannot be the main way anyway (that `drop`
does not fire there was the reason for the whole feature), but at the computer it would be
convenient.

## 14.2611.10 - 2026-09-04

**Players can now trade with each other**, with a finger, in Sheet Only mode, without
another module. Two people put items and money on a table, and only when both agree is
anything moved.

The reason is that a solution for this already exists that does not work at a real table.
Item Piles drags items with the mouse from one list to the other, and **the HTML5 `drop`
event does not fire on a touchscreen at all.** On the tablet this module exists for, that
trade cannot be used, however it is configured.

So everything here is a tap. Rows are 44 pixels tall, quantities have a minus and a plus,
and nothing needs a second hand.

**The table is the window, and picking lies over it.** A character with sixty items would
otherwise leave both sides staring at a list in which nobody can see what is actually being
agreed. So the table only shows what is on it; picking happens in a layer that covers it and
goes away again. While picking, nothing goes over the wire: the partner sees the change
once, at the end, and not with every tap.

**The gamemaster holds the truth.** Every change goes to their client, which keeps the one
real copy of the trade and sends it back to both. That sounds like a detour and buys three
things at once: the two offers cannot drift apart, because there is only one; nobody can
claim the other agreed to something else; and the rule "no gamemaster, no trade" (which
holds anyway, since only the gamemaster may create and delete items on another's character)
is no longer a special case but simply how it works.

**Every change resets both agreements.** Without that, one side could agree, wait for the
other and take something off the table at the last moment.

For the moving itself three rules apply, and they are why the whole thing got a chapter of
its own in the module: **write it down first, then touch it**. The entry in the "trade
ledger" journal is made while both inventories are still untouched, and so always says what
was *meant*, even if the moving falls over halfway. **Create first, then delete**: if it
breaks in between, the item exists twice rather than not at all. **Touch nothing that was not
on the table**: in particular nothing is sorted into the recipient's existing stacks; a stack
that has nothing to do with the trade is not changed.

**Containers travel whole.** A pouch takes its contents along, including nested containers
inside it and the money in the pouch. What is inside stands on the table as a row below the
pouch; "pouch" alone does not say what is handed over.

Offers can only be made **to fellow players who are logged in right now.** An offer to
someone who is not there cannot be answered.

Three settings: whether trading is allowed, whether the gamemaster appears as a partner (off),
and whether the trade ledger is kept (on).

*Whoever also uses Item Piles should switch off its `showTradeButton`, otherwise two trade
buttons stand side by side.*

## 14.2611.9 - 2026-09-01

**In Sheet Only mode the date and time now stand above the character sheet**, and on
request the weather and season too. The reason is a gap you only notice at the table: Sheet
Only does not hide the interface partially but entirely. That also removes a calendar
module's clock, and no setting brings it back, because nothing is left for it to appear in.
Right at the real table, where the people sit who ask for the time.

The values are **read, not borrowed.** `game.time` reaches every client, with or without a
game canvas; the weather sits in a world setting of Calendaria. Its HUD stays untouched:
re-hanging it would mean fighting its redraw at every time step, and it gets a new release
every one to three weeks.

That has a second benefit I had not expected: **the words are ours.** Calendaria's Harptos
calendar names its weekdays "Onesday" to "Tenday" as fixed strings, with no translation key
behind them, so no language file could reach them. The bar formats by itself and shows German.

It only redraws on a change of the **displayed minute**. If the clock runs in real time with a
multiplier (for me two game seconds per real second), `updateWorldTime` fires every second.
Sixty rebuilds for one visible change, and on the tablets that have the least to spare.

**Each device decides for itself** whether the bar appears; the gamemaster decides whether
weather and season come along. That is also what the toolbox concept says: what a player ever
touches belongs in the simple list, not in a window only the gamemaster can open.

Look and dimensions are taken from a running Calendaria bar: text `rgb(224 224 224)`, Signika,
the clock in monospace so the minutes do not shift the strip sideways. The rules are our own
all the same: Calendaria's stylesheet is 253 KB hanging on ATLAS colour variables that do not
even sit on `:root`. Where those variables exist the bar follows them; where not, our own
values apply.

The manifest and README now say so too: `sheet-only` and `calendaria` are listed as
recommended modules with a reason, and both language versions of the README have a section on
it.

## 14.2611.8 - 2026-09-01

**Sheet Only's actor picker can now be replaced by a side panel**, a feature that until now
lived in FANG. It was in the wrong place there: it rearranges another module's interface so
that playing at the table is more comfortable. That is this module's job, not that of a tool
for webs of relationships.

When switched on it hides Sheet Only's picker button and puts one in its place that opens
Foundry's actor directory on the right edge; the character sheet gives up 300 pixels for it
and takes them back afterwards. **Off by default**: a module that rearranges another's
interface without being asked is a bad guest.

The defence against Foundry's empty window shells moved along unchanged. It is the reason the
code looks so suspicious: after closing, v13 leaves the frame without content behind. Then the
CSS condition keeps the sheet narrow next to nothing, and the button refuses to open again. That
is why we clean up several times: as a microtask, after 0, 50 and 250 milliseconds, and over
five frames, because Foundry removes the shell at no fixed moment.

New is `sheet-only.js`: everything this module knows about Sheet Only's structure in one place.
Sheet Only is registered for Foundry 13.351 while we run on 14; if something moves there, one
selector will be wrong in future instead of many.

## 14.2611.6 - 2026-08-29

**The mark now glides instead of jumping**, and my reason against it was the wrong way round. I
had written that gliding would "light every pixel along the way". That is true and is exactly
the argument *for* it: burn-in comes from sustained load on the same pixel. Spreading a mark over
a path is gentler than setting it on one spot for half a minute. It is calmer to look at, too.

Twenty-five seconds per leg, easing in and out. The first placement stays a jump; otherwise the
mark would drive in from the corner every time the blanking lifts. In the preview the paths are
shorter, since otherwise you would see no movement in eight seconds.

**The chosen image is no longer darkened.** I had set it to 45 %, citing burn-in protection.
That was overcautious: the mark is small, moves constantly, and everything around it is black.
Whoever chooses an image wants to see their image.

## 14.2611.5 - 2026-08-29

**Companion scenes are now an editor, not a list.** Until now you could only view and dissolve
them there; a link was created exclusively in the scene configuration of the battlemap
concerned. That is half the way: whoever has an overview of all pairs wants to add one from
there too.

Below the list there are now two scene fields and a button. Both accept a scene dragged from the
sidebar or open the search list, the same field as in the scene configuration.

Creating and dissolving happen at once, not on save: a link is a property of the battlemap, not
a value of this form. Holding it back until save would mean that cancelling undoes one half and
not the other.

**"Preview blanking" showed the dot instead of the chosen image.** The button read the *saved*
setting, and that is still empty exactly when you need it: you have just chosen a file and want
to see it before saving. Whoever did that saw the dot and had to assume their choice had not
arrived.

The preview now takes the path as it stands in the form.

From the test as well: the text colour in the scene field is `inherit` rather than our own. The
field appears in two places with opposite grounds (Foundry's dark scene window and our light
pages), and `inherit` is right in both. Before, it was only right by chance: `--tm-text` is not
defined outside our windows, so the rule reached into nothing and inherited the same thing.

## 14.2611.3 - 2026-08-29

Two errors, found in operation.

**The search list was barely readable.** I had given the rows a ground and alignment but no text
colour, so they inherited Foundry's light theme colour on our parchment ground. Measured: 0.16
difference in lightness. The same error as with "Companion scenes" in 14.2610.5, this time in four
places at once. It is now a rule in `AGENTS.md`: whoever sets a font or a ground also sets the
colour.

**Missing thumbnails break the display.** A scene carries a path to a thumbnail whose file no
longer exists; "53. Pirate Ship" points at one the server answers with 404. The document knows
nothing of it, so the check has to happen where it shows: at the image element. If loading fails,
the fallback image now takes its place.

## 14.2611.2 - 2026-08-29

**The companion scene is no longer chosen from a list of 125 entries.** A select box is the wrong
form for it in two ways: finding a name in it means searching a list sorted differently from
memory, and once chosen, a name stands there and nothing else. No picture of the scene, and "53.
Pirate Ship" cannot be told apart from "53. Pirate Ship (Night)".

Instead, a field with three ways in, because people arrive differently:

| | |
|---|---|
| **Drag** | a scene from the sidebar onto the field, the fastest way when it lies in front of you anyway |
| **Choose** | opens a list you can type into, for the other 120 |
| **Clear** | takes it out again |

The chosen scene stands there with **its own thumbnail**. That is exactly what a select box cannot
do, and it is why a wrong choice only showed when the battlemap was activated and the second screen
showed the wrong room.

The field exists as a piece of its own (`scene-field.js`), because the same 125-entry list appears
twice more on the displays page, for the idle image and the default companion scene. Those follow
next.

On the side: a scene can no longer be set as its own companion scene. The select box had excluded
it, a drag would have allowed it.

## 14.2611.1 - 2026-08-29

**One window per tool.** The module is a toolbox: block downloads at the table, control two
screens, rotate maps. The three have nothing to do with each other except the occasion. In a flat
list, the settings of whichever tool has the most looked like "the settings of the module", and
that is exactly what had happened: **all nine visible entries belonged to table mode.**

New under *Module settings*:

```
For this client            [automatic ▾]   ← per device, players see it
Show status indicator      [✓]             ← per device
Open controls              [Control window]
Table mode                 [Set up…]
Scene displays             [Set up…]
```

Five lines, and five they stay when tools are added. A new tool is one line, not fifteen.

Sorting revealed a second axis that is easy to overlook: **who sets something.** Three settings
belong to the individual device, and they are the only ones a player ever touches. If they moved
into a window only the gamemaster may open, they would be gone for players, so they stay in the
list.

In the "Table mode" window, "Keep loading token images" now only appears when "Everything heavy" is
blocked. With the default only the background map is blocked anyway; then the setting has nothing
to do, and asking the question invites people to assume it has an effect.

**No window for scene rotation**, although the concept first planned one. It has zero settings:
rotation is set per scene, and the Lock View adjustment runs by itself. A window that only says
whether Lock View was detected is a window without content.

**One name instead of two.** The concept said "map block" for what the module calls "table mode" in
21 places. Aligned.

## 14.2610.8 - 2026-08-29

**Choosing an image threw away half the form.** The tick on "Use screensaver" disappeared, and
saving then wrote the cleared state back.

The cause was one line in the file picker: after the choice it called `render()` to show the
preview, and a render rebuilds the form **from the saved values**. Everything set and not yet saved
fell back to the old state. The chosen image too, by the way; it just did not look like it, because
the field had been written to shortly before.

Now **nothing** is rendered any more while editing. Preview and delete button stay in the form
permanently and are only shown and hidden, and the same applied to dissolving a companion scene,
which would also have discarded your entries. A path typed in by hand now also appears in the
preview.

## 14.2610.7 - 2026-08-29

**Reverted: three of the four settings from 14.2610.6 are back.** Two had been criticised, and I had
removed four. "Hide the loading bar" was never mentioned, and the status indicator had a question
next to it, and a question is not an order. Back are "Keep loading token images", "Hide the loading
bar for players" and "Show status indicator". Only "Keep the token menu upright" stays out. "Block
audio" was never affected.

**The screensaver is restructured, as a sequence of questions instead of a form.** Before, all times
stood side by side, and scene switching and blanking ran as two stages *at the same time*. That was
the wrong idea: they are alternatives.

```
Use a screensaver?                  ← without yes the rest stays hidden
  └ after how many minutes of quiet
  └ in which way?
      ├ Black blanking over the running scene   (default)
      │   └ how long it stays · image on it · [Preview blanking]
      └ Switch to other scenes
          └ folder · switch interval
```

The blanking now stays **on the same scene** instead of scenes being switched next to it. It still
comes and goes: it stays for its time, then lifts, then after the waiting time covers again.

**"Preview blanking" button.** Shows it on your own screen for eight seconds; a click or a key hides
it at once. On your own screen rather than the display, because "is my image too large" is a
question of presentation: the mark is sized by its share of the screen, so it looks here as it will
later on the television.

Hidden fields stay in the form and are saved too: switching back and forth between the modes loses
nothing.

## 14.2610.6 - 2026-08-29

**Four switches removed that were never decisions.** The measure behind it:

> Is there a case in which a reasonable person picks the other value?
> If not, it is not a setting but a decision that was not made.

All four were at their defaults; nobody had ever changed them. The features stay, fixed on the value
that is always right:

| Removed | Behaviour now | Why it was never a choice |
|---|---|---|
| Keep loading token images | always load | A token image is a few kilobytes, and blocking it costs the player recognising their own figure, the only thing they still need their screen for |
| Keep the token menu upright | always upright | It was an emergency exit for a doubt, not a wish. Measured since: rotated around Foundry's own anchor point, the label stays 6 px from its token, just as close as without rotation |
| Hide the loading bar | always off | The bar reports processing, not bandwidth. On a client whose files are all blocked it happily counts to 100 % while nothing crosses the network. Showing it is not a preference but a false statement |
| Show status indicator | always on | It is the only thing on the player's screen that explains the black map. Hiding it turns a deliberate saving into an apparent defect |

The list now stands at six entries. What is left are real trade-offs: whom it affects by default,
how much is blocked, whether audio belongs to it (breaks `monks-sound-enhancements`), whether the
game canvas goes off entirely (saves more, requires a reload), exception paths, and the choice per
device.

## 14.2610.5 - 2026-08-29

**The displays page overflowed and could not be scrolled.** The window grows with its content, and
with eleven fields in three groups it grew past the bottom of the screen. But an area declared
scrollable needs a *limited* height, otherwise there is no overflow for it to scroll.

The content is now capped against the window height and split in two: the fields scroll, the save
button stays in place. Scrolling it out of reach on a form whose whole purpose is saving would be a
small cruelty of its own.

**The master switch is out of the settings list.** It was there twice: as a bare checkbox in the
list and as a button in the control window that also says what it does ("Table mode running, 6
players are not loading maps right now"). Two ways to the same switch, one of them worse. The
controls are reachable through the button directly above.

Counted again: the list had eleven settings, exactly one of them really duplicated. The other ten
are values that do not exist in the control window.

**"Companion scenes" was practically invisible.** The heading set font family and size but no colour,
and so inherited Foundry's light theme colour on our white ground: measured 0.09 difference in
lightness. The error was already in the control window and came along in the move.

## 14.2610.4 - 2026-08-29

**Tidying up by a measure instead of by feel.** The control window (`Alt+T`) held the idle image, the
default companion scene and the overview of companion scenes, all things you set once and never touch
while playing. The measure it now hangs on:

> Would I touch this mid-session while six people are waiting?

That gives three places:

| Place | What |
|---|---|
| Settings page | values set once: accounts, times, idle image, default companion scene, image, overview of companion scenes |
| Right-click on a scene | everything about *this one* scene: view, pin here, bring players, as idle image, as default companion scene |
| Control window `Alt+T` | state and action *now*: master switch, player switches, pinning, refresh, cost of the scene |

The two select boxes were duplicated in the control window anyway: both have existed for a while as
right-click entries on the scene, and they are quicker to reach there because you have the scene in
front of you anyway.

The control window is now 40 lines shorter and only holds things needed during a session.

## 14.2610.3 - 2026-08-29

**A page of its own for the scene displays.** Everything about the two screens now sits under *Module
settings, Set up displays* instead of scattered between the map block's switches. Blocking downloads
and controlling two televisions are different jobs that only share a module; in a flat list it read as
a heap of unrelated switches.

The page is built by hand, not Foundry's standard list: the settings want groups and a running
explanation (which display is which, what happens on release, how the two stages of burn-in protection
work together). A flat list cannot carry that. Nothing is saved until the click, so half a thought can
be discarded by closing.

**The blanking now pulses instead of staying down.** That was the real thinking error in 14.2610.2: it
went up and stayed up. But it was never about switching the television off, only about no picture
standing still for hours. Now it lifts again after the set time, the scene can be seen, and after the
waiting time it covers again. New setting "Blanking stays for ... minutes", default 3.

Scene switching **keeps running while the blanking is down**: it is the only moment in which a switch
disturbs nobody, and every uncovering shows something different.

**Image on the blanking.** Instead of the gold dot you can choose your own file, which drifts slowly
over the black. Size by share of the screen rather than in pixels, so the same file fits a 24-inch
monitor and a 75-inch television.

**Step size of 1 minute** for all idle times: to try it out you no longer have to wait five minutes.

## 14.2610.2 - 2026-08-29

**Burn-in protection on the scene display.** Two stages, each can be switched off: after N minutes of
quiet the display cycles through a scene folder, after a further M minutes it goes black with a small
wandering mark.

The black blanking is the real measure, not the scene switching. A black pixel on OLED is off and does
not age at all; a bright scene keeps wearing the panel even if something moves in it. Movement protects
against a burnt-in *pattern*, not against wear. The scene switching stays all the same, for the short
break in which someone looks.

If only one scene lies in the folder, the display simply goes there and stays. That covers the case "one
scene with movement in it" without a setting of its own.

Quiet means that nobody apart from the displays does anything. The `userActivity` broadcast carries that
anyway: mouse pointer, ruler, targets, scene changes. What is evaluated is the *sender*, not the message:
the displays send along when switching themselves, and counting their own movement as activity would mean
the screensaver waking itself up in a circle.

The display reports to the gamemaster over the socket when it is keeping itself busy. Without that, the
bookkeeping from 14.2609.14 would dutifully file the screensaver scene as "that is where it belongs", and
the pin target would be gone after the first break.

## 14.2610.1 - 2026-08-29

**Default companion scene.** Until now an unpinned scene display simply showed the same map as the
battlemap display, which is exactly what you do not need the second screen for. Now a scene can be set that
it falls back to when the activated battlemap names no companion scene of its own. Set it in the controls or
by right-clicking a scene.

The whole order of precedence now sits in one place (`resolveDisplayTarget`), from the most specific to the
most general:

| | |
|---|---|
| 1 | a companion scene named on the battlemap |
| 2 | pinned: stay put |
| 3 | the default companion scene |
| 4 | follow the activation |

That 1 stands above 2 is deliberate and was already so: a link made by hand is a more precise instruction
than a general "stay put".

**Side effect, deliberate:** companion scenes now also work when the pin is released. Before, they only took
effect when pinned, which would no longer have fitted with the default companion scene.

Also, the deactivation of the outgoing scene on the scene display is now swallowed without exception. It
cannot be judged on its own: the decision depends on the scene being *activated*, and that is not reliably
known at that moment. On the side, this removes the brief black between two scenes.

## 14.2609.14 - 2026-08-29

Three reports from the table, one common cause.

**Pinning from the context menu now takes the scene that was clicked.** Before, it pinned the display
wherever it happened to be; the scene you had expressly right-clicked was passed over. The switch in the
controls and `Alt+T` still mean "stay where you are"; no scene is in question there.

**The badge stuck to the old scene** when the display was moved by hand, and on release the view then
jumped seemingly at random. Both the same reason: the stored value controls badge and release, and it went
stale.

Until now every route was tracked individually (our own moving, the companion scene jump), which left every
route uncovered that nobody had thought of. Now there is **one** place that notices the display has moved,
whatever moved it.

Foundry keeps `user.viewedScene` current from a `userActivity` broadcast but fires no hook for it, and the
responsible method is private and static, so it cannot be overridden. We therefore listen to the same
broadcast: several receivers may sit on a socket event, and because we read `sceneId` directly from the
message, the order does not matter. Only while pinned; otherwise the value controls nothing and every write
would be a broadcast to all.

`noteCompanionJump` from 14.2609.9 is dropped with this; the jump is a movement like any other and is
captured along with it.

## 14.2609.13 - 2026-08-29

**A pinned scene display is no longer dragged along.** Foundry's "pull all players here" took it along too,
which is exactly what pinning is meant to prevent. The lock on `_onActivate` only covers scene *activation*;
a pull goes through `Scene#pullUsers` and passed unhindered until now.

The filtering happens on the gamemaster's side, not on the display: the socket message of a blanket pull is
byte for byte the same as that of our targeted one. The display cannot tell them apart, the gamemaster can,
because they make the call. Targeted pulls therefore carry a marker and still get through. The battlemap
display stays untouched; it still follows everything.

**"Bring players here" now preselects everyone** except the scene display. Whoever is already on the scene
is no longer left out: the window has still scrolled somewhere else, and the point of the button is that
everyone sees the same afterwards.

## 14.2609.12 - 2026-08-29

**"Bring players here" is now also in the scene context menu.** The dialog was finished and reachable from
the controls, but the entry in the context menu was missing, although the guide described it. The import in
`main.js` lay around unused, which gave exactly that away.

From the context menu the dialog targets the **clicked** scene, not the one currently viewed. That is the
real gain over the button in the controls: bring people somewhere without switching there yourself first.

## 14.2609.11 - 2026-08-29

**Ruler labels stay with the ruler.** On rotated scenes they flew into a corner of the map: the "25 ft"
stood far away from the distance it belonged to. The error was ours: the counter-rotation that keeps text
upright hit *every* direct child of `#hud`.

That is right for a token menu: 45 × 45 pixels, hanging on the token, rotated around its own centre it stays
there and stands upright. It is wrong for `#measurement`: the container fills the screen (measured 2121 ×
1624), and its children carry their own positions. Rotating it around its centre sends everything in it
across the screen.

Now we distinguish: attached menus rotate around their centre, ruler labels and speech bubbles individually
around the anchor point Foundry already gives them. Measured: rotated around that anchor a label stays just
as close to its waypoint as without any rotation (6 px), rotated around the centre three times as far.

Speech bubbles were affected by the same error and are fixed with it.

## 14.2609.10 - 2026-08-29

Compatibility with Lock View on rotated scenes.

Lock View controls the displays at many tables, but since 2.0.0 it knows nothing about rotation. As soon as a
scene stands at 90° or 270° here, its "width" means something other than the screen, and two values no
longer match. Both are now corrected on our side, without changing Lock View.

**Fitting.** `horizontal` calculated the scene width against the window width. Rotated, though, the scene
*height* fills the screen along its width. Measured on a 3360 × 4340 map at 2290 px window width: scale
0.6815 instead of 0.5276; the map was 29 % too large, bow and stern fell off. `autoInside` and `autoOutside`
are affected the same way; `physical` and `off` stay untouched.

**View frame.** The display reported its visible area with the sides swapped, and the gamemaster saw a frame
that could not be right. At exactly 90° and 270° a screen rectangle stays axis-parallel in the world, only
with swapped dimensions, so swapping two numbers makes the frame *exactly* right, not just roughly.

**A note in the scene window** when Lock View was detected and the scene is rotated. Otherwise you later
search in vain for the connection.

Everything is guarded by feature detection: without Lock View nothing happens, and the module stays
self-contained. If one of the two corrections fails (say because a Lock View update rebuilds the method), the
previous behaviour remains instead of a crash.

Also two errors from test operation: pinning now always takes the scene the display is currently on (before,
an old value could pull it elsewhere at the moment of pinning), and a jump to a companion scene is recorded by
the gamemaster, since the display itself may not change a world setting, which let the stored state go stale.

## 14.2608.1 - 2026-08-28

Four interface adjustments.

**Keyboard shortcut.** `Alt+T` opens the controls directly. Alt combinations are practically unused in
Foundry: Alt alone is "highlight objects", Alt plus a letter is free. The shortcut can be changed through
Foundry's own keybinding settings and is only active for gamemasters.

**The scroll position stays.** Until now the list jumped to the top on every click. The cause was not a
Foundry bug but a missing declaration: the Handlebars mixin preserves scroll positions through
`PARTS[…].scrollable`, and exactly that was not declared. Now the panel and the player list are registered.

**"Measure" is explained.** Three tooltips and a hint text: what the button does (only queries headers, a few
hundred bytes instead of 35 MB), what the total means (what a player without table mode would load) and what
"unmeasured" means (missing from the total).

**Design switched to the D&D look.** Layout unchanged, only the appearance: parchment ground `#fdfbf7`, dark
red `#8B0000`, gold `#D4AF37`, Segoe UI, 2 px radii and the button shape from `fang.css`. The values are
deliberately fixed in the module rather than inherited as `var(--fang-...)`; otherwise the panel would follow
FANG's cyberpunk variant as soon as that is switched on.

## 14.2607.6 - 2026-08-28

Two results from the live measurement series.

**Loading bar.** New setting "Hide the loading bar for players" (default: on). Foundry shows its scene loading
bar even when every file comes from the browser cache or was blocked: measured, 52 files shown, 0.01 MB actually
transferred. It reports processing, not bandwidth, and is misleading in that role. Implemented through
`displayProgress: false`, a documented option of `TextureLoader#load`. It only hides the display; the loading
behaviour does not change.

**Audio blocking collides with monks-sound-enhancements.** Measured: with audio blocking on and a playlist
running, the console filled with 4476 exceptions at a rate of one per second (`Cannot read properties of null
(reading 'classList')` in `MSE_PlaylistDirectory.updateTimestamps`). After switching it off: not a single one in
ten seconds. The cause is that Foundry keeps a sound set to "failed" listed as playing, and MSE finds no DOM
element for it. The error is in MSE, table mode triggered it. The setting is off by default anyway; the hint text
now names the collision.

## 14.2607.5 - 2026-08-28

The precomputed block list is gone. Every request now checks directly against the scene documents whether the
file is a scene background.

The precomputation was the cause of the error in 14.2607.4, not its solution: a list that has to be filled at the
right moment can be empty at the wrong one. The direct query has no initialisation order and no hooks, and is
always current, also for scenes created during the session.

- `isSceneBackground()` replaces the set, the lazy build and four hooks.
- Cost: one string comparison per scene, only for clients in table mode.

## 14.2607.4 - 2026-08-28

Fixed an error found in the second live measurement: on the **first** draw after joining, the background was not
blocked.

Foundry draws the canvas during `setup`, that is **before** the `ready` hook. But the block list was only filled in
`ready` and was still empty on the first draw. It hit precisely the most common case: a player joining the session.
It did not show when preloading, because that happens long after `ready`.

- The list is now built lazily on first access, independent of the hook order, and additionally already in `setup`.
- New in the API: `backgroundCount()` and `rebuild()` for diagnosis.

## 14.2607.3 - 2026-08-28

Scope narrowed considerably. New setting "What is blocked", default: **only the background map**. Tiles, effects,
portraits, handouts and module graphics go through again.

The reason is a trade-off, not a technical necessity: a few megabytes too many cost bandwidth, a wrongly blocked file
costs the game evening. So the list is now a block list instead of an allow list: only what can be positively
identified as a scene background is blocked.

- Backgrounds and foregrounds of **all** scenes are collected, not only the current one's. Preloading can affect any
  scene in the world.
- The list follows scene and level changes through hooks.
- Audio blocking is now **off** by default.
- Whoever wants the old scope chooses "Everything heavy (map, tiles, effects)".

## 14.2607.2 - 2026-08-28

First measurement in live operation on foundry-1 (v14.367), a player client with the game canvas switched off. One
click on "Preload scene" by the gamemaster:

| | Table mode off | Table mode on |
|---|---|---|
| Transferred | 58.86 MB | 0.00 MB |
| Files loaded | 71 | 0 |

That proves `core.noCanvas` does not catch the preloading: the 58.86 MB flowed to a client that had no game canvas
at all.

- SVG files and all `icons/` directories are now on the exception list. The measurement showed that otherwise the
  token status markers of the system and modules are blocked too (`systems/dnd5e/icons/svg/statuses/*`, one or two
  KB per file, but they carry real information). Battlemaps are never SVG, so the rule costs nothing.

## 14.2607.1 - 2026-07-23

First version.

- Blocks map, tile, effect and audio downloads on assigned clients through a wrapper on `TextureLoader#loadTexture`
  and `Sound#load`.
- A black placeholder texture instead of a network request. Scene geometry, grid, walls, lighting and token
  positions stay untouched.
- Token graphics keep loading by default, can be switched off.
- Spritesheets, virtual textures and core icons are exempt from the block.
- GM panel with a three-way switch per player (automatic / always / never).
- Display accounts are protected and never run in table mode automatically. Detected through `monitorDisplayName`
  from FANG, otherwise through the module's own setting (default `Monitor`). Only an explicit "always" lifts the
  protection.
- Scene measurement by HEAD request: shows the real bytes per client instead of an estimate.
- Status indicator on affected clients, figures reported back to the GM panel.
- Optional stage "switch the game canvas off entirely in table mode": additionally sets `core.noCanvas` and offers
  the reload. Table mode only releases the flag if it set it itself, so it does not fight Sheet Only over it.
- German and English complete.
- libWrapper is used when present, otherwise a fallback patch of our own.

# FUNDVIEW_Text_Scroll — implemented

Section added below `.trust.client_ticker` in `OurERP_1.html`.

Preview: http://localhost:5500/OurERP_1.html#FUNDVIEW_Text_Scroll

## Spec used
- Scroll-linked character opacity reveal (Jesko-style / `data-div-reveal`)
- Focused text: `#0b2a4a` at full opacity
- Out-of-focus characters: same color at ~16% opacity
- Background: white → light grey gradient
- Vanilla JS (no GSAP dependency for HubSpot)

## Follow-ups (if needed)
- Tune font size / section height / reveal speed
- Decide whether sticky text stay or natural scroll-only like Jesko

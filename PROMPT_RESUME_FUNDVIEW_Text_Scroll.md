# Resume after reboot — OurERP text scroll section

Paste this into Cursor after reboot to continue:

---

Add a new section below class="trust client_ticker":

Section name 'FUNDVIEW_Text_Scroll'
Copy text for section:
FUNDVIEW is more than a collection of software modules—it's a connected ERP platform built specifically for local government. Every department shares the same data, works from the same real-time information, and operates within one secure cloud environment.

As work is completed throughout the organization, financial information updates automatically, workflows continue without interruption, and leadership gains immediate visibility into operations. The result is fewer disconnected systems, less duplicate entry, stronger collaboration between departments, and more confident decision-making across the organization.

How it will function:

I need this section to function just like within https://jeskojets.com/ of section data-div-reveal="true" (has this copy: "Jesko Jets® is a private aviation operator with over 5,000 missions completed across 150+ countries. From international executives to global industries, our clients trust us to deliver on time, every time.").
How to implement into the new section:

Keep the background color a white to light grey gradient. Clean blend.
- The color of the text needs to be in #0b2a4a for the bold part, and for text that "what isn't in focus as user scrolls to be more opaque would be cool"

---

## Notes
- Working file: `OurERP_1.html`
- Place section immediately below `.trust.client_ticker` / `#client_ticker`
- Preview: `http://localhost:5500/OurERP_1.html` (start local server on 5500 after Cursor restart — see `.cursor/rules/local-html-preview.mdc`)
- After edits: regenerate HubSpot with `node _hubspot_mode.js upload ourerp`, then commit + push to `origin/main`

# FUNDVIEW_CORE

Canonical HTML templates for the new FUNDVIEW site (header/footer + page shells).

## Shared chrome (keep these consistent)

| File | Role |
| --- | --- |
| `SITE_HEADER_7.29_730pm.html` | Official site header (edit this) |
| `SITE_FOOTER_7.29_730pm.html` | Official site footer (edit this) |
| `fundview-header-local.html` | Alias copy for tooling |
| `fundview-footer-local.html` | Alias copy for tooling |

Every page template loads header/footer via `fetch` from the `SITE_*` files, so one edit updates every local preview.

After editing `SITE_HEADER_*` or `SITE_FOOTER_*`:

```bash
node _sync_site_chrome.js
```

If you edited the `fundview-*-local.html` aliases instead:

```bash
node _sync_site_chrome.js --from-local
```

## Page templates (7.29 / 7:30pm set)

| Page | File |
| --- | --- |
| Homepage | `Home_7.29_730pm.html` (from `home7`) |
| Our ERP Platform (Overview) | `Our ERP-Over_7.29_730pm.html` |
| Our ERP — Guided Video / Demo | `Our ERP-Main_7.29_730pm.html` (from `OurERP_1`) |
| Solutions (Hub) | `Solutions-Over_7.29_730pm.html` |
| Financial Management | `Solutions-Sub-FinMan_7.29_730pm.html` |
| Workforce Management | `Solutions-Sub-WorkMan_7.29_730pm.html` |
| Community Development | `Solutions-Sub-ComDev_7.29_730pm.html` |
| Utility & Field Services | `Solutions-Sub-UtilField_7.29_730pm.html` |
| Municipal Operations | `Solutions-Sub-MunOper_7.29_730pm.html` |
| Why FUNDVIEW | `WhyFUNDVIEW_7.29_730pm.html` |
| How We Work | `HowWeWork_7.29_730pm.html` |
| Customers / People | `Cust-People_7.29_730pm.html` |
| Pricing | `Pricing_7.29_730pm.html` |
| Login | `Login_7.29_730pm.html` |

## Local preview

```bash
node _preview_server.js
```

Then open e.g. `http://localhost:5500/Home_7.29_730pm.html`.

## HubSpot export

```bash
node _hubspot_mode.js list
node _hubspot_mode.js upload home
node _hubspot_mode.js upload ourerp-main
node _hubspot_mode.js upload solutions-finman
```

Paste the generated `*.hubspot.html` into the HubSpot coded page template.

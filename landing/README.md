# Cash Check landing page

A standalone HTML/CSS site. All preview figures are fictional. No analytics, external fonts, database access, or app login links.

```sh
python3 -m http.server 8093 --directory landing
```

Open http://localhost:8093. To deploy, upload `index.html`, `styles.css`, and `icon.svg` to a static host, or build the included Dockerfile with `landing/` as its context and expose port 80.

Public site: https://cashcheck.jmmay.com/

Source: https://github.com/josh-may/cash-check

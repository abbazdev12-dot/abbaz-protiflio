# ABBAS.P.A Portfolio

Premium 3D portfolio built in phases with Vite, vanilla JavaScript, Three.js, and GSAP.

## Development

```sh
npm install
npm run dev
npm run build
npm run preview
```

## Foundation build

The current foundation provides the shared application shell, central ticker, shared renderer module, state lifecycle, accessible placeholder routes, config validation, and `?debug=1` diagnostics. Intro and final 3D door scenes are not implemented yet.

Content and media paths belong in `src/config.js`. Public media placeholders use the following structure:

```text
public/
  photo/
  videos/{cybersecurity,tech,forex,me}/
  posters/
  projects/
```

Never publish a private email, account detail, sensitive portrait region, or broker/trading information.

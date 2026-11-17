# nts-studio-keyboard-simulator

A web page that types like NTS-STUDIO in the NTS Discord.

Type or paste text into the box. The page updates the output as you type. Click **Copy to clipboard** to copy the output.

The page:

- changes all text to lowercase
- drops some spaces between words ("becausei", "inmy")
- puts in typos from adjacent keys ("agsin")
- removes most apostrophes and full stops

## Run locally

Open `index.html` in a browser. The page has no build step.

## Deploy

A GitHub Actions workflow deploys the page to GitHub Pages on each push to `main`.

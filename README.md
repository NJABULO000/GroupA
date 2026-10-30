# Fire & Vine

A single-page restaurant website for **Fire & Vine**, a grill and wine restaurant at Athlone Circle shopping centre in Pietermaritzburg. Built with plain HTML5 and CSS3, with no frameworks and no JavaScript.

This is a student project. Each team member built their own version in their own repository, using one shared look and structure agreed as a group.

## Features

- Hero section with a banner image and a "Book a table" call to action
- Short about section
- Menu with starters, mains and desserts, each with a photo
- Reservation form with built-in validation and a confirmation popup
- Footer with opening hours, location and contact details
- Responsive layout for phone, tablet and desktop, with no horizontal scroll

## Project structure

```
.
├── index.html
├── style.css
├── images/
│   ├── banner.jpg
│   ├── starters.jpg
│   ├── mains.jpg
│   └── desserts.jpg
└── README.md
```

## How it is built

**HTML**
- Semantic landmarks: `header`, `nav`, `main`, `section`, `article`, `address` and `footer`
- One `h1`, with `h2` for each section and `h3` for the menu categories
- Nav links use anchors: each `href="#menu"` matches a section's `id`
- Form labels are linked to inputs with `for` and `id`, and use the right input types plus `required`

**CSS**
- Colours are defined as CSS variables in `:root` (charcoal, wine, deep wine and ember)
- `box-sizing: border-box` is set globally
- **Flexbox:** the header, nav links, menu item rows (name left, price right), hero and form fields
- **Grid:** the menu columns, the footer and the reservation form
- Mobile-first, with one `@media (min-width: 700px)` breakpoint
- `clamp()` for fluid heading sizes, and `aspect-ratio` with `object-fit: cover` for equal-sized menu photos
- The hero background is a photo with a dark gradient overlay so the text stays readable

**Booking popup (no JavaScript)**
The form sends the page to `#confirmation`. The CSS `:target` selector changes the popup from `display: none` to `display: flex`. The popup is a thank-you message only: nothing is saved, because the site has no backend.

## Requirements checklist

- [x] GitHub repository with small commits
- [x] Single page, responsive, plain HTML5 and CSS3
- [x] Semantic landmarks, one `h1`, working nav links
- [x] `box-sizing: border-box` globally and CSS variables for colours
- [x] Real use of Flexbox and Grid
- [x] No horizontal scroll on phone, tablet or desktop

## Notes

- The menu items, prices, opening hours, phone number and email are sample content and not the restaurant's real details.
- Replace the photos in `images/` with your own. Keep the same file names, or update the paths in `index.html` and `style.css`.

## Author

Njabulo, Group 6
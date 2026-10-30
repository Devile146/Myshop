# AL SHAIKH GARMENTS — Final Customer Website

This project contains the customer-facing online store only. The owner Admin Panel is intentionally not included.

## Project structure

- `index.html` — page structure
- `css/style.css` — all responsive styling, including 360px–580px mobile layout
- `js/app.js` — category filters, product details, image popup, cart and checkout
- `js/products.js` — demo catalogue (replace with the shop's real catalogue)
- `js/firebase-config.js` — Firebase Web App configuration placeholders
- `firestore.rules` — starter Firestore security rules

## Firebase setup (required for real online orders)

1. Create a Firebase project: https://console.firebase.google.com/
2. Add a Web App in Project Settings.
3. Copy its Web App configuration into `js/firebase-config.js`.
4. Create a Cloud Firestore database.
5. Publish the included `firestore.rules` in Firestore > Rules.
6. Add products in Firestore collection `products` if you want Firestore catalogue loading to replace demo products.

### Product document fields

Example document in `products`:

```json
{
  "name": "School Backpack",
  "category": "Bags & School Bags",
  "price": 1899,
  "oldPrice": 2199,
  "image": "https://your-image-host/image.jpg",
  "badge": "New",
  "description": "Product description",
  "information": "Material, dimensions, details",
  "options": ["Small", "Medium", "Large"],
  "stock": "In stock",
  "active": true
}
```

For clothing, `options` can contain clothing sizes. For footwear, use shoe sizes. For cosmetics and general products, use shades, volume or `Standard`, as relevant.

## Run locally

Because the project uses JavaScript modules and Firebase's web SDK, serve the folder using a local web server or deploy it to a static host such as Firebase Hosting. Opening `index.html` directly as a `file://` URL may block module imports.

## Important current status

- Demo product catalogue is included so the design can be reviewed immediately.
- Firebase connection is implemented but remains inactive until real project config is entered.
- Once configured, the storefront reads active documents from `products` and creates new documents in `orders`.
- The provided rules deny public product writes and deny public order reads/updates/deletes.
- The customer order form does not send email and does not yet send WhatsApp messages.
- Owner Admin Panel, owner login, order management, product editor and image upload are a separate next phase.
- Replace all sample images, sample prices and sample product descriptions with the shop's verified catalogue before publishing.
- Before public launch, add abuse protection (for example App Check and server-side order validation/rate limiting) and verify Firestore rules against the final workflow.

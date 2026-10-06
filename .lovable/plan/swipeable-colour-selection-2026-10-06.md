# Swipeable colour selection

## What will change
- Turn the product colour options into a horizontal, touch-friendly strip customers can swipe.
- Show each colour as a visual thumbnail using that colour variant's first product photo.
- Selecting a colour will immediately switch the main gallery to that colour's photos, reset the gallery position, and update size availability.
- Keep a clear text label and selected state so the active colour is always obvious.

## Verification
- Test the colour strip and gallery switching on mobile and desktop.
- Confirm adding to cart uses the selected colour and its displayed image.
- Check the storefront for layout, console, and build errors.

## Technical details
- Reuse existing product colour and image metadata; no database changes are needed.
- Update the product details page only, preserving the current inventory and importer behavior.

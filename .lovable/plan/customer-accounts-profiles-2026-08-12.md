## Customer accounts & profiles

Shoppers get a proper account: sign up / sign in with email (or one-tap Google), then manage their profile, photo, login details and delete their account.

### Sign in / sign up (`/auth`)
- One page for customers with Sign in / Create account tabs (email + password) and a **Continue with Google** button.
- After signing in, customers land on **My Account** — today the page always sends people to the admin dashboard, which is wrong for shoppers. Admins still reach `/admin` from a link shown only to them.
- "Forgot password?" link sends a reset email.
- New route **`/reset-password`** where the emailed link lands so a new password can actually be set.
- Signing up with email shows a "check your email to confirm" state instead of pretending the person is logged in.

### My Account (`/account`)
Keeps the current Details / Orders tabs and adds a third: **Settings**.
- **Details** (existing): full name, phone, delivery address, city, region — used to autofill checkout.
- **Profile photo**: upload/replace an avatar; shown as a small avatar in the header and at the top of the account page. Stored in a new public `avatars` storage bucket, each customer only able to write their own file.
- **Settings**:
  - Change password (asks for the new password twice).
  - Change email (sends a confirmation to the new address).
  - **Delete my account** behind a type-to-confirm dialog: removes the profile, cart, wishlist and reviews, deletes the login, then signs out. Past orders are kept for records with the customer link removed.
- Signed-out visitors see the existing sign-in prompt.

### Header
The account icon becomes a small menu driven by the live session: avatar + name, links to My Account / Orders / Wishlist, Dashboard when the person is an admin, and Sign out. Signed-out visitors see "Sign in".

### Technical notes
- Migration: add `avatar_url` to `profiles`; create the `avatars` storage bucket with owner-scoped write policies and public read.
- Account deletion runs through a new authenticated server function that verifies the caller and uses the admin client to remove the auth user, nulling `orders.user_id` first.
- Google login goes through the Lovable managed OAuth helper with `redirect_uri` set to the site origin; the Google provider is enabled in the same step so first sign-in works. Email/password stays enabled.
- Sign-out clears cached data and replaces history so Back can't restore a signed-in view.
- Each new route gets its own title/description metadata; `/reset-password` stays public.

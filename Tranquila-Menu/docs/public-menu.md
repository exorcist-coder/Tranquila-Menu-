# Public website menu

`/browse` renders the same live catalogue, photos, categories, availability and prices as the existing hotel QR menu. It uses the same `MenuApp`, `ItemSheet` and `/api/menu` source; there is no second menu dataset to maintain.

The public view skips the welcome screen, retains search, category navigation, dish options, prices and photo galleries, and replaces ordering with this instruction:

> To place an order, please scan the QR code in your room or ask a member of staff for the ordering link.

It does not show a basket, add items, open checkout, expose the ordering WhatsApp link, or modify an existing guest basket. The top bag button explains how to order; a dish's ordering button reveals the same instruction. The existing `/` QR entry, branch routing, delivery fees, ordering hours and admin flow remain unchanged.

Main hotel public view: `https://menu.tranquilahotelandsuites.com/browse`. The shared route is also available on the Nest deployment with its configured branch data. Only the Mabushi website is linked in the current Framer project.

This separates the public website journey from the ordering journey. It is not proof of physical presence or access control for the existing ordering URL: someone who receives that URL can still use it. No geolocation, guest codes or Wi-Fi restriction is implemented.

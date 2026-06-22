# ZenCleanz Shipping & Customer Service SOP

> **Purpose1:** Reference + template library for the shipping/customer-service team.
> **Usage:** Each scenario below is self-contained. When a team member requests a template for a situation, retrieve the matching scenario and fill in the `{{placeholders}}`.
> **Brand voice:** Warm, apologetic where needed, reassuring. Standard sign-off:
> *To your vibrant health,*
> *ZenCleanz Customer Care | Detox & Rise*
> *customer.service@zencleanz.com*

## Placeholder Legend

| Placeholder | Meaning |
|---|---|
| `{{name}}` | Customer first name |
| `{{order_no}}` | Order number (e.g. ZCW10835531) |
| `{{awb}}` | DHL tracking number / Air Waybill |
| `{{tracking_url}}` | DHL or courier tracking link |
| `{{address}}` | Full shipping address |
| `{{date}}` | Relevant date |
| `{{amount}}` | Fee / refund amount |
| `{{items}}` | Product/kit names |

---

# 1. Address & Recipient Issues

## 1.1 PO Box Address (DHL cannot deliver)
**When to use:** Shipping address is a PO Box.

```
Hi {{name}},

Thank you very much for your order!

We noticed that your shipping address contains a PO Box. DHL is unable to deliver to PO Box addresses, as they require a physical location where someone can sign for the package upon delivery. We sincerely apologize for any inconvenience this may cause.

Could you please provide an alternative physical address that DHL can accept? Once we receive it, we will update your shipment right away.

Looking forward to your reply.
```

## 1.2 Address Updated — Confirmation
**When to use:** Customer has supplied a corrected/alternate address.

```
Thank you for your confirmation!

Your shipping details have been updated as follows:
{{address}}

Once the shipment has been sent, you will receive a notification email with the DHL tracking number (AWB).

Wishing you a beautiful day!
```

## 1.3 Wrong Shipping Address — Suspected Typo (City)
**When to use:** Likely spelling error in city/town name.

```
Hi {{name}},

Thank you for your order! While preparing your package, we noticed a potential error in the shipping address provided. Could you kindly confirm if the city should be "{{correct_city}}" instead of "{{typo_city}}"?

Here's the address we have on file:
{{address}}

Thank you for your help, and we look forward to your reply!
```

## 1.4 Wrong Shipping Address — Suspected Typo (Post Code)
**When to use:** Post code looks invalid.

```
Hi {{name}},

Thank you for your order! While preparing your package, we noticed a potential error in the post code provided. Could you kindly confirm the post code of the shipping address below?

Here's the address we have on file:
{{address}}

Thank you for your help, and we look forward to your reply!
```

## 1.5 Invalid Receiver Name
**When to use:** Receiver name is clearly wrong/placeholder (e.g. "Home Home").

```
Hi {{name}},

Thank you for your order! While preparing your package, we noticed that the receiver name appears incorrect: {{wrong_name}}. Could you kindly provide the correct name for accurate delivery?

Current Address:
{{address}}

We appreciate your prompt response to ensure smooth and timely delivery.
```

## 1.6 Invalid Name — No Reply, Proceeding
**When to use:** Customer didn't respond; defaulting to the order-account name.

```
Hi {{name}},

Thank you for your order! Since we haven't heard back from you regarding the receiver name, we will proceed with updating it to {{full_name}} to avoid further delays and ensure timely delivery.

If this needs to be corrected, please let us know immediately. Otherwise, we'll ship your package promptly.

Thank you for your understanding and cooperation.
```

## 1.7 Incomplete Recipient Name (Customs risk)
**When to use:** Name is initials/partial (e.g. "C M Cox") — risk of customs hold.

```
Hi {{name}},

Thank you for your order! While preparing your shipment, we noticed the receiver name listed as {{partial_name}}. Please note that export Customs will request a passport for verification if the name is incomplete, and import Customs are likely to stop and inspect the package.

To avoid extra processing steps, may we update the receiver name to {{full_name}}? Please confirm or provide the correct full name.

We appreciate your prompt response to ensure a smooth shipping process.
```

---

# 2. Order Management

## 2.1 Same Recipient — Multiple Orders (Combine?)
**When to use:** Two+ orders placed same day, same person.

```
Hi {{name}},

Thank you for your orders!

We noticed that you placed two orders on the same day ({{order_no_1}} and {{order_no_2}}). Would you like us to combine them into one shipment, or would you prefer to keep them as separate shipments?

Please let us know your preference, and we'll proceed accordingly.
```

## 2.2 Confirm Multiple Orders Before Shipping
**When to use:** Verifying contents/address across multiple orders.

```
Hi {{name}},

Thank you for your orders! To ensure everything is accurate before shipping, could you kindly confirm that both orders are correct? Please let us know if there are any changes needed.

{{order_no_1}}: {{items_1}}
{{order_no_2}}: {{items_2}}

Shipping Details:
{{address}}
```

## 2.3 Possible Duplicate Order
**When to use:** Identical order under same name/address — confirm not a mistake.

```
Hi {{name}},

Thank you for your order!

We noticed a same order ({{order_no}}) placed under your name {{full_name}}, with the same items and shipping address.

Could you kindly confirm if this is a separate order, or if it may have been placed by mistake? We'd like to make sure everything is processed correctly for you.
```

## 2.4 Order Already Dispatched — Cannot Edit
**When to use:** Customer requests changes after dispatch.

```
Hi {{name}},

Thank you for your message. We're sorry — your order was shipped out on {{date}} (AWB {{awb}}), so the requested items can't be removed or changed at this stage.
```

## 2.5 Cannot Locate Order
**When to use:** Customer's name/email returns no order.

```
Hi {{name}},

We couldn't locate your order using the name {{name}} or the email {{email}}.

Could you please share your order number or any relevant shipping details (full name, address, or phone number used at checkout)?
```

---

# 3. Shipment Notifications & Tracking

## 3.1 Shipment Dispatched
**When to use:** Order has shipped; sending tracking.

```
Hi {{name}},

Your order has been sent today with DHL tracking number (AWB) {{awb}}.

You can check the shipment status here:
{{tracking_url}}

We have attached the commercial invoice for your reference. Thank you!
```

## 3.2 No Email Entered at Checkout
**When to use:** No confirmation email was possible — customer asks where notifications are.

```
Hi {{name}},

We received your order {{order_no}} on {{date}} and shipped it out on {{date}}. Your tracking number is {{awb}}. Because there was no email entered at checkout, the confirmation email was not sent.

You can check your shipment status here:
{{tracking_url}}

Let us know if you have other questions!
```

## 3.3 Wrong / Different Email at Checkout
**When to use:** Notifications went to an email the customer isn't checking.

```
Hi {{name}},

We received your {{items}} order ({{order_no}}) on {{date}}, and it was shipped out on {{date}}. Your DHL tracking number is {{awb}}. You can track it here:
{{tracking_url}}

The email entered at checkout was {{email}}, so both the order confirmation and shipping notification were sent there. Kindly check your spam or promotions folder, as the emails may have been filtered.

Let us know if you need further assistance!
```

## 3.4 Pick-Up Notice
**When to use:** Parcel held for collection at a DHL service point.

```
Hi {{name}},

Your ZenCleanz order {{order_no}} with DHL tracking number (AWB {{awb}}) is now ready for pick-up at your local DHL service point. Please visit the location below at your convenience to collect your parcel.

{{pickup_location}}
```

## 3.5 Split Delivery
**When to use:** Customer received only part of the order.

```
Hi {{name}},

We understand that you've only received part of your order.

Sometimes DHL arranges a split delivery, which means your shipment may arrive on separate days even though it was sent together. In your case, the {{items}} just departed from {{origin}} on {{date}} and is already on its way to you.

You can track the shipping status using the same DHL tracking number; updates will appear once DHL scans the parcel.

We truly appreciate your patience — please rest assured the rest of your order is on its way!
```

## 3.6 Shipping Transit Time (estimate from history)
**When to use:** Customer asks how long delivery takes to a region.

```
Hi {{name}},

I checked the recent orders to {{region}}:
- One was delivered in {{x}} days
- One was {{y}} days
- One was {{z}} days

Hope this helps you estimate the delivery time. I suggest ordering about 2 weeks before your cleanse day.

Once we ship out, you'll receive a tracking number you can track on DHL.com. You can also contact your local DHL office to book a delivery time slot and request hand delivery.
```

---

# 4. Customs, Duties & Taxes (General)

## 4.1 Duty / Tax / Clearance Fee — Payment Required
**When to use:** Shipment held pending duty/clearance payment.

```
Hi {{name}},

Your order {{order_no}} with AWB {{awb}} is arriving soon. To proceed with delivery, payment for import duties and customs clearance is required.

To check the status of your shipment: {{tracking_url}}

Please complete the payment online at your earliest convenience via this link:
{{dhl_payment_url}}

Kindly ignore this message if the payment has already been made.
```

## 4.2 Explaining Duties & the End of U.S. De Minimis
**When to use:** Customer questions/disputes import charges (U.S.-bound).

```
We completely understand how frustrating it can feel to be charged these additional fees, and we'd like to clarify the situation.

The shipping fee covers the cost of transporting your order to your country, but import duties and taxes are separate charges imposed by your local customs authorities. If you are concerned about potential scams, we can provide the official DHL payment link to ensure everything is legitimate.

Please note that starting August 29, 2025, the U.S. government ended the USD 800 de minimis policy. This means additional duties and taxes may apply to all imports, regardless of value. In addition, DHL may charge a service fee for handling customs clearance.

Local customs authorities have the right to impose duties and taxes in accordance with their regulations. Unfortunately, these charges are beyond our control, as they are determined and collected directly by the respective customs authorities.

The good news: we're in the process of establishing our own U.S. warehouse. Once it's in place, this situation can be avoided in the future.
```

## 4.3 Policy Citation — Customs Charges Are Customer's Responsibility
**When to use:** Reinforce policy when a customer refuses charges.

```
As outlined on our delivery policy page:

"Strong Pulses International Co. Ltd. is not responsible for any customs and taxes applied to your order. All fees imposed during or after shipping are the responsibility of the customer (tariffs, taxes, etc.)."

"Customs, duties, and taxes are non-refundable: for a shipment that is refused because of unexpected import fees, the cost of the original shipping and any return shipping charges will not be refunded."

Read here: https://zencleanz.com/pages/zencleanz-page-special-shipping-requirments
```

## 4.4 Refuse Duties → Return Shipment (Decision Request)
**When to use:** Customer must choose: pay & import, or return.

```
Hi {{name}},

DHL has informed us that the deadline to pay the import duty fee is {{date}}. Please note that shipments with unpaid import duty fees will be destroyed or returned after this date.

If you choose to reject and return, please note the following:
- Return shipping cost: {{amount}} (covered by the customer)
- Import duty fee: {{amount}} (this may still apply if Customs has already logged it into their system, regardless of whether the shipment is imported or returned — this is entirely at the discretion of Customs)
- Refund: issued once we receive and verify the returned package

Could you kindly confirm whether you'd like to:
1. Proceed with customs clearance and import the shipment, or
2. Return the shipment to Taiwan.

We'll follow your instructions accordingly. Thank you for your understanding.
```

> **Note (return economics):** When relevant, point out if return shipping exceeds the duty fee (e.g. "Return shipping is USD 64, which is higher than the import duty of USD 108"). When a package is refused and returned — provided products are not defective — the customer is responsible for both the return shipping cost and the original outbound shipping cost.

## 4.5 Shipment Returned — Unpaid Duties After Deadline
**When to use:** Deadline passed; parcel auto-returned.

```
Hi {{name}},

We're sorry to inform you that your shipment has been returned to our warehouse due to unpaid import duties after the deadline passed.

As previously mentioned, DHL had set {{date}} as the final date for duty payment, and since payment was not received before the cutoff, the shipment was automatically returned by Customs.

The following costs are incurred for returned shipments:
- Return shipping cost: {{amount}} (covered by the customer)
- Import duty fee: {{amount}} (may still apply if Customs has already logged it into their system, at the discretion of Customs)

A refund will be issued once we receive and verify the returned package, minus any applicable fees above.

Thank you very much for your understanding and patience.
```

## 4.6 Customs Inspection — Shipment Delayed
**When to use:** Parcel under customs review; declaration submitted.

```
Hi {{name}},

DHL contacted us regarding your shipment being processed at Customs (AWB {{awb}}).

We have submitted the Customs Declaration Document to DHL, who will forward it to Customs. The document explains the product ingredients, intended use, and enzyme manufacturing process, which should help facilitate clearance. The clearance deadline is {{date}}.

Please contact your local DHL to see if there are additional documents the receiver needs to submit. The inspection process typically takes 1–2 weeks once under review.

Thank you for your understanding and patience!
```

## 4.7 Product Declaration Document (sending it)
**When to use:** Attaching the customs declaration document.

```
Hi {{name}},

Please find attached the customs declaration document for your shipment. We have also shared this with DHL so they can forward it to local Customs, which should help facilitate clearance.

If Customs requires any additional paperwork or information from our side, please let us know and we'll prepare and submit it promptly.

Thank you for your patience and cooperation.
```

## 4.8 Export Customs — Passport Required (Incomplete Name)
**When to use:** Taiwan Export Customs requests passport due to incomplete name.

> **⚠️ Internal caution:** Passports are sensitive PII. Use only the official channel and assure secure handling. Direct the customer to email DHL's official address (e.g. `AP.DPSS.TEAM@dhl.com`) where applicable, including the AWB.

```
Hi {{name}},

We've been contacted by DHL regarding your shipment (AWB {{awb}}), currently being processed by Taiwan Export Customs.

Your package was dispatched on {{date}}; however, due to an incomplete recipient name ({{partial_name}}), Taiwan Export Customs has requested a passport copy for identity verification before releasing the shipment for export to {{country}}.

To avoid delays, kindly email a copy of your passport to {{customs_email}} and include your DHL tracking number (AWB {{awb}}) in the email.

Please rest assured your passport copy will be used solely for customs clearance purposes and handled securely and confidentially.

Thank you for your cooperation.
```

## 4.9 Import Duty Reference — HS Code 3507.90
**When to use:** Customer asks about duties/taxes for their country.

Our product is classified under **HS Code 3507.90** (Enzymes), base duty **6.3%**. Standard VAT applies per country. DHL may add a clearance service fee. Charges are set/collected by local customs, not included in shipping, and may be applied at random.

| Country | Duty (HS 3507.90) | Notes |
|---|---|---|
| Italy | 6.3% | + VAT |
| Germany | 0% | (see §6 FORGIVE/lactose restriction) |
| France | 0% | |
| UK | 0% | No VAT under £135; over £135 VAT may apply |
| Canada | 0% | Smooth clearance per experience; duty collected by courier |
| USA | 25% | De minimis ended Aug 29, 2025 — duties apply at all values |
| Netherlands | 0% or 6.3% | |
| Costa Rica | 1–15% | + 13% VAT, possible 1% Central Bank surcharge, import permit by receiver |
| Australia | — | + 10% GST; possible duties/handling; rare BICON permit (~1%) |

> **Note:** The Canada template references duty collected by FedEx in one instance — confirm the actual courier (DHL vs FedEx) before sending.

---

# 5. Country-Specific Shipping Policies

> **Quick status reference**

| Country | Status | Key requirement / note |
|---|---|---|
| USA | ✅ Ships | 5–7 days; de minimis ended Aug 29, 2025 |
| Canada | ✅ Ships | Lower declared value; duty only, usually smooth |
| Australia | ✅ Ships | 3–7 days; 10% GST; rare BICON permit (~1%) |
| UK | ✅ Ships | VAT over £135 |
| Norway | ✅ Ships | 5–7 days; free shipping over $549 |
| Colombia | ✅ Ships | Personal import; DHL advises on duties; no RUT needed |
| Costa Rica | ✅ Ships | No free shipping; many route via U.S. forwarder |
| Mexico | ⚠️ Indirect | Min order $549; routed via U.S. (Texas) then forwarded |
| Indonesia | ⚠️ Redirect | Offer domestic shipping from Bali office |
| Germany | ⚠️ Partial | No FORGIVE/RAINBOW (lactose) until lactose-free formula |
| Thailand | ⛔ Paused | Requires Thai FDA cert; packages destroyed without it |
| Spain | ⛔ Paused | Requires Sanitary Inspection document |
| Austria | ⛔ Paused | Classified as medicine; requires doctor's prescription |
| Belgium | ⛔ Paused | Shipments refused; suggest neighboring-country address |
| Slovenia | ⛔ Paused | Classified medicinal; no personal imports |
| South Africa / Portugal / Nigeria | ⛔ Paused | Requires food import license |
| Peru | ⚠️ Restricted | Requires prescription + DIGEMID endorsement |

## 5.1 Mexico — Minimum Purchase & Routing
**When to use:** Mexico order under threshold / explaining routing.

```
Hi {{name}},

Thank you for your order {{order_no}}.

Kindly note that orders shipping to Mexico require a minimum purchase of USD 549. You can review our full shipping policy here.

For Mexico-bound orders, we first ship your package to our U.S. logistics partner in Texas, and from there it is forwarded to Mexico. As a result, U.S. import duties and taxes may apply. DHL will send a secure payment link via SMS or email if any charges arise upon importation into the U.S. Kindly ensure timely payment so DHL can proceed.

Please note that tariffs for Mexico are already included at checkout.

Please let us know how you'd like to proceed — we're happy to assist either way.
```

## 5.2 Mexico — Departed Texas Warehouse (forwarding tracking)
```
Hi {{name}},

Your ZenCleanz order {{order_no}} has departed from our logistics partner's warehouse in Texas and is now on its way to your address in Mexico.

Updated tracking:
Paquetexpress Tracking Number: {{awb}}

You may track directly with Paquetexpress for the latest delivery updates. Let us know if you have any other questions!
```

## 5.3 Mexico — General Shipping Enquiry
**When to use:** Pre-purchase questions about Mexico.

```
Thank you for your interest in our products!

At this time, we do not ship directly to Mexico due to complex import regulations. Instead, we route Mexico-bound orders through the U.S., then work with a local shipper to transport the package to Mexico. Full details:
https://zencleanz.com/pages/zencleanz-page-special-shipping-requirments

To your questions:
1. Shipping Time: ~3 weeks. Free shipping does not apply, and a minimum order value of $549 USD is required.
2. Handling & Temperature: All shipments are marked with fragile handling icons. Enzyme products should not be exposed to temperatures above 45°C / 113°F for extended periods. If breakage occurs in transit, send us photos — once confirmed shipping-related, we'll gladly send a replacement.
3. Expiration Dates: Labels include an expiry date as EYYYYMMDD (e.g. E20260812 = August 12, 2026). Liquid enzymes have a 3-year shelf life; powders and capsules last 2 years.
4. Wholesale Pricing: We don't offer wholesale, but we have an affiliate program — affiliates get 15% off their own orders and earn up to 15% commission on referred sales (including their own).

If you're interested in becoming an affiliate or have more questions, reach out at customer.service@zencleanz.com!
```

## 5.4 Indonesia — Offer Domestic Shipping from Bali
**When to use:** Indonesian order; redirect to local Bali fulfillment.

```
Hi {{name}},

Thank you for your order {{order_no}}!

Due to complicated import regulations and high tariffs from Indonesian Customs, we generally avoid direct international shipments into Indonesia. Instead, we'd like to offer domestic shipping from our Bali office, which lets you receive your order faster and without additional paperwork.

Our website orders and Bali/Indonesia orders are processed through two different payment systems. If you agree to switch to domestic shipping, we'll refund your website order, including the {{amount}} shipping fee, for a total refund of {{amount}}.

After the refund, please make payment to our Indonesian account instead.

For reference:
- Current website price: {{amount}} (excluding shipping)
- Indonesia price: {{amount}} (includes shipping, customs duties we cover, and Gojek delivery to your home)

If this works, please message Tiffer on WhatsApp: +62 823 3960 2036, and she'll assist with the next steps. Thank you!
```

## 5.5 Indonesia — Customs Inspection in Progress
```
Hi {{name}},

Your shipment (AWB {{awb}}) is currently under inspection by Indonesian Customs. Have you received any document requests from DHL? Usually DHL sends a notification email instructing you to provide:
a) the E-BPOM form (we'll assist you in filling this out),
b) a copy of your passport/ID,
c) proof of transaction.

If you haven't received any request yet, no worries — this often means Customs may release your shipment in the next few days. If you do receive a request, once all documents are submitted Customs will review and release accordingly.

The standard inspection process may take 1–2 weeks. We're here to help with any part of the process!
```

## 5.6 Australia — General Shipping + BICON
**When to use:** Pre-purchase Australia enquiry.

```
Hi {{name}},

Thank you so much for your interest in our products!

We don't currently have a local distributor in Australia, but we ship directly from our Taiwan warehouse via DHL Express. Delivery typically takes 3–7 days, provided there are no customs delays. If your area is outside DHL's standard zone, the shipment may be handed to a third-party courier for final delivery, which can add about a week.

Shipping cost is calculated at checkout based on your address and order weight. We offer free shipping to Australia for orders over $549.

Shipments may be subject to import GST (10%), and in some cases customs duties or DHL handling fees, depending on Australian Customs' assessment. These are not included in the shipping fee and are collected by DHL before delivery.

In rare cases (~1% of shipments), the Australian Department of Agriculture, Fisheries and Forestry (DAFF) may require a BICON import permit, which must be applied for prior to shipment by the recipient at their own expense. The permit is valid for 5 years. If this occurs, we'll assist in returning the package to Taiwan and reshipping at no additional cost (permit fees are the recipient's responsibility).

The final decision always rests with Australian Customs. Please let us know if you have any other questions!
```

## 5.7 Canada — Duties Explanation
```
Hi {{name}},

We completely understand your concern.

Our product is classified under HS Code 3507.90 (Enzymes), and in many countries an import duty fee applies during clearance. To help minimize duty, we've already declared a lower value on the invoice. These taxes are collected directly by the courier and paid to Customs — ZenCleanz does not receive any part of this fee.

Based on our experience, Canadian Customs typically does not require additional documents; only the import duty tax applies. Import regulations may update over time, but under current Canadian policies our orders have been delivered smoothly.

Please don't hesitate to reach out with any other questions!
```

## 5.8 USA — General Shipping
```
Thank you for your interest in our products!

There are no current issues shipping to the USA. Orders are typically delivered within 5–7 days from Taiwan, given no customs delays.

Please note, starting August 29, 2025, the U.S. government ended the USD 800 de minimis policy. This means additional duties and taxes may apply to all imports regardless of value, and it could affect delivery times — but for now shipments are moving normally.
```

## 5.9 Costa Rica — Direct vs U.S. Forwarder
```
Thank you for your interest in our products!

We can ship directly to Costa Rica, but it isn't eligible for our free shipping policy. Most Costa Rican customers ship to a U.S. address (a friend's, or a freight forwarder, often in Florida), then pay a local logistics provider to forward the package — taking advantage of free shipping from Taiwan to the U.S.

Two forwarding services you can check:
- UCL: https://www.uclogisticscr.com/en/carga-aerea
- ITG: http://www.shiptocr.com/home.html

If you prefer direct shipping to Costa Rica, potential charges/prep:
- HS Code: 3507.90
- Import Duty: 1–15% (non-U.S. origin products)
- VAT: 13%
- Other Fees: possible 1% Central Bank surcharge + DHL service/clearance fees
- Import Permit: arranged by the receiver
- Shipping cost: e.g. $188.20 for RAINBOW x1 to San José (varies by zip code)

Let us know if you have other questions!
```

## 5.10 Colombia — Personal Import
```
Thank you for your interest in our products!

We do ship to Colombia, though not in large volume, so requirements may vary. For reference, a recent Colombian customer reported the customs process went smoothly: DHL informed them of duties in advance, which they paid directly. The shipment was handled as a personal import — being a registered importer was not required, and a RUT was not mandatory. No documents beyond standard courier requirements were requested.

We recommend contacting your local DHL agent for the most up-to-date, country-specific guidance, since we ship via DHL.

Local customs may apply duties/taxes per local regulations; these are outside our control and may be applied at random. Happy to help with any questions!
```

## 5.11 Norway / Rest of World — General
```
Thank you for your interest in ZenCleanz!

Orders to {{country}} are typically shipped directly from Taiwan via DHL Express. Delivery usually takes around 5–7 days after dispatch, provided there are no customs delays. Orders over $549 are eligible for free shipping.

Please note that local customs authorities reserve the right to impose duties and taxes per local regulations. These charges may be applied at random, are not included in the shipping fee, and are collected by DHL.
```

## 5.12 UK — VAT & Duties
```
Thank you for your interest in our products!

For shipments entering the UK, import VAT applies to declared invoice values over £135. UK Customs may also assess import duties depending on classification (HS code 3507.90). In most cases duties are low or zero; however, this is ultimately determined by UK Customs.

Please note import VAT, any applicable duties, and DHL handling fees are not included in the shipping fee and will be collected by DHL prior to delivery.

Feel free to reach out with any other questions!
```

## 5.13 Paused — Thailand
```
Thank you so much for your interest!

We've paused shipments to Thailand at the moment. Thai Customs now requires Thai FDA certification for our products. Without it, they will destroy the packages on the spot, and returns are not allowed. We are not registered with the Thai FDA, and some shipments were destroyed in the past year — which is why we've stopped shipping there for now.

If you have travel plans to another country soon, we can help check shipping options for that destination.
```

## 5.14 Paused — Spain
```
Thank you for your interest in our products!

We've temporarily paused shipments to Spain because our products (HS Code 3507.90) are classified under the food category. For food imports into Spain, the receiver must provide a Sanitary Inspection document, which based on our experience only certain businesses can obtain.

You may consult local import agents who can assist with the document. Without it, there's a high risk the shipment could be rejected or returned.

If you'd still like to try, we can re-enable Spain for you — but if the shipment is rejected or destroyed by Customs, we wouldn't be able to cover the cost. Alternatively, we recommend shipping to a country where someone you trust can personally carry the products to Spain.

Let us know how you'd like to proceed.
```

## 5.15 Paused — Austria
```
Thank you for your interest in our products!

We've temporarily paused shipments to Austria because our products (HS Code 3507.90) are classified under the medicine category. For imports into Austria, the receiver must provide a doctor's prescription.

We recommend consulting a local import agent for guidance. Without the prescription, there's a high risk the shipment could be rejected or returned.

If you'd still like to proceed, we can re-enable Austria — but if the shipment is rejected or destroyed, we wouldn't be able to cover the cost. We'll re-enable Austria once our Luxembourg warehouse becomes operational, allowing smoother EU shipping.

We sincerely apologize for the inconvenience and appreciate your understanding.
```

## 5.16 Paused — Belgium
```
Thank you for your interest in our product!

We've paused shipping to Belgium due to local customs regulations that have recently led to shipments being refused.

If you have an alternative address in another European country (France, Netherlands, Germany, etc.), we'd be happy to ship there. Many of our Belgian clients use a friend's or family member's address in a neighboring country, or collect from a DHL service point across the border.

Hope this helps!
```

## 5.17 Paused — Slovenia
```
Thank you for your interest in our products!

We've temporarily paused shipping to Slovenia due to updated local customs regulations. Slovenian customs currently classify our products as medicinal items and do not allow personal imports — shipments are being confiscated, and returns are not permitted.

We'll re-enable Slovenia once our Luxembourg warehouse becomes operational, allowing smoother EU shipping.

We sincerely apologize for the inconvenience and appreciate your patience.
```

## 5.18 Paused — South Africa / Portugal / Nigeria
```
Thank you for your interest in our products!

We've temporarily paused shipping to {{country}} due to updated local customs regulations requiring a food import license. This has resulted in shipments being refused.

We recommend consulting a local import agent for guidance on the required documentation. If you'd still like to proceed, we can enable {{country}} for you — but if the shipment is rejected or destroyed by Customs, we wouldn't be able to cover the associated costs.

Please reach out with any questions!
```

## 5.19 Peru — Prescription / DIGEMID
```
Thank you for your interest in our products!

Based on our experience, Peruvian Customs typically requires a prescription issued by a Peruvian doctor and endorsement by the Health Organism (DIGEMID). Otherwise, they cannot allow the shipment to enter.

Could you confirm whether you're able to provide such a document?
```

## 5.20 Germany — FORGIVE/RAINBOW Rejected (Lactose)
**When to use:** EU/German order containing FORGIVE or RAINBOW.

```
Hi {{name}},

We regret to inform you that your recent order (AWB {{awb}}) was rejected by German Customs. The reason: the FORGIVE kit contains concentrated apple and pineapple powder with lactose — an ingredient currently prohibited for import. Despite updating our labels, German Customs continues to deny such shipments.

While some FORGIVE orders have cleared without issue, we do not recommend ordering FORGIVE or RAINBOW to EU countries until our new lactose-free formula becomes available (around June/July).

In the meantime, we'd be happy to issue a full refund — or resend, if you'd prefer. Please let us know how you'd like to proceed.

Wishing you a beautiful day and thank you for your understanding!
```

## 5.21 Wrong Shipping Country → Additional Fee
**When to use:** Wrong country at checkout removed an applicable shipping fee.

```
Hi {{name}},

We noticed your shipping address had the country set incorrectly as {{wrong_country}}. We've now updated it to {{correct_country}}.

Previously, with {{wrong_country}} selected, your order qualified for free shipping (free-shipping threshold of USD {{amount}}), so no fee was applied. After correcting the country, a shipping fee of USD {{amount}} now applies.

We'll send a secure payment link for the shipping fee shortly. Once paid, we'll ship your order right away. Please let us know if you have any questions!
```
**Follow-up after payment:**
```
We have received your payment — our warehouse will start preparing your order. Once shipped, you'll receive a notification email with the DHL tracking number (AWB). Wishing you a beautiful day!
```

---

# 6. Delivery Problems

## 6.1 Cannot Select Signature Release (greyed out)
**When to use:** Customer can't enable leave-at-door / signature waiver.

```
Thank you for your message — that's a valid question.

For certain delivery areas and postcodes, DHL's system automatically disables ("greys out") the signature release / leave-at-door option due to a higher history of lost or stolen packages in those locations. This is applied automatically by DHL to avoid disputes and protect both recipients and senders — which is why you may not be able to select the signature waiver yourself in DHL On Demand Delivery.

Please also note: if a package is authorized to be left without signature, DHL is generally no longer liable for loss, theft, or damage after delivery is completed.

For this reason, if signature-free delivery becomes available, we strongly recommend:
- selecting a very secure drop-off location (let us know the instructions and we'll inform DHL), and/or
- having a doorbell/security camera available if possible

We completely understand the inconvenience and appreciate your understanding of DHL's security policies. Let us know if there's anything else we can help with.
```

## 6.2 Signature Release — Package Not Received
**When to use:** Customer chose leave-at-door and reports it missing.

```
We're sorry to hear this.

DHL is not liable for loss/damage/theft of the package after it has completed delivery and left it in the agreed place (e.g. front door). Next time, we suggest receiving the package in person and requesting a delivery time slot convenient for you.

For the missing package, if you have any doorbell camera footage or CCTV, we advise filing a report with the police.

Sadly, we cannot compensate for the missing package, as the courier placed it as requested and completed the delivery.

Signature release clause: https://del.dhl.com/terms-of-use.xhtml?ctrycode=us&langcode=en
```

## 6.3 Missing Package — Investigation Opened
**When to use:** Package missing (not signature-release waived).

```
Hi {{name}},

We're truly sorry to hear that your package is missing, and we understand how frustrating this must be. Please rest assured we'll prioritize your case and resolve it as quickly as possible.

We've already reached out to DHL to investigate, and we'll update you as soon as we receive more information. Thank you for reaching out!
```

## 6.4 Delivered but Not Received — Gather Details
**When to use:** Tracking shows delivered; customer didn't get it.

```
Thank you for bringing this to our attention.

We've already contacted DHL to initiate an investigation regarding the missing {{items}}. To help guide it, could you kindly share a few details?
1. Did you authorize the courier to leave the package in a safe place (doorstep, mailbox, concierge)?
2. Or was a signature required upon delivery?

In some cases the courier may have delivered to a neighboring or incorrect address — if so, DHL will attempt to locate and redeliver to you.

The investigation may take 1–2 weeks, and we truly appreciate your patience. If you have any additional information that may assist, please share it with us.
```

---

# 7. Returns & Refunds

## 7.1 How to Return
**When to use:** Customer wants to return an item.

```
Hi {{name}},

To proceed with the return, please make sure the items are unused, unopened, in the same condition you received them, and in their original packaging.

You can arrange the return with any shipping provider of your choice to the address below. Kindly declare the value as shown on the original DHL commercial invoice ({{item}}: {{amount}}) and label the product description as "flavored fruit and vegetable drinks."

Return address:
Daniel Taillefer
No. 1-125, Laiganliao, Jiali Dist, Tainan City
722, Taiwan
Phone: 06-7261476
Email: distribution@zencleanz.com

Once the return is arranged, kindly share the tracking number so we can confirm it's your package. Your refund will be processed once we receive and verify the returned package.

Thank you for your understanding!
```

## 7.2 Return Policy / Window
**When to use:** Explaining the change-of-mind window.

```
Our return policy allows customers to return products within seven (7) days of delivery if they change their mind. We're happy to extend it to {{date}} for you.

Please note that return shipping costs are the customer's responsibility, and the outbound shipping fee is non-refundable. Your refund will be processed once we receive and verify the returned package.
```

## 7.3 No Refund After Products Consumed
**When to use:** Customer requests refund after using the product.

```
Our refund policy applies to products returned within 7 days of receipt.

Unfortunately, we do not offer refunds for products that have been consumed, even if you're unsatisfied with the experience.

You can review our full return policy here:
https://zencleanz.com/pages/return-and-refund-policy

For your other questions, a member of our team will get back to you shortly.
```

---

# 8. Product Damage & Quality

## 8.1 Product Damaged — Request Evidence
**When to use:** Customer reports damage; open the claim.

```
We sincerely apologize for the challenges you've faced. Please know we're committed to ensuring you have a positive experience with our product and support.

To help us understand what happened, could you take some photos of any leftover packaging and send them along with a description of your experience? Specifically:
- Did you notice any damage to the shipping box or the kit box?
- What did you observe when you opened the kit?
- Were you able to identify how the item might have been damaged?

Your feedback is invaluable for preventing similar issues. Thank you for your cooperation!
```

## 8.2 Bottle Leaked — Reassurance + Goodwill
**When to use:** Minor leak reported, product still sealed.

```
Thank you for sharing the photo with us.

We're really sorry for the inconvenience. Based on our experience and quality checks, as long as the bottle cap is sealed tightly and there's no unusual smell or change in color, the product is still safe to consume.

The small leak most likely occurred due to high pressure during air transport or handling in transit. As a token of our appreciation, we'd love to include a small gift with your next order — simply write "Free Gift Ticket {{ticket_no}}" in the special instructions to seller.

We truly appreciate your understanding and continued support!
```

---

# 9. Product Information

## 9.1 Product Storage
```
If the product is in liquid form, store it in the refrigerator only if you won't finish it within one month after opening. If you expect to consume it within a month, refrigeration isn't necessary — simply keep it at room temperature.

For powders and capsules, store them indoors away from direct sunlight. Room temperature is perfectly fine.
```

## 9.2 Product Shelf Life & Expiry Format
```
Thank you for your message — that's a very valid question.

Our detox kits, including ONE and FORGIVE, have a shelf life of 2 years. The expiry date is printed on the back of each kit box under "BEST BEFORE" in the format YYYY/MM/DD.

(Some labels use the code format EYYYYMMDD = "Expire by." Example: E20260812 = August 12, 2026. Liquid enzymes: 3-year shelf life. Powders/capsules: 2 years.)

For best quality, store products in a cool, dark place and avoid direct sunlight.

Before starting, please check all components in your kit. If anything is damaged or missing, contact us with clear photos and we'll arrange a replacement right away.
```

## 9.3 Kit Contents Checklists
**When to use:** Confirming what should be in each kit.

```
ONE Kit
- Meal Powder x8
- Ambrosia 60ml x3
- Fiber Crystals x1

FORGIVE Kit
- EASING FORMULA Powder x4
- CLEANSING FORMULA Powder x6
- Hygieia 60ml x3
- Flush Formula A x1
- Flush Formula B x1
```

> **Note:** A second source lists FORGIVE as "10 sachets Meal Powder, 3 Hygieia, 1 Olive Oil, 1 Mixed Juice." Verify current kit composition before quoting.

## 9.4 Packing Tips (traveling with bottles)
```
By "packing tips," we mean how to protect the glass bottles if you're flying with them in luggage. A few tips for safe transport:

1. Wrap each bottle individually in thick clothing (sweaters/towels) or bubble wrap to cushion impact.
2. Place bottles upright, if possible, in the center of the suitcase, surrounded by soft items on all sides.
3. Avoid corners or suitcase edges where pressure is higher.
4. Double-bag bottles in zip-lock or plastic bags to prevent leakage affecting other items.
5. Make sure the 750ml bottle (HYGIEIA) is especially well-padded, as it's the heaviest.

Hope this helps! Let us know if you have other questions!
```

---

# 10. Pricing & Fees

## 10.1 Abnormal Shipping Fee (system glitch)
**When to use:** Checkout showed an inflated shipping rate.

```
Thank you for bringing this to our attention and for your kind words.

You're absolutely right — shipping {{items}} to {{country}} should not incur a fee of {{amount}}, and we truly appreciate you alerting us.

This was caused by a system error: the connection between DHL and our website temporarily disconnected, causing a backup shipping rate to apply. This glitch typically lasts 3–5 minutes. Please try again at checkout — the shipping fee should be back to the correct rate now.

We've also received similar reports and have asked DHL to investigate the root cause. We sincerely apologize for the inconvenience.

If you experience any issues during or after future purchases, please don't hesitate to reach out.
```

## 10.2 Affiliate Program (no wholesale)
**When to use:** Customer asks about wholesale/bulk pricing.

```
We currently don't offer wholesale pricing, but we do have an affiliate program. Affiliates receive 15% off their own orders and earn up to 15% commission on every sale they refer, including their own.

If you're interested in becoming an affiliate, reach out at customer.service@zencleanz.com!
```

---

# Appendix A — Key Facts & Constants

- **HS Code:** 3507.90 (Enzymes), base duty 6.3%
- **U.S. de minimis:** USD 800 policy ended **August 29, 2025** — duties may apply to all imports regardless of value
- **Free shipping threshold:** USD 549 (most countries); Taiwan domestic USD 258
- **Mexico minimum order:** USD 549
- **Temperature limit:** Enzyme products should not exceed 45°C / 113°F for extended periods
- **Shelf life:** Liquid enzymes 3 years; powders/capsules & kits 2 years
- **Expiry formats:** `EYYYYMMDD` ("Expire by") on product labels; `YYYY/MM/DD` under "BEST BEFORE" on kit boxes
- **Return address:** Daniel Taillefer, No. 1-125, Laiganliao, Jiali Dist, Tainan City 722, Taiwan — Phone 06-7261476, distribution@zencleanz.com
- **Return declaration:** Declare invoice value; describe goods as "flavored fruit and vegetable drinks"
- **Return window:** 7 days from delivery (change of mind); no refunds on consumed products
- **Legal entity:** Strong Pulses International Co. Ltd. (not responsible for customs/taxes)
- **Future:** U.S. warehouse and Luxembourg (EU) warehouse in progress — will smooth U.S. and EU shipping

# Appendix B — Useful Links

- Special shipping requirements: https://zencleanz.com/pages/zencleanz-page-special-shipping-requirments
- Return & refund policy: https://zencleanz.com/pages/return-and-refund-policy
- DHL signature release terms: https://del.dhl.com/terms-of-use.xhtml?ctrycode=us&langcode=en
- DHL payment link (clearance): https://del.dhl.com/shipment-options.xhtml?locale=en-US
- Costa Rica forwarders — UCL: https://www.uclogisticscr.com/en/carga-aerea | ITG: http://www.shiptocr.com/home.html
- Indonesia (Bali) contact — Tiffer WhatsApp: +62 823 3960 2036

# Appendix C — Notes & Inconsistencies to Verify

These appeared inconsistently in the source material — confirm the live value before sending:
1. **Duty-payment deadlines** varied across examples (Oct 11 / Oct 24) — always use the date DHL specifies for the actual shipment.
2. **Return shipping costs** varied widely ($64 / $79 / $324) — quote the real quote for the specific lane.
3. **Courier for Canada** referenced both DHL and FedEx — confirm actual courier.
4. **FORGIVE kit contents** differ between two source sections — verify current composition.
5. **Germany duty** listed as 0% but FORGIVE/RAINBOW are restricted due to lactose — these are separate issues; don't conflate.

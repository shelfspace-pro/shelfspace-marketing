// The ONE content source for the four free templates (SEO row C3, 10/29/2026).
// scripts/build-templates.mjs renders each document three ways from these blocks: the .docx, the .pdf
// and the preview on /templates/<slug>. Edit here, then run `npm run build:templates`;
// `npm run check:assets` fails when a rendered file or preview no longer matches this source.
//
// Block types: h (heading), p (paragraph), f (fill-in line: label), fs (several fill-in lines),
// table (head + blank rows), sig (signature lines), disc (the disclaimer; required, exactly once, last).
// Generic business wording only: nothing here states a state law, and every document says so.

export const DISCLAIMER = "Not legal advice — have your counsel review it before you use it.";
export const CREDIT = (slug) => `Free template from ShelfSpace · shelfspace.pro/templates/${slug}`;

export const TEMPLATES = [
  {
    slug: "dispensary-credit-application",
    title: "Dispensary Credit Application",
    blocks: [
      { t: "p", x: "Complete this application to request wholesale credit terms from the seller named below. The seller reviews every application and may approve, limit or decline credit." },
      { t: "f", x: "Seller (your company)" },
      { t: "h", x: "1. Business information" },
      { t: "fs", x: ["Legal business name", "Trade name (DBA)", "State cannabis license number(s)", "License type and expiration date", "Store address", "Billing address (if different)", "Federal tax ID (EIN)", "Year the business started", "Business type (LLC, corporation, other)"] },
      { t: "h", x: "2. Owners and contacts" },
      { t: "fs", x: ["Owner name, title and percentage owned", "Owner name, title and percentage owned", "Buyer name, email and phone", "Accounts payable contact, email and phone", "Email for invoices"] },
      { t: "h", x: "3. Credit requested" },
      { t: "fs", x: ["Payment terms requested", "Credit limit requested", "Expected monthly purchases", "How you will pay (e-check, ACH, check)"] },
      { t: "h", x: "4. References" },
      { t: "p", x: "List your bank and at least two suppliers you buy from on terms." },
      { t: "table", head: ["Reference", "Contact name", "Phone or email", "Account since"], rows: 4 },
      { t: "h", x: "5. Terms the applicant accepts" },
      { t: "p", x: "If credit is approved, the applicant agrees to pay every invoice by its due date under the seller's payment terms in effect when the invoice is issued." },
      { t: "p", x: "When an invoice is past due, the seller may hold new orders, ship them cash on delivery, lower the credit limit or end credit terms." },
      { t: "p", x: "Late fees, interest and collection costs apply only where a signed agreement provides for them and the law allows them." },
      { t: "p", x: "The applicant will tell the seller in writing within ten business days of a change in ownership, a change to its license status, or a sale of the business." },
      { t: "h", x: "6. Authorization" },
      { t: "p", x: "The applicant authorizes the seller to contact the references above and to obtain business credit reports to evaluate this application, now and while the account is open. The information in this application is true and complete." },
      { t: "sig", x: ["Signature", "Printed name and title", "Date (MM/DD/YYYY)", "Company"] },
      { t: "h", x: "For the seller" },
      { t: "fs", x: ["Approved terms and credit limit", "Approved by and date (MM/DD/YYYY)"] },
      { t: "disc" },
    ],
  },
  {
    slug: "payment-plan-agreement",
    title: "Payment Plan Agreement",
    blocks: [
      { t: "p", x: "This agreement sets a schedule for paying a past-due balance in installments. It is between the seller and the buyer named below." },
      { t: "fs", x: ["Seller", "Buyer (legal name)", "Buyer's state cannabis license number", "Date of this agreement (MM/DD/YYYY)"] },
      { t: "h", x: "1. The balance" },
      { t: "p", x: "The buyer agrees that it owes the seller the balance below for the invoices listed, and that the balance is not in dispute." },
      { t: "fs", x: ["Total balance owed", "Invoice numbers covered"] },
      { t: "h", x: "2. Payment schedule" },
      { t: "p", x: "The buyer will pay the balance in the installments below, each on or before its due date." },
      { t: "table", head: ["Payment", "Due date (MM/DD/YYYY)", "Amount", "Paid on"], rows: 6 },
      { t: "f", x: "Payment method (e-check, ACH, check)" },
      { t: "p", x: "The buyer may pay early or pay more than an installment at any time without penalty." },
      { t: "h", x: "3. If a payment is missed" },
      { t: "p", x: "If an installment is not paid within the grace period below after its due date, the seller may treat the whole remaining balance as due right away and stop the plan." },
      { t: "f", x: "Grace period (days)" },
      { t: "h", x: "4. New orders during the plan" },
      { t: "p", x: "Choose one: [ ] New orders ship on the buyer's normal terms while the plan is current. [ ] New orders ship cash on delivery until the balance is paid." },
      { t: "h", x: "5. Everything else" },
      { t: "p", x: "Except for the schedule above, the original invoices and the parties' existing terms still apply. The seller does not give up any right by accepting a late or partial payment. Changes to this agreement must be in writing and signed by both parties." },
      { t: "sig", x: ["Seller signature", "Buyer signature", "Printed name and title", "Printed name and title", "Date (MM/DD/YYYY)", "Date (MM/DD/YYYY)"] },
      { t: "disc" },
    ],
  },
  {
    slug: "personal-guaranty",
    title: "Personal Guaranty",
    blocks: [
      { t: "p", x: "In this guaranty, an owner of a business personally promises to pay what the business owes the seller if the business does not pay. Sellers usually ask for it before extending credit terms to a new account." },
      { t: "fs", x: ["Seller", "Business (the buyer)", "Guarantor (full legal name)", "Guarantor's home address", "Guarantor's relationship to the business", "Date (MM/DD/YYYY)"] },
      { t: "h", x: "1. The promise" },
      { t: "p", x: "In exchange for the seller extending credit to the business, the guarantor personally guarantees prompt payment of every amount the business owes the seller for goods sold on credit, now or later." },
      { t: "f", x: "Maximum amount guaranteed (leave blank for no cap)" },
      { t: "h", x: "2. How it works" },
      { t: "p", x: "If the business does not pay an amount when due, the seller may ask the guarantor to pay it. The seller does not have to collect from the business first." },
      { t: "p", x: "This guaranty continues while the business buys from the seller on credit. The seller may change payment terms, extend due dates or accept partial payments without ending it." },
      { t: "h", x: "3. Ending the guaranty" },
      { t: "p", x: "The guarantor may end this guaranty for future orders by written notice to the seller. It still covers every amount owed for orders shipped before the seller received the notice." },
      { t: "h", x: "4. Other terms" },
      { t: "p", x: "If more than one person signs a guaranty for the business, each is responsible for the full amount. Changes to this guaranty must be in writing and signed by the guarantor and the seller." },
      { t: "sig", x: ["Guarantor signature", "Printed name", "Date (MM/DD/YYYY)", "Witness or notary, if your counsel requires one"] },
      { t: "disc" },
    ],
  },
  {
    slug: "promise-to-pay-letter",
    title: "Promise to Pay Letter",
    blocks: [
      { t: "p", x: "The buyer fills in and signs this letter to commit to a date for paying a past-due balance. The seller keeps the signed copy with the account." },
      { t: "fs", x: ["Date (MM/DD/YYYY)", "To (seller)", "From (buyer, legal name)", "Buyer's state cannabis license number"] },
      { t: "h", x: "Re: past-due balance" },
      { t: "p", x: "We acknowledge that we owe you the amount below for the invoices listed, and that the amount is correct." },
      { t: "fs", x: ["Amount owed", "Invoice numbers"] },
      { t: "p", x: "We promise to pay it as follows:" },
      { t: "table", head: ["Pay by (MM/DD/YYYY)", "Amount", "Method (e-check, ACH, check)"], rows: 3 },
      { t: "p", x: "If we cannot make a payment on the date above, we will tell you in writing before that date. We understand that if a promised payment is missed, you may hold new orders or ship them cash on delivery, and may pursue the balance under our existing terms." },
      { t: "sig", x: ["Signature", "Printed name and title", "Company", "Phone or email"] },
      { t: "disc" },
    ],
  },
];

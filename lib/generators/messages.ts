import type { AppSettings, BusinessInfo, MessageTone, SalesMessages } from "@/lib/types";

function toneLead(tone: MessageTone) {
const leads: Record<MessageTone, string> = {
Friendly: "I came across your business and liked how clearly your work comes through.",
Direct: "I reviewed the online information available for your business and saw a clear website opportunity.",
Premium: "Your business has the ingredients for a much stronger premium online presentation.",
"Soft sell": "I wanted to share a small idea that may be useful for your online presence.",
Confident: "I can see a strong opportunity to make your online presentation clearer, more polished, and more conversion-focused.",
"Local business friendly": "I enjoy seeing local businesses present their work well, and yours caught my attention.",
};

return leads[tone];
}

function observation(info: BusinessInfo) {
if (info.painPoints) return info.painPoints;

if (!info.websiteUrl) {
return "From the information I had, I could not find a clear website link where customers can quickly review the offer and contact you.";
}

return "I noticed an opportunity to make the mobile service journey, visual presentation, and main contact action more immediate.";
}

function priceLine(info: BusinessInfo) {
return info.packagePrice
? `The website package shown here starts at ${info.packagePrice}, subject to final scope.`
: "I can outline the package and scope after you review the concept.";
}

function demoLine(info: BusinessInfo) {
return info.demoUrl
? `You can view the website here: ${info.demoUrl}`
: "I can send the website link as soon as the preview is deployed.";
}

function categoryAngle(info: BusinessInfo) {
const category = `${info.category} ${info.services}`.toLowerCase();
if (/(restaurant|cafe|food|catering)/.test(category)) {
return "The direction focuses on atmosphere, menu clarity, reservations, and making the next visit easy to plan.";
}
if (/(funeral|memorial|tribute|cremation)/.test(category)) {
return "The direction keeps the tone calm, respectful, and easy for families to understand.";
}
if (/(auto|mechanic|detailing|repair)/.test(category)) {
return "The direction makes services, trust signals, and estimate requests much easier to act on.";
}
if (/(dental|clinic|medical|wellness)/.test(category)) {
return "The direction focuses on patient clarity, comfort, and a simpler appointment path.";
}
if (/(artist|music|violin|band|dj)/.test(category)) {
return "The direction is built around a stronger portfolio, media presence, and booking path.";
}
if (/(3d|printing|product|prototype)/.test(category)) {
return "The direction makes custom work, product categories, and quote requests easier to understand.";
}
return "The direction is built to make the offer clearer, more premium, and easier to contact from mobile.";
}

export function generateSalesMessages(
info: BusinessInfo,
tone: MessageTone,
settings: AppSettings,
): SalesMessages {
const name = info.businessName || "your business";
const sender = settings.senderName || "Chad";
const company = settings.companyName || "Niche Technologies";
const intro = toneLead(tone);
const specificObservation = observation(info);
const price = priceLine(info);
const link = demoLine(info);
const angle = categoryAngle(info);

return {
whatsapp: `Hi ${name}, ${intro}

${specificObservation}

I created a custom website direction to show how the business could look with clearer services, stronger mobile presentation, premium visuals, and an easier contact path. ${angle}

${link}

${price}

Would you be open to taking a quick look and telling me what you think?

${sender}
${company}`,

emailSubject: `Private website concept for ${name}`,

email: `Hi ${name},

${intro}

${specificObservation}

I prepared a custom website direction for your business. It is designed to make the offer easier to understand, improve the mobile experience, strengthen the visual presentation, and give prospective customers a clearer next step.

${angle}

${link}

${price}

If the direction feels useful, I would be happy to walk you through what is included and tailor it to your real content.

Regards,
${sender}
${company}
${settings.mailingAddress ? `${settings.mailingAddress}\n` : ""}
If you would prefer not to receive another message from me, just let me know.`,

dm: `Hi ${name}. ${specificObservation} I made a polished website direction to show a clearer customer path for the business. ${info.demoUrl ? `Website: ${info.demoUrl}` : "I can send the preview link once it is live."} ${price} Open to a quick look? - ${sender}, ${company}`,

facebook: `Hi ${name}, I came across your business and prepared a custom website direction that could make the offer clearer and easier to contact from mobile. ${angle} ${info.demoUrl ? `Here is the link: ${info.demoUrl}` : "I can share the link once it is live."} Would you be open to reviewing it? - ${sender}, ${company}`,

followUp: `Hi ${name}, just following up on the website direction I prepared. ${info.demoUrl ? `Here is the link again: ${info.demoUrl}` : "I can send the live link whenever convenient."} No pressure at all; I would value your honest feedback.`,

followUp2: `Hi ${name}, I wanted to check once more in case the website direction is useful. ${info.demoUrl ? `The link is here: ${info.demoUrl}` : "I can share the link if you would like to see it."} The main idea is a clearer, more premium path for customers to understand the offer and contact you.`,

finalFollowUp: `Hi ${name}, one last note from me about the website direction. ${info.demoUrl ? `The link is here if you would still like to see it: ${info.demoUrl}` : "I am happy to share the preview if it becomes useful."} I will close the loop after this, but you are welcome to reach out anytime. - ${sender}, ${company}`,

};
}

export function generateFollowUpMessage(
info: BusinessInfo,
settings: AppSettings,
final = false,
) {
const messages = generateSalesMessages(info, "Soft sell", settings);
return final ? messages.finalFollowUp : messages.followUp;
}

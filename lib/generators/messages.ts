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
? `You can view the private concept here: ${info.demoUrl}`
: "I can send the private concept link as soon as the preview is deployed.";
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

return {
whatsapp: `Hi ${name}, ${intro}

${specificObservation}

I created a private, custom website concept to show how the business could look with clearer services, stronger mobile presentation, premium visuals, and an easier contact path.

${link}

${price}

Would you be open to taking a quick look and telling me what you think?

${sender}
${company}`,

emailSubject: `Private website concept for ${name}`,

email: `Hi ${name},

${intro}

${specificObservation}

I prepared a private website concept for your business. It is designed to make the offer easier to understand, improve the mobile experience, strengthen the visual presentation, and give prospective customers a clearer next step.

${link}

${price}

If the direction feels useful, I would be happy to walk you through what is included and tailor it to your real content.

Regards,
${sender}
${company}
${settings.mailingAddress ? `${settings.mailingAddress}\n` : ""}
If you would prefer not to receive another message from me, just let me know.`,

dm: `Hi ${name}. ${specificObservation} I made a private website concept to show a clearer, more polished direction for the business. ${info.demoUrl ? `Preview: ${info.demoUrl}` : "I can send the preview link once it is live."} ${price} Open to a quick look? - ${sender}, ${company}`,

followUp: `Hi ${name}, just following up on the private website concept I prepared. ${info.demoUrl ? `Here is the preview again: ${info.demoUrl}` : "I can send the live preview whenever convenient."} No pressure at all; I would value your honest feedback.`,

finalFollowUp: `Hi ${name}, one last note from me about the website concept. ${info.demoUrl ? `The preview is here if you would still like to see it: ${info.demoUrl}` : "I am happy to share the preview if it becomes useful."} I will close the loop after this, but you are welcome to reach out anytime. - ${sender}, ${company}`,

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

export function visualProfile(category: string) {
const lower = category.toLowerCase();

const profiles = [
{
match: /(auto|mechanic|vehicle|car|detailing)/,
mood: "Precision, care, and a finish worth noticing.",
hero: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1400&q=84",
],
alt: "Premium vehicle presented in refined light",
},
{
match: /(flor|flower|wedding|event)/,
mood: "Thoughtful details, beautiful presentation, and moments made memorable.",
hero: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1507501336603-6e31db2be093?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1469259943454-aa100abba749?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=1400&q=84",
],
alt: "Artfully arranged flowers in refined natural light",
},
{
match: /(restaurant|cafe|food|bakery|catering)/,
mood: "An inviting experience shaped by flavor, atmosphere, and attention to detail.",
hero: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=1400&q=84",
],
alt: "Welcoming restaurant interior with thoughtful lighting",
},
{
match: /(dental|clinic|medical|health|wellness)/,
mood: "Modern care, clear guidance, and a calmer customer experience.",
hero: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1588776813677-77aaf5595b83?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=84",
],
alt: "Bright, modern care environment",
},
{
match: /(salon|barber|beauty|spa|makeup)/,
mood: "Personal style, considered service, and confidence in every detail.",
hero: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1519415943484-9fa1873496d4?auto=format&fit=crop&w=1400&q=84",
],
alt: "Polished salon interior with modern styling",
},
{
match: /(real estate|interior|architect|construction|contractor|home)/,
mood: "Spaces and projects presented with clarity, confidence, and strong visual intent.",
hero: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=84",
],
alt: "Refined contemporary interior with architectural detail",
},
{
match: /(pet|veterinary|animal)/,
mood: "Helpful service, genuine care, and an experience built around pets and their people.",
hero: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1400&q=84",
],
alt: "Happy pet in warm natural light",
},
{
match: /(3d|printing|prototype|custom product|sign)/,
mood: "Ideas shaped into useful, physical, memorable products.",
hero: "https://images.unsplash.com/photo-1631004191764-4c60c34e2313?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1611117775350-ac3950990985?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1631004191764-4c60c34e2313?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1611117775350-ac3950990985?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1581093458791-9d42cc5484a3?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1581091215367-59ab6f01d339?auto=format&fit=crop&w=1400&q=84",
],
alt: "Modern fabrication and product prototyping workspace",
},
];

return (
profiles.find((profile) => profile.match.test(lower)) ?? {
mood: "Professional service, clear next steps, and a presentation built around trust.",
hero: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=84",
],
alt: "Professional modern workspace",
}
);
}

export function schemaType(category: string) {
const lower = category.toLowerCase();

if (/(restaurant|cafe|food|bakery)/.test(lower)) return "Restaurant";
if (/(dental|dentist)/.test(lower)) return "Dentist";
if (/(auto|mechanic|vehicle|car|detailing)/.test(lower)) return "AutoRepair";
if (/(salon|beauty|spa|barber)/.test(lower)) return "BeautySalon";
if (/(real estate)/.test(lower)) return "RealEstateAgent";
if (/(pet|veterinary)/.test(lower)) return "PetStore";
if (/(funeral|memorial)/.test(lower)) return "LocalBusiness";
if (/(3d|printing|prototype|sign)/.test(lower)) return "ProfessionalService";

return "ProfessionalService";
}

export const INTERVIEW_DOMAINS = [
	'fund_alignment',
	'project_definition',
	'unique_qualifications',
	'budget_justification',
	'career_vision'
] as const;

export type InterviewDomain = (typeof INTERVIEW_DOMAINS)[number];

export const DOMAIN_LABELS: Record<InterviewDomain, string> = {
	fund_alignment: 'Fondsafstemning',
	project_definition: 'Projektdefinition',
	unique_qualifications: 'Unikke kvalifikationer',
	budget_justification: 'Budgetbegrundelse',
	career_vision: 'Karrierevision'
};

export const INTERVIEW_SYSTEM_PROMPT = `Du er en erfaren dansk studievejleder og legatrådgiver. Din rolle er at interviewe den studerende for at indsamle præcis den information, der er nødvendig for at skrive en stærk, personlig legatansøgning.

<regler>
- Stil KUN ét spørgsmål ad gangen.
- Skriv ALDRIG ansøgningstekst — du interviewer kun.
- Vær venlig, støttende og professionel.
- Hvis et svar er for vagt, stil et opfølgende spørgsmål for at få konkrete detaljer.
- Hold spørgsmålene korte og præcise.
- Svar altid på dansk.
- Returner dit output som JSON i dette format: {"question": "dit spørgsmål her"}
</regler>`;

export function getInterviewDomainPrompt(
	domain: InterviewDomain,
	existingAnswers: { question: string; answer: string }[],
	scrapedInfo?: Record<string, unknown> | null
): string {
	const domainInstructions: Record<InterviewDomain, string> = {
		fund_alignment: `<domæne>Fondsidentifikation og formålsafstemning</domæne>
<mål>Forstå hvilken fond der ansøges og sikre, at ansøgningen matcher fondens formål.</mål>
<kernespørgsmål>
- Hvilket specifikt legat eller fond ansøger du?
- Hvad er fondens primære formål ifølge deres fundats?
- Hvordan matcher dit projekt eller formål fondens værdier?
</kernespørgsmål>
${scrapedInfo ? `<fondsdata>Følgende er automatisk udtrukket fra fondens hjemmeside:\n${JSON.stringify(scrapedInfo, null, 2)}\nBrug denne information til at stille mere målrettede spørgsmål.</fondsdata>` : ''}`,

		project_definition: `<domæne>Projektdefinition og geografi</domæne>
<mål>Fastlæg de konkrete rammer for projektet/opholdet.</mål>
<kernespørgsmål>
- Hvad er det primære formål med dit ophold eller projekt? (f.eks. udveksling, praktik, feltarbejde, forskning)
- Præcis hvor skal det foregå? (land, by, institution)
- Hvornår starter og slutter opholdet/projektet?
- Er der specifikke kurser, forskningsgrupper eller samarbejdspartnere involveret?
</kernespørgsmål>`,

		unique_qualifications: `<domæne>Faglige og personlige kvalifikationer</domæne>
<mål>Afdæk ansøgerens unikke styrker, der beviser evnen til at gennemføre projektet.</mål>
<kernespørgsmål>
- Hvilke specifikke faglige kompetencer eller kurser har forberedt dig til dette projekt?
- Har du tidligere erfaringer (akademiske, professionelle eller frivillige), der er relevante?
- Er der særlige resultater eller præstationer, du er stolt af?
- Hvilke personlige egenskaber gør dig særligt egnet?
</kernespørgsmål>`,

		budget_justification: `<domæne>Økonomisk begrundelse og budget</domæne>
<mål>Sikre konsistens mellem ansøgningstekst og budgettal.</mål>
<kernespørgsmål>
- Hvor stort et beløb ansøger du om?
- Hvilke specifikke udgiftsposter skal midlerne dække? (f.eks. studieafgift, bolig, rejse, materialer)
- Har du andre finansieringskilder til projektet? (SU, opsparing, andre legater)
- Hvorfor er denne økonomiske støtte afgørende for at gennemføre projektet?
</kernespørgsmål>`,

		career_vision: `<domæne>Langsigtede karrieremål og vision</domæne>
<mål>Demonstrere at bevillingen er en investering i fremtiden.</mål>
<kernespørgsmål>
- Hvad er dit langsigtede karrieremål?
- Hvordan fungerer dette specifikke projekt som en katalysator for at nå dine mål?
- Hvilken konkret viden eller erfaring forventer du at tage med hjem?
- Hvordan vil du bruge det, du lærer, til gavn for andre? (samfund, fagfelt, fremtidige studerende)
</kernespørgsmål>`
	};

	let prompt = domainInstructions[domain];

	if (existingAnswers.length > 0) {
		prompt += `\n\n<tidligere_svar>\nFølgende spørgsmål er allerede besvaret i dette domæne:\n`;
		for (const qa of existingAnswers) {
			prompt += `Spørgsmål: ${qa.question}\nSvar: ${qa.answer}\n\n`;
		}
		prompt += `Stil et opfølgende spørgsmål baseret på svarene, eller returner {"question": null} hvis domænet er dækket tilstrækkeligt (typisk efter 2-4 spørgsmål).</tidligere_svar>`;
	} else {
		prompt += `\n\nStil det første spørgsmål for dette domæne.`;
	}

	return prompt;
}

export interface InterviewData {
	fund_alignment: { question: string; answer: string }[];
	project_definition: { question: string; answer: string }[];
	unique_qualifications: { question: string; answer: string }[];
	budget_justification: { question: string; answer: string }[];
	career_vision: { question: string; answer: string }[];
}

export const SCRAPER_SYSTEM_PROMPT = `Du er en hjælpsom assistent, der analyserer legatansøgninger og stipendier.
Givet HTML-indhold fra en legat-/stipendiewebside, udtræk følgende information i JSON-format:

{
  "name": "Legatets navn",
  "organization": "Organisationen bag legatet",
  "deadline": "Ansøgningsfrist (ISO dato hvis muligt)",
  "amount": "Beløb eller beløbsramme",
  "requirements": ["Liste af krav"],
  "documentsNeeded": ["Liste af nødvendige dokumenter"],
  "eligibility": "Hvem kan søge",
  "description": "Kort beskrivelse af legatet",
  "applicationUrl": "URL til ansøgningsskema hvis tilgængelig"
}

Svar KUN med JSON. Ingen yderligere forklaring.`;

export function getDocumentGenerationPrompt(
	category: string,
	interviewData?: InterviewData | null,
	scrapedInfo?: Record<string, unknown> | null
): string {
	const basePrompts: Record<string, string> = {
		motivated_application: `Du er en erfaren skribent, der hjælper med at skrive motiverede ansøgninger til legater og stipendier på dansk.
Skriv en velstruktureret, overbevisende motiveret ansøgning baseret på de givne oplysninger.
Brug et professionelt men personligt sprog. Strukturér med indledning, hoveddel og afslutning.`,

		budget: `Du er en erfaren økonomiassistent, der hjælper med at lave budgetter til legatansøgninger.
Lav et detaljeret og realistisk budget baseret på de givne oplysninger.
Returner budgettet som JSON med headers og rows arrays, der kan bruges i et regneark.`,

		cv: `Du er en erfaren karriererådgiver, der hjælper med at skrive akademiske CV'er på dansk.
Skriv et velstruktureret CV baseret på de givne oplysninger.
Brug omvendt kronologisk rækkefølge og fremhæv relevante erfaringer.`,

		project_description: `Du er en erfaren forsker/projektleder, der hjælper med at skrive projektbeskrivelser til legatansøgninger på dansk.
Skriv en klar og overbevisende projektbeskrivelse baseret på de givne oplysninger.
Strukturér med baggrund, formål, metode, tidsplan og forventet resultat.`,

		residence_documentation: `Du er en hjælpsom assistent, der hjælper med at udfærdige dokumentation for ophold i forbindelse med legatansøgninger på dansk.
Skriv en klar og detaljeret dokumentation baseret på de givne oplysninger.
Inkludér relevante detaljer som opholdets formål, varighed, lokation og tilknytning til projektet eller studiet.`,

		other: `Du er en hjælpsom assistent, der hjælper med at skrive dokumenter til legatansøgninger på dansk.
Skriv dokumentet baseret på de givne oplysninger. Brug et professionelt sprog.`
	};

	const basePrompt = basePrompts[category] || basePrompts.other;

	// If no interview data, return the simple prompt (backwards compatible)
	if (!interviewData) {
		return basePrompt;
	}

	// Build KERNEL-structured prompt with XML delimiters
	const hasResponses = Object.values(interviewData).some((arr) => arr.length > 0);
	if (!hasResponses) {
		return basePrompt;
	}

	function formatDomainData(label: string, responses: { question: string; answer: string }[]): string {
		if (responses.length === 0) return '';
		const lines = responses.map((r) => `  Spørgsmål: ${r.question}\n  Svar: ${r.answer}`).join('\n\n');
		return `### ${label}\n${lines}`;
	}

	const userData = [
		formatDomainData('Fondsafstemning', interviewData.fund_alignment),
		formatDomainData('Projektdefinition', interviewData.project_definition),
		formatDomainData('Unikke kvalifikationer', interviewData.unique_qualifications),
		formatDomainData('Budgetbegrundelse', interviewData.budget_justification),
		formatDomainData('Karrierevision', interviewData.career_vision)
	]
		.filter(Boolean)
		.join('\n\n');

	return `<role_assignment>
${basePrompt}
Du agerer som en skrivecoach, der forløser ansøgerens potentiale baseret på de oplysninger, ansøgeren selv har leveret gennem et struktureret interview.
</role_assignment>

${scrapedInfo ? `<foundation_context>\nFølgende information er udtrukket fra fondens hjemmeside:\n${JSON.stringify(scrapedInfo, null, 2)}\nSikr at ansøgningsteksten adresserer fondens specifikke formål og krav.\n</foundation_context>` : ''}

<user_data_input>
Følgende oplysninger er indsamlet direkte fra ansøgeren gennem et personligt interview. Brug KUN disse oplysninger som faktuelt grundlag:

${userData}
</user_data_input>

<strict_constraints>
- Du må ALDRIG opfinde erfaringer, karakterer, institutioner eller personlige motiver.
- Du må udelukkende trække på information fra <user_data_input>.
- Motiverede ansøgninger skal maksimalt fylde én A4-side (ca. 400 ord).
- Undgå overbrugte AI-ord: "fremme", "katalysere", "holistisk", "belyse", "yderligere", "derudover", "som følge heraf".
- Brug et naturligt, personligt sprog — ikke corporate eller akademisk floskler.
- Strukturér med klar indledning, hoveddel og afslutning.
- Sørg for at budgettal i teksten stemmer overens med ansøgerens oplyste tal.
</strict_constraints>`;
}
